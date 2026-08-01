-- Rattache une lecture à son contexte.
--
-- La table `contexts` existait déjà, synchronisée et pré-remplie, mais rien ne
-- la reliait aux lectures : le formulaire enregistrait systématiquement
-- `tags: []` et aucune colonne ne portait le contexte. Le SPEC prévoyait
-- pourtant un `contextId` sur ReadingEntry dès l'origine.
--
-- Un seul contexte par lecture, comme le menu déroulant du formulaire.
--
-- Pas de clé étrangère vers `contexts` : sa clé primaire est composite
-- (id, user_id) et un contexte supprimé ne doit pas emporter les lectures qui
-- s'y rattachaient. Une chaîne vide vaut « aucun contexte », ce qui garde les
-- lectures déjà enregistrées valides sans reprise de données.

alter table public.readings
  add column if not exists "contextId" text not null default '';

create index if not exists idx_readings_user_context
  on public.readings(user_id, "contextId");
