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
| `20260814140000_new_user_alerts.sql` | `new_user_alerts` : mémoire des inscriptions déjà signalées, amorcée avec les comptes existants |
| `20260818200000_tickets_closed_lock.sql` | Un ticket clos n'accepte plus de réponse : `guard_ticket_update` lève, sauf pour l'administrateur |

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

### État au 14 août 2026 : en service

Relevé sur le projet réel, pas déduit du dépôt.

| Élément | État |
|---|---|
| `push_subscriptions`, `notification_log` | en place (migration `20260813043957`) |
| `notification_data()` | en place (migration `20260813092636`) |
| `pg_net` 0.20.4, `pg_cron` 1.6.4 | installées |
| Fonction `send-notifications` | déployée, `verify_jwt: false` |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NOTIFY_CRON_SECRET` | déposés |
| Planificateur `notifications-quart-dheure` | `*/15 * * * *`, actif |
| Passages du planificateur | **68 sur 68 réussis** |
| Abonnements | 3 appareils, dont un iPhone via `web.push.apple.com` |
| **Réception sur l'appareil** | **confirmée le 14 août par le propriétaire du dépôt** |

Quatre des cinq déclencheurs se sont armés en conditions réelles :
`roadmap-done` (8), `daily` (3), `support-reply` (1), `plan-late` (1). Seul
`inactive` n'a rien produit — il demande sept jours sans lecture.

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

#### Le revers, mesuré le 16 août 2026

Ce choix a un angle mort, et il s'est manifesté sur `new_user_alerts`, qui
suit la même discipline : **rien ne rattrape une trace écrite pour un envoi qui
n'a pas eu lieu.**

Ce jour-là, `notify-new-user` a écrit ses quatre lignes à `06:45:04.760`, puis
a levé une exception au `fetch` vers Brevo **19 millisecondes plus tard**. Les
quatre comptes se sont retrouvés réputés annoncés sans qu'aucun courriel ne
parte — et définitivement, puisque la trace vaut « déjà envoyé ».

Le piège est double : le passage suivant rend alors `{"candidats":0}`, un `200`
franc qui ressemble à un succès et ne prouve rien. Les quatre lignes ont dû
être retirées à la main, par leur horodatage exact, pour rendre les comptes
annonçables et pour que l'essai retrouve un sens.

`notification_log` a exactement la même structure, donc le même angle mort.

Le correctif qui garderait les deux propriétés : écrire la trace d'abord —
c'est elle qui bloque le doublon —, tenter l'envoi, et **retirer la trace si
l'envoi lève**. Non fait à ce jour.

## Alerte d'inscription

`functions/notify-new-user` écrit à l'administrateur quand quelqu'un crée un
compte. Elle passe par l'API transactionnelle de **Brevo**
(`api.brevo.com/v3/smtp/email`).

Un **balayage** au même rythme que les notifications, et non un déclencheur sur
la table : le chemin d'inscription n'a pas à porter une pièce de plus, et un
quart d'heure de délai est sans conséquence pour un avertissement
d'administration.

`new_user_alerts` retient qui a déjà été signalé, et la ligne est écrite
**avant** l'envoi — même discipline que `notification_log`. Un courriel manqué
passe inaperçu ; recevoir dix fois la même inscription fait poser une règle de
filtrage, et l'alerte ne sert plus à rien.

La migration `20260814140000_new_user_alerts.sql` **amorce la table avec tous
les comptes existants**. C'est son point important : sans cela, le premier
passage aurait considéré chacun des 99 comptes déjà inscrits comme une
nouveauté.

### Les cinq secrets

À déposer une fois, **par le tableau de bord** — *Edge Functions → Secrets*.
Trois tentatives en ligne de commande ont échoué le 16 août là où le navigateur
a réussi du premier coup : le terminal dépose une valeur vide sans rien dire,
et `supabase secrets list` ne montre qu'un hachage.

| Secret | Valeur |
|---|---|
| `SMTP_HOST` | `nom-serveur.o2switch.net` |
| `SMTP_USER` | l'adresse complète, qui sert d'identifiant |
| `SMTP_PASSWORD` | le mot de passe de cette adresse |
| `NEW_USER_ALERT_FROM` | une adresse du domaine hébergé |
| `NEW_USER_ALERT_TO` | où recevoir l'alerte |

Aucun mot de passe ni aucune clé ne passe par un agent : c'est une commande
pour le propriétaire. Quatre clés ont dû être révoquées cette semaine pour
avoir transité par une conversation.

**Vérifier un dépôt sans voir les valeurs** : `supabase secrets list` rend le
SHA-256 de chacune. Le digest de la chaîne vide vaut
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` — c'est
ainsi qu'un secret déposé à vide s'est révélé, après deux heures de recherche
du côté du réseau. Comparer un digest à celui d'une adresse connue permet
aussi d'identifier une valeur sans la lire.

