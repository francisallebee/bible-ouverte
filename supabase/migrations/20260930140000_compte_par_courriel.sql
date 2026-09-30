-- Résoudre une adresse en compte, pour les invitations nominatives.
--
-- Correctif de la migration du même jour : `plan_invitations.invited_user`
-- suppose qu'on sache retrouver un compte depuis une adresse, et **rien ne le
-- permettait**. `public.profiles` ne porte pas de colonne `email` — relevé sur
-- la production le 30 septembre 2026, ses 18 colonnes n'en comprennent
-- aucune —, et l'adresse ne vit que dans `auth.users`, que PostgREST n'expose
-- pas.
--
-- Le défaut aurait été **muet** : la route API aurait posé `invited_user` à
-- nul pour tout le monde, chaque invitation par adresse aurait été traitée
-- comme « cette personne n'a pas de compte », et le destinataire ne l'aurait
-- jamais vue dans l'application. Aucune erreur, aucune trace — seulement une
-- invitation qui n'arrive pas.
--
-- **Dans `public` et non dans `private`**, contrairement aux autres helpers :
-- PostgREST n'expose que les schémas configurés, et une route qui doit
-- l'appeler en RPC ne peut pas atteindre `private`. La confidentialité tient
-- donc au seul `grant`, et il est étroit — `service_role` et personne d'autre.
-- Un utilisateur connecté qui pourrait l'appeler tiendrait un test d'existence
-- de compte, ce que la route s'interdit précisément de rendre.

create or replace function public.compte_par_courriel(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from auth.users u
   where lower(u.email) = lower(p_email)
   limit 1;
$$;

revoke all on function public.compte_par_courriel(text) from public, anon, authenticated;
grant execute on function public.compte_par_courriel(text) to service_role;

-- ---------------------------------------------------------------------------
-- `invitation_par_jeton` dit aussi si l'invitation est nominative
-- ---------------------------------------------------------------------------
-- La page d'invitation ne peut pas décider seule d'afficher « Refuser » : un
-- lien ouvert ne se refuse pas — le refuser le fermerait pour tous ceux qui
-- l'ont reçu —, et `refuser_invitation()` lève dans ce cas. Sans cette
-- colonne, l'écran aurait proposé un bouton qui échoue, ce qui est pire que
-- pas de bouton du tout.
--
-- `drop` puis `create` : changer le type de retour d'une fonction ne se fait
-- pas par `create or replace`.

drop function if exists public.invitation_par_jeton(text);

create or replace function public.invitation_par_jeton(p_jeton text)
returns table (
  plan_nom text,
  invite_par text,
  statut text,
  expiree boolean,
  deja_membre boolean,
  nominative boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.name,
    coalesce(pr.name, ''),
    i.statut,
    i."expiresAt" < now(),
    exists (
      select 1 from public.plan_members m
      where m.plan_id = i.plan_id and m.user_id = auth.uid()
    ),
    i.invited_user is not null or i.email is not null
  from public.plan_invitations i
  join public.plans p on p.id = i.plan_id
  left join public.profiles pr on pr.id = i.created_by
  where i.jeton = p_jeton;
$$;

revoke all on function public.invitation_par_jeton(text) from public;
grant execute on function public.invitation_par_jeton(text) to anon, authenticated, service_role;
