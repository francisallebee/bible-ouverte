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
3. **Dix-huit écrans sur dix-neuf n'ont jamais été vus en arabe.** Seul
   `/auth/login` l'a été, faute de session côté agent. Les propriétés logiques
   y tiennent ; rien ne dit qu'elles tiennent ailleurs. Une trentaine de
   classes physiques subsistent dans 14 fichiers — piste, pas verdict.
4. **Les actions de l'écran Administration n'ont jamais été exercées** :
   suspendre, promouvoir, supprimer un compte, changer le statut d'un ticket.
   L'écran s'affiche (vu le 15 août), ce qui n'est pas la même chose.
   S'y ajoutaient trois chemins déjà connus. **Le changement de mot de passe a
   été exercé le 16 août 2026, par le propriétaire du dépôt et non par
   l'agent**, depuis l'écran Profil et sur son compte réel — il fonctionne.
   Restent donc la suppression d'un ticket support et la suppression en bloc
   dans l'historique.
5. **La réversion de langue est expliquée et corrigée** — voir la section dédiée
   plus bas. Reste à la voir à l'écran, connecté : le correctif est éprouvé en
   laboratoire, pas encore en usage. Trois appareils sont concernés.
6. **Un mot de passe est à changer.** Celui du compte propriétaire est apparu en
   clair dans les journaux du serveur de développement le 15 août 2026, par une
   soumission de formulaire non hydratée. Le défaut de code est corrigé
   (règle 12 d'`AGENTS.md`), l'exposition ne l'est pas : rien n'annule ce qui a
   déjà été écrit dans un journal ou un historique.
7. **Deux migrations ont été appliquées par exécution SQL directe**, l'outil de
   migration ayant été refusé à l'époque : `20260809100000_meditation_emoji.sql`
   et `20260809140000_plan_reading_context.sql`. Elles ne figurent donc pas dans
   la table `supabase_migrations` du projet. Les fichiers sont au dépôt et
   rejouables sans dégât. `20260810120000_free_plans.sql`, elle, est bien passée
   par l'outil et y figure sous l'horodatage de son application.

## La vague 4 : la traduction (item 3)

Livrée le 15 août 2026, PR #18, `b9c62c6`, en production. **19 écrans, 8
composants, 520 clés**, français et anglais — puis espagnol et italien le même
jour, voir plus bas. L'architecture est décrite dans
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

### La langue repartait seule en arrière — mesuré, puis corrigé

Le 15 août, un réglage remis en français est **reparti en anglais** quelques
minutes plus tard — `updatedAt` postérieur à l'écriture, donc une vraie écriture
et non un cache. Refait en onglet unique, il tenait à travers rechargement
complet. La condition qui échouait comptait **trois onglets, dont un chargé
avant l'existence du champ `language`**.

**La piste était la bonne, et elle est maintenant mesurée.** Dans `getSettings`,
une ligne locale marquée `_dirty` partait vers le nuage **sans que le distant
soit lu une seule fois** — `fetchSettings` n'était même pas appelé sur ce
chemin. Un appareil dont la poussée avait échoué ramenait donc sa vieille valeur
à chaque session, quelle que soit la date de ce qu'il écrasait.

L'essai au navigateur supposait une session connectée, que l'agent n'a pas : la
règle a donc été éprouvée en laboratoire, comme celle de la déconnexion
automatique avant elle. `src/lib/storage/settings-store.test.ts` monte la
condition — local `en` en attente, distant `fr` plus récent — et l'a vue rendre
`en` avant correctif : `expected 'en' to be 'fr'`. Dix tests, dont trois
échouaient.

Le correctif tient en deux gestes. `updateSettings` **date chaque écriture**
dans le `jsonb` (`updatedAt`), que le distant porte donc à son tour — la colonne
`updatedAt` de la table, elle, porte la date de la *poussée*, et les deux
diffèrent dès qu'un appareil a travaillé hors ligne. Et `getSettings` **lit le
distant sans condition**, puis laisse gagner le plus récent des deux.

Deux choix à connaître :

- Une ligne locale en attente **non datée** — toutes celles écrites avant ce
  correctif — laisse gagner le distant. Une valeur parvenue au serveur a au
  moins été vue sur un appareil en ligne.
- **Une modification faite hors ligne et jamais poussée est abandonnée** si le
  serveur a reçu autre chose entre-temps. C'est le dernier-écrivain-gagne, et
  c'est ce qui surprend le moins : l'utilisateur retrouve partout la dernière
  chose qu'il a réglée.

Ce qui reste à faire : **le voir à l'écran**, connecté, sur les trois appareils.
Le laboratoire dit que la règle est juste, pas que l'application la suit.

### L'espagnol et l'italien, livrés le 15 août

Deux fichiers à côté de `ui/fr.ts`, deux lignes dans `ui/index.ts` — la promesse
d'`AGENTS.md` tenait, rien d'autre n'a été touché. `tsc` passe, donc aucune des
520 clés ne manque : c'est le garde-fou qui fait son travail.

Mais le typage garantit la **forme**, pas que rien n'est resté en français. Deux
relevés successifs, et un seul des deux compte vraiment :

- Un comptage des valeurs identiques au français a trouvé **11 en espagnol et
  12 en italien sur 652 feuilles** — toutes légitimes : *Audio*, *Emoji*,
  *Admin*, *User*, *Email*, *Menu*, *Bug*, et *Libre* et *Ocre* qui s'écrivent
  ainsi en espagnol. Aucun oubli.
- **L'écran, ensuite** — parce qu'un outil de relevé n'est pas un écran, et que
  la leçon a déjà été payée sur Progression. `/auth/login` a été vu dans les deux
  langues, dans un onglet neuf : `<html lang="es-ES">` et `<html lang="it-IT">`,
  formulaire entièrement traduit.

C'est l'écran qui a trouvé ce que le relevé ne pouvait pas voir : **le gabarit
`src/app/auth/layout.tsx` était resté français**. Composant serveur, deux
chaînes en dur — « Accueil » et « Par Ôappliday — Ressources et Vous ». Le
formulaire traduit, son cadre non. Ce n'était pas dans le périmètre délibéré,
qui ne nomme que `/` et les `metadata`.

Corrigé dans la foulée : le gabarit est passé client, et trois clés
(`home`, `byPrefix`, `bySuffix`) l'ont rejoint dans `authScreens`. Le pied de
page est coupé en deux parce qu'un lien s'y intercale, comme celui du canal
WhatsApp dans `donate`. Le bouton de retour est passé de `left-5` à `start-5`
et sa flèche porte `rtl:rotate-180` — l'arabe arrive.

**Le prérendu n'en a pas souffert, et c'est mesuré** : `/`, `/auth/login` et
`/auth/signup` restent `○ (Static)` au build, à 1,57 kB contre 1,56 avant. Un
composant client est tout de même rendu en HTML au build ; ce que la règle 9
protège sur `/` est la redirection du middleware, pas l'absence de `'use
client'`.

L'essai s'est fait **sans session** : `getSettings` lit IndexedDB, qui existe
avant toute connexion, et `SETTINGS_CHANGED` fait relire la langue sans
rechargement. Au passage, la ligne locale de ce navigateur **n'avait pas
d'`updatedAt`** — la preuve que le cas « ligne non datée » du correctif de
réversion existe pour de vrai.

Le coût est mesuré, pas estimé : **+15 kB de First Load JS**, identique sur tous
les écrans, soit environ 7,5 kB par langue. `/` reste prérendue statique.

### L'arabe, et ce qu'il a réellement éprouvé

Livré dans la foulée. Un fichier, une ligne — la promesse tient une troisième
fois. Mais l'arabe n'est pas une quatrième traduction : c'est l'épreuve des
fondations posées à la vague 4.

**Son pluriel justifie à lui seul les valeurs en fonction.** Six formes
cardinales et non deux — zéro, un, duel, 3 à 10, 11 à 99, le reste — et le nom
repasse au singulier après 11, la forme étant décidée par `n % 100`. `ar.ts`
porte un `pluriel()` local appliquant les règles CLDR ; sept tests le couvrent,
dont celui qui vérifie que 103 se comporte comme 3 et 111 comme 11.

**Ce que l'écran a montré**, sur `/auth/login`, dans un onglet neuf après
redémarrage du serveur :

| Fondation | Constat |
|---|---|
| `dir` sur `<html>` | `rtl`, et `lang="ar"` |
| Bouton de retour | passé **à droite** — c'est `start-5` qui agit |
| Sa flèche | retournée, `matrix(-1, 0, 0, -1, 0, 0)` |
| Libellés | `text-align: start` |
| En-tête | logo passé à droite du titre |

**Réserve, et elle est grande : un écran sur dix-neuf.** Les dix-huit autres
demandent une session, que l'agent n'a pas. Un relevé des classes physiques
restantes trouve une trentaine d'occurrences dans 14 fichiers — dont onze dans
la page de présentation, qui reste française et LTR par conception. Ce relevé
est une piste, pas un verdict : il ne dit pas lesquelles gênent réellement, et
un `grep` dit ce qu'il cherche, pas ce qui manque. **Les dix-huit écrans
restants sont à repasser en arabe.**

Coût mesuré : **+10 kB** de First Load JS (`/auth/login` 206 → 216 kB), un peu
au-dessus des ~7,5 kB de l'espagnol et de l'italien — l'arabe pèse davantage en
UTF-8.

Deux limites assumées : les chiffres des compteurs restent occidentaux, et le
test de non-régression a dû être réécrit — il citait `ar` comme exemple de
langue sans dictionnaire, et il n'y en a plus une seule.

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
| Coût de l'espagnol et de l'italien | **+15 kB de First Load JS**, identique sur tous les écrans (`/auth/login` 191 → 206 kB) | 15 août |
| Coût de l'arabe | **+10 kB** (`/auth/login` 206 → 216 kB) — plus lourd en UTF-8 | 15 août |
| RTL sur `/auth/login` | `dir=rtl`, bouton passé à droite, flèche retournée — **1 écran sur 19** | 15 août |
| Bibles en d'autres langues | KJV 31 102 versets, Diodati 31 095, Van Dyck 31 104 — 66 livres chacune | 16 août |
| Poids de `public/bibles/` | 47 → **75 Mo** ; la Van Dyck seule fait **10 Mo**, l'arabe vocalisé coûtant 2 octets par caractère | 16 août |
| Reina-Valera 1909 | 66 livres, 31 102 versets — trouvée dans `scrollmapper`, `midvash` n'ayant pas d'espagnol | 16 août |
| Conditions d'api.bible | cache limité à **500 versets consécutifs**, purge à 14 jours, **5 000 appels/mois** — incompatible avec le modèle hors ligne | 16 août |
| Valeurs restées identiques au français | 11 en espagnol, 12 en italien sur 652 feuilles — toutes légitimes (*Audio*, *Email*, *Admin*…) | 15 août |
| Ce que `readings.book` stocke | l'abréviation USFM (`GEN`, `2CH`), jamais le nom | 15 août |
| Persistance de la langue | écrite dans la colonne `jsonb`, relue après rechargement complet | 15 août |
| Réglages portant une langue, en base | **1 ligne sur 102**, à `fr`, écrite à 14:07:26 UTC | 15 août |
| Réversion de langue | reproduite en test : un `en` local en attente écrasait un `fr` distant plus récent | 15 août |

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
- **Un `<form>` sans `method` se soumet en GET, et un mot de passe dans une
  query string finit dans les journaux.** Le 15 août 2026, sur le serveur de
  développement, l'adresse et le mot de passe d'un vrai compte sont apparus en
  clair dans une ligne `GET /auth/login?email=…&password=…`. Le formulaire a
  pourtant un `onSubmit` avec `preventDefault()` : il n'était simplement pas
  encore hydraté — les chunks répondaient `404` après un changement de
  composant serveur en composant client. **Un garde-fou qui vit dans du
  JavaScript ne protège pas la fenêtre où ce JavaScript n'est pas là.** Les
  trois formulaires concernés portent désormais `method="post"` ; voir la
  règle 12 d'`AGENTS.md`. Le mot de passe exposé est à changer.

  **La portée en production a d'abord été surestimée, puis mesurée.** Les trois
  pages ne sont pas dans le même cas, et seul le HTML prérendu le dit :

  | Page | Formulaire dans le HTML statique | Fenêtre avant hydratation |
  |---|---|---|
  | `auth/login` | **non** — `<Suspense fallback={null}>` l'avale | fermée |
  | `auth/signup` | **oui** | **elle était réelle, en production** |
  | `profil` | non — page protégée, pas de prérendu | fermée |

  Le `Suspense` de `login` n'est pas là pour ça : il est imposé par
  `useSearchParams()`, sans quoi la page ne se prérendrait pas. La protection y
  est donc **fortuite**, et disparaîtrait avec ce crochet.

  Sur `auth/signup`, en revanche, le formulaire était bien servi en HTML sans
  `method`, à tout visiteur, avant tout JavaScript. Relevé sur la production
  d'avant le correctif. C'est là que le défaut était réel, et non sur la page
  où l'incident s'est produit.
- **Un cache qui pousse sans avoir lu finit par écraser.** `getSettings`
  envoyait sa ligne `_dirty` au cloud sans jamais appeler `fetchSettings` : rien
  ne comparait les deux états, donc l'appareil le plus en retard gagnait. Un
  cache local qui rattrape son retard doit d'abord regarder ce qu'il rattrape.
  Tout arbitrage suppose une date **des deux côtés** — celle de la modification,
  pas celle de la poussée.
- **Une version de la Bible se déclare en trois endroits, et l'oubli du
  troisième ne se voit qu'à l'usage.** Le 16 août 2026, les quatre versions non
  françaises sont parties en production déclarées dans le script et dans
  `TEXT_VERSIONS`, mais pas dans le `VERSIONS` de `features/bible/import.ts`.
  Elles s'affichaient aux Réglages, se laissaient cocher, et `loadData` levait
  « Version inconnue » : le `catch` de l'écran remettait la case décochée, si
  bien que le seul symptôme visible était un message d'échec de téléchargement.
  Ni le typage ni les tests ne pouvaient l'attraper, les deux tables étant
  indépendantes. `import.test.ts` les compare désormais dans les deux sens.

  **Sur qui l'a vu** : l'agent l'a trouvé par la lecture, en cherchant où son
  propre travail n'était pas vérifié — la ligne « l'activation importe le texte
  : non vérifié » de sa réserve. Mais c'est **le propriétaire du dépôt** qui l'a
  constaté à l'écran, en cochant une case, avant que le correctif soit poussé.
  Les deux comptent, et pas de la même façon.
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