### Pourquoi le SMTP, et pas une API

Brevo a été essayé trois jours durant, et abandonné le 18 août 2026. Son
compte n'accepte les appels que depuis des **adresses IP autorisées**, et les
fonctions Edge en changent à chaque exécution : sept refus, sept adresses
différentes, toutes dans `2a05:d01c:76e:790…`. Les autoriser une à une ne sert
à rien — le préfixe se répète mais le suffixe est neuf à chaque fois — et vider
la liste ne désactive pas le blocage.

Le SMTP de l'hébergeur n'a pas cette contrainte, et l'adresse d'expédition
appartient enfin au domaine du projet.

**Le port 465 sort des fonctions Edge, c'est mesuré.** La documentation de
Supabase annonce les ports 25, 465 et 587 fermés en sortie ; leur propre
exemple `send-email-smtp` s'en sert pourtant, et l'envoi du 18 août 2026 à
11:00 l'a confirmé — courriel reçu, aucune erreur au journal. Ne pas croire
cette page sans essayer.

`denomailer` ouvre la connexion, l'authentifie et la referme. Tout est
enveloppé dans un `try` : connexion refusée, mot de passe rejeté ou expéditeur
inconnu lèvent tous, et chacun doit rendre les traces.

### Le planificateur

À ajouter une fois les secrets déposés, en remplaçant le secret :

```sql
select cron.schedule(
  'alerte-nouvel-utilisateur',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://nttasjckcmoqvjchxbzf.supabase.co/functions/v1/notify-new-user',
    headers := '{"Content-Type":"application/json","x-cron-secret":"LE_SECRET"}'::jsonb
  );
  $$
);
```

Sans les secrets, la fonction répond `500` avec le nom de ce qui manque ; avec
un mauvais `x-cron-secret`, `401` et le corps `unauthorized`. Les deux ont été
vérifiés au déploiement.

### Lire la réponse : trois `500` qui ne disent pas la même chose

Diagnostiqué le 16 août 2026, et à relire avant de suspecter le dépôt.
`cron.job_run_details` ne sert à rien ici : `pg_net` étant asynchrone, le job
est « succeeded » dès la mise en file, avant toute réponse — même piège que
`envoyes`, à un autre étage. La vérité est dans `net._http_response`, et le
détail dans les journaux `function_logs`.

| Corps de la réponse | Cause |
|---|---|
| `500 secret manquant : BREVO_API_KEY` | le secret n'est pas déposé — **ou déposé à vide**, voir plus bas |
| `502 brevo : 401` | Brevo refuse : mauvais type de clé, **ou IP non autorisée** — le journal tranche |
| `500 Internal Server Error` | **exception non capturée** : la fonction a crashé avant d'appeler Brevo |

Le `502` a deux causes très différentes, et seul le journal `function_logs` les
distingue : le corps que Brevo renvoie y est écrit en entier.

### La liste blanche d'adresses IP de Brevo

Rencontrée le 16 août 2026, et elle n'était prévue nulle part.

Brevo peut restreindre l'usage d'une clé aux **adresses IP autorisées** du
compte, et refuse tout le reste par un `401` dont le message nomme l'IP vue :

```
brevo a refusé l'envoi 401
{"message":"We have detected you are using an unrecognised IP address
 2a05:d01c:76e:… ","code":"unauthorized"}
```

La clé était bonne, l'expéditeur validé, le secret correctement déposé : le
refus vient d'un réglage de compte, en amont de tout examen de la requête.

**Les fonctions Edge n'ont pas d'IP fixe.** Elles changent d'exécution en
exécution, si bien qu'autoriser l'adresse d'un échec ne règle rien pour le
suivant. Le réglage se trouve dans le compte Brevo — le nom en haut à droite,
puis *Security*, section *Authorized IPs*, et non dans *SMTP & API* — et il
offre deux modes : approbation par courriel, ingérable ici, et **autorisation
automatique**, qui est le mode fait pour ce cas. Le CIDR est accepté, mais
Supabase ne publie pas de plage stable pour ses fonctions Edge.

