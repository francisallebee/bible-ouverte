-- Les plans de lecture partagés : un plan, plusieurs lecteurs.
--
-- Demande du propriétaire du 30 septembre 2026, option la plus lourde des
-- trois proposées : **un plan réellement commun**. Cocher un jour le coche
-- pour tout le monde. C'est un changement de sens, pas un ajout : jusqu'ici
-- `plans.user_id` désignait à la fois le créateur et l'unique lecteur, et la
-- RLS tenait en `auth.uid() = user_id`.
--
-- Ce que cette migration change, et ce qu'elle ne change pas :
--
--   `plans.user_id`      reste le **créateur**, et lui seul peut renommer ou
--                        supprimer le plan. Un membre invité n'a aucune raison
--                        de pouvoir effacer le plan d'un autre.
--   `plan_days."isRead"` devient **collectif**. C'est le cœur de la demande.
--   `plan_days` structure reste au créateur : un membre coche, il ne
--                        réorganise pas le calendrier de quelqu'un d'autre.
--   `readings`           reste **strictement personnel**. Un jour coché par
--                        Marie ne crée pas de lecture chez Paul : il n'a rien
--                        lu. D'où `plan_day_readings`, qui laisse chacun
--                        déclarer sa propre lecture d'un jour déjà coché.
--
-- Additive et idempotente. Aucune ligne supprimée, aucune colonne retirée.
-- Les policies existantes sont **remplacées** (drop/create), ce qui est le
-- seul geste possible : on ne peut pas élargir une policy sans la réécrire.

-- ---------------------------------------------------------------------------
-- 1. Qui est membre d'un plan
-- ---------------------------------------------------------------------------

