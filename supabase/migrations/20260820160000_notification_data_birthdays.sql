-- Un sixième déclencheur de notification : l'anniversaire.
--
-- `notification_data()` rend une clé `birthdays` de plus. La fenêtre est
-- volontairement **large — plus ou moins un jour UTC** — parce que cette
-- fonction ne connaît pas le fuseau de chacun : elle rend des candidats, et
-- c'est `collectBirthdays` de `schedule.ts` qui tranche, avec le fuseau lu dans
-- les réglages. Un filtre serré en SQL manquerait les fuseaux extrêmes.
--
-- Seule cette clé change ; le reste de la fonction est repris tel quel, un
-- `create or replace` ne pouvant pas être partiel.

create or replace function public.notification_data(cutoff_date text, since timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path to 'public'
as $function$
  select jsonb_build_object(
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
          and pd.date <> ''
          and pd.date < cutoff_date
        group by pd.user_id, pd.plan_id, p.name
      ) t), '[]'::jsonb),
    'lastReadings', coalesce((
      select jsonb_agg(jsonb_build_object('userId', r.user_id, 'date', r.derniere))
      from (
        select user_id, max(date) as derniere
        from readings
        group by user_id
      ) r), '[]'::jsonb),
    'roadmapDone', coalesce((
      select jsonb_agg(jsonb_build_object('itemId', ri.id, 'title', ri.title))
      from roadmap_items ri
      where ri.status = 'done' and ri."updatedAt" >= since), '[]'::jsonb),
    'supportReplies', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', t.user_id,
        'ticketId', t.id,
        'replyId', rep->>'id',
        'authorName', coalesce(rep->>'userName', 'Quelqu''un')))
      from tickets t
      cross join lateral jsonb_array_elements(coalesce(t.replies, '[]'::jsonb)) rep
      where (rep->>'userId') is distinct from t.user_id::text
        and (rep->>'createdAt')::timestamptz >= since), '[]'::jsonb),
    'birthdays', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', p.id,
        'birthDate', p.birth_date,
        'firstName', coalesce(nullif(trim(p.first_name), ''), nullif(trim(p.name), ''))))
      from profiles p
      where p.birth_date ~ '^\d{4}-\d{2}-\d{2}$'
        and (
          substr(p.birth_date, 6, 5) in (
            to_char((now() at time zone 'UTC')::date - 1, 'MM-DD'),
            to_char((now() at time zone 'UTC')::date,     'MM-DD'),
            to_char((now() at time zone 'UTC')::date + 1, 'MM-DD')
          )
          or (
            substr(p.birth_date, 6, 5) = '02-29'
            and '02-28' in (
              to_char((now() at time zone 'UTC')::date - 1, 'MM-DD'),
              to_char((now() at time zone 'UTC')::date,     'MM-DD'),
              to_char((now() at time zone 'UTC')::date + 1, 'MM-DD')
            )
          )
        )), '[]'::jsonb)
  );
$function$;

comment on function public.notification_data(text, timestamptz) is
  'Données agrégées des déclencheurs de notification. security invoker : un compte ordinaire n''y voit que ses propres lignes, la clé service_role voit tout. La clé birthdays rend une fenêtre de plus ou moins un jour UTC — assez large pour couvrir tous les fuseaux, le tri exact se faisant dans la fonction Edge, qui connaît le fuseau de chacun.';
