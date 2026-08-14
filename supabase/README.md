# Base de données Bible Ouverte

Projet Supabase lié : `bible-ouverte` (`nttasjckcmoqvjchxbzf`).

## Migrations

Les fichiers de `migrations/` s'appliquent **dans l'ordre des noms**, sont
**idempotents** et **non destructifs** : les rejouer sur la production ne perd
aucune donnée.

| Fichier | Contenu |
|---|---|
| `20260801120000_baseline.sql` | Tables, index, RLS des données personnelles, helper `is_admin()`, trigger d'inscription |
| `20260801120001_profiles_rls.sql` | Verrouillage de `profiles` : personne ne peut s'attribuer `is_admin` depuis le navigateur |
| `20260801120002_tickets_roadmap_rls.sql` | Écriture colonne par colonne sur les tickets et la feuille de route |
| `20260801120003_private_helpers.sql` | Sort les fonctions internes de la surface d'API PostgREST |
| `20260801120004_storage_policies.sql` | Cloisonne les buckets `photos` et `audio` par utilisateur |
| `20260801130000_reading_context.sql` | Colonne `contextId` sur `readings` et son index |
| `20260809100000_meditation_emoji.sql` | Emoji du contexte « Méditation » : 🧘 → 🕊️ |
| `20260809140000_plan_reading_context.sql` | Contexte « Plan de lecture » et rattachement des lectures issues d'un plan |
| `20260810120000_free_plans.sql` | `plans.kind` et les versets de `plan_days` : les plans de lecture libres |
| `20260813120000_push_notifications.sql` | `push_subscriptions` et `notification_log`, avec leur RLS |
| `20260813160000_notification_data.sql` | `notification_data()` : les agrégats des cinq déclencheurs |

Ces fichiers remplacent l'ancien `supabase-schema.sql`, qui commençait par sept
`drop table … cascade` : le rejouer effaçait toutes les données utilisateurs.
**Toute évolution passe par un nouveau fichier**, jamais par la modification
d'un fichier déjà appliqué.

## Appliquer

Via le SQL Editor du dashboard Supabase, un fichier après l'autre dans l'ordre.
Ou avec la CLI, une fois installée (`brew install supabase/tap/supabase`) :

```bash
supabase db push
```

## État en production

Les cinq premières migrations ont été appliquées le 1er août 2026,
`20260809100000_meditation_emoji.sql` le 9 août, `20260810120000_free_plans.sql`
le 10 août. Cette dernière est la première à figurer dans la table
`supabase_migrations` — elle y porte l'horodatage de son application
(`20260810173352`) et non le nom de son fichier. Les deux migrations du 9 août
ont été passées par exécution SQL directe et n'y figurent toujours pas ; leurs
fichiers sont au dépôt et rejouables sans dégât.

Les deux migrations des notifications sont appliquées, et figurent dans
`supabase_migrations` sous `20260813043957` (`push_notifications`) et
`20260813092636` (`notification_data`). Relevé le 13 août 2026 par
`list_migrations`, et non déduit de la présence des fichiers.

Constat avant application des premières, sur la base réelle :

- `authenticated` avait le droit `UPDATE` sur `profiles.is_admin`, et la policy
  était `auth.uid() = id` sans restriction de colonne : **tout compte connecté
  pouvait se promouvoir administrateur** depuis la console du navigateur.
- La colonne `suspended` n'existait pas, alors que le middleware la lit et que
  le back-office l'écrit : **la suspension d'un compte n'avait aucun effet**.
- `tickets` et `roadmap_items` acceptaient un `UPDATE` de n'importe quel compte
  connecté sur n'importe quelle colonne.

Après application, les droits `UPDATE` de `authenticated` sur `profiles` se
limitent à `name`, `color`, `avatar_url`, `birth_date`, `phone`, `bio` et
`social_links`. Aucune ligne n'a été perdue.

`is_admin()` vit désormais dans le schéma `private`, que PostgREST n'expose pas,
et les fonctions de trigger ne sont plus appelables en RPC. L'analyseur de
sécurité Supabase ne signale plus aucun problème de schéma.

## Mots de passe

L'analyseur signale que la **protection contre les mots de passe compromis**
(HaveIBeenPwned) est désactivée. Elle ne peut pas être activée : elle est
réservée au **plan Pro**, et l'organisation ÔAppliday est sur le plan Free. Ce
n'est donc pas une case oubliée, elle n'apparaît pas dans le dashboard.

À défaut, ce sont les règles de robustesse qui ont été renforcées, dans
`config.toml` (`minimum_password_length = 10`,
`password_requirements = "lower_upper_letters_digits"`) et en miroir côté
formulaire dans `src/lib/auth/password.ts`.

Côté serveur, ces deux valeurs se règlent **dans le dashboard**, à
Authentication → Sign In / Providers → Email :

- *Minimum password length* : `10`
- *Password Requirements* : `Lowercase, uppercase letters and digits`

### N'utilise pas `supabase config push` pour ça

