-- Verrouillage de public.profiles.
--
-- profiles porte is_admin et suspended : c'est la frontière de privilège de
-- l'application. Or l'app écrit en direct depuis le navigateur avec la clé
-- anon. Sans restriction au niveau colonne, n'importe quel compte connecté
-- pouvait exécuter ceci depuis la console du navigateur :
--
--   await supabase.from('profiles').update({ is_admin: true }).eq('id', myId)
--
-- ...et obtenir l'accès au back-office. Deux verrous complémentaires ci-dessous.

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- 1. Policies : chacun ne voit et ne modifie que sa propre ligne
-- ---------------------------------------------------------------------------
-- Le back-office lit tous les profils via la clé service_role, qui contourne la
-- RLS : aucune policy "admin" n'est nécessaire ici.
-- Aucune policy INSERT ni DELETE : la création passe par le trigger
-- handle_new_user (security definer) et la suppression par la route
-- /api/admin/users/[id], toutes deux hors RLS.

drop policy if exists "users can read own profile" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;

create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2. Droits colonne par colonne
-- ---------------------------------------------------------------------------
-- Une policy RLS filtre les LIGNES, pas les COLONNES : "users can update own
-- profile" autorise encore à écrire is_admin sur sa propre ligne. Le contrôle
-- colonne se fait au niveau des GRANT.
--
-- Il faut d'abord retirer le droit UPDATE au niveau table : tant qu'il existe,
-- il couvre toutes les colonnes et un REVOKE partiel resterait sans effet.

revoke update on public.profiles from anon, authenticated;
revoke insert, delete on public.profiles from anon, authenticated;

grant update (
  name,
  color,
  avatar_url,
  birth_date,
  phone,
  bio,
  social_links
) on public.profiles to authenticated;

-- is_admin, suspended, id et created_at ne sont volontairement pas listés :
-- ils ne sont modifiables que par la clé service_role, c'est-à-dire par
-- /api/admin/users/[id] après vérification du drapeau admin côté serveur.

-- ---------------------------------------------------------------------------
-- 3. Filet de sécurité
-- ---------------------------------------------------------------------------
-- Défense en profondeur : si un futur code passe par une fonction security
-- definer ou si un GRANT est rétabli par mégarde, le trigger bloque quand même
-- l'élévation de privilège. auth.uid() est nul pour la clé service_role, ce qui
-- laisse le back-office promouvoir et suspendre normalement.

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new; -- service_role : back-office, trigger d'inscription
  end if;

  if new.is_admin is distinct from old.is_admin then
    raise exception 'is_admin ne peut pas être modifié depuis le client';
  end if;

  if new.suspended is distinct from old.suspended then
    raise exception 'suspended ne peut pas être modifié depuis le client';
  end if;

  new.id := old.id;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists guard_profile_privileges on public.profiles;
create trigger guard_profile_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();
