-- Mémoire des inscriptions déjà signalées à l'administrateur.
--
-- Même discipline que `notification_log` : la ligne est écrite avant l'envoi.
-- Un courriel manqué passe inaperçu ; recevoir dix fois la même inscription
-- fait poser une règle de filtrage, et l'alerte ne sert plus à rien.
--
-- Idempotente et non destructive : la rejouer ne perd aucune donnée et
-- n'entraîne aucun envoi.

create table if not exists public.new_user_alerts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  "sentAt" timestamptz not null default now()
);

-- Amorçage : tous les comptes existants sont marqués comme déjà signalés.
--
-- C'est le point important de cette migration. Sans lui, le premier passage
-- du balayage considérerait chaque compte déjà inscrit comme une nouveauté et
-- enverrait autant de courriels.
insert into public.new_user_alerts (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

alter table public.new_user_alerts enable row level security;

-- Aucune policy, volontairement : la table ne porte que des identifiants de
-- comptes, elle n'a rien à faire côté navigateur. Seule la clé service_role,
-- qui contourne la RLS, la lit et l'écrit — depuis la fonction d'envoi.

comment on table public.new_user_alerts is
  'Inscriptions déjà signalées par courriel à l''administrateur. La ligne est écrite avant l''envoi ; l''écriture est réservée à la clé service_role.';
