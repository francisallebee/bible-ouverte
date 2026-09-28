-- Réparation de données : les lectures de plan datées du jour **prévu**
-- plutôt que du jour **lu**.
--
-- Jusqu'au 28 septembre 2026, cocher un jour de plan daté enregistrait sa
-- lecture à la date que le calendrier du plan avait prévue pour ce jour, et
-- non au jour où le lecteur cochait. Statistiques, séries et objectifs
-- comptant tous par `readings.date`, une lecture faite en retard partait dans
-- une semaine révolue, et une lecture faite en avance dans le futur — où elle
-- reste invisible jusqu'à sa date. C'est le ticket 32, et le code est corrigé
-- par `lib/plans/cochage.ts` (`datesDuCochage`).
--
-- Relevé avant application : **242 lignes sur les 362 lectures de plan**, sur
-- 8 comptes, écart de −221 à +70 jours, dont 81 dans le futur.
--
-- Le jour réel est celui de la **création** de la ligne : cocher écrit la
-- lecture dans la foulée du geste. `createdAt` est un `timestamptz` ; le jour
-- civil s'en déduit dans un fuseau, et le dépôt n'en stocke aucun par compte —
-- **`Europe/Paris` est une hypothèse**, celle de la quasi-totalité des
-- lecteurs. Se tromper de fuseau coûte au plus un jour, là où l'écart corrigé
-- va jusqu'à sept mois.
--
-- `readings.date` est de type `text` (format `YYYY-MM-DD`), d'où le `to_char`.
--
-- Additive et idempotente : rejouée, la clause `where` ne trouve plus rien.
-- Aucune ligne n'est supprimée, aucune colonne n'est touchée hors `date`.
-- **Non réversible** : les dates précédentes ne sont conservées nulle part —
-- appliquée sur accord explicite du propriétaire, le 28 septembre 2026.

update public.readings r
set date = to_char((r."createdAt" at time zone 'Europe/Paris')::date, 'YYYY-MM-DD')
where r."contextId" = 'plan-lecture'
  and r.date::date <> (r."createdAt" at time zone 'Europe/Paris')::date;
