-- Change l'emoji du contexte système « Méditation » : 🧘 devient 🕊️.
--
-- 🧘 représente une posture de yoga, pas le recueillement sur un texte
-- biblique. Signalé par un ticket support.
--
-- Le seed du client porte la nouvelle valeur pour les installations neuves,
-- mais `ensureContextsExist` n'ajoute et ne supprime que : il ne met jamais à
-- jour un contexte déjà présent. Sans cette migration, les comptes existants
-- garderaient 🧘 — et comme `syncContexts` fait du distant la source de
-- vérité, il le réécrirait par-dessus toute correction locale.
--
-- Idempotent et sans reprise de données : `id` ne change pas, donc les
-- lectures qui pointent vers `meditation` restent rattachées. La clause sur
-- l'ancien emoji garantit qu'un rejeu n'écrase pas un choix ultérieur.

update public.contexts
   set emoji = '🕊️'
 where id = 'meditation'
   and "isSystemDefault" = true
   and emoji = '🧘';
