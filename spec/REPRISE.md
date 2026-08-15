# Reprise des travaux — état au 15 août 2026

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
2. **Il ne manque plus qu'un secret à l'alerte d'inscription :
   `BREVO_API_KEY`.** `NEW_USER_ALERT_FROM`, `NEW_USER_ALERT_TO` et le
   planificateur `alerte-nouvel-utilisateur` sont en place. Un agent ne dépose
   pas de clé d'API. Commande dans `supabase/README.md`.

   **L'essai est déjà prêt, sans rien créer** : au 15 août, `profiles` compte
   102 lignes et `new_user_alerts` 99 — **trois comptes réels attendent d'être
   annoncés**, le plus ancien du 14 août 21 h 42, le plus récent du 15 août
   8 h 32. Dès le dépôt de la clé, le premier passage du cron enverra un
   courriel les nommant tous les trois. Inutile de créer un compte de test.
   Si rien n'arrive dans le quart d'heure, c'est la validation de l'expéditeur
   chez Brevo qui est en cause — le point resté non vérifié.
3. **Les actions de l'écran Administration n'ont jamais été exercées** :
   suspendre, promouvoir, supprimer un compte, changer le statut d'un ticket.
   L'écran s'affiche (vu le 15 août), ce qui n'est pas la même chose.
   S'y ajoutent trois chemins déjà connus, eux non plus jamais exécutés sur des
   données réelles : la suppression d'un ticket support, le changement de mot de
   passe, et la suppression en bloc dans l'historique.
4. **La réversion de langue reste inexpliquée** — voir la section dédiée plus
   bas. À éprouver en multi-onglets avant de s'y fier : trois appareils sont
   abonnés.
5. **Deux migrations ont été appliquées par exécution SQL directe**, l'outil de
   migration ayant été refusé à l'époque : `20260809100000_meditation_emoji.sql`
   et `20260809140000_plan_reading_context.sql`. Elles ne figurent donc pas dans
   la table `supabase_migrations` du projet. Les fichiers sont au dépôt et
   rejouables sans dégât. `20260810120000_free_plans.sql`, elle, est bien passée
   par l'outil et y figure sous l'horodatage de son application.

## La vague 4 : la traduction (item 3)

Livrée le 15 août 2026, PR #18, `b9c62c6`, en production. **19 écrans, 8
composants, 520 clés**, français et anglais. L'architecture est décrite dans
`AGENTS.md`, section « Les langues » ; ne sont consignés ici que les faits
mesurés et les pièges.

Ce qui a été vérifié avant d'écrire une ligne, sur la production :

| Mesure | Conséquence |
|---|---|
| `readings.book` stocke `GEN`, `2CH`, `PSA` | traduire un nom de livre ne touche **aucune ligne enregistrée** |
| 11 contextes système à `slug` stable, 71 à 94 lignes chacun | traduits à l'affichage ; `seedIfNeeded` n'est pas touché |
| Contextes à `isSystemDefault: false` | « ZOOM », « Recherches versets » gardent le nom tapé |

**Le relevé par `grep` a menti, l'écran non.** L'écran Progression avait été
déclaré terminé par un comptage des lignes accentuées. Le passage au navigateur,
langue basculée, y a trouvé **quatre blocs encore français** : l'anneau
d'objectif, les deux testaments, et une section « par contexte » que le relevé
avait confondue avec celle « par catégorie ». Sans cette revue, ils partaient en
production. Compter les accents ne dit rien de ce qui n'en porte pas.

**Deux variables de boucle nommées `t`** masquaient le dictionnaire, dans
Réglages (`COLOR_THEMES.map(t => …)`) et Administration
(`filteredTickets.map(t => …)`). Le typage ne le signale pas : les deux objets
ont un `.name`. Renommées en `charte` et `ticket`.

**Le rechargement à chaud produit des erreurs qui n'existent pas.** Trois fois
dans la séance, la console a montré `DICTIONARIES is not defined`,
`BOOKS is not defined`, `formatDate is not defined` — alors que `tsc` passait.
C'était chaque fois l'état intermédiaire entre deux éditions d'un même fichier.
Un onglet neuf ne montrait rien. La leçon du 13 août tient toujours, et vaut
aussi pour l'état, pas seulement pour l'historique.

Corrigé au passage : les Réglages annonçaient la version **0.1.0** en dur ; une
phrase y affirmait encore que les notifications n'étaient pas envoyées, faux
depuis le 14 août ; `/contexts` renvoyait vers `/settings`, où aucune section
contextes n'existe.

### La langue est-elle repartie seule en arrière ?

Le 15 août, un réglage remis en français est **reparti en anglais** quelques
minutes plus tard — `updatedAt` postérieur à l'écriture, donc une vraie écriture
et non un cache. Refait en onglet unique, il tient à travers rechargement
complet, dans IndexedDB comme dans Supabase, sans nouvelle écriture.

La condition qui a échoué comptait **trois onglets ouverts, dont un chargé avant
l'existence du champ `language`**.

