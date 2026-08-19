-- Les versets en cours d'apprentissage, et leur échéance de révision.
--
-- Pourquoi une table et non `game_sessions` : celle-ci journalise des parties
-- jouées, immuables, sans UPDATE dans sa RLS. Un verset qu'on mémorise est
-- exactement l'inverse — un **état** qui change à chaque séance : son niveau
-- monte, sa prochaine échéance recule. Les deux cohabitent : la table ci-dessous
-- porte l'état, `game_sessions` garde la trace de chaque séance pour les
-- statistiques.
--
-- Migration additive : elle ne touche à aucune table existante.

create table if not exists public.memorised_verses (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.profiles(id) on delete cascade,

  book text not null,
  chapter integer not null,
  verse integer not null,
  -- La version dans laquelle le verset est appris. Mémoriser un texte, c'est
  -- mémoriser une traduction : changer de version ne doit pas faire croire que
  -- le travail est acquis.
  "versionId" text not null,

  -- Le niveau commande deux choses : l'espacement du prochain rappel et la part
  -- de mots masqués. Voir `INTERVALLES` et `MASQUAGE` dans
  -- `lib/memorisation/revision.ts`, qui font seuls autorité sur ces valeurs.
  niveau integer not null default 0,
  -- Date locale de la prochaine révision, au format `AAAA-MM-JJ`. Du texte et
  -- non une `date` : c'est un jour civil chez l'utilisateur, pas un instant.
  -- Une colonne `date` inviterait à des comparaisons en UTC, qui feraient
  -- basculer l'échéance en pleine soirée pour une partie des lecteurs.
  prochain text not null,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),

  -- Un même verset n'est appris qu'une fois par version : sans cela, deux
  -- ajouts depuis deux appareils créeraient deux suivis concurrents du même
  -- texte, aux échéances divergentes.
  unique (user_id, book, chapter, verse, "versionId")
);

-- L'écran lit « ce qui est dû aujourd'hui », donc par compte et par échéance.
create index if not exists idx_memorised_user_prochain
  on public.memorised_verses(user_id, prochain);

alter table public.memorised_verses enable row level security;

drop policy if exists "users can read own memorised_verses" on public.memorised_verses;
drop policy if exists "users can insert own memorised_verses" on public.memorised_verses;
drop policy if exists "users can update own memorised_verses" on public.memorised_verses;
drop policy if exists "users can delete own memorised_verses" on public.memorised_verses;

create policy "users can read own memorised_verses"
  on public.memorised_verses for select
  using (auth.uid() = user_id);

create policy "users can insert own memorised_verses"
  on public.memorised_verses for insert
  with check (auth.uid() = user_id);

-- Le `with check` est indispensable sur l'UPDATE : sans lui, un compte peut
-- déplacer sa ligne chez un autre en y écrivant son `user_id`. Même remarque
-- que sur `push_subscriptions`.
create policy "users can update own memorised_verses"
  on public.memorised_verses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own memorised_verses"
  on public.memorised_verses for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.memorised_verses to authenticated;
