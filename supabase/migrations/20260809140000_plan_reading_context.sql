-- Rattache les lectures issues d'un plan au contexte « Plan de lecture ».
--
-- Cocher un jour de plan enregistrait une lecture sans contexte. Ces lectures
-- s'accumulaient donc sous « Sans contexte » dans les statistiques, où elles
-- représentaient l'essentiel du total et rendaient la répartition illisible.
-- Le code écrit désormais le contexte à la création ; cette migration reprend
-- les lignes déjà enregistrées.
--
-- Deux étapes, toutes deux idempotentes et non destructives.

-- 1. Le contexte système, pour chaque compte qui ne l'a pas déjà.
--    `contexts` a une clé primaire composite (id, user_id) : une ligne par
--    utilisateur, comme les autres contextes par défaut.
insert into public.contexts (id, user_id, name, slug, color, icon, emoji, "parentId", "isSystemDefault")
select 'plan-lecture', p.id, 'Plan de lecture', 'plan-lecture', '#3498db', 'tag', '📅', '', true
  from public.profiles p
 where not exists (
   select 1 from public.contexts c
    where c.id = 'plan-lecture' and c.user_id = p.id
 );

-- 2. Les lectures déjà enregistrées depuis un plan.
--    Elles se reconnaissent à leurs notes, écrites par la page du plan sous la
--    forme « Plan : <nom> (jour N) ».
--
--    La clause sur le contexte vide est essentielle : elle garantit qu'aucun
--    contexte choisi par l'utilisateur n'est écrasé, et rend le rejeu sans
--    effet.
update public.readings
   set "contextId" = 'plan-lecture'
 where notes like 'Plan : %'
   and "contextId" = '';