La piste : dans `getSettings`, une ligne locale marquée `_dirty` est poussée
vers le nuage **avant** toute lecture. Une modification locale ancienne peut
donc écraser une valeur distante plus récente, quelle que soit la date.

**Cette piste n'est pas vérifiée.** Un coupable plausible n'est pas un coupable
mesuré — c'est exactement la leçon des extensions Surfshark. L'essai qui
trancherait : deux onglets, une écriture dans chacun, et relever les deux
sources après rechargement.

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

### Le mur du 13 août, franchi le 14

**Les notifications arrivent.** Constaté le 14 août 2026 par le propriétaire du
dépôt, sur son iPhone — pas par l'agent, qui n'a jamais pu voir l'écran. Le
parcours découverte a été confirmé du même coup.

Ce qui manquait n'était donc **aucun** des maillons mesurés ci-dessous : ils
étaient tous corrects. L'échec du 13 au soir tenait à l'essai lui-même, mené
vers 23 h 55 — l'hypothèse du mode de concentration ou du Sommeil reste la plus
probable, et n'a pas été formellement écartée. Ce qui a changé entre les deux
essais : l'heure, et le déploiement en production du code d'abonnement.

**La leçon n'en est pas invalidée** : `envoyes` ne prouvait toujours pas la
remise. Il se trouve simplement que la remise avait lieu.

Le tableau qui suit reste utile pour un prochain diagnostic : il dit où
regarder, maillon par maillon.

Chaque ligne est une mesure, pas une déduction.

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
| **Affichage sur l'iPhone** | **vu le 14 août**, par le propriétaire du dépôt |

Le cycle du 14 août a tourné seul : **68 passages du planificateur, 68 réussis**,
et quatre des cinq déclencheurs armés en conditions réelles — `roadmap-done` (8),
`daily` (3), `support-reply` (1), `plan-late` (1). Seul `inactive` n'a rien
produit, ce qui est normal : il demande sept jours sans lecture.

**Si un jour rien n'arrive à nouveau**, le test qui sépare le plus vite : le
bouton de notification de test des réglages appelle `showNotification`
localement, sans serveur ni abonnement. S'il affiche quelque chose, l'affichage
fonctionne et le défaut est dans la remise ; s'il n'affiche rien, c'est iOS qui
retient tout et le push n'y est pour rien. Regarder aussi les modes de
concentration, et le centre de notifications — une remise silencieuse ressemble
à une absence.

**Pour rejouer un déclencheur**, sa référence doit changer ou disparaître. Le
`daily` repart chaque jour de lui-même ; un `plan-late` ne repartira pas tant
que son plus ancien jour en retard n'aura pas bougé. Pour forcer, effacer la
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
pas d'outil pour cela. C'est ce qui a fait passer les secrets de l'alerte
d'inscription par la CLI, deux d'abord puis le troisième — et il ne reste que
`BREVO_API_KEY`, que le propriétaire déposera lui-même.

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
| Comptes et alertes en attente | 102 profils, 99 traces — 3 comptes à annoncer | 15 août |
| Volume de la traduction | 1 070 lignes accentuées sur 19 écrans et ~85 fichiers, ramenées à 520 clés | 15 août |
| Ce que `readings.book` stocke | l'abréviation USFM (`GEN`, `2CH`), jamais le nom | 15 août |
| Persistance de la langue | écrite dans la colonne `jsonb`, relue après rechargement complet | 15 août |

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

**Un outil de relevé n'est pas un écran.** Le 15 août, un comptage des lignes
accentuées a déclaré l'écran Progression entièrement traduit. Il l'était à 80 % :
quatre blocs restaient français, dont deux ne portaient aucun accent — « Old
Testament » n'en a pas plus que « Ancien Testament » n'en manque. C'est le
passage au navigateur, langue basculée, qui les a trouvés. Un `grep` dit ce
qu'il cherche, pas ce qui manque.

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

**Tous les écrans de l'application ont désormais été vus fonctionner.**

Nouvelle lecture, Recherche, Historique, Statistiques, Progression, Réglages,
Profil, Support, Feuille de route, Soutenir, Plans de lecture, Détail d'un plan,
Détail d'une lecture — les dix premiers le 9 août 2026, les trois écrans de
plans le 13 août.

**Administration, le 15 août 2026, et par l'agent.** C'est la première preuve
d'écran de ce dépôt qui ne vienne pas du propriétaire. 101 comptes, 111
lectures, 7 plans, 808 contextes, les deux onglets et le tableau des comptes.
Réserve, qui compte : **aucune de ses actions n'a été exercée** — voir la
section des actions en attente.

Le 15 août également, **les 19 écrans ont été repassés dans les deux langues**,
par l'agent, pour la vague 4.

**Vus fonctionner le 14 août 2026, par le propriétaire du dépôt et non par
l'agent** : les **notifications push** sur iPhone, et le **parcours découverte**.
C'est la même distinction que pour les plans libres — une preuve d'écran vaut
par qui l'a vue, et l'agent n'avait alors jamais eu de session pour la produire
lui-même.

L'abonnement suppose que l'application soit installée sur l'écran d'accueil et
lancée depuis son icône : iOS ne délivre rien à un onglet Safari.