`config push` est tout ou rien : il enverrait toute la section `[auth]` de
`config.toml`, produite par `supabase init` avec les valeurs par défaut du
développement local. `site_url` y vaut `http://127.0.0.1:3000`. Les e-mails de
confirmation d'inscription pointeraient vers localhost et les redirections après
connexion seraient rejetées : **l'authentification cesserait de fonctionner en
production**, pour gagner deux réglages de mot de passe.

La CLI n'a pas de `config pull`, donc aucun moyen de fusionner avec l'existant.
Rendre `config push` utilisable supposerait de reconstruire à la main toute la
section `[auth]` à l'identique du dashboard. Tant que ce n'est pas fait, le
dashboard fait autorité.

Sans le réglage serveur, seule la validation du formulaire d'inscription
s'applique — un client appelant `/auth/v1/signup` directement, avec la clé anon
qui est publique par conception, resterait au minimum de 6 caractères.

Les comptes existants ne sont pas affectés : ils continuent de se connecter avec
leur mot de passe actuel, la règle ne s'applique qu'aux créations et aux
changements.

## Stockage

Audit du 1er août 2026 : les buckets `photos` et `audio` sont privés, la RLS est
active sur `storage.objects` — et il n'existait **aucune policy**. Personne ne
pouvait donc rien y lire ni y écrire : pas de fuite, mais des buckets
inutilisables (0 objet stocké).

`20260801120004_storage_policies.sql` les cloisonne par préfixe `{user_id}/`,
la convention déjà employée par la route de suppression de compte, et pose des
limites de taille et de type qui n'existaient pas (10 Mo pour les images, 25 Mo
pour l'audio).

## Vérifier après application

Que `is_admin` est bien hors de portée du client — connecté avec un compte
ordinaire, dans la console du navigateur :

```js
await supabase.from('profiles').update({ is_admin: true }).eq('id', (await supabase.auth.getUser()).data.user.id)
```

La réponse doit contenir une erreur (`permission denied for column is_admin`).
Si la ligne passe, la migration `20260801120001` n'a pas été appliquée.

## Notifications push

La fonction `functions/send-notifications` envoie les rappels. Sa logique de
sélection — qui reçoit quoi, à quelle heure locale — vit dans `schedule.ts`,
sans dépendance, et est couverte par les tests de `npm test`. Seul le point
d'entrée `index.ts` est écarté de `tsc` : il tourne sous Deno.

### État au 13 août 2026

Relevé sur le projet réel, pas déduit du dépôt.

| Élément | État |
|---|---|
| `push_subscriptions`, `notification_log` | en place (migration `20260813043957`) |
| `notification_data()` | en place (migration `20260813092636`) |
| `pg_net` 0.20.4, `pg_cron` 1.6.4 | installées |
| Fonction `send-notifications` | déployée, version 1, `verify_jwt: false` |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NOTIFY_CRON_SECRET` | déposés |
| Planificateur `cron.schedule` | **absent** — c'est ce qui reste |
| Abonnements, journal | 0 ligne l'un et l'autre |

Appelée avec le bon secret, la fonction rend `200` et
`{"candidats":0,"envoyes":0,"deja":0,"purges":0,"parMotif":{}}` ; avec un
mauvais, `401` et le corps `unauthorized`.

Ces deux réponses valent bien plus qu'un aller-retour. Le `200` prouve que les
clés VAPID sont chargées — sans elles la fonction rendrait `500` —, que le
client service_role fonctionne et que la RPC `notification_data()` répond. Le
`401` porte la chaîne de `index.ts`, et non un JSON d'erreur de la passerelle :
c'est la preuve qu'un appel dépourvu d'`Authorization` traverse bien, donc que
`verify_jwt` est effectivement à `false`. `candidats:0` est l'attendu tant que
personne n'a activé les notifications.

Le planificateur se crée **après** les secrets. L'inverse ferait tourner un cron
à vide toutes les quinze minutes, dont les échecs ressembleraient à ceux d'un
secret mal recopié.

### Les cinq déclencheurs

| Motif | Quand | Référence anti-doublon |
|---|---|---|
| `daily` | à l'heure choisie | la date locale |
| `plan-late` | à l'heure choisie | le plan **et** son plus ancien jour non coché |
| `inactive` | à l'heure choisie, après 7 jours sans lecture | la date de la dernière lecture |
| `support-reply` | dès la plage de veille (8 h–22 h) | le ticket **et** la réponse |
| `roadmap-done` | dès la plage de veille | l'item — mais **un seul envoi** pour tous |

Les trois premiers ne pressent pas : ils attendent le créneau choisi. Les deux
autres perdent leur sens s'ils attendent, mais n'ont rien à faire à 3 h du
matin — d'où la plage de veille.

Le choix des références n'est pas cosmétique. Celle de `plan-late` est le plan
et son plus ancien jour en retard : tant que rien n'est rattrapé, ce jour ne
bouge pas, la référence non plus, et l'unicité bloque la relance. Rattraper une
partie du retard fait avancer ce jour, donc autorise une relance, une seule.
Même principe pour `inactive`, dont la référence est la dernière lecture : une
relance par période d'absence, et non chaque jour où l'absence dure.

### Pourquoi la feuille de route est le seul déclencheur groupé

Le 14 août, marquer quatre items terminés a produit **huit notifications en
moins de quatre heures** — une par personne et par item. C'est ce qui donne
envie de tout couper.

`roadmap-done` n'envoie donc plus qu'une notification par personne : « A », « B »
et 2 autres nouveautés sont disponibles. Mais **les références restent une par
item**, et c'est le point délicat. Une référence composée — `« 3+7+9 »` —
changerait dès qu'un item est terminé après coup, et réannoncerait les
précédents.

Le groupe écrit donc ses traces en une fois, par
`upsert(..., { ignoreDuplicates: true }).select()`, et ne rédige son message
qu'à partir des lignes **réellement écrites**. Vérifié contre la base : deux
références soumises en rendent deux, puis trois références dont deux déjà
écrites n'en rendent qu'une. Un item terminé plus tard rejoint donc le groupe
sans faire répéter les autres.

`notification_data()` fournit les agrégats en une requête. `security invoker` :
la clé service_role voit tout, un compte ordinaire qui l'appellerait depuis son
navigateur ne verrait que ses propres lignes.

### Ce qui doit être fait à la main, une fois

Trois secrets, à déposer sur la fonction. La **clé privée VAPID ne doit jamais
entrer dans le dépôt** : seule la clé publique y figure, en clair, dans
`src/lib/notifications.ts` et dans `index.ts`.

La paire a été **regénérée le 13 août 2026** : la première clé privée n'avait
jamais été affichée, et le répertoire temporaire qui la portait n'a pas survécu
à la séance. Cela n'a rien coûté — `push_subscriptions` était vide, donc aucun
abonnement à invalider. Ce ne serait plus vrai après le premier appareil
abonné : changer la clé publique force alors chaque appareil à se réabonner,
faute de quoi il ne reçoit plus rien sans que rien ne le signale.

```bash
supabase secrets set \
  VAPID_PRIVATE_KEY="…" \
  VAPID_SUBJECT="mailto:…" \
  NOTIFY_CRON_SECRET="…" \
  --project-ref nttasjckcmoqvjchxbzf
