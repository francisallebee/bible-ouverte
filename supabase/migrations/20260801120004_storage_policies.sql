-- Policies des buckets `photos` et `audio`.
--
-- Audit du 1er août 2026 : les deux buckets sont privés, la RLS est active sur
-- storage.objects — et il n'existait AUCUNE policy. Le résultat était donc
-- fermé par défaut : personne, pas même le propriétaire d'un fichier, ne
-- pouvait lire ou écrire quoi que ce soit depuis le navigateur. Pas de fuite,
-- mais des buckets inutilisables (0 objet stocké).
--
-- Le cloisonnement repose sur la convention de nommage déjà employée par la
-- route de suppression de compte : chaque fichier est rangé sous un préfixe
-- `{user_id}/`. storage.foldername(name) découpe le chemin, son premier
-- segment est donc l'identifiant du propriétaire.
--
-- service_role contourne la RLS : le back-office continue de lister et purger
-- les fichiers d'un compte supprimé.

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------

drop policy if exists "users read own photos" on storage.objects;
drop policy if exists "users upload own photos" on storage.objects;
drop policy if exists "users update own photos" on storage.objects;
drop policy if exists "users delete own photos" on storage.objects;

create policy "users read own photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "users upload own photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "users update own photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "users delete own photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- ---------------------------------------------------------------------------
-- audio
-- ---------------------------------------------------------------------------

drop policy if exists "users read own audio" on storage.objects;
drop policy if exists "users upload own audio" on storage.objects;
drop policy if exists "users update own audio" on storage.objects;
drop policy if exists "users delete own audio" on storage.objects;

create policy "users read own audio"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "users upload own audio"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "users update own audio"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "users delete own audio"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- ---------------------------------------------------------------------------
-- Garde-fous sur les buckets eux-mêmes
-- ---------------------------------------------------------------------------
-- Les deux buckets étaient sans limite de taille ni de type. Un compte pouvait
-- y déposer n'importe quoi, de n'importe quelle taille.

update storage.buckets
set file_size_limit = 10485760, -- 10 Mo
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
where id = 'photos';

update storage.buckets
set file_size_limit = 26214400, -- 25 Mo
    allowed_mime_types = array['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav']
where id = 'audio';
