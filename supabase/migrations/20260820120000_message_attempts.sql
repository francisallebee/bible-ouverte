-- Le compteur de tentatives d'envoi, incrémenté de façon atomique.
--
-- La fonction Edge incrémente **avant** d'envoyer : une coupure entre l'envoi
-- et l'écriture ferait sinon réessayer indéfiniment. Un lire-puis-écrire depuis
-- la fonction aurait suffi au rythme réel, mais laisse une fenêtre où deux
-- passages concurrents lisent la même valeur et écrivent la même incrémentée —
-- soit une tentative perdue, et une borne qui ne borne plus.
--
-- **Elle vit dans `public` et non dans `private`, à contre-courant de
-- `20260801120003_private_helpers.sql`, et c'est forcé** : PostgREST n'expose
-- en RPC que le schéma `public`, et la fonction Edge l'appelle par là. Le
-- verrou est donc reporté sur les droits — `execute` retiré à `anon` et
-- `authenticated`, accordé à la seule clé service_role.

create or replace function public.increment_message_attempt(message_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.messages
  set email_attempts = email_attempts + 1,
      "updatedAt" = now()
  where id = message_id;
$$;

revoke all on function public.increment_message_attempt(bigint) from public, anon, authenticated;
grant execute on function public.increment_message_attempt(bigint) to service_role;

comment on function public.increment_message_attempt(bigint) is
  'Incrémente le compteur de tentatives d''envoi par courriel. Réservée à la clé service_role : appelée par la fonction Edge send-messages.';
