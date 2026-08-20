-- Le courriel de bienvenue : de quoi savoir à qui il a déjà été envoyé.
--
-- `new_user_alerts` retenait jusqu'ici une seule chose : « ce compte a-t-il été
-- signalé au propriétaire ? ». Deux colonnes s'y ajoutent pour la question
-- symétrique — « ce compte a-t-il reçu son message de bienvenue ? ».
--
-- **Le remplissage rétroactif n'est pas un détail, c'est tout l'enjeu.** La
-- table porte déjà 112 lignes, amorcées par `20260814140000_new_user_alerts.sql`
-- avec les comptes existants. Sans le `update` ci-dessous, le prochain passage
-- du planificateur enverrait un message de bienvenue à 112 personnes inscrites
-- depuis des semaines. On les marque donc comme déjà servies : elles ne le sont
-- pas, mais leur écrire aujourd'hui serait plus surprenant que de se taire.
--
-- `welcome_attempts` borne les reprises. La trace d'alerte est écrite AVANT
-- l'envoi — c'est ce qui empêche d'annoncer dix fois la même inscription — mais
-- appliquer la même règle au message de bienvenue le ferait disparaître
-- silencieusement au moindre incident SMTP. Le compteur permet de réessayer
-- sans jamais tourner en boucle : trois tentatives, puis on renonce.

alter table public.new_user_alerts
  add column if not exists welcomed_at timestamptz,
  add column if not exists welcome_attempts integer not null default 0;

update public.new_user_alerts
set welcomed_at = now()
where welcomed_at is null;

comment on column public.new_user_alerts.welcomed_at is
  'Date d''envoi du message de bienvenue. Rempli rétroactivement le 20 août 2026 sur les 112 comptes antérieurs, qui ne doivent pas en recevoir un.';
comment on column public.new_user_alerts.welcome_attempts is
  'Tentatives d''envoi du message de bienvenue. Borné à 3 par la fonction Edge : au-delà on renonce plutôt que de réessayer tous les quarts d''heure.';
