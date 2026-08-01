-- Verrouillage des contenus partagés : tickets support et feuille de route.
--
-- Les deux tables sont volontairement collectives — le support est un tableau
-- commun où chacun voit et commente les tickets des autres, la feuille de route
-- est un contenu global sur lequel chacun réagit. Ce qui n'était pas voulu,
-- c'est que la policy "authenticated can update" laissait n'importe quel compte
-- connecté réécrire le message d'un ticket d'autrui, en changer le statut, le
-- réattribuer, modifier le titre d'un item de roadmap ou effacer d'un coup les
-- réactions de tout le monde.
--
-- Une policy RLS raisonne par ligne, pas par colonne. Le découpage colonne par
-- colonne se fait donc dans des triggers BEFORE UPDATE, qui portent aussi
-- l'exception administrateur — ce qu'un GRANT, attaché à un rôle et non à un
-- utilisateur, ne sait pas exprimer.
--
-- auth.uid() est nul pour la clé service_role : les routes /api/admin/*
-- continuent de passer sans entrave.

-- ---------------------------------------------------------------------------
-- 1. Tickets
-- ---------------------------------------------------------------------------

drop policy if exists "authenticated can read tickets" on public.tickets;
drop policy if exists "users can insert own tickets" on public.tickets;
drop policy if exists "authenticated can update tickets" on public.tickets;
drop policy if exists "admins can delete tickets" on public.tickets;

create policy "authenticated can read tickets"
  on public.tickets for select
  using (auth.uid() is not null);

create policy "users can insert own tickets"
  on public.tickets for insert
  with check (auth.uid() = user_id);

create policy "authenticated can update tickets"
  on public.tickets for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "admins can delete tickets"
  on public.tickets for delete
  using (public.is_admin());

-- Un non-admin n'a le droit de toucher qu'à replies et updatedAt : c'est
-- exactement ce qu'écrit addReply() dans support-store.ts. Le reste est
-- restauré depuis l'ancienne ligne.
create or replace function public.guard_ticket_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  new.id := old.id;
  new.user_id := old.user_id;
  new."userName" := old."userName";
  new.type := old.type;
  new.message := old.message;
  new.status := old.status;
  new."createdAt" := old."createdAt";
  return new;
end;
$$;

drop trigger if exists guard_ticket_update on public.tickets;
create trigger guard_ticket_update
  before update on public.tickets
  for each row execute function public.guard_ticket_update();

-- À la création, le statut est toujours 'open' : il n'appartient qu'au
-- back-office de le faire avancer.
create or replace function public.guard_ticket_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  new.status := 'open';
  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists guard_ticket_insert on public.tickets;
create trigger guard_ticket_insert
  before insert on public.tickets
  for each row execute function public.guard_ticket_insert();

-- ---------------------------------------------------------------------------
-- 2. Feuille de route
-- ---------------------------------------------------------------------------

drop policy if exists "authenticated can read roadmap" on public.roadmap_items;
drop policy if exists "admins can insert roadmap" on public.roadmap_items;
drop policy if exists "authenticated can update roadmap" on public.roadmap_items;
drop policy if exists "admins can delete roadmap" on public.roadmap_items;

create policy "authenticated can read roadmap"
  on public.roadmap_items for select
  using (auth.uid() is not null);

create policy "admins can insert roadmap"
  on public.roadmap_items for insert
  with check (public.is_admin());

create policy "authenticated can update roadmap"
  on public.roadmap_items for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "admins can delete roadmap"
  on public.roadmap_items for delete
  using (public.is_admin());

-- Un non-admin ne peut que réagir. Et comme reactions est un objet JSON
-- réécrit en entier par le client, on ne garde de sa version que SA propre
-- clé : les réactions des autres sont reprises de l'ancienne ligne, sinon un
-- client un peu curieux les effacerait toutes d'un seul update.
create or replace function public.guard_roadmap_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid text;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  uid := auth.uid()::text;

  new.id := old.id;
  new.title := old.title;
  new.description := old.description;
  new.status := old.status;
  new."createdAt" := old."createdAt";
  new.reactions := (coalesce(old.reactions, '{}'::jsonb) - uid)
    || (case
          when coalesce(new.reactions, '{}'::jsonb) ? uid
            then jsonb_build_object(uid, new.reactions -> uid)
          else '{}'::jsonb
        end);
  return new;
end;
$$;

drop trigger if exists guard_roadmap_update on public.roadmap_items;
create trigger guard_roadmap_update
  before update on public.roadmap_items
  for each row execute function public.guard_roadmap_update();