```

`NOTIFY_CRON_SECRET` est une chaîne aléatoire de votre choix. Elle évite
d'exposer la clé `service_role` au planificateur : la fonction n'accepte que
les appels qui la portent dans l'en-tête `x-cron-secret`.

Puis le déploiement :

```bash
supabase functions deploy send-notifications --project-ref nttasjckcmoqvjchxbzf
```

**`verify_jwt` doit rester à `false`**, ce que `[functions.send-notifications]`
de `config.toml` impose désormais. C'est un piège coûteux : `pg_cron` n'envoie
aucun en-tête `Authorization`, et la valeur par défaut ferait rejeter l'appel
par la passerelle **avant** que le corps de la fonction s'exécute. Le rejet est
un `401`, exactement comme celui d'un mauvais `x-cron-secret` : on chercherait
l'erreur du côté du secret pendant des heures. Le déploiement du 13 août, passé
par l'outil MCP, a été fait avec `verify_jwt: false` et vérifié.

### La cadence

Un quart d'heure, et non une heure. Certains fuseaux sont décalés d'une
demi-heure ou d'un quart d'heure — l'Inde, le Népal — et un passage horaire
servirait tous leurs habitants à côté de l'heure demandée.

Le planificateur n'est **pas** une migration : il contient le secret, qui n'a
rien à faire dans le dépôt. À passer une fois dans le SQL Editor, en
remplaçant les deux valeurs :

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'notifications-quart-dheure',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://nttasjckcmoqvjchxbzf.supabase.co/functions/v1/send-notifications',
    headers := '{"Content-Type":"application/json","x-cron-secret":"LE_SECRET"}'::jsonb
  );
  $$
);
```

Pour vérifier ou retirer : `select * from cron.job;` et
`select cron.unschedule('notifications-quart-dheure');`.

### Pourquoi la trace est écrite avant l'envoi

`notification_log` reçoit la ligne **avant** que la notification parte. Un
doublon est pire qu'un manque : recevoir deux fois le même rappel donne envie
de tout couper, alors qu'un rappel manqué passe inaperçu. Un conflit sur
l'unicité `(user_id, kind, ref)` vaut donc « déjà envoyé ».

Un abonnement qui répond 404 ou 410 est retiré : le service de push ne le
connaît plus, et le garder ferait échouer chaque envoi à jamais.

## Ce qui reste hors du dépôt

Les buckets de stockage `photos` et `audio` sont créés depuis le dashboard et ne
sont pas décrits ici. Leurs policies méritent le même audit que les tables : la
route `/api/admin/users/[id]` y range les fichiers sous un préfixe `{user_id}/`,
et rien dans le dépôt ne garantit qu'un utilisateur ne peut pas lire le préfixe
d'un autre.

## Choix assumés

Le tableau des tickets support est **collectif** : tout utilisateur connecté lit
les tickets des autres, avec le nom de leur auteur. C'est le fonctionnement
voulu de la page Support, pas un défaut de configuration — mais si un jour un
ticket doit pouvoir contenir quelque chose de confidentiel, c'est la policy
`authenticated can read tickets` qu'il faudra revoir.
