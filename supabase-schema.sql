-- Exécute ce fichier dans Supabase SQL Editor

-- 0. AVANT : créer les buckets Storage via le Dashboard
--    Une fois les tables créées, pour te définir admin :
--    UPDATE public.profiles SET is_admin = true WHERE id = auth.uid();
--    Supabase Dashboard → Storage → Create bucket
--    - Nom : "photos" (public)
--    - Nom : "audio" (public)

-- 1. Tables

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  color text not null default '#1e3a5f',
  reading_goal_type text not null default 'chapters' check (reading_goal_type in ('chapters', 'verses')),
  reading_goal_count int not null default 1,
  is_admin boolean not null default false,
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.readings (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date text not null,
  book text not null,
  chapter int not null,
  verse_start int,
  verse_end int,
  content text not null default '',
  notes text not null default '',
  tags text not null default '[]',
  links jsonb not null default '[]',
  photos jsonb not null default '[]',
  audio jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index idx_readings_user_date on public.readings(user_id, date);
create index idx_readings_user_book on public.readings(user_id, book);

create table if not exists public.contexts (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contexts_user on public.contexts(user_id);

create table if not exists public.plans (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  bible_version text not null default 'LS1910',
  duration int not null,
  start_date text not null,
  custom_days jsonb not null default '[]',
  books jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_plans_user on public.plans(user_id);

create table if not exists public.plan_days (
  id text primary key,
  plan_id text not null references public.plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day int not null,
  date text not null,
  book text not null,
  chapter int not null,
  verse_start int,
  verse_end int,
  done boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index idx_plan_days_plan on public.plan_days(plan_id);
create index idx_plan_days_user_date on public.plan_days(user_id, date);

-- 2. Row Level Security
alter table public.profiles enable row level security;
alter table public.readings enable row level security;
alter table public.contexts enable row level security;
alter table public.plans enable row level security;
alter table public.plan_days enable row level security;

-- Profiles policies
create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

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

-- 3. Auto-create profile on signup
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
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
