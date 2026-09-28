-- Les thèmes de l'utilisateur, à côté des quinze thèmes du code.
--
-- Demandé le 28 septembre 2026 : « créer son propre thème » dans la recherche
-- biblique. C'est exactement la situation des **contextes** — une table de
-- référence dans le code (`features/bible/themes.ts`, libellés dans les cinq
-- dictionnaires) et des entrées créées par le lecteur, qui gardent son texte.
-- Les thèmes du code ne descendent donc pas en base : ils s'y mêleraient, et
-- une traduction cesserait d'être une traduction.
--
-- `passages` en `jsonb`, comme `plan_days.passages` depuis le 19 août 2026 :
-- un thème est une liste de passages, jamais interrogée passage par passage.
-- Une table jointe coûterait une jointure à chaque affichage pour un tableau
-- qu'on lit toujours en entier.
--
-- `id` est un `text` engendré par le client, comme `contexts.id` : le cache
-- IndexedDB doit pouvoir écrire hors ligne et pousser ensuite, ce qu'un
-- `identity` de la base interdirait.
--
-- Additive : nouvelle table, rien n'est touché. Aucun `grant` de colonne — la
-- table entière appartient à son propriétaire, comme `contexts`.

create table if not exists public.user_themes (
  id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  emoji text not null default '',
  passages jsonb not null default '[]'::jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  primary key (id, user_id)
);

create index if not exists idx_user_themes_user on public.user_themes(user_id);

alter table public.user_themes enable row level security;

-- Mêmes quatre policies que les données personnelles du baseline. Le
-- `with check` sur l'UPDATE n'est pas décoratif : sans lui, un compte peut
-- réécrire le `user_id` de sa propre ligne et déposer sa donnée chez un tiers.

drop policy if exists "users can read own user_themes" on public.user_themes;
drop policy if exists "users can insert own user_themes" on public.user_themes;
drop policy if exists "users can update own user_themes" on public.user_themes;
drop policy if exists "users can delete own user_themes" on public.user_themes;

create policy "users can read own user_themes" on public.user_themes
  for select using (auth.uid() = user_id);
create policy "users can insert own user_themes" on public.user_themes
  for insert with check (auth.uid() = user_id);
create policy "users can update own user_themes" on public.user_themes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own user_themes" on public.user_themes
  for delete using (auth.uid() = user_id);
