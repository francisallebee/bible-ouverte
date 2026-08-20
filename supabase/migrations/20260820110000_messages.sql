-- La messagerie : un fil par utilisateur, entre lui et l'administration.
--
-- **Un fil et non deux tables.** Chaque ligne appartient à la conversation d'un
-- utilisateur (`user_id`), et `from_admin` dit qui l'a écrite. Une table
-- « messages envoyés » et une table « réponses » auraient demandé une union à
-- chaque affichage, et deux RLS à tenir d'accord.
--
-- `user_id` est donc le **propriétaire du fil**, jamais l'auteur : sur un
-- message venu de l'administration, il désigne le destinataire. C'est ce qui
-- permet à la policy de tenir en une ligne.

create table if not exists public.messages (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_admin boolean not null default false,
  subject text not null default '',
  body text not null default '',
  /** L'auteur réel. Null si son compte a été supprimé depuis. */
  sent_by uuid references public.profiles(id) on delete set null,
  /** Le nom au moment de l'envoi : il survit à la suppression de l'auteur. */
  sent_by_name text not null default '',
  read_at timestamptz,
  /** Envoi du doublon par courriel : date, et tentatives bornées. */
  emailed_at timestamptz,
  email_attempts integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_messages_user on public.messages(user_id, "createdAt" desc);
-- Le compteur de non-lus est la requête la plus fréquente de l'application :
-- il part à chaque montage de la barre latérale.
create index if not exists idx_messages_unread
  on public.messages(user_id) where read_at is null and from_admin;
-- Le balayage d'envoi des courriels ne regarde qu'une poignée de lignes.
create index if not exists idx_messages_a_envoyer
  on public.messages(id) where emailed_at is null and from_admin;

alter table public.messages enable row level security;

-- ---------------------------------------------------------------------------
-- Qui voit quoi
-- ---------------------------------------------------------------------------
-- Lecture : son propre fil, ou tout pour un administrateur.

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());

-- Écriture : un utilisateur ne peut écrire **que dans son fil**, et **que des
-- messages qui ne viennent pas de l'administration**. Sans le `from_admin =
-- false` du `with check`, n'importe qui se fabriquerait un message d'apparence
-- officielle dans sa propre boîte — sans conséquence pour les autres, mais un
-- faux tout de même. Les envois de l'administration passent par la clé
-- service_role, jamais par le navigateur.

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and from_admin = false
    and sent_by = (select auth.uid())
  );

-- Mise à jour : marquer comme lu, et rien d'autre. Le contrôle des colonnes se
-- fait au niveau des GRANT, comme sur `profiles` (règle 2) : la policy seule
-- laisserait réécrire le corps du message.

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke update on public.messages from anon, authenticated;
revoke delete on public.messages from anon, authenticated;
grant update (read_at) on public.messages to authenticated;

-- Pas de policy de suppression : personne n'efface un message depuis le
-- navigateur. Un fil qui disparaît côté destinataire mais pas côté
-- administration donnerait deux versions d'une même conversation.

comment on table public.messages is
  'Fil de discussion entre un utilisateur et l''administration. `user_id` est le propriétaire du fil, `from_admin` dit qui a écrit.';
