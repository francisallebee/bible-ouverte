-- Un jour de plan peut porter plusieurs passages.
--
-- `plan_days` ne pouvait décrire qu'un livre par jour : un jour, un livre, une
-- plage de chapitres. Cela suffisait aux plans engendrés par l'application —
-- qui répartissent des livres choisis sur une durée — mais interdisait les
-- plans classiques, qui font lire chaque jour un passage de l'Ancien Testament,
-- un des Évangiles et un Psaume. M'Cheyne, les plans chronologiques et tous
-- leurs cousins étaient hors de portée.
--
-- Le choix retenu, et pourquoi il ne casse rien :
--
-- **Une colonne `jsonb` plutôt qu'une table `plan_passages`.** Une table
-- séparée aurait demandé sa RLS, ses policies, sa synchronisation et une
-- jointure sur chaque lecture d'un plan. La colonne garde une ligne par jour,
-- ce qui est aussi la maille de `isRead` et de `readingId`.
--
-- **Les colonnes existantes restent, et portent le premier passage.** Elles
-- sont `not null` avec des valeurs par défaut ; les vider aurait demandé de
-- relâcher ces contraintes, donc de toucher aux 7 plans en production. Elles
-- continuent donc de décrire le premier passage du jour, et tout code qui ne
-- connaît pas `passages` lit un plan cohérent, simplement tronqué à son premier
-- passage.
--
-- **Aucune reprise de données.** Une ligne dont `passages` est nul se lit comme
-- un jour à passage unique, reconstitué depuis les colonnes — voir
-- `dayPassages` dans `lib/storage/plan-passages.ts`. Les lignes existantes
-- n'ont donc pas à être réécrites, et un appareil resté sur l'ancienne version
-- continue de fonctionner.
--
-- Forme attendue, quand la colonne est renseignée :
--
--   [{"book":"GEN","chapterStart":1,"chapterEnd":3,"verseStart":1,"verseEnd":1},
--    {"book":"MAT","chapterStart":1,"chapterEnd":1,"verseStart":1,"verseEnd":25}]

alter table public.plan_days
  add column if not exists passages jsonb;

comment on column public.plan_days.passages is
  'Passages du jour. Nul = jour à passage unique, décrit par les colonnes book/chapterStart/chapterEnd/verseStart/verseEnd, qui portent de toute façon le premier passage.';
