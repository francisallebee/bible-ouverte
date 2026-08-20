-- La date de naissance, demandée à l'inscription.
--
-- La colonne existait déjà — `birth_date`, ajoutée à l'origine et modifiable
-- depuis l'écran Profil — mais rien ne la renseignait à la création du compte,
-- et personne ne la remplissait après coup. Elle restait donc vide partout.
--
-- Seul le trigger change : `create or replace` dans une migration neuve, la
-- précédente n'est pas touchée (règle 1). Le format attendu est `AAAA-MM-JJ`,
-- celui que rend un `<input type="date">` — c'est ce que l'écran Profil
-- employait déjà.
--
-- Elle reste **facultative**, comme la ville, le portable et la provenance :
-- seuls le prénom et le nom sont exigés.

create or replace function public.handle_new_user()
returns trigger
security definer set search_path = ''
as $$
declare
  prenom text := nullif(trim(new.raw_user_meta_data ->> 'first_name'), '');
  nom    text := nullif(trim(new.raw_user_meta_data ->> 'last_name'), '');
begin
  insert into public.profiles (
    id, name, color, first_name, last_name, city, phone, discovery_source, birth_date
  )
  values (
    new.id,
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
    nullif(trim(new.raw_user_meta_data ->> 'discovery_source'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'birth_date'), '')
  )
  on conflict (id) do nothing;

  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql;

comment on column public.profiles.birth_date is
  'Date de naissance au format AAAA-MM-JJ. Demandée à l''inscription depuis le 20 août 2026, facultative. Sert à souhaiter l''anniversaire.';