create table if not exists public.plan_members (
  plan_id bigint not null references public.plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- 'proprietaire' ou 'membre'. Le créateur en est toujours propriétaire ;
  -- le rôle est porté ici plutôt que déduit de `plans.user_id` pour qu'une
  -- seule table réponde à la question « qui a le droit de quoi ».
  role text not null default 'membre',
  "joinedAt" timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create index if not exists idx_plan_members_user on public.plan_members(user_id);

-- Les plans existants n'ont qu'un lecteur : leur créateur. Sans cette reprise,
-- la nouvelle RLS les rendrait invisibles à leur propre auteur le temps qu'un
-- membre soit inscrit — et c'est exactement le genre de migration qui casse la
-- production en silence, puisque rien ne lève : la liste revient simplement
-- vide.
insert into public.plan_members (plan_id, user_id, role)
select p.id, p.user_id, 'proprietaire' from public.plans p
on conflict (plan_id, user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Le helper, en `private` et en `security definer`
-- ---------------------------------------------------------------------------
-- Sans `security definer`, la policy de `plans` interrogerait `plan_members`,
-- dont la policy interrogerait `plans` : récursion infinie, et Postgres la
-- refuse à l'exécution. Le schéma `private` n'est pas exposé par PostgREST —
-- même raison qu'`is_admin()` le 1er août 2026.

create or replace function private.est_membre(p_plan_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.plan_members m
    where m.plan_id = p_plan_id and m.user_id = auth.uid()
  );
$$;

revoke all on function private.est_membre(bigint) from public, anon;
grant execute on function private.est_membre(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. La RLS de `plan_members`
-- ---------------------------------------------------------------------------
-- Lecture : ses propres adhésions, et celles des plans dont on est membre —
-- il faut bien pouvoir afficher « lu par Marie ». Écriture : aucune depuis le
-- navigateur. On n'entre dans un plan que par `accepter_invitation()`, et on
-- en sort par `quitter_plan()` ; laisser un `insert` libre permettrait de
-- s'inscrire dans le plan de n'importe qui en devinant un identifiant.

alter table public.plan_members enable row level security;

drop policy if exists "membres lisent leur appartenance" on public.plan_members;
create policy "membres lisent leur appartenance"
  on public.plan_members for select
  using (user_id = auth.uid() or private.est_membre(plan_id));

revoke insert, update, delete on public.plan_members from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. `plans` et `plan_days` s'ouvrent aux membres
-- ---------------------------------------------------------------------------

drop policy if exists "users can read own plans" on public.plans;
create policy "users can read own plans"
  on public.plans for select
  using (auth.uid() = user_id or private.est_membre(id));

-- `update` et `delete` restent au créateur : les policies de la baseline sont
-- déjà exactement cela, et ne sont donc pas retouchées.

drop policy if exists "users can read own plan_days" on public.plan_days;
create policy "users can read own plan_days"
  on public.plan_days for select
  using (auth.uid() = user_id or private.est_membre(plan_id));

-- L'`update` s'ouvre aux membres — c'est le cochage, l'objet même de la
-- demande —, mais un trigger borne ce qu'un non-créateur peut écrire.
drop policy if exists "users can update own plan_days" on public.plan_days;
create policy "users can update own plan_days"
  on public.plan_days for update
  using (auth.uid() = user_id or private.est_membre(plan_id))
  with check (auth.uid() = user_id or private.est_membre(plan_id));

-- `insert` et `delete` de `plan_days` gardent la policy de la baseline
-- (`auth.uid() = user_id`) : un membre coche, il ne réorganise pas le
-- calendrier d'un autre.

-- ---------------------------------------------------------------------------
-- 5. Ce qu'un membre a le droit d'écrire
-- ---------------------------------------------------------------------------
-- Même forme que `guard_ticket_update` du 18 août 2026 : la policy dit qui
-- peut écrire, le trigger dit **quoi**. Sans lui, un membre pourrait réécrire
-- le passage d'un jour, sa date, ou le `readingId` d'un autre — la policy
-- d'`update` ne sait pas distinguer les colonnes.

alter table public.plan_days add column if not exists "luPar" uuid references public.profiles(id) on delete set null;
alter table public.plan_days add column if not exists "luLe" timestamptz;

comment on column public.plan_days."luPar" is
  'Qui a coché ce jour. Nul sur les jours cochés avant le 30 septembre 2026 : on ne peut pas le reconstituer, et l''inventer serait pire.';

create or replace function public.guard_plan_day_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Le créateur du jour garde la main sur tout. `auth.uid() is null` couvre
  -- service_role et les migrations, qui ne passent pas par une session.
  if auth.uid() is null or auth.uid() = old.user_id then
    return new;
  end if;

  -- Un membre ne change que l'état de lecture. Tout le reste est remis à sa
  -- valeur d'origine plutôt que refusé : une écriture partielle ne doit pas
  -- faire échouer un cochage légitime.
  new.id := old.id;
  new.plan_id := old.plan_id;
  new.user_id := old.user_id;
  new.day := old.day;
  -- `date` est l'exception, et elle n'est pas cosmétique : sur un plan
  -- **libre**, la date du jour EST celle de la lecture, posée au moment du
  -- cochage (voir `lib/plans/cochage.ts`, ticket 32). La figer ici aurait
  -- annulé en silence la date de tout jour coché par un membre — un défaut
  -- qui ne lève pas et ne se voit qu'aux statistiques, des semaines plus
  -- tard. Elle n'est donc libre que pendant la bascule d'`isRead`, ce qui est
  -- exactement le geste du cochage et rien d'autre.
  if old."isRead" is not distinct from new."isRead" then
    new.date := old.date;
  end if;
  new.book := old.book;
  new."chapterStart" := old."chapterStart";
  new."chapterEnd" := old."chapterEnd";
  new."verseStart" := old."verseStart";
  new."verseEnd" := old."verseEnd";
  new.passages := old.passages;
  new.titre := old.titre;
  new.texte := old.texte;
  new."page_debut" := old."page_debut";
  new."page_fin" := old."page_fin";
  -- `readingId` appartient à celui qui a créé le jour : il pointe une ligne de
  -- `readings` que le membre ne peut de toute façon pas lire.
  new."readingId" := old."readingId";
  return new;
end;
$$;

revoke all on function public.guard_plan_day_update() from public, anon, authenticated;

drop trigger if exists guard_plan_day_update on public.plan_days;
create trigger guard_plan_day_update
  before update on public.plan_days
  for each row execute function public.guard_plan_day_update();

-- ---------------------------------------------------------------------------
-- 6. La lecture personnelle d'un jour collectif
-- ---------------------------------------------------------------------------
-- Un jour coché par Marie est fait **pour le plan**. Mais Paul, qui l'a lu
-- aussi, doit pouvoir l'inscrire dans ses propres lectures : sinon ses
-- statistiques, ses séries et ses objectifs ignorent ce qu'il a lu. Sans cette
-- table, un plan partagé ferait disparaître la moitié de l'activité de chacun
-- des deux comptes.

create table if not exists public.plan_day_readings (
  plan_day_id bigint not null references public.plan_days(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reading_id bigint,
  "createdAt" timestamptz not null default now(),
  primary key (plan_day_id, user_id)
);

create index if not exists idx_plan_day_readings_user on public.plan_day_readings(user_id);

alter table public.plan_day_readings enable row level security;

drop policy if exists "chacun lit les siennes et celles de son plan" on public.plan_day_readings;
create policy "chacun lit les siennes et celles de son plan"
  on public.plan_day_readings for select
  using (
    user_id = auth.uid()
    or private.est_membre((select d.plan_id from public.plan_days d where d.id = plan_day_id))
  );

drop policy if exists "chacun déclare la sienne" on public.plan_day_readings;
create policy "chacun déclare la sienne"
  on public.plan_day_readings for insert
  with check (
    user_id = auth.uid()
    and private.est_membre((select d.plan_id from public.plan_days d where d.id = plan_day_id))
  );

drop policy if exists "chacun retire la sienne" on public.plan_day_readings;
create policy "chacun retire la sienne"
  on public.plan_day_readings for delete
  using (user_id = auth.uid());

revoke update on public.plan_day_readings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Les invitations
-- ---------------------------------------------------------------------------
-- Deux chemins, sur décision du propriétaire : un **lien** porteur d'un jeton,
-- et une **adresse courriel** résolue côté serveur. Le jeton est la capacité :
-- qui l'a peut répondre, et c'est pourquoi il n'y a **aucune policy de
-- `select` sur cette table**. Une policy « lisible si on connaît le jeton »
-- n'existe pas — PostgREST filtrerait après coup, et un `select *` rendrait
-- tous les jetons. L'accès passe donc par trois fonctions `security definer`,
-- qui ne rendent que ce qu'il faut voir.

create table if not exists public.plan_invitations (
  id bigint primary key generated always as identity,
  plan_id bigint not null references public.plans(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  -- Deux UUID v4 concaténés : 244 bits d'aléa, et **aucune extension
  -- requise**. `gen_random_bytes` aurait été plus direct mais vient de
  -- pgcrypto, dont je n'ai pas vérifié la présence — et une migration qui
  -- suppose une extension échoue à l'application, pas à la relecture.
  jeton text not null unique
    default replace(gen_random_uuid()::text, '-', '')
         || replace(gen_random_uuid()::text, '-', ''),
  -- Renseignée quand l'invitation a été adressée à quelqu'un par courriel.
  -- Nulle pour un simple lien.
  email text,
  -- Le compte visé, résolu **côté serveur** par la route API : le navigateur
  -- ne peut pas lire `profiles` d'autrui, et c'est voulu. Nul si l'adresse
  -- n'a pas encore de compte — l'invitation attend alors son inscription.
  invited_user uuid references public.profiles(id) on delete set null,
  statut text not null default 'en_attente',
  "createdAt" timestamptz not null default now(),
  -- Une invitation qui traîne est une porte ouverte. Trente jours.
  "expiresAt" timestamptz not null default now() + interval '30 days',
  accepted_by uuid references public.profiles(id) on delete set null,
  "respondedAt" timestamptz,
  constraint plan_invitations_statut_connu
    check (statut in ('en_attente', 'acceptee', 'refusee', 'revoquee'))
);

create index if not exists idx_plan_invitations_plan on public.plan_invitations(plan_id);
create index if not exists idx_plan_invitations_user on public.plan_invitations(invited_user)
  where statut = 'en_attente';

alter table public.plan_invitations enable row level security;

-- Le membre d'un plan voit les invitations qu'il a émises — pour les révoquer
-- et savoir où elles en sont —, et le destinataire nommé voit les siennes.
-- Personne d'autre, et surtout pas « qui connaît un identifiant ».
drop policy if exists "auteur et destinataire voient l’invitation" on public.plan_invitations;
create policy "auteur et destinataire voient l’invitation"
  on public.plan_invitations for select
  using (created_by = auth.uid() or invited_user = auth.uid());

-- Un membre peut inviter à son tour : c'est ce que le propriétaire a demandé
-- en disant qu'un invité non inscrit « ne pourra pas partager aussi ce lien »,
-- donc qu'un invité **inscrit** le peut.
drop policy if exists "un membre invite" on public.plan_invitations;
create policy "un membre invite"
  on public.plan_invitations for insert
  with check (created_by = auth.uid() and private.est_membre(plan_id));

-- Révoquer : seul l'auteur, et seulement le statut — d'où le grant colonne,
-- comme sur `profiles` et `messages`.
drop policy if exists "l’auteur révoque" on public.plan_invitations;
create policy "l’auteur révoque"
  on public.plan_invitations for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

revoke update on public.plan_invitations from anon, authenticated;
grant update (statut) on public.plan_invitations to authenticated;

revoke delete on public.plan_invitations from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Répondre à une invitation
-- ---------------------------------------------------------------------------

-- Ce qu'un invité a le droit de voir **avant** d'accepter : le nom du plan et
-- celui de qui l'invite. Pas les jours, pas les autres membres, pas le
-- document. Rien de plus que ce qu'il faut pour décider.
create or replace function public.invitation_par_jeton(p_jeton text)
returns table (
  plan_nom text,
  invite_par text,
  statut text,
  expiree boolean,
  deja_membre boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.name,
    coalesce(pr.name, ''),
    i.statut,
    i."expiresAt" < now(),
    exists (
      select 1 from public.plan_members m
      where m.plan_id = i.plan_id and m.user_id = auth.uid()
    )
  from public.plan_invitations i
  join public.plans p on p.id = i.plan_id
  left join public.profiles pr on pr.id = i.created_by
  where i.jeton = p_jeton;
$$;

-- `anon` l'exécute aussi : c'est ce qui permet à la page d'invitation de dire
-- « Marie vous invite à suivre *Les Évangiles en 90 jours* » à quelqu'un qui
-- n'a pas encore de compte, et donc de lui donner une raison de s'inscrire.
-- Elle ne rend aucune donnée personnelle au-delà du prénom de l'hôte.
revoke all on function public.invitation_par_jeton(text) from public;
grant execute on function public.invitation_par_jeton(text) to anon, authenticated, service_role;

create or replace function public.accepter_invitation(p_jeton text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.plan_invitations;
begin
  if auth.uid() is null then
    raise exception 'connexion requise';
  end if;

  select * into inv from public.plan_invitations where jeton = p_jeton;
  if not found then
    raise exception 'invitation introuvable';
  end if;
  if inv."expiresAt" < now() then
    raise exception 'invitation expirée';
  end if;
  -- Déjà répondu : on ne rejoue pas. Sauf si l'on est déjà membre, auquel cas
  -- rouvrir le lien doit simplement ramener au plan plutôt que de lever.
  if exists (select 1 from public.plan_members m
             where m.plan_id = inv.plan_id and m.user_id = auth.uid()) then
    return inv.plan_id;
  end if;
  if inv.statut <> 'en_attente' then
    raise exception 'invitation déjà traitée';
  end if;
  -- Une invitation nominative ne s'accepte que par la personne visée : sans
  -- cela, un lien envoyé à une adresse précise vaudrait pour quiconque
  -- l'intercepte.
  if inv.invited_user is not null and inv.invited_user <> auth.uid() then
    raise exception 'invitation adressée à quelqu''un d''autre';
  end if;

  insert into public.plan_members (plan_id, user_id, role)
  values (inv.plan_id, auth.uid(), 'membre')
  on conflict (plan_id, user_id) do nothing;

  -- Un lien sans destinataire nommé reste utilisable : c'est une invitation
  -- « à qui veut », et la refermer au premier accepté surprendrait celui qui
  -- l'a partagé dans un groupe. Une invitation nominative, elle, se clôt.
  if inv.invited_user is not null then
    update public.plan_invitations
       set statut = 'acceptee', accepted_by = auth.uid(), "respondedAt" = now()
     where id = inv.id;
  end if;

  return inv.plan_id;
end;
$$;

revoke all on function public.accepter_invitation(text) from public, anon;
grant execute on function public.accepter_invitation(text) to authenticated, service_role;

create or replace function public.refuser_invitation(p_jeton text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.plan_invitations;
begin
  if auth.uid() is null then
    raise exception 'connexion requise';
  end if;

  select * into inv from public.plan_invitations where jeton = p_jeton;
  if not found then
    raise exception 'invitation introuvable';
  end if;
  -- Seul le destinataire nommé peut refuser : un lien ouvert refusé par le
  -- premier venu le fermerait pour tous les autres.
  if inv.invited_user is null or inv.invited_user <> auth.uid() then
    raise exception 'invitation non refusable';
  end if;
  if inv.statut <> 'en_attente' then
    return;
  end if;

  update public.plan_invitations
     set statut = 'refusee', "respondedAt" = now()
   where id = inv.id;
end;
$$;

revoke all on function public.refuser_invitation(text) from public, anon;
grant execute on function public.refuser_invitation(text) to authenticated, service_role;

-- Sortir d'un plan qu'on a rejoint. Le créateur ne peut pas se retirer du
-- sien — il le supprimerait pour tout le monde sans le vouloir.
create or replace function public.quitter_plan(p_plan_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'connexion requise';
  end if;
  if exists (select 1 from public.plans p
             where p.id = p_plan_id and p.user_id = auth.uid()) then
    raise exception 'le créateur ne quitte pas son plan';
  end if;

  delete from public.plan_members
   where plan_id = p_plan_id and user_id = auth.uid();
end;
$$;

revoke all on function public.quitter_plan(bigint) from public, anon;
grant execute on function public.quitter_plan(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. Les invitations en attente d'un compte
-- ---------------------------------------------------------------------------
-- Une invitation par courriel adressée à quelqu'un qui n'a pas encore de
-- compte reste avec `invited_user` nul. Quand cette personne s'inscrit, son
-- adresse est rapprochée et l'invitation lui est rattachée — sinon elle
-- s'inscrirait, reviendrait, et ne trouverait rien.

create or replace function private.rattacher_invitations(p_user_id uuid, p_email text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.plan_invitations
     set invited_user = p_user_id
   where invited_user is null
     and statut = 'en_attente'
     and "expiresAt" > now()
     and lower(email) = lower(p_email);
$$;

revoke all on function private.rattacher_invitations(uuid, text) from public, anon, authenticated;
grant execute on function private.rattacher_invitations(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- 10. Qui est dans le plan, par leur nom
-- ---------------------------------------------------------------------------
-- `plan_members` ne porte que des UUID, et `profiles` reste verrouillé sur
-- « son propre profil » depuis le 1er août 2026 — à raison : il porte
-- `is_admin`, `suspended`, la ville et la date de naissance. Une policy de
-- `select` ne sait pas se restreindre à deux colonnes, la RLS étant par ligne
-- et non par colonne ; ouvrir `profiles` aux co-membres leur donnerait donc
-- tout le profil.
--
-- D'où cette fonction, qui ne rend que l'identifiant, le nom et le rôle, et
-- seulement à quelqu'un du plan. Sans elle, l'écran afficherait « lu par
-- 7f3a-… » — ce qui revient à ne pas faire la fonctionnalité.

create or replace function public.membres_du_plan(p_plan_id bigint)
returns table (user_id uuid, nom text, role text, "joinedAt" timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, coalesce(pr.name, ''), m.role, m."joinedAt"
  from public.plan_members m
  left join public.profiles pr on pr.id = m.user_id
  where m.plan_id = p_plan_id
    and exists (
      select 1 from public.plan_members moi
      where moi.plan_id = p_plan_id and moi.user_id = auth.uid()
    )
  order by m."joinedAt";
$$;

revoke all on function public.membres_du_plan(bigint) from public, anon;
grant execute on function public.membres_du_plan(bigint) to authenticated, service_role;