### Vérifier un secret sans attendre le cron

`supabase secrets list --project-ref …` rend le **digest SHA-256** de chaque
secret, jamais sa valeur. Deux usages :

- savoir si un dépôt a été pris, en comparant l'`updated_at` ;
- **détecter un secret vide**, dont le digest est la constante
  `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` —
  le SHA-256 de la chaîne vide.

Le cas s'est produit : un `--env-file` déposé avant que la clé y soit collée a
posé une valeur vide, que la fonction a signalée comme « secret manquant ». La
CLI le dit en trois secondes, là où le cron demande un quart d'heure.

**Le tableau de bord est plus sûr que la CLI pour ce geste** : *Edge Functions →
Secrets*. Un champ, un collage, aucun risque de quoting, de locale, de fichier
mal enregistré ni de `rm` passé trop tôt — trois tentatives en terminal ont
échoué là où le navigateur a réussi du premier coup.

Le troisième est le plus trompeur, parce que le message est générique et vient
de la passerelle, pas du code. Le cas rencontré :

```
TypeError: Failed to construct 'Request': 'headers' of 'RequestInit'
            is not a valid ByteString
```

**La valeur du secret portait un caractère au-dessus de U+00FF** — un guillemet
typographique ou un espace de largeur nulle ramené par un copier-coller. Un
en-tête HTTP n'accepte que du `ByteString` ; le `fetch` lève avant de partir.

Pour le vérifier sans divulguer la clé :

```bash
printf %s 'la-cle' | LC_ALL=C grep -q '[^ -~]' && echo "caractère parasite" || echo "ASCII pur"
```

Et déposer entre guillemets **simples**, qui empêchent le shell d'interpréter
quoi que ce soit.

## Les courriels d'authentification : SMTP Brevo

**État : à faire.** Cette section décrit la manœuvre, pas un fait mesuré. Elle
sera reprise une fois la bascule effectuée, avec ce qui aura été constaté.

Supabase envoie lui-même la confirmation d'adresse à l'inscription. Son service
intégré est **explicitement bridé et non destiné à la production** : son quota
horaire est bas et partagé, si bien qu'une rafale d'inscriptions peut faire
échouer des confirmations sans que rien ne le signale. Le relais SMTP de Brevo
lève cette limite, et regroupe au même endroit les deux courriels que le projet
émet déjà.

### Deux clés Brevo, et surtout ne pas les confondre

C'est le piège de cette bascule, et il coûte une heure à qui l'ignore : Brevo
délivre **deux sortes de clés**, qui ne s'emploient pas au même endroit et ne
s'authentifient pas de la même façon.

| Usage | Type | Préfixe | Où elle vit |
|---|---|---|---|
| `notify-new-user`, qui appelle `api.brevo.com/v3/smtp/email` | clé **API** v3 | `xkeysib-` | secret de fonction `BREVO_API_KEY` |
| Confirmation d'adresse à l'inscription | clé **SMTP** | `xsmtpsib-` | *Custom SMTP* du dashboard |

Une clé SMTP déposée comme `BREVO_API_KEY` ne produit pas l'erreur qu'on
attend : la fonction trouve bien son secret, part appeler l'API, et Brevo
refuse l'authentification — la réponse est **`502 brevo : 401`**, et non le
`500 secret manquant : BREVO_API_KEY` d'un secret absent. Ces deux codes
distinguent les deux causes ; les lire dans `net._http_response` évite de
chercher du côté du dépôt quand le problème est le type de clé.

### Où cela se règle

**Au dashboard** : *Authentication → Emails → SMTP Settings*. Nulle part
ailleurs.

Pas par `config.toml`, dont la section `[auth.email.smtp]` n'est que le gabarit
SendGrid commenté laissé par `supabase init`. Ce fichier diverge déjà de la
production sur au moins deux points — `site_url` en localhost, et
`enable_confirmations = false` alors que l'inscription envoie bel et bien une
confirmation. **`supabase config push` casserait l'authentification**, pour la
raison exposée plus haut.

Le MCP ne sait pas le faire non plus : il n'expose aucun outil de réglage Auth.

| Champ | Valeur |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | le **SMTP login** Brevo, de la forme `9xxxxx@smtp-brevo.com` — *pas* l'adresse d'expédition |
| Password | la clé **SMTP** (`xsmtpsib-…`) |
| Sender email | une adresse **vérifiée chez Brevo** |
| Sender name | `Bible Ouverte` |

