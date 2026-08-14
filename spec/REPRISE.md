# Reprise des travaux — état au 13 août 2026 (soir)

Ce document ne liste pas les fonctionnalités à venir : **la feuille de route
fait foi**, et elle vit dans l'application (`/roadmap`, table `roadmap_items`).
La recopier ici produirait une seconde source de vérité qui divergerait.

Il consigne ce que la feuille de route ne peut pas porter : les mesures faites
sur l'application réelle, les pièges rencontrés, et les points qui attendent une
action hors du dépôt.

## Ce qui attend une action hors du dépôt

1. **Le réseau domestique filtre github, supabase et vercel.** Tant que ce n'est
   pas réglé sur la box, travailler en **partage de connexion iPhone** : c'est
   mesuré, tout repasse. Voir la section dédiée plus bas.
2. **Aucune notification n'est jamais apparue sur un appareil.** Tout le reste
   de la chaîne est vérifié — voir « Le mur du 13 août » plus bas. C'est le
   seul point qui empêche de déclarer l'item 17 terminé, et il se reprend au
   cycle du 14 août.
3. **L'heure du rappel quotidien du compte `7e8695d3` a été déplacée** sur
   ~23 h 55 le 13 août pour l'essai, au lieu de 14 h. À remettre à l'heure
   voulue, sans quoi le rappel de demain tombera vers minuit.
4. **Trois chemins n'ont jamais été exécutés sur des données réelles** : la
   suppression d'un ticket support, le changement de mot de passe, et la
   suppression en bloc dans l'historique. Le code est en place et le reste a été
   vérifié, mais ces trois-là attendent un premier essai.
5. **Deux migrations ont été appliquées par exécution SQL directe**, l'outil de
   migration ayant été refusé à l'époque : `20260809100000_meditation_emoji.sql`
   et `20260809140000_plan_reading_context.sql`. Elles ne figurent donc pas dans
   la table `supabase_migrations` du projet. Les fichiers sont au dépôt et
   rejouables sans dégât. `20260810120000_free_plans.sql`, elle, est bien passée
   par l'outil et y figure sous l'horodatage de son application.

## La vague 3 et les notifications

La **vague 3 est terminée côté code** : thème système (item 18), modale de
sélection (8), déconnexion automatique (7), plans de lecture libres (15) sont en
production. Reste l'item 17, les notifications push, découpé en cinq morceaux.

| Morceau | Code | En production |
|---|---|---|
| Réglages et demande de permission | fait | oui |
| Table d'abonnements et préférences | fait | oui |
| Gestionnaires `push` et `notificationclick` | fait | oui |
| Abonnement de l'appareil au service de push | fait | oui (PR #10, `d3437ae`) |
| Fonction d'envoi et les cinq déclencheurs | fait | oui (PR #10, `d3437ae`) |

Le morceau qui méritait un commit à lui seul est `5603523` : un appareil déjà
connu du compte s'abonne enfin. L'abonnement ne pouvait naître que du
basculement de la case des réglages, ce qui laissait un **deuxième appareil**
sans abonnement pour toujours — il trouve la case déjà cochée et n'a rien à
basculer. L'abonnement vaut par appareil, son déclencheur ne pouvait pas être un
changement d'état par compte. C'est ce correctif qui a permis le premier
abonnement réel : les deux comptes avaient les notifications activées depuis une
séance antérieure, sans aucun appareil enregistré.

### Le mur du 13 août : tout marche, rien n'arrive

Toute la chaîne est vérifiée **sauf le dernier mètre**. Chaque ligne ci-dessous
est une mesure, pas une déduction.

