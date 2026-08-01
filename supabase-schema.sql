-- Exécute ce fichier dans Supabase SQL Editor
-- ATTENTION : supprime les tables existantes et recrée tout
-- IMPORTANT : les colonnes camelCase sont ENTRE GUILLEMETS pour préserver la casse
-- (sans guillemets, PostgreSQL convertit chapterStart -> chapterstart et PostgREST
--  rejette ensuite les requêtes du client qui envoient "chapterStart")

drop table if exists public.plan_days cascade;
drop table if exists public.plans cascade;
drop table if exists public.readings cascade;
drop table if exists public.contexts cascade;
drop table if exists public.settings cascade;
drop table if exists public.tickets cascade;

-- 1. Tables (colonnes camelCase quotées pour correspondre aux types TypeScript)

create table public.readings (
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

create index idx_readings_user on public.readings(user_id);
create index idx_readings_user_date on public.readings(user_id, date);

create table public.contexts (
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

create index idx_contexts_user on public.contexts(user_id);

create table public.plans (
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

create index idx_plans_user on public.plans(user_id);

create table public.plan_days (
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

create index idx_plan_days_plan on public.plan_days(plan_id);
create index idx_plan_days_user on public.plan_days(user_id);

-- Paramètres utilisateur (payload JSON complet : simple et évolutif)
create table public.settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}',
  "updatedAt" timestamptz not null default now()
);

-- Tickets (alignés sur les routes /api/tickets : id uuid, created_at snake_case)
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'bug',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tickets_user on public.tickets(user_id);
create index idx_tickets_status on public.tickets(status);

-- 2. Row Level Security

alter table public.readings enable row level security;
alter table public.contexts enable row level security;
alter table public.plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.settings enable row level security;
alter table public.tickets enable row level security;

-- Readings policies
create policy "users can read own readings"
  on public.readings for select
  using (auth.uid() = user_id);

create policy "users can insert own readings"
  on public.readings for insert
  with check (auth.uid() = user_id);

create policy "users can update own readings"
  on public.readings for update
  using (auth.uid() = user_id);

create policy "users can delete own readings"
  on public.readings for delete
  using (auth.uid() = user_id);

-- Contexts policies
create policy "users can read own contexts"
  on public.contexts for select
  using (auth.uid() = user_id);

create policy "users can insert own contexts"
  on public.contexts for insert
  with check (auth.uid() = user_id);

create policy "users can update own contexts"
  on public.contexts for update
  using (auth.uid() = user_id);

create policy "users can delete own contexts"
  on public.contexts for delete
  using (auth.uid() = user_id);

-- Plans policies
create policy "users can read own plans"
  on public.plans for select
  using (auth.uid() = user_id);

create policy "users can insert own plans"
  on public.plans for insert
  with check (auth.uid() = user_id);

create policy "users can update own plans"
  on public.plans for update
  using (auth.uid() = user_id);

create policy "users can delete own plans"
  on public.plans for delete
  using (auth.uid() = user_id);

-- Plan days policies
create policy "users can read own plan_days"
  on public.plan_days for select
  using (auth.uid() = user_id);

create policy "users can insert own plan_days"
  on public.plan_days for insert
  with check (auth.uid() = user_id);

create policy "users can update own plan_days"
  on public.plan_days for update
  using (auth.uid() = user_id);

create policy "users can delete own plan_days"
  on public.plan_days for delete
  using (auth.uid() = user_id);

-- Settings policies
create policy "users can read own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "users can insert own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "users can update own settings"
  on public.settings for update
  using (auth.uid() = user_id);

-- Tickets policies
create policy "users can read own tickets"
  on public.tickets for select
  using (auth.uid() = user_id);

create policy "users can insert own tickets"
  on public.tickets for insert
  with check (auth.uid() = user_id);

create policy "users can update own tickets"
  on public.tickets for update
  using (auth.uid() = user_id);

-- Admin policies
create policy "admins can read all tickets"
  on public.tickets for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "admins can update any ticket"
  on public.tickets for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- 3. Trigger : création auto du profil et des settings
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
  );
  insert into public.settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Settings par défaut pour les profils existants
insert into public.settings (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
