-- Le titre de la séance qui a produit une lecture.
--
-- « Mes lectures » regroupe déjà les lectures d'un même enregistrement, en les
-- reconnaissant à leur proximité dans le temps (`lib/lectures/saisies.ts`).
-- Ce groupe n'avait pourtant pas de nom : il s'annonçait par ses références —
-- « Ecclésiaste 3:11, Jean 3:16-17 et 8 autres ». Un titre donné au moment de
-- l'enregistrement — « Culte du dimanche », « Étude sur Romains » — le rend
-- reconnaissable, et sert de première clé de tri à l'intérieur d'une journée.
--
-- **Une colonne sur `readings`, et non une table `sessions`.** Une table
-- séparée aurait demandé sa RLS, ses policies, sa synchronisation, une
-- jointure sur chaque lecture, et la gestion des séances devenues vides quand
-- on supprime leurs lectures. Le titre est une propriété de la lecture, répétée
-- sur les quelques lignes d'une même séance — la même économie que
-- `plan_days.passages` en son temps.
--
-- **Nullable, sans valeur par défaut, et c'est le point.** Le titre est
-- facultatif à la saisie : le bandeau de nommage propose « Enregistrer sans
-- nommer ». Une séance sans nom est donc un cas normal, pas un accident — et
-- les 347 lectures déjà en base, qui n'ont évidemment pas de titre, se
-- comportent exactement comme une séance neuve non nommée. Un seul cas à
-- traiter à l'affichage au lieu de deux, et **aucune reprise de données**.
--
-- **Aucun `grant` à écrire, et c'est mesuré.** La règle 2 d'`AGENTS.md` vaut
-- pour `profiles`, dont l'`update` est révoqué au niveau table : toute colonne
-- neuve y exige son propre `grant update (…)`. `readings` est dans l'autre cas
-- — relevé le 31 août 2026 dans `information_schema.table_privileges`, avec
-- `profiles` en témoin pour prouver que la requête distingue bien les deux :
--
--   profiles  → SELECT seulement, au niveau table
--   readings  → SELECT, INSERT, UPDATE, DELETE, au niveau table
--
-- Une colonne ajoutée à `readings` est donc couverte d'office par les grants
-- existants, et la RLS `auth.uid() = user_id` continue de s'appliquer telle
-- quelle. Ne pas ajouter de `grant` ici : ce serait un aveu de doute là où la
-- mesure a répondu.

alter table public.readings
  add column if not exists "sessionTitle" text;

comment on column public.readings."sessionTitle" is
  'Titre de la séance d''enregistrement, répété sur chaque lecture du même geste. Nul = séance non nommée, ce qui est un cas normal : le nommage est facultatif, et les lignes antérieures au 31 août 2026 n''en portent aucun.';
