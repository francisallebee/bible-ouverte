-- Les vœux d'anniversaire.
--
-- **Un seul texte, deux canaux.** Le vœu est déposé comme un message ordinaire
-- dans `public.messages` : il apparaît donc dans la boîte de réception, et
-- `send-messages` l'envoie par courriel sans rien savoir des anniversaires.
-- La notification push, elle, n'annonce que son arrivée — elle ne recopie pas
-- le texte, qui n'est ainsi écrit qu'à un seul endroit.
--
-- `messages.kind` distingue le vœu du message écrit à la main. Le courriel s'en
-- sert pour **ne pas saluer ni signer deux fois** : le texte porte déjà
-- « Joyeux anniversaire Prénom, » en tête et le nom de son auteur en pied.
-- C'est une colonne et non une devinette sur le contenu — reconnaître un vœu à
-- ses premiers mots tiendrait jusqu'au jour où le texte changerait.
--
-- `birthday_wishes` porte l'unicité : une clé primaire `(user_id, annee)` rend
-- la fonction **idempotente**. Le planificateur peut donc passer toutes les
-- heures — ce qu'il doit faire, puisque le jour civil ne commence pas à la même
-- heure partout — sans jamais souhaiter deux fois.
--
-- Le jour est calculé **dans le fuseau de chacun**, lu dans ses réglages :
-- `now() at time zone timeZone`. Le piège de la date UTC s'est déjà présenté
-- quatre fois dans ce dépôt ; un anniversaire est un jour civil local, pas un
-- instant.

alter table public.messages
  add column if not exists kind text;

create table if not exists public.birthday_wishes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  annee integer not null,
  "createdAt" timestamptz not null default now(),
  primary key (user_id, annee)
);

alter table public.birthday_wishes enable row level security;

drop policy if exists birthday_wishes_select on public.birthday_wishes;
create policy birthday_wishes_select on public.birthday_wishes
  for select to authenticated
  using (private.is_admin());

revoke insert, update, delete on public.birthday_wishes from anon, authenticated;

create or replace function public.souhaiter_anniversaires()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  ecrits integer := 0;
begin
  with candidats as (
    select
      p.id,
      coalesce(nullif(trim(p.first_name), ''), nullif(trim(p.name), ''), 'à toi') as prenom,
      (now() at time zone coalesce(nullif(s.data ->> 'timeZone', ''), 'Europe/Paris'))::date as jour_local
    from public.profiles p
    left join public.settings s on s.user_id = p.id
    where p.birth_date ~ '^\d{4}-\d{2}-\d{2}$'
  ),
  aujourdhui as (
    select c.id, c.prenom, extract(year from c.jour_local)::int as annee
    from candidats c
    join public.profiles p on p.id = c.id
    where
      substr(p.birth_date, 6, 5) = to_char(c.jour_local, 'MM-DD')
      -- Le 29 février est ramené au 28 les années non bissextiles : sans cela,
      -- cette personne n'aurait de vœux qu'une année sur quatre.
      or (
        substr(p.birth_date, 6, 5) = '02-29'
        and to_char(c.jour_local, 'MM-DD') = '02-28'
        and not (
          extract(year from c.jour_local)::int % 4 = 0
          and (extract(year from c.jour_local)::int % 100 <> 0
               or extract(year from c.jour_local)::int % 400 = 0)
        )
      )
  ),
  -- La réservation d'abord : c'est elle qui garantit l'unicité, et le message
  -- n'est écrit que pour les lignes réellement réservées par ce passage.
  reserves as (
    insert into public.birthday_wishes (user_id, annee)
    select a.id, a.annee from aujourdhui a
    on conflict (user_id, annee) do nothing
    returning user_id, annee
  )
  insert into public.messages (user_id, from_admin, kind, subject, body, sent_by_name)
  select
    r.user_id,
    true,
    'birthday',
    'Joyeux anniversaire !',
    'Joyeux anniversaire ' || a.prenom || ',

Je crois qu''aujourd''hui, c''est un jour spécial non ?
Nous ne voulions pas oublier ton anniversaire.

Passe une belle journée !

Francis ALLEBEE - Ôappliday',
    'Francis ALLEBEE - Ôappliday'
  from reserves r
  join aujourdhui a on a.id = r.user_id;

  get diagnostics ecrits = row_count;
  return ecrits;
end;
$$;

revoke all on function public.souhaiter_anniversaires() from public, anon, authenticated;
grant execute on function public.souhaiter_anniversaires() to service_role;

comment on function public.souhaiter_anniversaires() is
  'Insère un message de voeux pour chaque anniversaire du jour, dans le fuseau de chacun. Idempotente : la clé primaire de birthday_wishes garantit un seul voeu par personne et par an.';
