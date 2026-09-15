-- Un passage à mémoriser peut être un groupe de versets, et non plus un seul.
--
-- La table ne portait qu'un verset par ligne, ce qui suffisait à la
-- mémorisation « au hasard » née le 19 août. La mémorisation personnalisée du
-- 15 septembre 2026 laisse choisir un passage avec le sélecteur commun de
-- l'application — un verset, ou plusieurs, jusqu'à enjamber un chapitre.
--
-- **Un groupe de versets est un seul texte appris, donc une seule ligne.** Une
-- ligne par verset aurait fait réviser Psaume 23 en six séances sans lien,
-- chacune à son niveau et à son échéance ; ce n'est pas ce qu'on apprend par
-- cœur. `chapter` et `verse` restent le début de l'intervalle — aucune ligne
-- existante ne change de sens —, `chapterEnd` et `verseEnd` en sont la fin.
--
-- Migration additive et idempotente : les lignes existantes reçoivent leur
-- propre verset pour fin, ce qu'elles étaient déjà implicitement.

alter table public.memorised_verses
  add column if not exists "chapterEnd" integer,
  add column if not exists "verseEnd" integer;

update public.memorised_verses
  set "chapterEnd" = chapter
  where "chapterEnd" is null;

update public.memorised_verses
  set "verseEnd" = verse
  where "verseEnd" is null;

alter table public.memorised_verses
  alter column "chapterEnd" set not null,
  alter column "verseEnd" set not null;

-- L'intervalle est ordonné : la fin ne précède pas le début. Sur un même
-- chapitre, le dernier verset n'est pas avant le premier.
alter table public.memorised_verses
  drop constraint if exists memorised_verses_intervalle_ordonne;
alter table public.memorised_verses
  add constraint memorised_verses_intervalle_ordonne check (
    "chapterEnd" > chapter
    or ("chapterEnd" = chapter and "verseEnd" >= verse)
  );

-- L'unicité portait sur le verset de départ ; elle porte désormais sur
-- l'intervalle entier. Sans cela, Jean 3:16 et Jean 3:16-17 se seraient
-- exclus l'un l'autre alors que ce sont deux textes distincts.
--
-- Le nom est entre guillemets parce que Postgres l'a composé avec `versionId`
-- et sa majuscule : sans eux, l'identifiant serait replié en minuscules et le
-- `drop` ne trouverait rien — sans erreur, grâce au `if exists`. Relevé dans
-- `pg_constraint` le 15 septembre 2026, et non supposé.
alter table public.memorised_verses
  drop constraint if exists "memorised_verses_user_id_book_chapter_verse_versionId_key";
alter table public.memorised_verses
  drop constraint if exists memorised_verses_intervalle_unique;
alter table public.memorised_verses
  add constraint memorised_verses_intervalle_unique
  unique (user_id, book, chapter, verse, "chapterEnd", "verseEnd", "versionId");

-- Aucun `grant` colonne : `memorised_verses` a l'UPDATE au niveau table,
-- comme `readings` — et non colonne par colonne comme `profiles` et
-- `messages`. Vérifié par `information_schema.table_privileges` avant
-- d'écrire cette ligne, jamais par `column_privileges`.