Le champ *Username* est l'erreur classique : c'est un identifiant de relais
distinct de l'adresse d'expédition, et il se lit dans *SMTP & API → SMTP*.

### Ce qui restera à faire après la bascule

**Les gabarits ne sont pas traduits.** Ils vivent dans *Authentication → Emails
→ Templates* et sont en anglais par défaut. Basculer le SMTP ne les touche pas.
Un utilisateur peut donc lire une interface en arabe et recevoir sa
confirmation en anglais — même limite que les notifications push : le courriel
part du serveur, qui ne connaît pas la langue choisie. C'est le troisième
endroit où la traduction sort du navigateur.

**L'expéditeur vérifié est le maillon à surveiller.** Brevo refuse d'expédier
depuis une adresse non validée, en SMTP comme en API. C'est déjà le suspect
principal de l'alerte d'inscription ; il devient commun aux deux chemins.

### L'essai qui vaut pour quatre

Une fois le SMTP en place, **un seul compte de test** éprouve d'un coup ce qui
attend depuis des séances :

1. il reçoit sa confirmation — le SMTP Brevo fonctionne ;
2. le cron l'annonce par courriel — l'alerte d'inscription fonctionne ;
3. il sert de cible aux actions d'Administration jamais exercées : promouvoir,
   rétrograder, suspendre, réactiver ;
4. et sa suppression exerce la dernière d'entre elles.

## Ce qui reste hors du dépôt

Les buckets de stockage `photos` et `audio` sont créés depuis le dashboard et ne
sont pas décrits ici. Leurs policies méritent le même audit que les tables : la
route `/api/admin/users/[id]` y range les fichiers sous un préfixe `{user_id}/`,
et rien dans le dépôt ne garantit qu'un utilisateur ne peut pas lire le préfixe
d'un autre.

## La clôture d'un ticket

Appliquée le 18 août 2026 par l'outil MCP, et figurant donc dans
`supabase_migrations`.

Le statut d'un ticket appartenait déjà au seul administrateur :
`guard_ticket_update` restaure `status` depuis l'ancienne ligne pour tout
appelant ordinaire. Ce qui manquait, c'est la conséquence — un ticket clos
restait ouvert aux commentaires, `replies` étant précisément la colonne que le
garde laisse passer.

Masquer le champ de saisie dans l'écran Support n'aurait rien valu : le
navigateur parle directement à Supabase avec la clé anon, et un appel depuis la
console contourne n'importe quel composant. Le refus vient donc de la base.

**Le refus est une exception, pas une restauration silencieuse**, contrairement
aux autres colonnes de ce garde. Les deux ne jouent pas le même rôle : une
colonne restaurée corrige une écriture illégitime dont l'auteur n'a pas à être
averti, tandis qu'une réponse refusée doit remonter à celui qui l'a rédigée.
`addReply` écrit désormais le distant **avant** le cache et rend un booléen —
sans quoi la réponse s'afficherait puis disparaîtrait à la synchronisation
suivante, sans un mot.

Les trois règles ont été éprouvées sur la base réelle, sous
`set local role authenticated` avec `request.jwt.claims` posé :

| Essai | Résultat |
|---|---|
| Compte ordinaire, réponse sur un ticket **clos** | `P0001 : ticket clos : plus aucune réponse ne peut y être ajoutée` |
| Compte ordinaire, réponse sur un ticket **ouvert** | passe |
| Compte ordinaire tentant `status = 'closed'` | statut restauré à `open` |

**Piège rencontré** : le premier essai a « réussi » sur un ticket clos, ce qui
semblait démentir la migration. Le compte choisi était l'administrateur, qui
sort de la fonction avant tout contrôle. Vérifier `is_admin` du cobaye avant de
conclure. Second piège, plus discret : `set local request.jwt.claims` doit être
posé **avant** `set local role authenticated`, sinon `auth.uid()` reste nul et
l'essai mesure le chemin service_role sans le dire.

## Choix assumés

Le tableau des tickets support est **collectif** : tout utilisateur connecté lit
les tickets des autres, avec le nom de leur auteur. C'est le fonctionnement
voulu de la page Support, pas un défaut de configuration — mais si un jour un
ticket doit pouvoir contenir quelque chose de confidentiel, c'est la policy
`authenticated can read tickets` qu'il faudra revoir.
