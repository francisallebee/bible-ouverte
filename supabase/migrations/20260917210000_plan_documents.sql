-- Un plan de lecture peut porter son document, et chaque jour ses pages.
--
-- Le 17 septembre 2026, le propriétaire a lu son premier plan « document en
-- entier » et l'a trouvé illisible : le texte extrait d'un PDF est une
-- reconstruction — lignes devenues paragraphes, césures gardées, ligatures
-- cassées — et le découpage « une ligne à référence = un jour » tranche un
-- cahier d'étude au hasard de ses citations. Sa demande : un lecteur qui
-- respecte le document original. Décision du même jour : le fichier PDF est
-- **gardé** et se lit tel quel, page par page, une page par jour par défaut.
--
-- C'est le premier fichier que l'application stocke. Trois choses en découlent :
--
-- 1. Un seau `documents`, privé, créé ici et non au dashboard — les seaux
--    `photos` et `audio` l'avaient été, et le README les tenait pour « hors du
--    dépôt ». 20 Mo par fichier, PDF seulement : `texteDuFichier` a la même
--    borne, et seul le PDF a des pages à dessiner.
--
-- 2. Le cloisonnement des seaux existants, par préfixe `{user_id}/`, et **le
--    dépôt réservé à l'administrateur** — `private.is_admin()` dans le
--    `with check` de l'insertion. Le bouton du navigateur ne protège rien ;
--    c'est ici que la règle tient. L'ouvrir à tous sera une migration d'une
--    ligne. La lecture et la suppression restent au propriétaire du préfixe.
--
-- 3. Deux colonnes additives : `plans.document`, le chemin dans le seau, et
--    `plan_days.page_debut` / `page_fin`, les pages du jour. Nulles sur tout
--    autre plan ; un appareil resté sur l'ancienne version les ignore et
--    montre les passages seuls — tronqué, jamais faux. `plan_days.texte`
--    reste : les autres formats (Word, EPUB, OpenDocument) n'ont pas de page
--    et se lisent toujours par leur texte.
--
-- Aucun `grant` : `plans` et `plan_days` ont l'`UPDATE` au niveau table pour
-- `authenticated` (vérifié le 17 septembre 2026).

-- ---------------------------------------------------------------------------
-- 1. Le seau
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 20971520, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. Ses policies
-- ---------------------------------------------------------------------------

drop policy if exists "users read own documents" on storage.objects;
drop policy if exists "admins upload own documents" on storage.objects;
drop policy if exists "users delete own documents" on storage.objects;

create policy "users read own documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "admins upload own documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and private.is_admin()
  );

create policy "users delete own documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Pas de policy `update` : un document ne se remplace pas, on refait le plan.

-- ---------------------------------------------------------------------------
-- 3. Les colonnes
-- ---------------------------------------------------------------------------

alter table public.plans
  add column if not exists document text;

comment on column public.plans.document is
  'Chemin, dans le seau `documents`, du PDF dont le plan est tiré — `{user_id}/{uuid}.pdf`. Nul = plan sans document.';

alter table public.plan_days
  add column if not exists page_debut integer,
  add column if not exists page_fin integer;

comment on column public.plan_days.page_debut is
  'Première page du document à lire ce jour (à partir de 1). Nul = pas de document.';
comment on column public.plan_days.page_fin is
  'Dernière page du document à lire ce jour, incluse.';