| Maillon | Preuve |
|---|---|
| Migrations, `notification_data()`, `pg_net`, `pg_cron` | présents |
| Fonction déployée, `verify_jwt: false` | `401`/`unauthorized` sur secret faux — la chaîne vient de `index.ts`, pas de la passerelle |
| Les trois secrets | `200` sur appel valide ; sans les clés VAPID ce serait `500` |
| Planificateur | `notifications-quart-dheure`, `*/15 * * * *`, `active = true` |
| Abonnement iPhone | endpoint `web.push.apple.com`, iOS 18.7, créé à 21:46:46 UTC |
| Envoi | `{"candidats":2,"envoyes":2,"purges":0,"parMotif":{"daily":1,"plan-late":1}}` |
| Trace | deux lignes dans `notification_log`, refs `2026-08-13` et `3:2026-01-06` |
| `sw.js` en production | **identique octet pour octet** au dépôt, gestionnaire `push` présent, `cache-control: max-age=0, must-revalidate` |
| **Affichage sur l'iPhone** | **rien** |

L'essai a eu lieu vers 23 h 55 heure de Paris, ce qui laisse une explication
simple et non vérifiée : un mode de concentration ou Sommeil qui remet les
notifications silencieusement. À reprendre au cycle du 14 août, en journée.

Pistes non encore écartées, par ordre de vraisemblance : mode de concentration
actif ; remise silencieuse (les notifications seraient dans le centre de
notifications, pas sur l'écran verrouillé) ; réglage iOS de l'app ; service
worker enregistré sur l'appareil différent de celui servi.

**Le test qui sépare** : le bouton de notification de test des réglages appelle
`showNotification` localement, sans serveur ni abonnement. S'il affiche quelque
chose, l'affichage fonctionne et le défaut est dans la remise ; s'il n'affiche
rien, c'est iOS qui retient tout et le push n'y est pour rien.

**Attention pour rejouer** : les deux références sont consommées. Le `daily` du
14 août partira seul (nouvelle date), mais ce `plan-late` ne repartira pas tant
que le jour du 6 janvier du plan 3 n'aura pas été coché. Pour forcer, effacer la
ligne correspondante de `notification_log`.

### La clé privée VAPID a été perdue, puis regénérée

Elle avait été produite sans jamais être affichée, et rangée en `600` dans le
répertoire temporaire d'une séance. Ce répertoire n'a pas survécu. Une paire
neuve a été générée le 13 août au soir, vérifiée — la publique se redéduit de la
privée, une signature se vérifie — et la clé publique remplacée dans
`src/lib/notifications.ts` et dans `index.ts`.

Cela n'a rien coûté cette fois : zéro abonnement à invalider. **Ce ne sera plus
vrai après le premier appareil abonné.** Changer la clé publique force alors
chaque appareil à se réabonner, et rien ne signale à celui qui ne le fait pas
qu'il ne recevra plus rien. Une clé privée qui doit survivre à une séance n'a
rien à faire dans un répertoire temporaire.

## Réseau et déploiement

### Le réseau domestique filtre github, supabase et vercel

**La cause est la box, pas le Mac.** Établi le 13 août au soir par le seul essai
qui tranche : basculer le Mac sur le partage de connexion de l'iPhone. Sur la
box (`192.168.1.46`, passerelle `192.168.1.254`), tout échoue ; sur le partage
de connexion (`172.20.10.6`), `github.com` répond `200` en 124 ms et le `git
push` passe du premier coup.

La forme du blocage, relevée depuis la box :

| Épreuve | Résultat |
|---|---|
| DNS, `/etc/hosts`, `scutil --proxy`, règles `pf` | tous normaux ou vides |
| `example.com`, `apple.com`, `google.com`, `cloudflare.com` | passent |
| `registry.npmjs.org`, **`gitlab.com`**, `anthropic.com` | passent |
| `github.com:443`, `api.github.com:443` | refusés |
| `supabase.com:443`, `vercel.com:443` | refusés |
| **`github.com:80`** | **`301`, passe** |
| `github.com:22` | *No route to host* (ICMP de rejet) |

Deux détails désignent un filtrage amont par liste d'hôtes : le **même hôte, la
même IP** répond sur le port 80 et se voit refuser le 443 ; et GitLab passe
quand GitHub est bloqué. Aucun réglage du Mac ne produit ça.

Pour travailler quand la box filtre : **partage de connexion iPhone**. Pour
régler durablement, c'est le contrôle parental ou le filtrage de la box, sur
`http://192.168.1.254`.

### Une fausse piste coûteuse : les extensions Surfshark

Elle a occupé plusieurs échanges, elle est consignée pour ne pas être reprise.

L'application Surfshark avait été désinstallée, mais ses **deux extensions
système sont restées enregistrées et actives** —
`com.surfshark.vpnclient.macos.TransparentProxy` et `…direct.Antivirus`, cette
dernière tournant en root et consommant du CPU en continu. C'est un vrai défaut
de nettoyage, qui mérite d'être réglé (Réglages Système → Général → Ouverture et
extensions), mais **ce n'est pas la cause du blocage réseau** : celui-ci
persistait extensions actives, et a disparu sans y toucher, par simple
changement de réseau.

