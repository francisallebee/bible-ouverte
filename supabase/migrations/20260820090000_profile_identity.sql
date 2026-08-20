-- Identité et provenance : prénom, nom, ville, et « comment avez-vous connu ».
--
-- Quatre colonnes, et trois points à ne pas redécouvrir.
--
-- 1. `name` NE DISPARAÎT PAS. Tout le code le lit — le tableau
--    d'administration, `tickets.userName`, l'alerte d'inscription, l'avatar par
--    initiale. Il devient le **nom d'affichage**, composé du prénom et du nom
--    quand les deux existent, et gardant sa valeur d'avant sinon. Le découper
--    aurait été une reprise de données sur des lignes réelles : « Admin »,
--    « francisallebee », « Contexte : bible » se coupent mal au premier espace.
--
-- 2. Les nouvelles colonnes doivent recevoir un GRANT explicite (règle 2).
--    `update` est révoqué au niveau table sur `profiles` depuis
--    `20260801120001_profiles_rls.sql` : sans la ligne ci-dessous, l'utilisateur
--    ne pourrait pas écrire son propre prénom, et rien ne le dirait clairement.
--    `is_admin` et `suspended` restent volontairement hors de la liste.
--
-- 3. `discovery_source` porte un **identifiant**, pas un libellé. Les quatre
--    valeurs sont figées par une contrainte et traduites à l'affichage, comme
--    les statuts de ticket et les contextes système.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists city text,
  add column if not exists discovery_source text;

alter table public.profiles
  drop constraint if exists profiles_discovery_source_check;

alter table public.profiles
  add constraint profiles_discovery_source_check
  check (
    discovery_source is null
    or discovery_source in ('internet', 'reseaux', 'connaissance', 'autre')
  );

grant update (
  first_name,
  last_name,
  city,
  discovery_source
) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Le trigger d'inscription reprend les nouveaux champs
-- ---------------------------------------------------------------------------
-- `create or replace` dans une migration NEUVE : la migration d'origine
-- (`20260801120000_baseline.sql`) n'est pas touchée, conformément à la règle 1.
--
-- `raw_user_meta_data` est ce que le formulaire passe dans `options.data` de
-- `signUp`. Les clés absentes rendent null, ce qui est le cas de tous les
-- comptes créés avant aujourd'hui — et des connexions par un autre moyen que
-- le formulaire, s'il en arrive un jour.

create or replace function public.handle_new_user()
returns trigger
security definer set search_path = ''
as $$
declare
  prenom text := nullif(trim(new.raw_user_meta_data ->> 'first_name'), '');
  nom    text := nullif(trim(new.raw_user_meta_data ->> 'last_name'), '');
begin
  insert into public.profiles (
    id, name, color, first_name, last_name, city, phone, discovery_source
  )
  values (
    new.id,
    -- Le nom d'affichage, par ordre de préférence : « Prénom Nom », puis le
    -- `name` d'avant que le formulaire envoyait seul, puis la partie locale de
    -- l'adresse. Jamais vide : la colonne est `not null`.
    coalesce(
      nullif(trim(concat_ws(' ', prenom, nom)), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    '#1e3a5f',
    prenom,
    nom,
    nullif(trim(new.raw_user_meta_data ->> 'city'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'discovery_source'), '')
  )
  on conflict (id) do nothing;

  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql;

comment on column public.profiles.first_name is
  'Prénom, demandé à l''inscription depuis le 20 août 2026. Null sur les comptes antérieurs.';
comment on column public.profiles.discovery_source is
  'Comment la personne a connu l''application : internet, reseaux, connaissance, autre. Identifiant, traduit à l''affichage.';
