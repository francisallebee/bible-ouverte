-- Déclencher l'envoi des courriels sans attendre le quart d'heure.
--
-- Un message écrit depuis l'administration partait déjà par courriel, mais au
-- prochain passage de `courriels-messages` : jusqu'à quinze minutes d'attente
-- pour un geste que l'administrateur vient de faire et dont il attend l'effet.
--
-- **Le secret ne sort pas de la base, et c'est tout l'intérêt.** La route
-- `/api/admin/messages` tourne sur Vercel, qui n'a pas `NOTIFY_CRON_SECRET` —
-- et l'y déposer serait un secret de plus à tenir, dans un environnement qui
-- n'en a pas besoin. La fonction ci-dessous rejoue la commande du
-- planificateur **à l'intérieur de la base**, exactement comme le troisième
-- travail `pg_cron` avait été créé le 20 août 2026 en recopiant le deuxième.
-- Personne n'a besoin de lire le secret pour s'en servir.
--
-- Elle vit dans `public` à contre-courant de `20260801120003_private_helpers`,
-- pour la même raison forcée qu'`increment_message_attempt` : PostgREST
-- n'expose en RPC que ce schéma. Le verrou est donc reporté sur les droits.
--
-- **Le cron reste, et n'est pas un doublon.** Il devient le filet : si cet
-- appel immédiat échoue — fonction Edge indisponible, réseau, `pg_net` en
-- vrac —, `emailed_at` reste nul et le passage suivant reprend l'envoi. Et
-- comme c'est `emailed_at` qui décide, un message déjà parti ne repart pas.
-- Aucun message perdu, aucun message en double.

create or replace function public.declencher_envoi_messages()
returns bigint
language plpgsql
security definer
set search_path = public, cron, net, extensions
as $$
declare
  commande text;
  requete bigint;
begin
  select command into commande
  from cron.job
  where jobname = 'courriels-messages';

  -- Sans planificateur, pas de commande à rejouer — donc pas d'URL ni de
  -- secret. On le dit plutôt que de rendre un succès qui n'envoie rien.
  if commande is null then
    raise exception 'planificateur « courriels-messages » introuvable';
  end if;

  -- La commande est un `select net.http_post(...)`, qui rend l'identifiant de
  -- la requête mise en file. `pg_net` étant asynchrone, cet identifiant ne dit
  -- pas que le courriel est parti : il dit que l'appel est en route. La
  -- vérité reste dans `net._http_response`, et la remise, chez le
  -- destinataire seul.
  execute commande into requete;
  return requete;
end;
$$;

comment on function public.declencher_envoi_messages() is
  'Rejoue la commande du planificateur courriels-messages, sans exposer son secret.';

-- Réservée à la clé service_role : un compte connecté ne doit pas pouvoir
-- faire partir les courriels de l'administration à volonté.
revoke all on function public.declencher_envoi_messages() from public;
revoke all on function public.declencher_envoi_messages() from anon;
revoke all on function public.declencher_envoi_messages() from authenticated;
grant execute on function public.declencher_envoi_messages() to service_role;