Ce qui aurait dû mettre la puce à l'oreille plus tôt : un proxy transparent de
VPN n'ouvre pas le port 80 d'un hôte dont il ferme le 443, et ne laisse pas
passer GitLab en bloquant GitHub.

### Le MCP Supabase, lui, passe

Découvert le 13 août au soir, et c'est ce qui a permis d'avancer malgré le
blocage : les outils MCP de Supabase ne transitent pas par le réseau du poste.
Migrations, SQL, déploiement de fonction Edge restent accessibles quand la CLI
et le tableau de bord ne le sont pas.

Ce que le MCP **ne** sait pas faire : déposer un secret de fonction. Il n'existe
pas d'outil pour cela. Les trois secrets passeront donc par le tableau de bord
ou par la CLI, une fois le réseau rétabli.

Pour appeler une fonction Edge sans réseau depuis le poste, la base sert de
relais : `select net.http_post(...)` puis lecture de `net._http_response`. C'est
ainsi que le déploiement a été vérifié.

### Réglé le 13 août 2026 : les previews Vercel

Elles étaient bloquées depuis l'origine. Les deux moitiés du problème sont
maintenant traitées : les routes API portent `export const dynamic =
'force-dynamic'`, et `NEXT_PUBLIC_SUPABASE_URL` et
`NEXT_PUBLIC_SUPABASE_ANON_KEY` ont été ajoutées à l'environnement **Preview**.

