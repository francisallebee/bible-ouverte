-- Le journal des actions d'administration.
--
-- Rien ne traçait jusqu'ici qui avait suspendu qui, ni quand. Six actions
-- existent — promouvoir, rétrograder, suspendre, réactiver, supprimer un
-- compte, écrire un message — et la plus lourde d'entre elles ne laissait
-- aucune trace du tout.
--
-- **`target_id` n'a volontairement aucune clé étrangère.** C'est le point à ne
-- pas « corriger » plus tard par souci de cohérence : une contrainte vers
-- `profiles` avec `on delete cascade` effacerait la trace d'une suppression de
-- compte au moment même où elle se produit, et `on delete set null` la rendrait
-- anonyme. Le journal doit survivre à ce qu'il journalise.
--
-- `target_name` est figé pour la même raison : après la suppression, le nom de
-- la personne n'est plus lisible nulle part ailleurs.
--
-- Lecture réservée aux administrateurs. **Aucune écriture depuis le
-- navigateur** : les lignes naissent dans les routes `src/app/api/admin/`,
-- avec la clé service_role. Un journal qu'on peut écrire soi-même ne prouve
-- rien.

create table if not exists public.admin_actions (
  id bigint primary key generated always as identity,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default '',
  target_id uuid,
  target_name text not null default '',
  action text not null,
  details jsonb not null default '{}',
  "createdAt" timestamptz not null default now()
);

create index if not exists idx_admin_actions_date on public.admin_actions("createdAt" desc);
create index if not exists idx_admin_actions_target on public.admin_actions(target_id);

alter table public.admin_actions enable row level security;

drop policy if exists admin_actions_select on public.admin_actions;
create policy admin_actions_select on public.admin_actions
  for select to authenticated
  using (private.is_admin());

revoke insert, update, delete on public.admin_actions from anon, authenticated;

comment on table public.admin_actions is
  'Journal des actions d''administration. `target_id` n''a volontairement AUCUNE clé étrangère : une suppression de compte effacerait sinon la trace de cette suppression même.';
comment on column public.admin_actions.target_name is
  'Le nom au moment de l''action. Il survit à la suppression de la cible, dont le nom n''est plus lisible nulle part ailleurs.';
