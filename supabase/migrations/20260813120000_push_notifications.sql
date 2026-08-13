-- Notifications push (feuille de route, item 17) — deuxième des cinq morceaux.
--
-- Deux tables, et rien d'autre : les préférences de l'utilisateur — les cinq
-- interrupteurs, l'heure du rappel, le fuseau — vivent dans le `jsonb` de
-- `settings`, comme `autoLogoutMinutes` et `notificationsEnabled` avant elles.
-- Une colonne par préférence aurait fait une migration à chaque réglage ajouté.
--
-- Migration additive : elle ne touche à aucune table existante.

-- ---------------------------------------------------------------------------
-- 1. Les abonnements
-- ---------------------------------------------------------------------------
-- Un abonnement par appareil, pas par compte : le même utilisateur reçoit sur
-- son téléphone et sur son ordinateur, et se désabonne de l'un sans l'autre.

create table if not exists public.push_subscriptions (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- L'URL que le service de push du navigateur nous donne. Elle identifie
  -- l'appareil : d'où l'unicité, qui évite qu'un même téléphone reçoive deux
  -- fois la même notification après une réinstallation.
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  "userAgent" text,
  "createdAt" timestamptz not null default now(),
  "lastSeenAt" timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions(user_id);

-- ---------------------------------------------------------------------------
-- 2. La mémoire des envois
-- ---------------------------------------------------------------------------
-- Sans elle, un plan en retard le reste et serait notifié à chaque passage du
-- cron. C'est la contrainte d'unicité qui fait tout le travail : le même motif
-- pour la même référence ne peut pas être envoyé deux fois.
--
-- `ref` porte ce qui distingue deux envois d'un même motif :
--   daily         → la date du jour, donc un rappel par jour et pas davantage
--   plan-late     → l'identifiant du plan
--   support-reply → l'identifiant du ticket
--   roadmap-done  → l'identifiant de l'item passé à « Terminé »
--   inactive      → la date du jour de la relance

create table if not exists public.notification_log (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  ref text not null default '',
  "sentAt" timestamptz not null default now(),
  unique (user_id, kind, ref)
);

alter table public.notification_log
  drop constraint if exists notification_log_kind_check;
alter table public.notification_log
  add constraint notification_log_kind_check
  check (kind in ('daily', 'plan-late', 'support-reply', 'roadmap-done', 'inactive'));

create index if not exists idx_notification_log_user
  on public.notification_log(user_id, "sentAt" desc);

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------

alter table public.push_subscriptions enable row level security;
alter table public.notification_log enable row level security;

-- Un appareil s'inscrit et se désinscrit lui-même, depuis le navigateur.
-- Le `with check` sur l'UPDATE est indispensable : sans lui, un utilisateur
-- peut déplacer sa ligne dans le compte d'un autre en y écrivant son user_id.

drop policy if exists "users can read own push_subscriptions" on public.push_subscriptions;
drop policy if exists "users can insert own push_subscriptions" on public.push_subscriptions;
drop policy if exists "users can update own push_subscriptions" on public.push_subscriptions;
drop policy if exists "users can delete own push_subscriptions" on public.push_subscriptions;

create policy "users can read own push_subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "users can insert own push_subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "users can update own push_subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own push_subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- La mémoire des envois se lit mais ne s'écrit pas depuis le navigateur :
-- aucune policy d'écriture n'est posée, et la clé service_role, qui contourne
-- la RLS, reste seule à pouvoir y inscrire quelque chose. Un compte qui
-- pourrait y écrire s'exempterait de ses propres notifications, ou en
-- provoquerait chez les autres.

drop policy if exists "users can read own notification_log" on public.notification_log;

create policy "users can read own notification_log"
  on public.notification_log for select
  using (auth.uid() = user_id);

comment on table public.push_subscriptions is
  'Un abonnement push par appareil. L''endpoint identifie l''appareil et porte l''unicité.';
comment on table public.notification_log is
  'Mémoire des notifications envoyées. L''unicité (user_id, kind, ref) empêche les doublons ; l''écriture est réservée à la clé service_role.';