Vérifié sur la première preview (PR #6) : `/`, `/auth/login` et `/new-reading`
répondent toutes `200`. Le middleware ne plante donc plus.

**Les URL de preview sont protégées par la protection de déploiement Vercel** :
le contenu servi est la page de connexion Vercel (`<title>Login – Vercel</title>`)
tant qu'on n'est pas authentifié sur le compte. Pour ouvrir une preview depuis un
téléphone, il faut y être connecté à Vercel. C'est mesuré, et cela contredit ce
que ce document affirmait jusqu'ici.

`SUPABASE_SERVICE_ROLE_KEY` reste malgré tout sur le seul environnement
Production, et doit y rester. La protection de déploiement est un réglage, pas
une garantie : si elle est levée un jour — c'est une case du tableau de bord —
chaque branche poussée devient lisible de tous.

Ne pas essayer de déployer une preview par `vercel deploy` depuis le poste : le
dépôt représente 62,5 Mo à téléverser à cause des traductions, et l'envoi est
interrompu avant la fin. Les previews passent par git.

## Mesures faites sur l'application réelle

À ne pas redécouvrir.

| Sujet | Mesure | Date |
|---|---|---|
| Cache des traductions | 216 812 versets, 42 Mo par appareil, 47 Mo téléchargés | 9 août |
| Comptage des versions | 932 ms, autrefois répété à chaque montage d'écran | 9 août |
| Appels Supabase | 24 appels et 4 895 ms cumulées sur trois navigations | 9 août |
| Appels `/auth/v1/user` | ramenés de 17 à 3 par session | 9 août |
| Carte de saisie de Nouvelle lecture, sur 375 px | 686 → 596 px, sept listes déroulantes ramenées à trois | 13 août |
| Apostrophes doublées dans Louis Segond 1910 | 48 028 occurrences, dans le fichier source et non à l'affichage | 13 août |
| Filtrage de la box | github/supabase/vercel refusés sur 443, github:80 et gitlab:443 passent | 13 août |
| Le même Mac en partage de connexion | `github.com` à `200` en 124 ms, `git push` immédiat | 13 août |
| Fonction `send-notifications` | `200` et `{"candidats":0,…}` avec le bon secret, `401` sans | 13 août |

Le prochain levier de performance reste identifié : **chaque écran resynchronise
contextes, lectures et réglages à son ouverture** sans mémoire de ce qui vient
d'être récupéré. Sur trois navigations, cela donne `contexts` ×8, `readings` ×6,
`settings` ×4, `profiles` ×3.

## Pièges vérifiés, à ne pas réintroduire

- **`envoyes` ne prouve pas qu'une notification est arrivée.** Le compteur
  n'incrémente que parce que `webpush.sendNotification` n'a pas levé, c'est-à-dire
  parce que le **service de push a accepté le message** — Apple répond `201` et
  se charge de la suite. Entre cette acceptation et un écran allumé, il reste la
  remise au terminal, le réveil du service worker, `showNotification`, et les
  réglages iOS. Le 13 août, `envoyes:2` et zéro notification visible : les deux
  faits sont compatibles. Ne jamais lire ce compteur comme un accusé de
  réception.
- **`verify_jwt` doit rester à `false` sur `send-notifications`.** `pg_cron`
  n'envoie aucun en-tête `Authorization` : la valeur par défaut ferait rejeter
  l'appel par la passerelle **avant** que la fonction s'exécute. Et le rejet est
  un `401`, comme celui d'un mauvais `x-cron-secret` — on chercherait l'erreur
  du côté du secret. Ce qui distingue les deux est le corps de la réponse :
  `unauthorized` vient de la fonction, un JSON d'erreur vient de la passerelle.
  `[functions.send-notifications]` de `config.toml` fige désormais le réglage,
  que la commande de déploiement du README ne portait pas.
- **Ne pas appeler `auth.getUser()` directement.** L'identité est mémorisée par
  `getUserId()` dans `lib/supabase/store.ts`, sur lequel s'appuie
  `getCurrentUserId()`. Un second chemin sans cache avait fait quatre
  allers-retours réseau par ouverture d'écran.
- **Ne pas retirer les garde-fous de `seedIfNeeded`.** Le verrou d'exécution
  unique et l'import non bloquant sont couverts par `seed.test.ts` ; sans eux,
  un écran restait sur « Chargement… » indéfiniment, de façon intermittente.
- **Après une mutation, mettre à jour l'état local** plutôt que de rappeler
  `getAllReadings()`. Celui-ci resynchronise depuis Supabase, où l'écriture
  partie en arrière-plan n'est pas forcément arrivée : la liste se repeuple
  alors avec l'état d'avant.
- **Vérifier qu'un champ ajouté figure dans les trois chemins** : `toRemote` à
  la création, `rowToReading` à la lecture, et le payload de mise à jour.
  `contextId` manquait dans le troisième, ce qui rendait toute modification
  éphémère. Le même piège s'est représenté avec la `date` des plans libres, que
  `updatePlanDay` ne poussait pas.
- **Sous RLS, un `delete` qui ne correspond à rien réussit sans erreur.**
  Ajouter `.select()` pour distinguer une suppression d'un refus silencieux.
- **L'espace disque n'est pas rendu immédiatement** quand on désactive une
  version : les lignes sont supprimées, mais le navigateur ne récupère les
  octets qu'à sa prochaine compaction. Ne rien promettre à l'utilisateur sur ce
  point.
- **La progression compte les chapitres, jamais les versets**
  (`src/app/progress/page.tsx`, qui parcourt `chapterStart..chapterEnd`). Cocher
  Jean 3:16-18 marque tout Jean 3 comme lu. Les plans libres, qui portent enfin
  des versets, rendent ce comportement bien plus visible qu'avant.
- **Un thème appliqué à la main dans chaque écran finit par diverger.** Les
  trois endroits qui posaient la classe `dark` séparément passent désormais par
  `applyTheme()` de `lib/themes.ts` ; le mode « Système » n'aurait pas pu être
  fiable autrement.

## Méthode

Sur la session du 9 août, quatre diagnostics posés à la lecture du code se sont
révélés faux, et ont été redressés par la mesure ou l'essai à l'écran. Trois
enseignements s'y sont ajoutés le 13 août.

**L'historique de la console survit aux navigations.** Des erreurs
`SlidersHorizontal is not defined`, apparues pendant un `git stash` de mesure,
semblaient persister après un redémarrage du serveur de développement. Un onglet
neuf n'en signalait aucune : elles étaient l'historique, pas l'état.

**Certaines choses ne se mesurent pas au navigateur.** Chronométrer le compte à
rebours de la déconnexion automatique a donné des relevés contradictoires : la
latence des allers-retours s'ajoute au temps mesuré, et une activité de
l'utilisateur réarme le compteur sans qu'on la voie. La règle de temps a été
sortie dans `lib/auto-logout.ts` et couverte par dix tests déterministes. Quand
la mesure échoue, le dire plutôt que d'inventer une explication plausible.

**Une preuve d'écran vaut par qui l'a vue.** Les plans libres ont été vérifiés
par le propriétaire du dépôt, pas par l'agent. C'est consigné sur la PR #5, et
ce n'est pas la même chose qu'un écran vu fonctionner soi-même.

**Un chemin bloqué n'est pas toute la carte.** Le poste ne joignait plus
supabase.com, ce dont il aurait été facile de conclure que rien n'était possible
côté base. Le MCP Supabase passait par ailleurs, et a permis de déployer et de
vérifier la fonction d'envoi pendant que la CLI restait muette. Avant de
déclarer une tâche bloquée, chercher si un autre chemin y mène.

**Un coupable plausible n'est pas un coupable mesuré.** Une extension Surfshark
orpheline, `activated enabled` alors que son application était désinstallée, a
été désignée comme la cause du blocage réseau : c'était cohérent, vérifiable
d'une commande, et faux. Plusieurs échanges y sont passés. Le diagnostic n'a
tenu que jusqu'à ce qu'on élargisse la mesure — le port 80 ouvert quand le 443
est fermé, GitLab qui passe quand GitHub est bloqué — et il est tombé
définitivement au premier changement de réseau. **Quand une hypothèse désigne un
composant, chercher d'abord l'essai qui l'éliminerait** : ici, basculer de
réseau coûtait trente secondes et aurait tranché d'emblée.

## Vérification visuelle

Vus fonctionner : Nouvelle lecture, Recherche, Historique, Statistiques,
Progression, Réglages, Profil, Support, Feuille de route, Soutenir, Plans de
lecture, Détail d'un plan, Détail d'une lecture.

**Jamais vu fonctionner : Administration.** Typage, lint, tests et build
passent, ce qui n'est pas la même chose.

**Jamais vue arriver : une notification push.** Le 13 août au soir, deux
notifications sont parties, ont été acceptées par Apple et tracées en base — et
rien n'est apparu sur l'iPhone. Tous les maillons en amont sont mesurés, le
dernier ne l'est pas. Voir « Le mur du 13 août ».

L'abonnement, lui, est acquis : un iPhone sous iOS 18.7 figure dans
`push_subscriptions` avec un endpoint `web.push.apple.com`. L'application doit
être installée sur l'écran d'accueil et lancée depuis son icône — iOS ne délivre
rien à un onglet Safari.
