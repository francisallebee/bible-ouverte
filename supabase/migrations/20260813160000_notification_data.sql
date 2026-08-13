-- Les données dont la fonction d'envoi a besoin, en une seule requête.
--
-- Quatre des cinq déclencheurs demandent une agrégation — le plus ancien jour
-- non coché de chaque plan, la dernière lecture de chaque compte — que
-- PostgREST ne sait pas exprimer. Les faire côté TypeScript supposerait de
-- rapatrier toutes les lectures et tous les jours de plan de tous les comptes
-- à chaque passage du cron, toutes les quinze minutes.
--
-- `security invoker` et non `definer` : la fonction s'exécute avec les droits
-- de son appelant. La clé service_role de la fonction d'envoi contourne la RLS
-- et voit tout ; un compte ordinaire qui l'appellerait depuis le navigateur ne
-- verrait que ses propres lignes, comme partout ailleurs. C'est ce qui permet
-- de l'exposer sans risque.

create or replace function public.notification_data(cutoff_date text, since timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(

    -- Les plans dont un jour prévu est passé sans être coché. `min(date)` est
    -- le plus ancien : c'est lui qui sert de référence anti-doublon, pour que
    -- la relance ne se répète pas tant que rien n'est rattrapé.
    'latePlans', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', t.user_id,
        'planId', t.plan_id,
        'planName', t.name,
        'earliestLateDate', t.earliest))
      from (
        select pd.user_id, pd.plan_id, p.name, min(pd.date) as earliest
        from plan_days pd
        join plans p on p.id = pd.plan_id
        where pd."isRead" = false
          -- Les entrées d'un plan libre non cochées portent une date vide :
          -- elles n'ont pas de jour prévu, donc pas de retard possible.
          and pd.date <> ''
          and pd.date < cutoff_date
        group by pd.user_id, pd.plan_id, p.name
      ) t), '[]'::jsonb),

    -- La dernière lecture de chaque compte, pour la relance après absence.
    'lastReadings', coalesce((
      select jsonb_agg(jsonb_build_object('userId', r.user_id, 'date', r.derniere))
      from (
        select user_id, max(date) as derniere
        from readings
        group by user_id
      ) r), '[]'::jsonb),

    -- Les items passés à « Terminé » récemment. La borne `since` est
    -- essentielle : sans elle, le premier passage du cron annoncerait à tout
    -- le monde les vingt fonctionnalités déjà livrées.
    'roadmapDone', coalesce((
      select jsonb_agg(jsonb_build_object('itemId', ri.id, 'title', ri.title))
      from roadmap_items ri
      where ri.status = 'done' and ri."updatedAt" >= since), '[]'::jsonb),

    -- Les réponses reçues sur un ticket, écrites par quelqu'un d'autre que son
    -- auteur. Bornées elles aussi : on ne réveille pas l'historique complet.
    'supportReplies', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', t.user_id,
        'ticketId', t.id,
        'replyId', rep->>'id',
        'authorName', coalesce(rep->>'userName', 'Quelqu''un')))
      from tickets t
      cross join lateral jsonb_array_elements(coalesce(t.replies, '[]'::jsonb)) rep
      where (rep->>'userId') is distinct from t.user_id::text
        and (rep->>'createdAt')::timestamptz >= since), '[]'::jsonb)
  );
$$;

comment on function public.notification_data(text, timestamptz) is
  'Données agrégées des déclencheurs de notification. security invoker : un compte ordinaire n''y voit que ses propres lignes, la clé service_role voit tout.';
