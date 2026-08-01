-- Retire les fonctions internes de la surface d'API.
--
-- PostgREST expose en RPC toute fonction du schéma `public` que le rôle peut
-- exécuter. Deux fonctions s'y trouvaient sans raison :
--
--   public.is_admin()        introduite par la migration de baseline. Les
--                            policies l'appellent, donc `authenticated` doit
--                            garder le droit de l'exécuter — mais rien
--                            n'oblige à la publier sur /rest/v1/rpc/is_admin.
--   public.handle_new_user() fonction de trigger, appelable par anon. Un
--                            trigger ne vérifie pas le droit EXECUTE de
--                            l'appelant : on peut le révoquer sans rien casser.
--
-- Les fonctions internes déménagent donc dans un schéma `private`, que
-- PostgREST n'expose pas.

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. is_admin() passe en privé
-- ---------------------------------------------------------------------------

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

-- Les policies qui référencent public.is_admin() doivent être recréées avant
-- de pouvoir supprimer l'ancienne fonction.

drop policy if exists "admins can delete tickets" on public.tickets;
create policy "admins can delete tickets"
  on public.tickets for delete
  using (private.is_admin());

drop policy if exists "admins can insert roadmap" on public.roadmap_items;
create policy "admins can insert roadmap"
  on public.roadmap_items for insert
  with check (private.is_admin());

drop policy if exists "admins can delete roadmap" on public.roadmap_items;
create policy "admins can delete roadmap"
  on public.roadmap_items for delete
  using (private.is_admin());

-- Idem pour les triggers de garde.

create or replace function public.guard_ticket_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or private.is_admin() then
    return new;
  end if;

  new.id := old.id;
  new.user_id := old.user_id;
  new."userName" := old."userName";
  new.type := old.type;
  new.message := old.message;
  new.status := old.status;
  new."createdAt" := old."createdAt";
  return new;
end;
$$;

create or replace function public.guard_roadmap_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid text;
begin
  if auth.uid() is null or private.is_admin() then
    return new;
  end if;

  uid := auth.uid()::text;

  new.id := old.id;
  new.title := old.title;
  new.description := old.description;
  new.status := old.status;
  new."createdAt" := old."createdAt";
  new.reactions := (coalesce(old.reactions, '{}'::jsonb) - uid)
    || (case
          when coalesce(new.reactions, '{}'::jsonb) ? uid
            then jsonb_build_object(uid, new.reactions -> uid)
          else '{}'::jsonb
        end);
  return new;
end;
$$;

drop function if exists public.is_admin();

-- ---------------------------------------------------------------------------
-- 2. Les fonctions de trigger ne sont plus appelables en RPC
-- ---------------------------------------------------------------------------
-- Un trigger vérifie le droit EXECUTE à sa création, pas à chaque exécution :
-- révoquer ici ne casse ni l'inscription ni les gardes.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.guard_profile_privileges() from public, anon, authenticated;
revoke all on function public.guard_ticket_update() from public, anon, authenticated;
revoke all on function public.guard_ticket_insert() from public, anon, authenticated;
revoke all on function public.guard_roadmap_update() from public, anon, authenticated;
