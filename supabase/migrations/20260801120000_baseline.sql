-- Baseline du schéma Bible Ouverte.
--
-- Ce fichier est IDEMPOTENT et NON DESTRUCTIF : il peut être rejoué sur la base
-- de production sans perdre une seule ligne. Il remplace l'ancien
-- supabase-schema.sql qui commençait par sept "drop table ... cascade".
--
-- Toute évolution ultérieure du schéma passe par un NOUVEAU fichier de
-- migration, jamais par une modification de celui-ci.
--
-- Les colonnes camelCase sont entre guillemets pour préserver la casse : sans
-- guillemets PostgreSQL les replierait en minuscules et PostgREST rejetterait
-- les requêtes du client, qui envoie "chapterStart".

-- ---------------------------------------------------------------------------
-- 1. Profils
-- ---------------------------------------------------------------------------
-- Cette table existait en production mais n'était définie nulle part dans le
-- dépôt : impossible de rejouer le schéma sur un projet neuf, et impossible
-- d'auditer ses droits alors qu'elle porte le drapeau d'administration.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  color text not null default '#1e3a5f',
  is_admin boolean not null default false,
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists suspended boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists avatar_url text,
  add column if not exists birth_date text,
  add column if not exists phone text,
  add column if not exists bio text,
  add column if not exists social_links jsonb not null default '{}';

-- ---------------------------------------------------------------------------
-- 2. Données de lecture
-- ---------------------------------------------------------------------------

create table if not exists public.readings (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date text not null,
  book text not null,
  "chapterStart" int not null default 1,
  "chapterEnd" int not null default 1,
  "verseStart" int not null default 1,
  "verseEnd" int not null default 1,
  "passageText" text not null default '',
  "translationId" text not null default '',
  tags text not null default '[]',
  notes text not null default '',
  links text not null default '[]',
  photos text not null default '[]',
  audio text not null default '',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_readings_user on public.readings(user_id);
create index if not exists idx_readings_user_date on public.readings(user_id, date);

create table if not exists public.contexts (
  id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null default '',
  color text not null default '#6366f1',
  icon text not null default '',
  emoji text default '',
  "parentId" text default '',
  "isSystemDefault" boolean not null default false,
  primary key (id, user_id)
);

create index if not exists idx_contexts_user on public.contexts(user_id);

create table if not exists public.plans (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  "versionId" text not null default '',
  duration text not null default '1-year',
  "customDays" int,
  books text not null default '[]',
  "startDate" text not null,
  "totalDays" int not null default 30,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_plans_user on public.plans(user_id);

create table if not exists public.plan_days (
  id bigint primary key generated always as identity,
  plan_id bigint not null references public.plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day int not null,
  date text not null,
  book text not null,
  "chapterStart" int not null default 1,
  "chapterEnd" int not null default 1,
  "isRead" boolean not null default false,
  "readingId" bigint
);

create index if not exists idx_plan_days_plan on public.plan_days(plan_id);
create index if not exists idx_plan_days_user on public.plan_days(user_id);

-- Paramètres utilisateur (payload JSON complet : simple et évolutif)
create table if not exists public.settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}',
  "updatedAt" timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Contenus partagés
-- ---------------------------------------------------------------------------

-- Tickets support : le tableau est partagé entre tous les utilisateurs
-- connectés (chacun voit les tickets des autres et peut y répondre). Les
-- restrictions d'écriture colonne par colonne sont dans la migration
-- 20260801120002.
create table if not exists public.tickets (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.profiles(id) on delete cascade,
  "userName" text not null default '',
  type text not null default 'bug',
  message text not null default '',
  status text not null default 'open',
  replies jsonb not null default '[]',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_tickets_user on public.tickets(user_id);
create index if not exists idx_tickets_status on public.tickets(status);

-- Feuille de route : contenu global, lecture pour tous, édition par les admins
create table if not exists public.roadmap_items (
  id bigint primary key generated always as identity,
  title text not null,
  description text not null default '',
  status text not null default 'planned',
  reactions jsonb not null default '{}',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Helper : l'appelant est-il administrateur ?
-- ---------------------------------------------------------------------------
-- security definer pour que la fonction lise profiles sans repasser par la RLS
-- de profiles (sinon les policies qui l'appellent deviendraient récursives dès
-- qu'on ajoute une policy "les admins voient tous les profils").
-- stable : PostgreSQL peut mémoïser l'appel sur la durée d'une requête.

create or replace function public.is_admin()
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

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.readings enable row level security;
alter table public.contexts enable row level security;
alter table public.plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.settings enable row level security;
alter table public.tickets enable row level security;
alter table public.roadmap_items enable row level security;

-- Données personnelles : lecture, écriture et suppression réservées au
-- propriétaire. Le "with check" sur les UPDATE est indispensable — sans lui, un
-- utilisateur peut modifier sa propre ligne en y écrivant le user_id de
-- quelqu'un d'autre, et donc déplacer ses données dans le compte d'un tiers.

do $$
declare
  t text;
begin
  foreach t in array array['readings', 'contexts', 'plans', 'plan_days'] loop
    execute format('drop policy if exists "users can read own %1$s" on public.%1$I', t);
    execute format('drop policy if exists "users can insert own %1$s" on public.%1$I', t);
    execute format('drop policy if exists "users can update own %1$s" on public.%1$I', t);
    execute format('drop policy if exists "users can delete own %1$s" on public.%1$I', t);

    execute format(
      'create policy "users can read own %1$s" on public.%1$I
         for select using (auth.uid() = user_id)', t);
    execute format(
      'create policy "users can insert own %1$s" on public.%1$I
         for insert with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "users can update own %1$s" on public.%1$I
         for update using (auth.uid() = user_id)
         with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "users can delete own %1$s" on public.%1$I
         for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

drop policy if exists "users can read own settings" on public.settings;
drop policy if exists "users can insert own settings" on public.settings;
drop policy if exists "users can update own settings" on public.settings;

create policy "users can read own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "users can insert own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "users can update own settings"
  on public.settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. Création automatique du profil et des réglages
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    '#1e3a5f'
  )
  on conflict (id) do nothing;

  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rattrapage : réglages par défaut pour les profils déjà existants
insert into public.settings (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
