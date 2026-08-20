-- Un vrai signal de présence : `profiles.last_seen_at`.
--
-- **`auth.users.last_sign_in_at` ne dit pas qui est en ligne**, et c'est
-- mesuré. Le 20 août 2026 à 13:26 UTC, le compte administrateur portait une
-- « dernière connexion » à 11:29 alors que sa dernière action datait de
-- 13:21 : **117 minutes d'écart**, en pleine utilisation. GoTrue ne met ce
-- champ à jour qu'à une vraie saisie de mot de passe, jamais au
-- rafraîchissement du jeton.
--
-- L'indicateur « En ligne » du tableau d'administration reposait dessus depuis
-- l'origine : il ne s'allumait donc que dans les minutes suivant une connexion,
-- et jamais pour quelqu'un qui reste connecté — c'est-à-dire pour presque tout
-- le monde.
--
-- Le navigateur écrit désormais un horodatage, au plus une fois toutes les
-- trois minutes. La colonne reçoit son propre GRANT (règle 2) : `update` est
-- révoqué au niveau table sur `profiles`, sans cette ligne personne ne pourrait
-- signaler sa présence, et rien ne le dirait clairement.

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

grant update (last_seen_at) on public.profiles to authenticated;

create index if not exists idx_profiles_last_seen on public.profiles(last_seen_at desc nulls last);

comment on column public.profiles.last_seen_at is
  'Dernier signe de vie de l''application, écrit par le navigateur au plus une fois toutes les trois minutes. À ne pas confondre avec auth.users.last_sign_in_at, qui ne bouge qu''à une vraie saisie de mot de passe et ne dit donc rien de la présence.';
