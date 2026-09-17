-- Un jour de plan peut ne porter aucun passage : il lit une portion d'un
-- document, et rien d'autre.
--
-- Le 17 septembre 2026 au soir, le propriétaire a tranché la fonction « lire
-- un document jour après jour » : le document lui-même, gardé, découpé par
-- lui, lu tel qu'il est, **sans aucune référence ajoutée** — « elles sont déjà
-- dans le document ». Cocher un jour, c'est l'avoir lu ; aucune lecture
-- biblique n'en naît.
--
-- Jusqu'ici `plan_days` exigeait un livre et des chapitres (`not null`), parce
-- que chaque jour de plan était une lecture biblique. Ces colonnes deviennent
-- nullables : nulles, le jour est une portion de document, décrite par
-- `page_debut`/`page_fin` (migration `20260917210000`) et par son `titre` —
-- le signet du PDF ou la première ligne de la page, ce que l'écran montre à la
-- place d'une référence.
--
-- Les défauts (`1`) restent : une écriture qui omet ces colonnes se comporte
-- comme avant. Les lignes existantes ne changent pas. Un appareil resté sur
-- l'ancienne version lirait un livre nul comme une chaîne vide et n'afficherait
-- rien pour ce jour — un plan de cette sorte n'existe pas encore sur ces
-- appareils, ils ne le verront qu'après mise à jour.
--
-- Aucun `grant` : `plan_days` a l'`UPDATE` au niveau table pour `authenticated`.

alter table public.plan_days
  alter column book drop not null,
  alter column "chapterStart" drop not null,
  alter column "chapterEnd" drop not null,
  alter column "verseStart" drop not null,
  alter column "verseEnd" drop not null,
  add column if not exists titre text;

comment on column public.plan_days.book is
  'Livre du premier passage (code USFM). Nul = le jour ne lit pas la Bible mais une portion du document du plan (page_debut/page_fin).';
comment on column public.plan_days.titre is
  'Le nom de la portion lue ce jour — signet du PDF ou première ligne de la page. Nul sur un jour biblique.';
