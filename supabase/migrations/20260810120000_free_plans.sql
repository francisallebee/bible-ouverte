-- Plans de lecture libres (feuille de route, item 15).
--
-- Un plan libre est une liste de passages sans date : on l'écrit d'avance et on
-- coche au fur et à mesure, en choisissant la date de chaque lecture. Deux
-- manques l'empêchaient :
--
--   1. Rien ne distinguait un plan daté d'un plan libre.
--   2. `plan_days` ne connaissait que des chapitres, alors que la feuille de
--      route demande de pouvoir cocher « n'importe quel verset, chapitre ».
--
-- Migration purement additive. Les plans existants prennent `kind = 'scheduled'`
-- et gardent leur comportement au chapitre près : `verseStart` et `verseEnd`
-- valent 1, comme les lectures que les plans datés créent déjà.
--
-- Les policies RLS de `20260801120000_baseline.sql` sont posées par ligne et non
-- par colonne : elles couvrent ces nouvelles colonnes sans rien à ajouter.

alter table public.plans
  add column if not exists kind text not null default 'scheduled';

-- Une valeur inattendue ferait basculer l'écran sur la mauvaise présentation
-- sans rien signaler.
alter table public.plans
  drop constraint if exists plans_kind_check;
alter table public.plans
  add constraint plans_kind_check check (kind in ('scheduled', 'free'));

alter table public.plan_days
  add column if not exists "verseStart" int not null default 1;
alter table public.plan_days
  add column if not exists "verseEnd" int not null default 1;

-- `date` reste `not null` : une entrée de plan libre porte la chaîne vide tant
-- qu'elle n'est pas cochée, et la date choisie ensuite. Rendre la colonne
-- nullable aurait obligé à traiter deux absences de date au lieu d'une.

comment on column public.plans.kind is
  'scheduled : jours générés à partir d''une durée et d''une date de début. free : liste de passages sans date, cochés un à un.';
comment on column public.plan_days."verseStart" is
  'Premier verset du passage. 1 pour les plans datés, qui raisonnent au chapitre.';
comment on column public.plan_days."verseEnd" is
  'Dernier verset du passage. 1 pour les plans datés, qui raisonnent au chapitre.';
