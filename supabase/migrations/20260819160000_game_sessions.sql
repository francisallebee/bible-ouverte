-- Les parties jouées : quizz de révision, mémorisation, verset du jour.
--
-- **Une seule table pour les trois**, avec un discriminant `kind`. Trois tables
-- auraient demandé trois migrations, trois RLS, trois chemins de
-- synchronisation et trois écrans de statistiques, pour trois formes qui ne
-- diffèrent que par ce qu'elles comptent. Ce qu'elles partagent — qui, quand,
-- combien de bon sur combien — est exactement ce que porte une ligne ici.
--
-- Ce qui leur est propre va dans `details`, en `jsonb` : le genre des questions
-- ratées pour le quizz, le nombre d'indices demandés pour la mémorisation, la
-- référence du jour pour le verset du jour. Ajouter un jeu ne demandera donc
-- pas de migration — c'est le même raisonnement que la colonne `jsonb` des
-- réglages, et que `plan_days.passages`.
--
-- Migration additive : elle ne touche à aucune table existante.

create table if not exists public.game_sessions (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- 'quiz' | 'memorisation' | 'verset-du-jour'. Volontairement non contraint
  -- par une énumération : ajouter un jeu ne doit pas demander de migration, et
  -- une valeur inconnue s'ignore à l'affichage plutôt que de casser l'écriture.
  kind text not null,

  -- Ce qui est réussi, sur ce qui était demandé. Pour le verset du jour, 1/1 :
  -- il est lu ou il ne l'est pas, et cela suffit à le compter comme le reste.
  score integer not null default 0,
  total integer not null default 0,

  -- Le passage travaillé, quand il y en a un. Nul pour un quizz, qui en couvre
  -- plusieurs — le détail est alors dans `details`.
  book text,
  chapter integer,
  verse integer,

  details jsonb,

  "createdAt" timestamptz not null default now()
);

-- L'écran des statistiques lit par compte, par genre et par date décroissante.
create index if not exists idx_game_sessions_user_kind
  on public.game_sessions(user_id, kind, "createdAt" desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Le navigateur écrit directement avec la clé anon : la RLS est la seule
-- barrière. Chacun ne voit et n'écrit que ses propres parties.
--
-- Le `with check` sur l'INSERT et l'UPDATE n'est pas décoratif : sans lui, un
-- compte pourrait écrire une partie dans le compte d'un autre en y posant son
-- `user_id` — c'est la remarque déjà faite sur `push_subscriptions`.

alter table public.game_sessions enable row level security;

drop policy if exists "users can read own game_sessions" on public.game_sessions;
drop policy if exists "users can insert own game_sessions" on public.game_sessions;
drop policy if exists "users can delete own game_sessions" on public.game_sessions;

create policy "users can read own game_sessions"
  on public.game_sessions for select
  using (auth.uid() = user_id);

create policy "users can insert own game_sessions"
  on public.game_sessions for insert
  with check (auth.uid() = user_id);

-- Pas d'UPDATE : une partie jouée ne se corrige pas. La supprimer reste permis,
-- puisque l'utilisateur doit pouvoir effacer ses données.
create policy "users can delete own game_sessions"
  on public.game_sessions for delete
  using (auth.uid() = user_id);

grant select, insert, delete on public.game_sessions to authenticated;
