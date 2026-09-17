# Reprise des travaux — état au 15 août 2026

Ce document ne liste pas les fonctionnalités à venir : **la feuille de route
fait foi**, et elle vit dans l'application (`/roadmap`, table `roadmap_items`).
La recopier ici produirait une seconde source de vérité qui divergerait.

Il consigne ce que la feuille de route ne peut pas porter : les mesures faites
sur l'application réelle, les pièges rencontrés, et les points qui attendent une
action hors du dépôt.

## Ce qui attend une action hors du dépôt

1. **Le filtrage de la box a été levé — mesuré le 21 août 2026 en fin de
   journée.** `github.com`, `supabase.com`, `vercel.com` et
   `bible-ouverte.vercel.app` répondent tous `200`, **et depuis le Wi-Fi**
   (`en0`, `192.168.1.46`), l'adresse même qui les voyait refusés le matin.
   **Le partage de connexion iPhone n'est plus nécessaire.** Il reste la
   solution de repli si le filtrage revenait ; la section dédiée plus bas garde
   le relevé du blocage, qui a structuré une semaine de travail.
2. **L'alerte d'inscription fonctionne**, depuis le 18 août 2026 à 11:00 UTC.
   Courriel reçu, onze inscriptions annoncées d'un coup. Trois jours auront été
   nécessaires, et le récit vaut d'être lu dans `supabase/README.md` : Brevo
   abandonné pour sa liste blanche d'IP, un caractère typographique invisible
   dans une clé, un secret déposé à vide, et onze comptes perdus puis rendus.
   Elle passe désormais par le **SMTP d'o2switch**, sur le domaine du projet.

   `BREVO_API_KEY` a été retiré ; les cinq secrets utiles — `SMTP_HOST`,
   `SMTP_USER`, `SMTP_PASSWORD`, `NEW_USER_ALERT_FROM` et `NEW_USER_ALERT_TO` —
   sont tous renseignés, aucun vide. Seul reste au choix : `NEW_USER_ALERT_TO`
   vaut la même adresse que l'expéditeur, ce qui fait un envoi à soi-même. À
   changer si tu préfères recevoir ailleurs.

3. **Le catalan est en pause, sur décision du propriétaire du dépôt, le
   19 août 2026 — jusqu'à nouvel ordre.** Ne pas le reprendre sans qu'il le
   demande, et surtout ne pas relancer la recherche : elle est faite, et son
   résultat est ci-dessous. L'item 26 de la feuille de route reste à *projet*,
   ce qui est désormais son état exact et non un retard.

   **Aucun texte du domaine public n'a été trouvé.** Cherché le 19 août 2026,
   sur les cinq sources qui pouvaient en porter un. Le propriétaire avait
   demandé qu'on cherche le texte **avant** d'ajouter la langue, `AGENTS.md`
   promettant une version biblique par langue d'interface. La réponse est non.

   | Source | Catalan ? |
   |---|---|
   | `ebible.org`, catalogue `translations.csv` | **aucune ligne** — c'est pourtant le plus gros fonds sous licence libre |
   | `seven1m/open-bibles`, 45 langues | aucune |
   | `midvash/bible-data`, 22 langues — notre première source | aucune |
   | `scrollmapper/bible_databases`, ~50 langues — notre seconde | aucune, du klingon au gotique mais pas de catalan |
   | CrossWire / SWORD | la **Bíblia Evangèlica Catalana** existe, mais **© IBEC 2000** : CrossWire n'a qu'une autorisation de module, pas une licence de redistribution |

   Sous droits également : la **BCI** de 1993 (Associació Bíblica de
   Catalunya), et la Bíblia de Montserrat. Le *Corpus Biblicum Catalanicum*
   publie des éditions critiques imprimées, sans texte intégral libre annoncé.

   **Le seul texte libre par l'âge est un Nouveau Testament** : *Lo Nou
   Testament* de Josep Melcior Prat, Londres 1832, pour la British and Foreign
   Bible Society. Aucune numérisation structurée n'a été trouvée — et un
   Nouveau Testament seul ne tiendrait pas la promesse d'`AGENTS.md`, la même
   raison qui a fait écarter quatre versions françaises de `scrollmapper` le
   16 août. La Bible de Valence de 1478 ne survit qu'à l'état de fragment.

   Les quatre options restent ouvertes pour le jour où le sujet reprendra :
   accepter un Nouveau Testament seul, assouplir la promesse d'une version par
   langue, obtenir une licence auprès de l'IBEC ou de l'ABCat, ou laisser le
   catalan en projet. **Aucune n'est à instruire tant que le propriétaire ne
   le demande pas.**

4. **La revue de l'arabe est en pause, sur décision du propriétaire du dépôt,
   le 19 août 2026 — jusqu'à nouvel ordre.** Ne pas la reprendre sans qu'il le
   demande : la tentation est forte, c'est la dette la plus voyante de ce
   document.

   L'état, pour quand elle reprendra. Dix-huit écrans sur dix-neuf n'ont
   jamais été vus en arabe ; seul `/auth/login` l'a été, faute de session côté
   agent à l'époque. Les propriétés logiques y tiennent ; rien ne dit qu'elles
   tiennent ailleurs. Une trentaine de classes physiques subsistent dans 14
   fichiers — piste, pas verdict.

   **Le périmètre a grandi depuis** : trois fenêtres surgissantes
   (`BookPicker`, `PassagePreview`, `PassageSearch`), l'arbre de « Mes
   lectures » dont le retrait des niveaux est posé en `paddingInlineStart`, et
   la section des pages masquables. Aucun n'a été vu en RTL.
5. **Les actions de l'écran Administration ont toutes été exercées le 18 août
   2026**, par l'agent, sur le compte de test *Teste* — voir la section dédiée
   plus bas. Suspendre, réactiver, promouvoir, rétrograder, changer le statut
   d'un ticket et supprimer un compte : les six passent, chacune vue à l'écran
   **et** confirmée en base. Le compte de test a été consommé par la
   suppression ; en recréer un pour la prochaine vérification.
   S'y ajoutaient trois chemins déjà connus. **Le changement de mot de passe a
   été exercé le 16 août 2026, par le propriétaire du dépôt et non par
   l'agent**, depuis l'écran Profil et sur son compte réel — il fonctionne.
   Restent donc la suppression d'un ticket support et la suppression en bloc
   dans l'historique.
6. **La réversion de langue est corrigée et vue fonctionner**, le 18 août 2026,
   par le propriétaire du dépôt : deux appareils, un même compte, la langue se
   synchronise. Voir la section dédiée plus bas. Le correctif était éprouvé en
   laboratoire depuis le 15 août ; il l'est désormais en usage.
7. **Le mot de passe exposé a été changé**, le 18 août 2026, par le propriétaire
   du dépôt. Celui du compte propriétaire était apparu en clair dans les
   journaux du serveur de développement le 15 août 2026, par une soumission de
   formulaire non hydratée. Le défaut de code avait été corrigé aussitôt
   (règle 12 d'`AGENTS.md`) ; l'exposition, elle, ne s'annule pas — rien n'efface
   ce qui a déjà été écrit dans un journal ou un historique, seule la rotation
   du secret ferme le sujet. C'est fait.
8. **Deux migrations ont été appliquées par exécution SQL directe**, l'outil de
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

**Vu à l'écran le 18 août 2026, par le propriétaire du dépôt** : deux appareils,
un même compte, la langue se synchronise. C'est ce qui manquait — le laboratoire
disait que la règle était juste, pas que l'application la suivait ; il le dit
maintenant. Le troisième appareil n'a pas été repassé, et il n'a pas à l'être :
la règle éprouvée est celle qui départage deux appareils, et deux suffisent à la
mettre en défaut.

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

### Le réseau domestique filtrait github, supabase et vercel — levé le 21 août

**Le blocage n'existe plus.** Mesuré le 21 août 2026 vers 13 h, sur les deux
interfaces de la box : `github.com` **200** en 0,22 s par l'Ethernet USB
(`en7`, `192.168.1.112`) et **200** en 0,29 s par le Wi-Fi (`en0`,
`192.168.1.46`). `supabase.com`, refusé toute la semaine, répond lui aussi.

Ce qui a levé le filtrage n'est pas connu de l'agent, et la date exacte non
plus : il était actif le matin même — la production `bible-ouverte.vercel.app`
était injoignable — et ne l'était plus l'après-midi.

**Une hypothèse a été formée puis tuée**, et elle mérite d'être notée parce
qu'elle était plausible. Le trafic passait par un adaptateur **Ethernet USB**
et non par le Wi-Fi : deux adresses, deux baux DHCP, donc deux appareils aux
yeux de la box. Un contrôle parental visant l'appareil aurait tout expliqué. Le
seul essai qui pouvait la réfuter — forcer une requête sur `en0` — l'a réfutée :
le Wi-Fi passe aussi. **Chercher l'essai qui élimine l'hypothèse, pas celui qui
la conforte.**

Cet essai a d'abord produit un **faux négatif** : `curl --interface` échouait en
**0,0002 seconde**, sur `example.com` compris. Un refus réseau ne peut pas être
aussi rapide — c'était le bac à sable de l'agent, qui interdit de lier un socket
à une interface donnée, comme il interdit le socket de routage de `route` et
l'`AuthorizationCreate()` de `networksetup`. **La durée est le premier indice à
lire : trop rapide veut dire local.**

Ce qui suit est le relevé du blocage, conservé pour le jour où il reviendrait.

#### Le relevé du blocage, du 13 au 21 août 2026

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

**Le filtrage porte sur le nom d'hôte exact, et non sur le domaine.** Mesuré le
18 août : `supabase.com` est refusé mais `api.supabase.com` répond — si bien que
la CLI Supabase, qui n'appelle que le second, fonctionne depuis la box. Seul le
tableau de bord est inaccessible. Ne pas conclure d'un hôte bloqué que tout le
domaine l'est : c'est la variante fine de « un chemin bloqué n'est pas toute la
carte ».

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
| Finesse du filtrage | **`api.supabase.com` passe** quand `supabase.com` est refusé — c'est le nom d'hôte exact qui est filtré, pas le domaine. La CLI Supabase fonctionne donc depuis la box | 18 août |
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
| Bible Annotée de Neuchâtel 1900 | 66 livres, 31 102 versets, **0 vide** — la 8ᵉ française | 16 août |
| Import d'une version à l'écran | **vu fonctionner** par le propriétaire du dépôt, sur la Bible Annotée | 16 août |
| Alerte d'inscription | **reçue**, 11 inscriptions annoncées — SMTP o2switch, port 465 | 18 août |
| Port 465 depuis une fonction Edge | **il sort**, contrairement à ce qu'annonce la documentation Supabase | 18 août |
| Liste blanche d'IP de Brevo | 7 refus, 7 adresses différentes en 2 jours, toutes dans `2a05:d01c:76e:790…` | 18 août |
| Quatre autres françaises de `scrollmapper` | 66 livres annoncés, **Ancien Testament entièrement vide** — écartées | 16 août |
| Versets vides des versions livrées | kjv 0, diodati 0, svd 0, rv1909 **18**, tous aux jonctions de chapitre | 16 août |
| Droits des versions demandées | **9 sur 11 sous droits** (SBG, ABF, Biblica) ; Fillion et Vigouroux libres mais sans source structurée | 16 août |
| Conditions d'api.bible | cache limité à **500 versets consécutifs**, purge à 14 jours, **5 000 appels/mois** — incompatible avec le modèle hors ligne | 16 août |
| Valeurs restées identiques au français | 11 en espagnol, 12 en italien sur 652 feuilles — toutes légitimes (*Audio*, *Email*, *Admin*…) | 15 août |
| Ce que `readings.book` stocke | l'abréviation USFM (`GEN`, `2CH`), jamais le nom | 15 août |
| Persistance de la langue | écrite dans la colonne `jsonb`, relue après rechargement complet | 15 août |
| Réglages portant une langue, en base | **1 ligne sur 102**, à `fr`, écrite à 14:07:26 UTC | 15 août |
| Réversion de langue | reproduite en test : un `en` local en attente écrasait un `fr` distant plus récent | 15 août |
| Colonnes de `profiles` | `phone`, `birth_date`, `bio`, `avatar_url` existaient déjà et n'étaient pas renseignées à l'inscription | 20 août |
| Lignes de `new_user_alerts` | **112**, amorcées en août — un `welcomed_at` ajouté sans remplissage rétroactif aurait écrit à 112 personnes | 20 août |
| Droits d'écriture sur `profiles` | révoqués au niveau table : toute colonne neuve exige son propre `grant update` (règle 2), sans quoi l'écriture échoue sans message clair | 20 août |
| Séries de l'écran Progression | un second calcul, `calcStreaks`, vivait encore dans la page — **UTC contre dates locales**, et sans la tolérance | 19 août |
| Ce qui relie une lecture à un plan | **rien** : pas de colonne, et le contexte « Plan de lecture » est commun à tous. Seul `plan_days.readingId`, posé au cochage | 19 août |
| Poids de la Bible en mots | Louis Segond 1910 : **722 968 mots**, 31 102 versets, 1 189 chapitres — 608 mots par chapitre en moyenne | 19 août |
| Écart entre livres | un chapitre des Psaumes fait **268** mots, un chapitre des Rois **1 015** — facteur 3,8, d'où une table par livre et non une moyenne | 19 août |
| `verseEnd` à 200 en base | **valeur de repli** de `PassagePicker` quand le texte n'est pas téléchargé (`FALLBACK_VERSES`) — Psaumes 1:1-200 existe pour de vrai | 19 août |
| Estimation sur les 166 lectures réelles | 39,6 h au total ; Genèse entière à **231 min**, quand les bibles audio l'annoncent vers 3 h 50 | 19 août |
| Déclencheur `roadmap-done`, en conditions réelles | items 29 et 30 passés à *terminé* à 19:42 UTC, **notifiés à 19:45** — 5 comptes abonnés, deux lignes chacun, une par item | 19 août |
| Changement de statut d'un ticket | **ne notifie rien** : `supportReplies` de `notification_data()` ne lit que `replies`, jamais `status` | 19 août |
| Portée de cet identifiant | c'est l'identifiant **Supabase** — `rowToEntry` reprend `row.id` comme clé locale —, donc stable d'un appareil à l'autre | 19 août |
| Pastille de palier, contraste | `text-orange-600` sur `bg-orange-50` : **3,35** — porté à `orange-700`, **4,88** | 19 août |
| Badges débloqués, mode sombre | texte hérité `--text` sur `bg-yellow-50` : **1,06** — calculé sur le CSS produit, **pas vu à l'écran** | 19 août |
| Badges débloqués, **mode clair** | la *description* en `text-gray-400` sur `bg-yellow-50` : **2,45** — le défaut existait donc dans les deux thèmes, et non dans le seul mode sombre | 21 août |
| Migrations, dépôt contre base | **25 fichiers, 23 enregistrées** — l'écart est exactement les deux du 9 août passées en SQL direct, aucune en attente | 21 août |
| Filtrage réseau, **sous-domaines** | `bible-ouverte.vercel.app` refusé **comme** `vercel.com` — la production est injoignable depuis la box, ce qui n'était consigné nulle part | 21 août |
| Compteurs d'actifs de l'écran de gestion | carte **20**, filtre **24**, dans le même rendu — deux calculs corrects répondant à deux questions | 21 août |
| Coût d'un `/api/admin/users` en production | **1,3 à 2,4 s**, et il repart à chaque retour au premier plan | 21 août |
| Présence contre connexion, en base | 10 comptes ont un `last_seen_at`, 20 une connexion de moins de 7 jours, 12 une lecture — trois définitions, trois nombres | 21 août |
| Délai d'envoi d'un courriel, **avant** | vœu d'anniversaire du 20 août : **603 s** entre l'écriture et l'acceptation SMTP | 21 août |
| Délai d'envoi, **après** | envoi réel depuis l'administration : **2,3 s** et **3,0 s** — 258 fois plus court | 21 août |
| Entraînement libre, effet sur les données | niveau, échéance et `updatedAt` **identiques à la milliseconde** après une séance ; 5 séances avant, 5 après | 21 août |
| **Levée du filtrage de la box** | `github.com` et `supabase.com` à **200** depuis le Wi-Fi `192.168.1.46`, refusés le matin même depuis cette adresse — le partage iPhone n'est plus nécessaire | 21 août |
| Écarts entre créations de lectures d'un même jour | deux populations séparées par un creux : **119 sous la seconde**, 6 entre 1 et 5 s, puis plus rien avant 30 s, et 63 au-delà | 28 août |
| Regroupement de l'historique | **314 lectures deviennent 189 entrées** ; la plus grande saisie fait 39 passages en 2,816 s, la plus longue dure 8,88 s | 28 août |
| Repli de `vuLe()` sur « actifs » | **0 compte** lui doit son statut : 15 actifs par la règle actuelle comme par la présence seule | 28 août |
| Comptes situés par la seule connexion | **98 sur 114** sont entre 7 et 30 jours sans aucune présence — retirer le repli les sortirait aussi de « inactifs » | 28 août |
| « Sept traductions » dans le HTML servi | **6 occurrences** alors que le composant n'en portait plus aucune : `metadata`, page Soutenir, parcours | 28 août |
| Suppression du compte de test | `delete_account` sur *Alain Fictif* le **21 août à 15:21:51 UTC**, 2 h 48 après les deux courriels ; ses messages sont partis avec lui | 28 août |
| Étapes du parcours découverte | **17 → 21** : Quizz, Verset du jour, Mémorisation et Messages étaient ignorés depuis leur naissance | 28 août |
| `curl` vers `localhost:3000` | `code=000` en **0,015 s** alors que le serveur répond — le bac à sable, pas le réseau | 28 août |
| Défaut trouvé à l'œil sur la page d'accueil | la maquette du hero affichait « + ajouter un passage » quand le relevé cherchait « Réunis plusieurs passages » — **deux libellés, un seul connu du contrôle** | 28 août |
| Messages par connexion SMTP o2switch | **3**, puis `UnexpectedEof` — répété **39 fois** sur l'envoi de l'annonce | 28 août |
| Envoi groupé de 114 courriels | tous acceptés, mais en **39 passages sur 9 h 34** — 3 par passage | 28 août |
| Tentatives brûlées sans envoi | **37**, parce que la boucle continuait après la coupure | 28 août |
| Délivrabilité vers iCloud | le courriel arrive **dans les indésirables** — toutes les remises confirmées jusqu'ici l'étaient vers Gmail | 28 août |
| Correctif SMTP, éprouvé | **5 envoyés sur 5 en un passage**, 0 échec, 0 tentative brûlée — 11 s contre 9 h 34 pour 114 | 29 août |
| Signature de la reconnexion | messages 1-2-3 acceptés dans la **même seconde**, le 4ᵉ une seconde plus tard : le temps d'une connexion TLS neuve | 29 août |
| Authentification de `bibleouverte.fr` | **SPF, DKIM et DMARC sont tous les trois présents** — DKIM sélecteur `default`, RSA 2048 ; DMARC à `p=none` **sans `rua`** | 29 août |
| Versets de Proverbes 18 | **24 dans les douze versions**, sans exception — le repli du sélecteur en annonçait 200 | 31 août |
| Plus grand chapitre de la Bible | **Psaume 119, 176 versets.** `200` ne désigne donc rien, dans aucune version, nulle part | 31 août |
| Versification, écart à Louis Segond 1910 | `annotee`, `kjv` et `rv1909` **identiques sur les 1189 chapitres** ; `svd` 2, `perret` 4, `diodati` 44, `martin1744` 90, `ostervald` 91, `cramp23` 132, `darby` 142, `sacc` 322 | 31 août |
| Lectures dont le `verseEnd` dépasse le chapitre réel | **6 sur 347**, chez **6 comptes** — quatre à 200, mais aussi `PSA 65:1-20` (13 versets) et `PSA 22:1-45` (31), saisies à la main dans les anciennes listes | 31 août |
| Dernière lecture hors bornes enregistrée | **17 août 2026** — aucune depuis, le sélecteur ayant remplacé les listes déroulantes | 31 août |
| Coût d'une réexportation dans le baril `features/bible` | la table des 1189 chapitres — **3,8 kB** non compressés — servie sur la **page d'accueil prérendue**, `I18nContext` important `BOOKS` du même baril | 31 août |
| Après l'import par chemin | **zéro occurrence** de la table dans les 17 chunks de `/`, `BOOKS` toujours servi ; chunk `5954` de 226 à 221,5 kB | 31 août |
| Séance à plusieurs passages, écriture | une lecture par passage reste la règle en base ; **date, contexte, version, notes et médias** sont communs et recopiés sur chaque ligne | 31 août |
| Le panneau de séance vu à l'écran | **par l'agent, session ouverte par le propriétaire** : Proverbes 18 rend 24 boutons, « Tout le chapitre » donne `Proverbes 18:1-24`, deux passages au panneau, croix et pluriel du bouton | 31 août |
| Droits sur `readings`, au niveau table | **`SELECT, INSERT, UPDATE, DELETE`** — contrairement à `profiles`, qui n'a que `SELECT` : une colonne neuve y est couverte d'office, la règle 2 ne s'y applique pas | 31 août |
| Points de création d'une lecture | **cinq**, et non trois : Nouvelle lecture, recherche biblique, verset du jour, cochage d'un jour de plan, et un test — tous trouvés par `tsc`, aucun par relecture | 31 août |
| Droits d'écriture, table par table | **rien ne se généralise** : `readings` a l'`UPDATE` au niveau table, `messages` et `profiles` non — ces deux-là exigent un `grant update (…)` par colonne ajoutée | 1er sept. |
| Contrainte sur `roadmap_items.status` | **aucune** : un statut neuf ne demande pas de migration, seulement du typage, une couleur et cinq traductions | 1er sept. |
| Cause de l'instabilité du verset du jour | le **diviseur** : `condense(jour) % matiere.length`, et marquer le verset « lu » enregistre une lecture — il se déplaçait lui-même | 1er sept. |
| Archivage d'un message, exercé | passé en Archivés et confirmé en base à 08:14:22 UTC, puis désarchivé — base rendue à **0 archivé, 0 supprimé sur 244** | 1er sept. |
| Tickets support | **20, tous clos** — le 25 fermé le 1er septembre à 07:02:49 UTC, une réponse ; plus aucun ouvert | 1er sept. |
| Page d'accueil au choix, éprouvée | `/history` choisie → `/` mène à `/history` ; la même page **masquée** → `/` ramène à `/new-reading`. Le chaînage réglage → base → middleware tient | 1er sept. |
| Chemins qui contournaient le réglage d'accueil | **quatre** : `start_url` du manifeste, la connexion, le lien de confirmation, le logo — le middleware ne décide que sur `/` et `/auth/*` | 2 sept. |
| Coût de ce réglage | **une requête, sur `/` et `/auth/*` seulement** — les deux chemins qui redirigent ; aucune navigation ordinaire n'en paie le prix | 1er sept. |
| `readings` après la migration du titre | **360 lignes sur 360** à `sessionTitle` nul, aucune reprise de données ; la colonne porte bien `INSERT, SELECT, UPDATE` pour `anon` et `authenticated` | 31 août |
| Lectures du propriétaire dans la journée | **347 → 360** : les essais d'enregistrement de la séance à plusieurs passages ont abouti, dont une séance de **12 passages** le 30 août | 31 août |
| `bg-[--primary-light]` en mode sombre | **reste clair quelle que soit la charte** : `applyTheme()` pose la variable en style **inline** sur `<html>`, ce qui bat la règle `html.dark` qui la remapperait en `#1a2840` | 31 août |
| Contraste du panneau, mode sombre | `--text-secondary` sur ce fond : **2,15** — porté à **5,57** par `text-[--primary] opacity-75`, le titre restant à 11,02 | 31 août |
| Étendue de ce défaut | **13 fichiers** emploient `bg-[--primary-light]` : Réglages ×7, Support ×6, parcours ×3, historique ×3 | 31 août |
| Sondage d'un déploiement par le texte servi | le minifieur **échappe le Latin-1** (`La s\xe9ance`) et **laisse l'arabe brut** — une sonde accentuée ne trouve jamais rien | 31 août |
| Hauteur d'une entrée de menu | `py-2.5` + `text-sm` donne **40 px** — c'est la **boîte de ligne** de 20 px qui gouverne, pas la police de 14 px | 2 sept. |
| Ce que `py-3` donnerait | **44 px**, le seuil Apple — l'audit le proposait en annonçant 48, tout en chiffrant son coût à huit pixels par entrée, qui est celui de `py-3.5` | 2 sept. |
| Cibles du menu après correctif | **19 sur 19 à 48 px ou plus**, relevé au navigateur : 17 à 48, le profil à 52, le logo passé de 36 à 48 | 2 sept. |
| Le logo de la barre latérale | **36 px** — dix-neuvième cible, affichée dans le relevé de l'audit mais **hors de son correctif**, qui ne portait que sur les entrées | 2 sept. |
| Champs sans nom accessible, après correctif | **0 sur Nouvelle lecture, 0 sur Mes lectures, 0 sur les 12 listes de Réglages** — relevé dans le DOM, nom par nom | 2 sept. |
| `placeholder` sur `<input type="date">` | **jamais rendu** : le navigateur y affiche son format. Les deux dates de Mes lectures n'avaient donc aucun nom, pas même visible — l'audit les disait pourvues | 2 sept. |
| `<h2>` réellement rendus par Réglages | **16**, quand un `grep` sur le source en compte **1** : `SectionCard` est une source unique rendue quinze fois | 2 sept. |
| Champs sans `htmlFor` au `grep` | **~64 sur 11 écrans**, contre **10 sur 3** mesurés à l'écran par l'audit — le relevé ignore `aria-label` et les `<label>` englobants | 2 sept. |
| Coût d'un titre `sr-only` | **1 × 1 px en position absolue** — aucun décalage de mise en page, vérifié par `getComputedStyle` | 2 sept. |
| Chapitres réellement lus en entier | **40 sur 169** au relevé SQL, **38** au calcul juste — 129 partiels, soit 76 %, dont beaucoup d'un seul verset | 9 sept. |
| Ce que le comptage strict coûterait | du **niveau 4 au niveau 2**, et **deux badges déjà obtenus** retirés — au propriétaire comme aux 33 autres comptes ayant des lectures | 9 sept. |
| Base au 9 septembre | **597 lectures**, 34 comptes en portent — contre 412 au briefing du 2 septembre | 9 sept. |
| Ce qu'écrivait le cochage d'un plan daté | `verseEnd: 1` — cocher « Genèse 1-4 » enregistrait une lecture s'arrêtant à **Genèse 4:1** | 9 sept. |
| Largeur rendue par le rail | contenu de **1 020 → 1 193 px** sur un écran de 1 280 ; barre de 260 à 80 px | 9 sept. |
| Cibles du menu en rail, avant correctif | **44 × 40 px** — le libellé passé en `sr-only` ne soutenait plus la hauteur, et la barre de défilement prenait 15 px de large | 9 sept. |
| `lg:ml-[var(--nav-width)]` en arabe | propriété **physique** : la barre passe à droite, le contenu restait poussé depuis la gauche et passait dessous | 9 sept. |
| Où vont les 3 820 px de Progression | **84 % dans cinq sections de liste** — Succès 836, par contexte 598, par catégorie 550, Détail par livre 466 ; les quatre cartes n'en font que 625, soit 16 % | 2 sept. |
| Cartes en deux colonnes, effet réel | Progression **3 820 → 3 462 px** (4,70 → 4,26 écrans), Statistiques **2 126 → 1 878** — l'audit promettait « sous trois écrans », ce que la disposition seule ne peut pas rendre | 2 sept. |
| `text-[--primary]` sur `--surface` en mode sombre | **1,11** de contraste — `#4a1a5e` sur `rgb(30,41,59)`. Le « 141 / 1189 » de Progression est illisible en thème sombre | 2 sept. |
| Étendue de ce défaut | **87 occurrences dans 29 fichiers** ; toutes ne sont pas sur un fond remappé, mais la cause leur est commune | 2 sept. |
| Sonde de contrôle du même relevé | le `h1`, lisible à l'œil, mesure **16,30** — l'instrument est bon avant qu'on l'accuse | 2 sept. |
| Progression et Statistiques en arabe | **premiers écrans internes jamais vus en RTL** : grille inversée, barres remplies depuis la droite, aucun débordement | 2 sept. |
| « Aller au contenu » | **écrit en dur**, donc français dans les cinq langues — et `focus:left-2`, propriété physique. Seul texte visible échappant aux dictionnaires, parce qu'il ne s'affiche qu'au clavier | 2 sept. |
| Champs de `/auth/login` à 768 px, en production | **15 px** — sous le seuil de 16 qui déclenche le zoom automatique de Safari iOS, et `data-preset` y vaut `null` | 9 sept. |
| Écarts entre l'état après connexion et après rechargement | **zéro sur seize mesures**, sur navigateur de bureau : le défaut ne s'y reproduit pas, ce qui a désigné le tactile | 9 sept. |

Le prochain levier de performance reste identifié : **chaque écran resynchronise
contextes, lectures et réglages à son ouverture** sans mémoire de ce qui vient
d'être récupéré. Sur trois navigations, cela donne `contexts` ×8, `readings` ×6,
`settings` ×4, `profiles` ×3.

## Pièges vérifiés, à ne pas réintroduire

- **Une valeur de repli inventée finit par être lue comme une mesure.**
  `FALLBACK_VERSES = 200` était documenté comme tel dans `PassagePicker`, cité
  comme tel dans le commentaire de `lib/objectifs`, et relevé comme tel en base
  le 19 août — « Psaumes 1:1-200 existe pour de vrai ». Le dépôt savait donc
  parfaitement ce qu'il faisait. Ce qu'il n'avait pas remarqué, c'est que **cette
  valeur ne désigne rien** : le plus grand chapitre de la Bible en compte 176.
  Elle n'était pas approximative, elle était impossible — et il a fallu un
  utilisateur, le ticket 25 du 30 août 2026, pour la voir sur Proverbes 18.

  Ni `tsc`, ni le lint, ni les tests ne pouvaient l'attraper : `200` est un
  nombre parfaitement valide. Le remède n'est pas un meilleur repli mais une
  mesure — `scripts/mesure-versets.mjs` relève les 1189 chapitres depuis Louis
  Segond, comme `mesure-mots.mjs` relevait leur poids. **Une constante qu'on
  documente comme un pis-aller mérite qu'on aille chercher la vraie valeur ;
  l'écrire dans un commentaire n'est pas la mesurer.**

  Deux corollaires trouvés au passage. Le repli s'affichait aussi **pendant**
  l'aller-retour vers IndexedDB, donc à chaque ouverture de la fenêtre et pour
  tout le monde, pas seulement quand le texte manquait — une table lue de façon
  synchrone ferme cette fenêtre de temps que rien ne signalait. Et le même `200`
  vivait en dur dans l'écran de modification d'une lecture, resté aux listes
  déroulantes : c'est même **lui** qui a écrit `PSA 65:1-20` et `PSA 22:1-45`,
  que le repli n'explique pas. Chercher une valeur en dur partout, pas seulement
  là où le ticket la signale.

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
- **Compter les versets ne dit pas qu'ils portent du texte.** Le 16 août 2026,
  quatre versions françaises de `scrollmapper` — Genève 1669, Oltramare 1874,
  Stapfer 1889, Synodale 1921 — annonçaient chacune **66 livres et 31 102
  versets**, exactement comme les versions saines. Leur Ancien Testament était
  entièrement vide : des versets présents, au texte réduit à la chaîne vide. Ce
  sont des Nouveaux Testaments, ce que leur titre disait d'ailleurs, complétés
  par des cases blanches.

  Le contrôle qui avait validé la King James, Diodati et la Van Dyck — compter
  les chapitres des livres qui avaient trahi Sacy — les aurait déclarées
  complètes. **Il faut lire Genèse 1:1**, et compter les versets vides sur toute
  la version. C'est ce contrôle-là qui a retenu la Bible Annotée de Neuchâtel,
  seule des cinq à avoir zéro verset vide.

  Il a aussi servi à revérifier les quatre versions déjà livrées : `kjv`,
  `diodati` et `svd` en ont **zéro**, et la Reina-Valera **18**, tous aux
  jonctions de chapitre — Jonas 1:17 vide et son texte dans Jonas 2:1. C'est une
  différence de versification entre traditions, comme Malachie à 3 chapitres
  dans Crampon et Darby, et non un manque.
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

  **Le correctif est validé en usage** : la Bible Annotée de Neuchâtel a été
  cochée et téléchargée avec succès le 16 août 2026, par le propriétaire du
  dépôt. Le chemin complet — case cochée, fichier récupéré, 31 102 versets
  écrits dans IndexedDB — fonctionne donc de bout en bout. C'est la première
  version ajoutée après la règle 13, et la seule dont l'import ait été vu.
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
- **Un jour de plan coché hors ligne perd son lien avec sa lecture.** Le
  cochage enregistre `plan_days.readingId` avec l'identifiant que la lecture
  porte *à cet instant* — temporaire tant qu'elle n'est pas poussée. La
  synchronisation lui donne ensuite l'identifiant Supabase, supprime la ligne
  locale et n'a aucune raison de revenir sur `plan_days`. Le défaut est
  antérieur aux objectifs à portée : il touche déjà le décochage, qui supprime
  les lectures par ces mêmes identifiants. Il se voit maintenant d'un endroit
  de plus — un objectif « par plan » cesse de compter ce jour-là.

- **Un `Partial<Record<…>>` désarme le garde-fou qui tient tout le reste.**
  `BY_LOCALE` de `i18n/contexts.ts` n'avait que `fr` et `en` : les douze
  contextes système retombaient en français en espagnol, en italien et en
  arabe, sur trois écrans, et rien ne le signalait. Le typage qui fait échouer
  la compilation sur une clé de dictionnaire oubliée est exactement le même —
  il n'était simplement pas armé ici. Passé en `Record` complet le 19 août
  2026, avec les trois tables manquantes. **Chercher les `Partial` et les
  `as Record<string, string>` avant de croire qu'une traduction est complète.**

- **Un composant défini dans un autre remonte tout son sous-arbre à chaque
  rendu.** `SectionCard` vivait dans le corps de `SettingsPage` : sa fonction
  changeait donc d'identité à chaque rendu, et React — qui compare les types
  **par référence** — démontait puis remontait la totalité de l'écran des
  réglages à chaque frappe au clavier.

  Le symptôme, signalé le 20 août 2026 sur un iPad : **le clavier se fermait
  après chaque chiffre** saisi dans le champ d'objectif, l'élément qui avait le
  focus ayant été détruit. Deux correctifs sur le champ lui-même — un brouillon
  de saisie, puis le passage de `type="number"` à `type="text"` — n'y ont rien
  changé, et pour cause : le champ n'était pas en cause. **Quand deux
  correctifs successifs ne changent rien, c'est qu'on répare la mauvaise
  chose.**

  Ni `tsc`, ni `eslint`, ni les tests, ni le build ne le signalent. Seule une
  saisie continue le révèle — c'est la seule chose qui souffre d'un remontage,
  tout le reste se contentant de se redessiner. Un balayage des `.tsx` du dépôt
  n'a trouvé aucun autre cas ; le refaire après toute extraction de composant.

- **`auth.users.last_sign_in_at` ne dit pas qui est en ligne.** Il ne bouge
  qu'à une **vraie saisie de mot de passe**, jamais au rafraîchissement du
  jeton. Mesuré le 20 août 2026 à 13:26 UTC : le compte administrateur portait
  une « dernière connexion » à 11:29 alors que sa dernière action datait de
  13:21 — **117 minutes d'écart, en pleine utilisation.**

  L'indicateur « En ligne » du tableau d'administration reposait dessus depuis
  l'origine. Il ne s'allumait donc que dans les minutes suivant une connexion,
  et jamais pour quelqu'un qui reste connecté, c'est-à-dire pour presque tout le
  monde. Le défaut est antérieur à la refonte : il a seulement été **remarqué**
  ce jour-là.

  La présence a désormais sa propre colonne, `profiles.last_seen_at`, écrite par
  le navigateur au plus une fois toutes les trois minutes, avec une fenêtre
  d'affichage de cinq. Trois déclencheurs — montage, minuterie, retour au
  premier plan — parce qu'un onglet caché voit ses minuteries ralenties par le
  navigateur. **Ne pas confondre les deux colonnes** : `lastSignIn` reste utile
  pour dire quand quelqu'un s'est connecté la dernière fois, et pour rien
  d'autre.

- **Next.js met en cache les appels que `supabase-js` adresse à PostgREST.**
  Le 20 août 2026, un compte suspendu s'affichait bien sur sa fiche et **jamais
  dans la liste**, filtre « Suspendus » à zéro, y compris après le bouton
  Actualiser et après un changement de page. Tout ce qui pouvait être mesuré
  disait que c'était impossible : la base rendait `suspended = true` de type
  `boolean`, `banned_until` en 2126, les deux routes faisaient le **même**
  `select('*')` avec la **même** clé service_role, et le service worker exclut
  `/api/` de son cache. Dans le navigateur, la pastille et le compteur du filtre
  lisent le même tableau dans le même rendu : ils ne pouvaient pas se
  contredire.

  Il ne restait qu'une variable : **l'âge de la réponse**. `createAdminClient()`
  n'avait pas de `fetch` personnalisé, donc employait le `fetch` global — que
  Next remplace par le sien, à cache de données. L'entrée de cache de la liste
  avait été remplie **avant** la suspension et resservie ensuite ; celle de la
  fiche, **après**. Un déploiement vidait le cache, la pastille réapparaissait
  une fois, puis disparaissait de nouveau — ce qui achevait de désorienter.

  **`export const dynamic = 'force-dynamic'` n'y suffit pas** : il empêche la
  mise en cache de la *route*, pas celle des appels qu'elle passe. Le client
  d'administration force désormais `cache: 'no-store'` sur chaque appel. Une
  route d'administration lit toujours un état qui vient de changer ; le cache
  n'y peut être qu'un piège.

  Leçon de méthode : **quand tout ce qu'on mesure dit « impossible », la
  variable oubliée est le temps.**

- **Le cache de segments de l'App Router sert un écran périmé, sans rien
  dire.** Le 20 août 2026 : un administrateur suspend un compte depuis sa fiche,
  revient à la liste, et la liste le donne toujours pour actif — filtre
  « Suspendus » à zéro. Les deux écrans lisaient pourtant la même colonne, par
  la même clé service_role, et la base disait bien `suspended = true`. Vérifié
  avant de chercher ailleurs : `pg_typeof` rend `boolean`, la valeur est `true`,
  et les deux routes font le même `select('*')`. **Les routes ne pouvaient donc
  pas diverger.**

  La cause est que **revenir sur une route déjà visitée ne remonte pas son
  composant** : un `useEffect(..., [])` ne repart jamais, et l'état local reste
  celui d'avant l'action. Rien ne le signale — l'écran affiche un état
  cohérent, seulement périmé, ce qui est pire qu'une erreur.

  `lib/admin/use-fraicheur.ts` recharge sur deux déclencheurs, qui couvrent des
  cas différents : le **retour sur la route**, pour l'aller-retour vers une
  fiche, et le **retour au premier plan**, pour l'onglet laissé de côté ou
  l'action faite depuis un autre appareil. La fonction de rechargement doit
  être un `useCallback` stable, faute de quoi l'effet relance un rendu qui
  relance l'effet.

- **Une colonne `flex` en `fixed top-0 bottom-0` rogne son pied de page en
  silence.** La barre latérale n'avait aucun `overflow-y-auto` : dès que les
  entrées dépassaient la hauteur de l'écran, le lien vers le profil, la
  **déconnexion** et le numéro de version sortaient du cadre, sans défilement
  pour y revenir. Quatorze entrées réclamaient déjà 820 px ; la quinzième,
  `/messages`, a porté le besoin à 862 px et rendu le défaut visible. Ni `tsc`,
  ni `eslint`, ni les tests, ni le build n'en disent rien — c'est le
  propriétaire du dépôt qui l'a signalé, sur son appareil.

  Le correctif tient en trois classes, et **`min-h-0` en est le cœur** : sans
  elle, un enfant `flex-1` refuse de se comprimer sous la taille de son
  contenu, et `overflow-y-auto` n'a rien à faire défiler. Le pied de page prend
  `shrink-0`. **Toute entrée ajoutée au menu doit rappeler cette mesure.**

- **Dans une seule instruction SQL, une CTE ne voit pas ce qu'une CTE sœur
  vient d'écrire.** Le 20 août 2026, un `with essai as (insert …), efface as
  (delete …) select` a rendu `inseree: 1, effacee: 0, restant: 0` — trois
  chiffres cohérents entre eux et faux ensemble. Les trois lisent le **même
  instantané** : le `delete` ne trouve rien, et le `count` ne voit pas non plus
  la ligne insérée. Elle était bel et bien là, trouvée par une seconde requête.
  C'est « un `200` ne prouve que ce qu'il a traversé », transposé au SQL :
  **pour vérifier une écriture, relire dans une instruction séparée.**
- **Un journal d'audit ne doit pas être détruit par ce qu'il journalise.**
  `admin_actions.target_id` n'a volontairement **aucune** clé étrangère. Une
  contrainte vers `profiles` avec `on delete cascade` effacerait la trace d'une
  suppression de compte au moment même où elle se produit ; `on delete set
  null` la rendrait anonyme. Le nom de la cible est figé dans la ligne pour la
  même raison : après la suppression, il n'est plus lisible ailleurs. Ne pas
  « corriger » cette absence de contrainte par souci de cohérence.
- **On peut planifier une fonction Edge sans jamais lire son secret.**
  `cron.schedule` réclame la commande littérale, secret compris — qu'un agent
  n'a pas à connaître. Le 20 août 2026, le troisième travail `pg_cron` a été
  créé en recopiant la commande du deuxième **à l'intérieur de la base**, avec
  un `replace` du nom de fonction. Le contrôle se fait ensuite par prédicats et
  non par lecture : `command like '%send-messages%'`, `like '%x-cron-secret%'`,
  et une longueur inférieure de deux caractères — l'écart exact entre les deux
  noms. Le `200` du premier passage a confirmé ; un secret mal recopié aurait
  rendu `401`.

- **Extraire un module ne retire pas le calcul qu'il remplace.** `lib/objectifs`
  a été livré le 19 août avec `calculerSeries`, testé, et sa raison d'être
  écrite en tête de fichier : l'ancien calcul comparait une date **UTC** aux
  dates civiles locales des lectures. L'écran Progression, lui, a continué
  d'appeler son `calcStreaks` local — le défaut décrit dans le module vivait
  encore dans la page qui l'avait motivé. Ni `tsc`, ni `eslint`, ni les tests
  ne signalent une fonction exportée que personne n'appelle. Après extraction,
  chercher les appelants de ce qu'on remplace, pas seulement les appelants du
  neuf.
- **Une classe de couleur n'est pas remappée en mode sombre.** Le bloc
  `html.dark` de `globals.css` ne réécrit que les gris. Un fond coloré clair y
  reste clair, et tout texte qui n'a pas de classe de couleur hérite de
  `--text`, presque blanc : c'est la règle 15 sous un autre visage. Poser la
  couleur du texte **explicitement** sur un fond coloré, et la mesurer.

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

## L'écran Administration ne reflétait plus Supabase — mesuré et corrigé

Le 18 août 2026, par l'agent, session connectée, en partage de connexion
iPhone. Trois symptômes étaient rapportés : le compte créé ce jour-là
n'apparaissait pas, les actions semblaient sans effet, les changements de
statut des tickets ne se voyaient pas.

**Un seul défaut les produit tous les trois, et ce n'est aucun des deux qui
avaient été identifiés dans le code.**

### Ce que la mesure a écarté avant de chercher ailleurs

Sur la base réelle, et non par lecture des migrations :

| Soupçon | Mesure | Verdict |
|---|---|---|
| Ligne `profiles` manquante | 111 comptes, 111 profils, aucun orphelin des deux côtés | écarté |
| GRANT colonne sur `profiles` | `service_role` garde l'UPDATE table **et** colonne, `is_admin` et `suspended` compris | écarté |
| Trigger `guard_profile_privileges` | UPDATE à blanc sous `set local role service_role` : passe sur `profiles` **et** sur `tickets`, `auth.uid()` y vaut bien null | écarté |
| Migration 002 rejouée par-dessus 003 | les gardes vivantes appellent `private.is_admin()` | écarté |
| **Le service worker** | `isCacheable()` exclut explicitement `/api/` | écarté |

Le dernier était le meilleur candidat : un service worker qui met en cache les
`GET` d'API expliquait les trois symptômes d'un coup, et un `cache: 'no-store'`
ne l'aurait pas corrigé, puisqu'il n'agit que sur le cache HTTP. Il fallait le
lire pour le savoir.

### Ce que le navigateur a montré

Le `PATCH` d'une suspension rend **200**. La base change dans la seconde. Et
l'écran ne bouge pas — pendant très longtemps.

Le relevé `performance.getEntriesByType('resource')` donne la réponse :

| Appel | Durée mesurée |
|---|---|
| `PATCH /api/admin/users/{id}` | 3,4 à 12,4 s |
| `GET /api/admin/users` | **19,5 à 94 s** |

`GET /api/admin/users` comptait lectures, plans et contextes par une requête
PostgREST **par ligne et par table** : 111 profils fois trois tables, soit 333
allers-retours, plus quatre pour les totaux. L'action réussissait, puis
`loadData()` laissait l'écran sur « Chargement… » une minute et demie.

Sur Vercel, la fonction dépasse son délai maximum et rend un 504 : le tableau
ne se rafraîchit **jamais**. D'où les trois symptômes — l'action paraît sans
effet, le compte du jour n'apparaît pas, le statut du ticket ne se voit pas
changer. Un seul défaut, trois visages.

Après réécriture — lecture de la seule colonne `user_id`, comptage en mémoire,
`range()` par pages de 1000 pour ne pas se faire tronquer par le plafond
PostgREST — : **5,4 s** pour une relecture à chaud, seule. Sept requêtes au
lieu de 337. Le gain sur Vercel, où la fonction est proche de Supabase, n'est
pas mesuré.

Les chiffres rendus sont identiques à ceux d'avant, contrôlés contre la base :
111 comptes, 161 lectures, 10 plans, 2676 jours, 939 contextes, 19 actifs sur
7 jours, 1 admin — et au détail, Teste à 11 contextes, Nicolas à 3 lectures.

### Les deux défauts qui avaient été identifiés dans le code

Ils étaient réels, et ils ont été corrigés — mais **aucun des deux n'était la
cause**. C'est leur conjonction qui rendait le diagnostic impossible : les
trois actions ne lisaient jamais leur réponse, si bien qu'un 403 ou un 504
rendait le même écran qu'un succès. Corrigés d'abord, ils n'ont rien réparé ;
ils ont rendu la mesure lisible.

Un troisième défaut a été trouvé en passant : `listUsers()` était appelé sans
argument, donc sur la pagination par défaut de GoTrue — une page. Au-delà, les
comptes n'avaient ni adresse ni date de connexion.

### Les actions, enfin exercées

Le 18 août 2026, par l'agent, sur le compte de test *Teste*
(`francisallebee@icloud.com`). Chacune vue à l'écran **et** confirmée par une
requête en base, les deux comptant séparément :

| Action | Réseau | Base | Écran |
|---|---|---|---|
| Suspendre | `PATCH` 200 | `suspended: true`, `banned_until` en 2126 | badge « Suspendu », ligne grisée, compteur à 1 |
| Réactiver | `PATCH` 200 | `suspended: false`, `banned_until: null` | retour à « Hors ligne », compteur à 0 |
| Promouvoir | `PATCH` 200 | `is_admin: true` | badge vert « Admin », carte à « 2 admin » |
| Rétrograder | `PATCH` 200 | `is_admin: false` | retour à « User », carte à « 1 admin » |
| Statut d'un ticket | `PATCH` 200 | 8 ouverts, 2 en cours, 2 résolus, 4 clos | badge « en cours », filtres recomptés |

| Supprimer | `DELETE` 200 | compte auth, profil et ses 11 contextes partis ; 110/110, aucun orphelin | 110 lignes, *Teste* absent, cartes à 110 et 928 |

La boîte de confirmation portait bien « Supprimer Teste et toutes ses
données ? ». Sa réponse a été fournie par une substitution de `window.confirm`,
le propriétaire du dépôt ayant donné son accord dans la conversation : c'est le
`DELETE` qui est éprouvé, pas le clic sur le bouton natif.

Le compte de test est donc **consommé**. En recréer un avant la prochaine
vérification — ce qui éprouvera au passage la confirmation d'adresse et
l'alerte d'inscription. La ligne de `new_user_alerts` qui portait l'ancien
compte reste en base, sans effet : un nouveau compte aura un autre
identifiant.

### Deux pièges de la séance, à ne pas repayer

**Une capture d'écran prise trop tôt ment.** La rétrogradation a été déclarée
sans effet sur la foi d'un écran figé sur l'état précédent — le corps de la
réponse portait pourtant `is_admin: false`, et le DOM relu quelques secondes
plus tard disait « User ». Lire le DOM, pas l'image, quand la relecture dure
des dizaines de secondes.

**Le panneau Navigateur n'envoie pas les coordonnées de la page.** Un facteur
d'échelle d'environ 2,95 s'applique entre ce qui est envoyé et ce qui arrive :
des clics visant un bouton tombaient hors de l'écran, sur `<html>`, sans la
moindre erreur. Un clic par `ref` ne corrige rien — il passe par le même
chemin. Calibrer sur deux points avec un écouteur `click` en capture, qui rend
`clientX/clientY` et la cible réelle, avant de conclure qu'un bouton ne réagit
pas.

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

**Vus fonctionner par le propriétaire du dépôt et non par l'agent** : les
**notifications push** sur iPhone et le **parcours découverte**, le 14 août
2026 ; la **synchronisation de la langue entre deux appareils**, le 18 août ;
l'**aperçu du texte en fenêtre**, le **contexte de lecture depuis Recherche
biblique**, la **recherche d'un passage sans quitter Nouvelle lecture** avec son
garde-fou de sortie, et les **trois axes de classement de Mes lectures**, le
19 août — la session du navigateur d'essai avait été perdue au redémarrage du
serveur, et l'agent ne peut pas s'y reconnecter seul.

Le dernier compte double, et c'était la réserve la plus sérieuse : le rendu de
`/history` a été remanié en profondeur — bloc des entrées extrait, rendu
récursif, trois niveaux d'imbrication. `typecheck`, `lint`, les 225 tests et le
build de production disent qu'il se construit ; ils ne disaient rien de son
aspect. Seul l'écran pouvait le dire, et il l'a dit.
C'est la même distinction que pour les plans libres — une preuve d'écran vaut
par qui l'a vue, et l'agent n'avait alors jamais eu de session pour la produire
lui-même.

L'abonnement suppose que l'application soit installée sur l'écran d'accueil et
lancée depuis son icône : iOS ne délivre rien à un onglet Safari.

**L'objectif en minutes n'a pas été vu à l'écran** non plus. Ce qui est vérifié :
l'estimation a été passée sur les **166 lectures réelles** de la base, et ses
ordres de grandeur tiennent — Genèse entière à 231 minutes contre les 3 h 50
qu'annoncent les bibles audio. Ce qui ne l'est pas : la liste déroulante à trois
unités, et la phrase qui prévient que rien n'est chronométré.

**La chaîne complète est prouvée, et par un humain** — 20 août 2026, sur le
compte de test *Alain Fictif* créé par le propriétaire du dépôt à 10:14:23 UTC.

C'est la preuve qui manquait à toutes les autres : il a **reçu** le courriel
d'anniversaire, et **vu le message dans l'application**. Les compteurs disaient
l'acceptation SMTP ; lui dit la remise.

| Maillon | Preuve |
|---|---|
| Les sept champs du formulaire | `first_name` Alain, `last_name` Fictif, `city` Perpignan, `phone`, `birth_date`, `discovery_source` = `connaissance` |
| Le `name` composé par le trigger | **« Alain Fictif »**, de prénom + nom |
| Courriel de bienvenue | `welcomed_at` 10:15:04, `welcome_attempts` 1 |
| Vœu d'anniversaire créé | passage de 11:05 du planificateur horaire |
| Courriel du vœu | expédié 11:15:03 par `send-messages` |
| **Reçu dans la boîte** | **oui, par le propriétaire** |
| **Visible dans l'application** | **oui, par le propriétaire** |

Le compte de test perdu le 18 août est donc remplacé, et il porte une date de
naissance au 20 août : il resservira.

**Il n'a pas resservi : il a été supprimé le 21 août à 15:21:51 UTC**, relevé
le 28 août au journal d'audit. Le compte de test est donc consommé pour la
deuxième fois, et ses deux messages d'essai sont partis avec lui. En recréer un
reste un geste du propriétaire — il demande une adresse et un mot de passe.

**Il n'est plus suspendu**, contrairement à ce que ce document a longtemps dit.
Relevé le 21 août 2026 en base — `suspended: false`, `banned_until: null` — et
l'onglet Journal en donne la raison : trois cycles suspendre/réactiver le
20 août, dont la **dernière action est une réactivation à 15:21**.

**Le premier courriel était parti plus tôt le même jour** — deux fois plutôt
qu'une :

- **Bienvenue.** Un compte réel créé à 08:43:10 UTC ; à 08:45:00 la fonction
  rend `{"nouveaux":1,"envoye":true,"bienvenues":1,"bienvenuesEchouees":0}`,
  et la base porte `welcomed_at` à 08:45:04 avec `welcome_attempts` à 1 — le
  compteur incrémenté avant l'envoi, la date posée après. Les 112 comptes
  antérieurs n'ont rien reçu. Réserve : ce compte s'est inscrit par l'**ancien**
  formulaire (`first_name` nul), le chemin prénom + nom reste donc à éprouver.
- **Anniversaire.** Le vœu a été déposé comme message à 09:5x, et
  `send-messages` l'a expédié à 10:00:05, `email_attempts` à 1. Le second appel
  de `souhaiter_anniversaires()` rend **0** : l'idempotence tient.

**Ce que ces deux preuves ne disent pas.** `envoye`, `bienvenues` et
`emailed_at` ne marquent que l'**acceptation par le serveur SMTP** — c'est
exactement la leçon d'`envoyes` sur les notifications push, et elle vaut ici
mot pour mot. Entre cette acceptation et une boîte de réception, il reste la
remise et les filtres. Seuls les destinataires peuvent confirmer.

**La notification push d'anniversaire reste, elle, invérifiée**, et pour une
raison qui n'est pas un défaut : ni la personne dont c'était l'anniversaire, ni
le compte de test n'avaient d'appareil abonné — zéro `push_subscriptions` pour
les deux. Ils n'entrent donc pas dans les candidats, ce qui est voulu.

**Pour l'éprouver sans attendre**, la marche est écrite : activer les
notifications sur le compte de test, l'installer sur l'écran d'accueil et
laisser un appareil s'abonner, puis effacer sa ligne de `birthday_wishes` et sa
ligne `birthday:2026` de `notification_log`. Le passage suivant recréera le vœu
**et** émettra la notification. Sans les deux effacements, l'idempotence fait
correctement son travail et il ne se passe rien. Elle n'entre donc pas dans les candidats, ce qui est le comportement
voulu. Sur 113 comptes, **6 ont les notifications actives**, 6 appareils sont
abonnés, et **3 d'entre eux seulement ont une date de naissance** — les 4
novembre, 10 juillet et 16 mai. La première occasion de voir ce déclencheur
partir pour de vrai est donc le **16 mai**, à moins qu'un compte abonné ne
renseigne sa date d'ici là.

**Ce que le propriétaire du dépôt a vu fonctionner le 20 août 2026**, et qui ne
vient donc pas de l'agent :

| Écran ou chemin | Constat |
|---|---|
| Bandeau de complétion de profil | apparu sur son appareil |
| Formulaire d'inscription, sept champs | compte de test créé, tout écrit en base |
| Courriel de bienvenue | **reçu** |
| Vœu d'anniversaire | **reçu**, et le message **vu dans l'application** |
| Pastille de statut, suspendu et en ligne | vues, après trois correctifs |
| Champ de cible d'objectif | saisie libre, clavier stable — ticket n°19 clos |

C'est la première journée où la majorité des preuves d'écran viennent de lui
plutôt que de nulle part. Ce qui suit reste néanmoins invérifié.

**Toute la refonte Administration du 20 août 2026 est invérifiée à l'œil, sauf
`/auth/signup`.** Gestion des utilisateurs, fiche individuelle, boîte de
réception, bandeau de complétion, onglets Acquisition et Journal : tous
demandent une session, et l'agent n'en a pas. `/auth/signup` étant publique, il
a pu la voir — **et la voir en arabe**, deuxième écran de ce dépôt à l'avoir
été. C'est l'arabe qui y a trouvé un défaut qu'aucun relevé n'aurait vu.

**Aucun courriel n'est parti**, ni bienvenue ni message : les tables sont vides,
et écrire à un compte réel pour éprouver la chaîne n'est pas une décision
d'agent. Les deux fonctions Edge sont déployées et rendent `200` avec zéro
candidat ; c'est tout ce qui est prouvé. Le premier message envoyé depuis
l'administration sera la première preuve de bout en bout.

**Les objectifs à portée n'ont pas été vus à l'écran** non plus, et pour la même
raison : `/settings` comme `/progress` demandent une session. Ce qui est
vérifié : le filtre est couvert par huit tests, dont celui qui exige qu'un plan
non résolu compte **zéro** plutôt que tout ; `tsc` garantit les cinq
dictionnaires ; l'aller-retour UTF-8 est propre. Ce qui ne l'est pas : les deux
listes déroulantes ajoutées aux Réglages, le récapitulatif, et la mention
« Dans … » sur Progression.

**Les paliers de série n'ont pas été vus à l'écran**, le 19 août 2026. Le calcul
est couvert par les tests du module, les classes Tailwind sont bien produites —
relevé dans la feuille servie par le serveur de développement, `text-orange-700`
comprise —, et les contrastes sont calculés sur les valeurs réelles. Mais
`/progress` demande une session, et l'agent n'en a pas : le navigateur le renvoie
sur `/auth/login`. Ce qui n'est donc pas vérifié : la mise en page de la carte
une fois les pastilles ajoutées, son aspect en mode sombre, et son rendu en
arabe. C'est une preuve d'écran qui reste à faire, par le propriétaire du dépôt.

## La séance du 21 août 2026

Trois travaux, tous menés sans session — **et aucun des trois écrans touchés n'a
été vu**. C'est la réserve à porter au crédit de ce qui suit.

### Les deux tickets ouverts le matin même

Signalés par le propriétaire du dépôt, et tous deux confirmés par la lecture
avant d'être corrigés.

**Ticket n°23 — la mémorisation ne masquait rien.** Et c'était conforme au
module : `MASQUAGE[0]` vaut `0`, parce qu'« au premier passage rien n'est caché,
on lit le verset ». Le défaut n'est donc pas dans le masquage mais dans ce que
l'écran en dit : `consigne` ne recevait que le nombre de mots **révélés**, jamais
le nombre de mots **masqués**, et servait donc « Touche un mot caché pour le
révéler » devant un verset entier. Un verset qu'on vient d'ajouter étant toujours
au niveau 0, il était **impossible de voir un mot masqué à la première séance** —
la page ne montrait son intérêt que le lendemain. La consigne connaît désormais
les deux nombres et annonce le premier passage pour ce qu'il est.

**Ce que cela ne règle pas, et qui est une décision de produit** : il faut
toujours attendre le lendemain pour le premier exercice réel. Ouvrir un
entraînement libre, qui masquerait sans toucher à la révision espacée, est
possible — mais c'est un choix à faire, pas un défaut à corriger.

**Ticket n°24 — le quizz demandait le chapitre sans nommer le livre.** Les
leurres de `questionChapitre` sont bien pris dans le même livre, ce qui donne son
sens à la question ; mais la consigne était le libellé fixe « De quel chapitre ? »
et les choix des nombres nus. Choisir entre 3, 7 et 12 sans savoir de quel livre
il s'agit est arbitraire. La consigne est désormais paramétrée : « Jean : de quel
chapitre vient ce verset ? »

`quiz.consignes` étant un `as Record<string, string>`, y glisser une fonction
était impossible — et l'assertion aurait de toute façon désarmé le contrôle du
type, comme le `Partial<Record<…>>` du 19 août. La clé vit donc **à côté**, où le
typage la rend obligatoire dans les cinq langues.

### Les deux dettes calculées du 19 août

**Le contraste des badges est corrigé, et la mesure a trouvé plus que prévu.**
Le nom héritait bien de `--text` sur `bg-yellow-50` — 1,06, comme calculé. Mais
la **description** portait `text-gray-400`, ce qui donne **2,45 en mode clair**
et 2,48 en sombre : ce badge n'a jamais été lisible, dans aucun des deux thèmes,
et le document ne signalait que la moitié du défaut. Les deux couleurs sont
maintenant posées explicitement — `text-yellow-900` (8,38) et `text-yellow-800`
(6,62) —, sur le modèle des pastilles de palier voisines.

Les contrastes sont calculés sur le **CSS réellement produit** par un build, et
non sur la table Tailwind : `rgb(113 63 18)` et `rgb(133 77 14)` s'y trouvent
bien, ce qui vaut aussi contrôle de la règle 14.

**`use-fraicheur.ts` a enfin un test, sans dépendance nouvelle.** L'obstacle
était réel : l'environnement vitest est `node`, et couvrir un crochet React y
demanderait `jsdom` (règle 6). La parade est celle de `lib/auto-logout.ts` —
**sortir la règle du composant**. `lib/admin/retour-ecran.ts` porte désormais
l'abonnement, cibles injectées, et le crochet n'est plus que le branchement de
deux effets. Douze tests, dont ceux qui éprouvent le retrait des écouteurs : un
abonnement laissé derrière soi rappellerait les données d'un écran quitté,
indéfiniment.

**Deux tests ont échoué au premier essai, et c'étaient eux qui avaient tort.**
`Object.assign` **invoque** le getter de sa source et en copie la valeur : le
faux document restait figé sur `visible`, si bien qu'il ne pouvait plus jamais
devenir caché — les deux tests seraient passés au vert sans rien éprouver.
`Object.defineProperty` corrige. C'est la sixième fois que la question « lequel
des deux a tort ? » se pose, et la première où c'est le test.

Un troisième défaut n'est apparu qu'à `tsc` : itérer un `Set` directement demande
`--downlevelIteration`. Vitest ne l'avait pas vu — esbuild ne fait pas ce
contrôle. **`tsc` voit ce que les tests ne voient pas**, dans ce sens-là aussi.

### Le tableau des migrations était en retard de douze lignes

`supabase/README.md` s'arrêtait à `tickets_closed_lock`, du 18 août. Les douze
migrations du 19 et du 20 y sont ajoutées, chacune décrite d'après **son
fichier** et non d'après son nom. Le relevé par `list_migrations` accompagne :
25 fichiers au dépôt, 23 enregistrées en base, l'écart étant exactement les deux
du 9 août passées en SQL direct.

### Ce qui reste à voir à l'œil

Les trois écrans touchés — `/memorisation`, `/quiz`, `/progress` — demandent tous
une session. `typecheck`, `lint`, les **565 tests** et un build de production
disent qu'ils se construisent ; ils ne disent rien de ce qu'ils affichent. En
particulier : la consigne du premier passage, la question de chapitre nommant son
livre, et les badges débloqués en mode sombre.

### La revue d'écrans du 21 août 2026, en production

**La première session connectée de l'agent sur la production.** Réseau débloqué
par le partage de connexion iPhone (`en9`, `172.20.10.6`), identifiants saisis
par le propriétaire du dépôt — un agent ne saisit pas de mot de passe.

**Vu à l'œil, et par l'agent :**

| Écran ou chemin | Constat |
|---|---|
| `/quiz` | **« GENÈSE : de quel chapitre vient ce verset ? »** — le ticket 24 corrigé, en production |
| `/memorisation` | le nouveau texte est dans les chunks déployés ; l'écran confirme le diagnostic (deux versets au **niveau 1**, dus le lendemain) |
| `/progress`, mode sombre | badges à **8,38** et **6,62** de contraste, mesurés sur la page |
| `/auth/signup` | `method="post"` bien présent dans le HTML servi — la règle 12 vérifiée en production, une première |
| `/admin` | les quatre onglets, les cinq cartes |
| `/admin/utilisateurs` | 114 comptes, huit filtres, export CSV, envoi groupé |
| Onglet **Journal** | sept entrées, qui racontent les trois cycles du 20 août |
| Onglet **Acquisition** | 4 + 1 + 109 = 114, cohérent |
| **`use-fraicheur`** | **fonctionne** — prouvé par accident, voir plus bas |

Sept cartes sur huit concordent exactement avec la base. La huitième est le
défaut ci-dessous.

### Le défaut que seul l'écran pouvait montrer : deux compteurs d'actifs

La carte annonçait **20** actifs quand le filtre « Actifs (7 j) » en comptait
**24**, dans le même rendu. Aucun des deux calculs n'était faux : ils ne
répondaient pas à la même question. `filtrerParSegment` emploie `vuLe()` — la
présence d'abord, la connexion en repli —, tandis que la route refaisait le
calcul sur `lastSignIn` **seul**.

C'est **le piège de l'extraction, pour la troisième fois** : la bonne règle
avait été écrite dans un module, et l'ancien calcul a survécu chez son
appelant. Ni `tsc`, ni `eslint`, ni les tests ne pouvaient le voir.

Le correctif ne recopie pas la règle : `compterActifs()` **délègue** à
`filtrerParSegment`, ce qui rend l'écart impossible plutôt qu'improbable.
Réserve honnête sur son test : comparer les deux est tautologique tant que la
délégation tient — il verrouille l'architecture, pas le calcul.

### Le journal d'audit ne disait pas à qui l'on avait écrit

« Francis ALLEBEE **a écrit à** » — et rien. En base, `target_name` valait la
chaîne vide sur une action `message` dont le `target_id` était pourtant bien
renseigné : la route écrivait `targetName: ''` **en dur**, même pour un envoi à
une seule personne. Le repli d'affichage ne jouait pas, exigeant
`destinataires > 1`.

C'est exactement ce que la migration `admin_actions` voulait éviter en figeant
le nom dans la ligne — « après la suppression, il n'est plus lisible ailleurs ».
Corrigé aux deux bouts : le nom du destinataire unique est désormais lu et figé,
et le repli d'affichage descend à `>= 1` pour que les lignes déjà écrites
cessent d'être blanches.

### La fausse alerte, et ce qu'elle enseigne

**Annoncé : une boucle rappelant `/api/admin/users` toutes les deux secondes.**
Dix-huit appels depuis le chargement, à intervalles réguliers, chacun coûtant
1,3 à 2,4 s. Le coupable désigné était le crochet de fraîcheur, dont la
documentation prévient qu'un `recharger` instable ferait exactement cela.

**C'était faux, et `charger` est bien un `useCallback` sans dépendance.** Le
test qui tranche : instrumenter, puis attendre **six secondes sans aucune
interaction**. Résultat : zéro appel, zéro `focus`, zéro `visibilitychange`.

Les appels venaient de l'agent lui-même — chaque `javascript_tool`, chaque
capture, chaque clic refocalise la fenêtre, et le crochet fait alors ce pour
quoi il est écrit. L'« intervalle de deux secondes » n'était que la cadence des
appels d'outil.

**L'observateur produisait ce qu'il mesurait.** À ranger à côté de « quand tout
ce qu'on mesure dit impossible, la variable oubliée est le temps » : ici, la
variable oubliée était *l'instrument*. Et le résultat vaut mieux qu'une absence
de défaut — c'est la preuve que `use-fraicheur` fonctionne en production, ce
qui n'avait jamais été constaté.

### Deux pièges d'outillage, corrigés dans ce document

**Le « facteur 2,95 » n'est pas une constante, ni une propriété du panneau.**
Le 18 août, des clics tombaient à côté et un facteur d'échelle d'environ 2,95
avait été relevé. Le 21 août, les clics par `ref` étaient **exacts au pixel**
sur `/quiz`… puis faux après un `resize_window` à dimensions forcées. Deux
points de calibration donnent alors une relation **affine**, non
multiplicative :

    reçu_x ≈ 0,62 × envoyé_x + 851
    reçu_y ≈ 0,61 × envoyé_y + 153

Le décalage est tel que certaines cibles demanderaient une coordonnée négative,
donc sont hors d'atteinte. **Le remède n'est pas de calibrer, c'est de revenir
au préréglage natif** (`resize_window` avec `preset`), après quoi le clic
retombe au pixel près — vérifié.

**Chercher une chaîne accentuée dans un bundle minifié ne trouve rien.** Les
accents y sont échappés en `\xe9` — ni UTF-8 littéral, ni `\u00e9`. Une
recherche de « caché pour le révéler » rend donc *absent* ce qui est présent.
C'est le piège du `grep` sous un troisième visage : chercher sur la portion sans
accent, ou ne pas conclure d'une absence.

### Ce qui reste à voir

La **consigne du premier passage** de `/memorisation` n'a pas été vue : la faire
apparaître demande un verset de niveau 0 dû le jour même, donc d'ajouter une
ligne aux données du propriétaire — ce n'est pas une décision d'agent. Les deux
versets suivis étaient au niveau 1, à revoir le lendemain.

Les **tickets 23 et 24 n'ont pas reçu de réponse** : écrire dans `replies`
déclenche une notification `support-reply`, ce qui n'est pas un geste à faire en
passant.

## La séance du 21 août, seconde partie : sept demandes

Toutes menées avec une session connectée, la première du dépôt pour l'agent.

### Ce qui a été livré

| Demande | Livré | Vu à l'écran |
|---|---|---|
| Ponctuation des leurres du quizz | `motNu`, ancrée sur les bords | non — le module est couvert par 4 tests |
| Entraînement libre | second bouton, n'écrit rien | **oui**, et l'absence d'écriture prouvée en base |
| Bouton pourcentage (item 32) | `lib/progression/rapport.ts` | **oui** |
| Envoi de courriel immédiat | `declencher_envoi_messages()` | **oui**, 2,3 s mesurées |
| Courriel seul | `kind = 'courriel'`, masqué par la RLS | **oui**, 0 vu par le destinataire |
| Consigne du premier passage (ticket 23) | livré le matin | **oui** — « Premier passage : lis ce verset en entier » |

Les tickets 23 et 24 avaient été clos par le propriétaire lui-même à 10:59 ;
l'item 32 reste à *projet* — le passer à terminé notifie tous les abonnés, et
c'est son geste. **Il l'a fait le 23 août à 09:28:22**, relevé le 28.

### Ce que l'entraînement libre a coûté comme décision

Il n'écrit **rien** : ni niveau, ni échéance, ni séance dans `game_sessions`.
La révision espacée ne vaut que par ses intervalles, et s'exercer trois fois
dans la journée ne doit ni rapprocher ni éloigner le prochain rappel. Vérifié
en base après une séance réelle : `updatedAt` identique à la milliseconde, et
le nombre de séances inchangé.

Il force **au moins un cran de masquage**, `MASQUAGE[0]` valant zéro — juste
pour un premier passage, vide de sens pour un entraînement demandé exprès.

### Le pourcentage, et le test qui a eu raison

Trois cas limites vivent dans `lib/progression/rapport.ts` plutôt que dans
l'écran : un dénominateur nul rend `null` et non zéro ; une part non nulle ne
s'affiche jamais « 0 % » ; **une part incomplète ne s'affiche jamais
« 100 % »**.

Ce dernier a été écrit faux, et le test l'a montré : le code contrôlait la
valeur brute — 1 188 sur 1 189 valent 99,92 %, donc `>= 100` est faux — quand
c'est **le formatage** qui crée le mensonge. Septième fois que la question
« lequel des deux a tort ? » se pose, et le test avait raison.

**Une bascule incomplète est pire qu'une absence de bascule** : l'interrupteur
laissait trois affichages en nombres, si bien que l'écran mêlait « 9,3 % » et
« 111 / 250 » dans le même regard. Trouvé à l'écran, juste après le
déploiement, et corrigé dans la foulée.

### Deux erreurs de l'agent, à consigner

**Un identifiant pris pour un autre.** Le test de la policy du courriel seul a
été mené sur `d9113b95…`, décrit dans le commit comme le compte de test — c'est
en réalité celui d'un **utilisateur réel**. Deux lignes d'essai ont donc été
posées dans son fil. Elles ont été neutralisées par `emailed_at` avant tout
passage du cron, puis supprimées, et la relecture en instruction séparée
confirme qu'il n'en reste rien : aucun courriel n'est parti. La leçon tient en
une phrase — **vérifier l'identifiant du cobaye avant d'écrire, pas après**,
ce que le README disait déjà pour `is_admin`.

**Insérer dans `messages` est un acte d'envoi.** Ces deux lignes auraient été
ramassées par le planificateur au passage suivant. Une table qu'une fonction
Edge balaie n'accepte pas de ligne « pour voir ».

### Le pilotage par script, et ce qu'il ne prouve pas

L'envoi réel a été fait en posant les valeurs par le setter natif puis en
appelant `click()`, et non par des clics du panneau : la fiche repasse en
« Chargement… » à chaque interaction — `use-fraicheur` recharge au retour au
premier plan, et chaque appel d'outil produit ce focus. Ce qui est donc éprouvé
est **la chaîne d'envoi** — route, RPC, fonction Edge, SMTP —, pas le clic sur
le bouton. À distinguer.

### Ce que seul le destinataire peut confirmer

Deux courriels ont été acceptés par le SMTP à 12:32:25 et 12:33:43 UTC, sur
`francisallebee@gmail.com`. `emailed_at` ne marque que cette acceptation — la
leçon d'`envoyes` vaut mot pour mot. **La remise reste à confirmer par le
propriétaire du dépôt**, ainsi que le fait qu'un seul des deux messages
apparaisse dans l'application.

**Relevé le 28 août : ce second point ne pourra plus être vérifié à l'écran.**
Le compte porteur a été supprimé le 21 août à 15:21:51 UTC, et ses messages
avec lui. La policy reste éprouvée en base ; elle ne le sera pas à l'œil.

## La séance du 28 août 2026 : quatre demandes

**La première séance de ce dépôt où l'agent a travaillé avec une session
connectée d'un bout à l'autre**, sur la production. Le navigateur portait déjà
le cookie du propriétaire : les quatre écrans touchés ont donc été vus, ce qui
n'était arrivé pour aucune des trois séances précédentes.

Conséquence à connaître : **le serveur de développement écrit dans la base de
production** (`.env.local` porte l'URL du projet réel). Une lecture d'essai y
serait une vraie lecture. Aucune n'a été enregistrée.

### Ce qui avait bougé sans l'agent, et que le briefing ignorait

Trois faits relevés en base avant de commencer, tous postérieurs au 21 août :

| Fait | Relevé |
|---|---|
| **L'item 32 est terminé** | passé à `done` le 23 août à 09:28:22 — le geste du propriétaire est fait |
| **Le compte de test est supprimé** | `delete_account` sur *Alain Fictif* le 21 août à **15:21:51 UTC**, 2 h 48 après les deux courriels |
| La feuille de route | 30 items, 28 terminés, **2 en projet** (5 « appareil photo » et 26 « catalan »), après une passe du 23 août |

**Le journal d'audit a tenu son rôle exact.** Les trois lignes d'*Alain Fictif*
— deux `message` à 12:32:23 et 12:33:41, puis `delete_account` à 15:21:51 —
portent toutes `target_name = « Alain Fictif »`, **y compris celle de la
suppression**. C'est précisément ce que `20260820130000_admin_actions.sql`
cherchait en refusant toute clé étrangère sur `target_id` : une contrainte
`on delete cascade` aurait effacé la trace au moment où elle devenait la seule
mémoire du compte. Le correctif du 21 août sur `targetName: ''` tient aussi —
les deux lignes `message` portent le nom du destinataire.

**Conséquence sur la question restée ouverte** : la remise des deux courriels
du 21 août reste à confirmer par le destinataire, et le restera. Mais la
seconde moitié de la question — « un seul des deux apparaît-il dans
l'application ? » — **n'est plus vérifiable à l'écran** : le compte porteur et
ses messages n'existent plus. La preuve de la policy reste acquise en base, pas
à l'œil. Le compte de test est **consommé pour la deuxième fois**, après
*Teste* le 18 août.

### Le compteur d'actifs : la question du 21 août est tranchée par la mesure

La réserve portée au 21 août était que le repli de `vuLe()` — `lastSeen` puis
`lastSignIn` — deviendrait discutable quand `last_seen_at` aurait de
l'historique. Huit jours plus tard :

| Définition d'« actif sur 7 jours » | Comptes |
|---|---|
| Règle actuelle (`vuLe`) | **15** |
| Présence seule | **15** |
| **Par le repli** | **0** |
| Présence plus ancienne que la connexion | 0 |

**Le repli s'est effacé de lui-même**, exactement comme le commentaire du
module l'annonçait. Aucun compte ne lui doit son statut d'actif.

**Mais le retirer serait une faute**, et c'est le second relevé qui le dit :
**98 comptes sur 114** sont dans l'intervalle mort de 7 à 30 jours, et aucun
n'a de présence. Sans le repli, `vuLe()` rendrait `null` pour eux : ils
sortiraient de « actifs » — déjà le cas — **et** de « inactifs », qui
tomberait de 1 à 0. Ils n'appartiendraient plus à aucun segment temporel.

Le même `??` est donc **inerte là où il pouvait fausser, et porteur là où il
situe**. La question n'est pas « le garder ou non » mais « quand la présence
aura remplacé la connexion pour la majorité », ce que la requête ci-dessus
mesure en une ligne. À refaire avant d'y toucher.

### Le regroupement de l'historique, et le seuil qui ne pouvait pas être une seconde

Demande du propriétaire : dans « Mes lectures », les lectures enregistrées à
une même date et d'un même geste doivent se lire comme une seule entrée. Sa
précision, à la question posée : **l'instant de validation** fait la clé.

**Le seuil est mesuré, pas choisi.** Sur les 314 lectures réelles, les écarts
entre créations consécutives d'un même jour forment deux populations que sépare
un creux franc :

| Écart | Occurrences |
|---|---|
| moins de 1 s | **119** |
| 1 à 5 s | 6 |
| 5 à 30 s | 6 |
| 30 s à 5 min | 22 |
| plus de 5 min | 41 |

**Ce ne pouvait donc pas être « la même seconde ».** La séance de 39 passages
du 20 août s'étale sur **2,816 secondes** : un découpage du temps en tranches
l'aurait coupée en trois, et une tranche de 5 secondes l'aurait coupée aussi.
C'est le **chaînage de proche en proche** qui décide, ce qui rend le seuil
indifférent à la durée totale — la plus longue saisie réelle dure **8,88 s** et
reste entière. Un test le fixe : trois lectures espacées de 4 secondes couvrent
8 secondes et forment un seul groupe.

Résultat sur les données réelles : **314 lectures deviennent 189 entrées**.

Deux gardes que les données ont imposées, et qui sont dans `lib/lectures/saisies.ts` :

- **La même date de lecture est exigée en plus de l'écart.** Rien n'interdit
  d'enregistrer coup sur coup deux lectures datées de deux jours différents, et
  les réunir ferait mentir la ligne qui les porte.
- **Une lecture non datable forme son propre groupe.** Ne pas savoir quand une
  ligne a été écrite n'est pas une raison de la coller à sa voisine.

**Rien n'est fusionné en base.** La progression, les statistiques et les plans
continuent de voir les lectures une par une : c'est un fait d'affichage, et le
seul. La cause de ces 191 lignes était l'empilement de passages, retiré le même
jour — `handleSave` écrivait une lecture par passage, à dessein.

### « Sept traductions » survivait où le composant ne le montrait pas

**C'est le HTML servi qui les a trouvées, et non la lecture du fichier.**
`LandingPage.tsx` corrigé, un `fetch('/', { credentials: 'omit' })` — pour
obtenir la page sans session — comptait encore **six occurrences** de « Sept
traductions ». Elles vivaient dans trois endroits qu'un `grep` sur le composant
ne pouvait pas voir :

| Endroit | Portée |
|---|---|
| `src/app/page.tsx`, la `metadata` | la **description servie aux moteurs** et aux aperçus de partage |
| `donate.freeText`, cinq langues | le texte de la page Soutenir |
| `tour.steps.recherche.points[0]`, cinq langues | un point du parcours découverte |

Il y a **douze traductions en cinq langues depuis le 16 août**. C'est
l'inverse de la leçon du 15 août sur Progression : là, l'écran avait trouvé ce
que le relevé manquait ; ici, le relevé a trouvé ce que la lecture ciblée
laissait passer. **Les deux se prennent en défaut, et pas au même endroit.**

### Le parcours ignorait quatre écrans sur quatorze

Quizz, Verset du jour, Mémorisation et Messages sont nés entre le 19 et le
21 août ; le parcours s'arrêtait aux douze autres entrées de la barre latérale.
Il compte désormais **21 étapes** au lieu de 17.

Une étape décrivait par ailleurs **une fonction retirée le jour même** :
« Plusieurs passages peuvent tenir dans une même lecture ».

**Le test avait raison de m'arrêter, et sa liste avait tort.** Les quatre
nouvelles étapes ont fait échouer *« ne vise que des écrans qui affichent
quelque chose »* : `ECRANS_REELS` est tenue à la main et n'avait pas suivi.
Vérifié avant de l'étendre — les quatre pages font 243, 190, 312 et 121 lignes
et **aucune ne redirige**, là où `/contexts`, le vestige que ce test protège,
le fait deux fois. Le commentaire du test porte désormais cette leçon : **un
écran ajouté à la barre latérale doit rejoindre le parcours et cette liste**,
faute de quoi il reste invisible neuf jours durant sans que rien ne le signale.

### Ce qui a été vu à l'écran, par l'agent, sur la production

| Écran ou chemin | Constat |
|---|---|
| `/new-reading` | le bouton « Ajouter un autre passage » **a disparu** |
| Le bouton d'enregistrement | **flottant, il suit le défilement**, et passe **sous** les fenêtres (`z-20` contre `z-50`) |
| La boîte de sortie | **trois issues** — « Enregistrer, puis continuer », « Quitter sans enregistrer », « Rester sur la page » |
| `/history`, 25 août | **11 lectures en une entrée** : « Ecclésiaste 3:11, Jean 3:16-17, Matthieu 28:19-20 et 8 autres — 11 passages » |
| Le dépliage | chaque lecture reste un lien vers son détail : **rien n'est masqué, seulement rassemblé** |
| La case d'en-tête d'un groupe | **« 11 sélectionnées »** d'un seul clic |
| Le parcours | **« ÉTAPE 9 SUR 21 — Le quizz »** et **« ÉTAPE 16 SUR 21 — Les messages »**, chacune par-dessus son écran réel |

### Trois relevés pris trop tôt, dans la même séance

La leçon du 18 août — « une capture d'écran prise trop tôt ment » — s'est
présentée **trois fois** en quelques heures, et sous deux formes :

- une capture montrait « 0 sélectionnée » quand le DOM disait déjà
  « 11 sélectionnées » ;
- une capture montrait la boîte de sortie encore ouverte alors que la
  navigation avait eu lieu ;
- et un relevé JavaScript a lu `location.pathname` **avant** que la navigation
  de Next aboutisse, faisant croire que l'étape « Mémorisation » n'ouvrait pas
  `/memorisation`. Elle l'ouvrait.

Le troisième est le plus instructif : ce n'était plus l'image mais **la mesure
elle-même** qui était prise trop tôt. Relire après un délai, ou lire ce qui fait
foi — ici le `pathname` **et** le `h1` de la page.

### Le bac à sable, encore, et toujours à la durée

`curl http://localhost:3000/` rend `code=000` en **0,015 seconde**. Le serveur
répondait pourtant : c'est le bac à sable de l'agent qui interdit la connexion
sortante, y compris vers localhost. **Un échec trop rapide est local**, la règle
du 21 août tient sans changement. Le contournement est le navigateur, qui a
l'accès — et `fetch(..., { credentials: 'omit' })` sert alors à obtenir une page
telle qu'un visiteur sans session la reçoit.

### Ce qui n'a pas été vu, et une écriture à signaler

- **La page d'accueil a finalement été vue** — après le déploiement, sur
  `bible-ouverte.vercel.app`, le navigateur ne portant pas de session sur ce
  domaine alors qu'il en portait une sur `localhost`. **Et elle a livré un
  défaut qu'aucun relevé n'avait vu** : l'illustration du hero (`AppPreview`,
  la fausse capture d'écran) affichait encore « + ajouter un passage » et
  « 2 passages · 32 versets », vendant l'empilement retiré le matin même.

  Le contrôle textuel ne pouvait pas l'attraper : il cherchait « Réunis
  plusieurs passages », la formule de la carte, quand la maquette écrivait
  « + ajouter un passage ». **Deux libellés pour la même fonction, et le relevé
  n'en connaissait qu'un.** Le `grep` dit ce qu'il cherche, pas ce qui manque —
  et cette fois c'est l'écran qui a rattrapé le relevé, dans le même après-midi
  où le relevé avait rattrapé l'écran sur les « sept traductions ». **Les deux
  instruments se relaient ; aucun ne se suffit.**

  Le reste de la page est conforme, vu à l'œil : « Douze traductions, cinq
  langues, libres de droits », les douze versions avec leur langue, les neuf
  cartes dont les trois ajoutées.

### L'annonce de rentrée, et le défaut que seul un envoi groupé pouvait montrer

Un article de rentrée a été rédigé, une séquence animée de 32 s produite pour
être filmée, et l'annonce envoyée **aux 114 comptes** — d'abord au seul
propriétaire, à sa demande, puis aux 113 autres après qu'il eut vu le rendu.

**Le premier courriel est arrivé dans les indésirables.** Constat du
propriétaire, sur une boîte iCloud. La chaîne fonctionne donc de bout en bout —
écriture, déclenchement immédiat, SMTP, remise — mais l'authentification du
domaine expéditeur ne convainc pas Apple. **Toutes les remises confirmées
jusqu'ici l'avaient été vers Gmail** : le corpus de preuves du dépôt reposait
sur le destinataire le plus indulgent. SPF, DKIM et DMARC restent à instruire.

**Puis l'envoi groupé a révélé un défaut de la fonction Edge.** Les 114
courriels sont partis, mais en **39 passages de trois**, sur **9 h 34**. Le
SMTP d'o2switch ferme la connexion après trois messages ; la fonction en
partageait une seule pour un lot de 50. Le détail est dans
`supabase/README.md`.

**Le second défaut était le vrai danger**, et il tenait à une bonne règle mal
bornée : le compteur de tentatives s'incrémente avant l'envoi — pour qu'une
coupure en plein vol ne fasse pas réessayer sans fin — mais la boucle
continuait après l'erreur. **37 tentatives ont été brûlées sans qu'un seul
courriel parte.** Seul le crash de la fonction a limité les dégâts ; avec trois
tentatives pour plafond, un lot plus grand aurait condamné des messages en
silence.

**Leçon de méthode.** Un mécanisme éprouvé unitairement ne l'est pas à
l'échelle : une connexion pour un message ne dit rien d'une connexion pour
cinquante. Et quand une garde protège d'un cas — la coupure en plein vol — il
faut regarder ce qu'elle coûte dans le cas voisin, ici la coupure *avant* le
vol.

**Ce qui n'a pas pu être fait, et pourquoi.** Aucun encodeur vidéo sur la
machine — ni ffmpeg, ni ImageMagick, ni Playwright — donc pas de fichier vidéo
possible : la séquence est publiée comme page animée, à enregistrer à l'écran.
Les captures du panneau ne peuvent pas non plus être exportées en fichiers. Et
**la séquence n'a pas été vue en mouvement par l'agent** : le panneau Artifacts
est en lecture seule, le middleware redirige un fichier servi depuis `public/`
(règle 7), et le bac à sable interdit d'ouvrir un port d'écoute — trois chemins,
trois murs.

**La notification push n'a pas été envoyée**, sur décision du propriétaire : les
six déclencheurs sont figés et aucun ne permet une annonce libre, quand
**4 comptes sur 114** ont un appareil abonné. Le message dans l'application et
son doublon par courriel couvrent tout le monde.
- **Rien n'a été vu en arabe ni en mode sombre** : ni le bouton flottant, ni la
  boîte de sortie, ni l'entrée groupée. Le bouton porte `end-6` et la flèche du
  chevron `rtl:rotate-180`, mais c'est du code, pas un constat.
- **Une écriture dans les données du propriétaire** : quitter le parcours
  réécrit `tourCompletedAt`, passé de `09:29:06.162Z` à `11:07:16.588Z` le même
  jour. L'affichage « Déjà suivi le 28 août 2026 » est donc inchangé. C'est la
  seule écriture de la séance, et elle est notée parce qu'une écriture non
  demandée se signale, même sans conséquence.

## La séance du 31 août 2026 : le ticket 25

> **Clos le 1er septembre 2026 à 07:02:49 UTC, par le propriétaire du dépôt**,
> qui a répondu lui-même à Francis M. L'agent avait rédigé une réponse et ne
> l'a pas écrite : écrire dans `replies` déclenche une notification
> `support-reply`, et un message à un utilisateur ne part pas sans accord.
> C'est le premier défaut de ce dépôt signalé par un utilisateur, et le premier
> dont le cycle complet — signalement, mesure, correctif, déploiement, réponse
> — se soit refermé.

Le premier défaut de ce dépôt **signalé par un utilisateur** plutôt que trouvé
par l'agent ou par le propriétaire. Francis M l'ouvre le 30 août à 16:31 UTC :
« Nouvelle lecture », Proverbes 18, Louis Segond 1910, « Tout le chapitre », et
l'application annonce **200 versets** quand le chapitre en compte 24.

### Ce que le dépôt savait déjà, et ce qu'il n'avait pas vu

`FALLBACK_VERSES = 200` était documenté trois fois — dans `PassagePicker`, dans
le commentaire de `lib/objectifs`, et dans le tableau des mesures du 19 août,
qui notait que « Psaumes 1:1-200 existe pour de vrai ». La valeur était connue,
assumée, et tracée jusqu'en base.

Ce qui manquait tient en une mesure, faite en quelques secondes sur les fichiers
de `public/bibles/` : **le plus grand chapitre de la Bible est le Psaume 119, et
il en compte 176.** Le repli ne proposait donc pas un compte approximatif mais
vingt-quatre numéros de versets qui n'existent dans aucune version. Personne
n'avait posé la question, parce qu'une valeur documentée comme un pis-aller
n'appelle plus de vérification.

### La table, et ce que sa mesure a montré

`scripts/mesure-versets.mjs` relève le dernier verset des 1189 chapitres depuis
Louis Segond 1910 et écrit `src/features/bible/versification.ts` — même patron
que `mesure-mots.mjs`, même version de référence, même mention « ne pas modifier
à la main ».

Le script mesure aussi l'écart des onze autres versions, plutôt que de le
supposer, et le reporte dans l'en-tête du fichier produit :

| Constat | Versions |
|---|---|
| Identiques sur les 1189 chapitres | `annotee`, `kjv`, `rv1909` |
| Écart marginal | `svd` 2 chapitres, `perret` 4 |
| Écart réel | `diodati` 44, `martin1744` 90, `ostervald` 91 |
| Écart important | `cramp23` 132 (jusqu'à 70 versets), `darby` 142 |
| Hors concours | `sacc` 322 — c'est la dette connue de son texte amputé |

C'est ce tableau qui justifie l'architecture retenue : **la table n'est qu'un
repli, le cache fait foi dès qu'il répond**, puisque lui seul porte la version
que l'utilisateur a devant les yeux. Sur une version dont la versification
diverge, la table se tromperait — mais elle ne sert précisément que quand le
texte n'est pas là, cas où toute valeur est approchée, et où 24 vaut mieux que
200.

### Deux choses que le ticket ne disait pas

**Le repli s'affichait aussi pendant l'aller-retour vers IndexedDB.** Le
chargement des comptes est un `useEffect`, donc postérieur au premier rendu :
la grille montrait 200 boutons puis se réduisait, à **chaque ouverture de la
fenêtre et pour tout le monde**, indépendamment de tout cache manquant. Une
table lue de façon synchrone ferme cette fenêtre de temps. On ne saura pas
lequel des deux chemins Francis M a emprunté, et le correctif couvre les deux.

**Le même 200 vivait en dur dans l'écran de modification d'une lecture**,
resté aux listes déroulantes que `PassagePicker` a remplacées ailleurs. Le
ticket ne parlait que de « Nouvelle lecture » ; corriger là seulement aurait
laissé le défaut à l'endroit qui l'avait produit.

### La mesure sur les lectures déjà enregistrées

Demandée avant toute décision d'y toucher, et elle a trouvé plus large que le
repli n'explique : **6 lectures sur 347, chez 6 comptes**, portent un `verseEnd`
au-delà du dernier verset réel de leur chapitre.

| Lecture | Dernier verset réel | Enregistrée le |
|---|---|---|
| `PSA 1:1-200` | 6 | 3 août |
| `PSA 65:1-20` | 13 | 4 août |
| `GEN 20:1-200` | 18 | 10 août |
| `1SA 18:1-200` | 30 | 10 août |
| `PSA 22:1-45` | 31 | 10 août |
| `GEN 50:1-200` | 26 | 17 août |

Les deux lignes qui ne sont pas à 200 sont les plus instructives : elles ont été
**choisies à la main** dans des listes qui offraient 1 à 200 sans borne. Le
défaut n'a donc pas seulement inscrit sa valeur de repli, il a laissé chacun
inscrire la sienne. Aucune n'est postérieure au 17 août, date à laquelle le
sélecteur a remplacé les listes.

**Décision du propriétaire : ne rien réécrire en base.** Une lecture affichée
« Psaumes 1:1-6 » ne serait plus celle que son auteur a enregistrée, et la borne
de `motsDe` dans `lib/objectifs` empêche déjà ces lignes de fausser un objectif
en minutes. Le correctif garde en revanche ces valeurs **atteignables** dans
l'écran de modification : une donnée qu'on n'affiche plus est une donnée qu'on
ne peut plus corriger, et c'est la raison d'être du paramètre `dejaSaisi` de
`versetsAProposer`.

### Ce qui n'a pas été vu, et pourquoi

**Rien n'a été vu à l'écran.** L'agent n'a de session ni sur la production ni
sur le serveur de développement — `/new-reading` redirige vers `/auth/login`
dans les deux cas —, et le dépôt n'a ni jsdom ni testing-library, par la
discipline qui veut que les règles soient sorties dans des modules purs plutôt
que testées à travers un composant. La règle l'a donc été : treize tests sur
`features/bible/versets`, dont celui qui reproduit exactement le ticket.

Reste à voir de l'œil, avec une session ouverte : la grille de Proverbes 18 à
24 boutons, « Tout le chapitre » rendant « Proverbes 18:1-24 », et une lecture
héritée à 200 encore modifiable dans son écran de détail.

**Une erreur d'outillage, pour la quatrième fois.** Le serveur de développement
a signalé `'versetsAProposer' is not exported from '@/features/bible'` alors que
`tsc` passait et que l'export était bien là : c'était le cache du rechargement à
chaud, l'export ayant été ajouté après le démarrage du serveur. Redémarrer a
tranché en trente secondes — `/new-reading` compile sans un avertissement. La
leçon du 15 août tient : **un onglet neuf, ou un serveur neuf, avant de croire
une erreur de compilation qui contredit `tsc`.**

### Le déploiement a montré ce que le laboratoire ne pouvait pas voir

Le correctif poussé, la production a servi de mesure — et elle a trouvé une
régression que ni `tsc`, ni le lint, ni les 642 tests ne pouvaient signaler.

Le contrôle cherchait seulement à **prouver que le déploiement avait eu lieu**,
sans session : le HTML de `/` liste ses chunks, et il suffit d'y chercher la
signature de la table, `31,25,24,26,32,…`. Elle y était. C'était la preuve
demandée, et en même temps le défaut.

`src/contexts/I18nContext.tsx` importe `BOOKS` depuis `@/features/bible`. **Tout
ce que ce baril réexporte entre donc dans le chunk partagé de toutes les
routes** — la table des 1189 chapitres s'est retrouvée sur la page d'accueil
prérendue, qui ne choisit aucun passage. 3,8 kB non compressés, mesurés dans le
chunk `5954` servi en production.

Le remède est un import par chemin — `@/features/bible/versets` —, ce que
`seed.ts` fait déjà pour `@/features/bible/import` : le patron existait, il n'a
pas été suivi. Le baril porte désormais la mesure en commentaire, pour que la
réexportation ne revienne pas par commodité.

Après déploiement : **zéro occurrence** de la table dans les 17 chunks de `/`,
`BOOKS` toujours servi, chunk `5954` ramené de 226 à 221,5 kB. Page d'accueil
vue à l'écran, aucune erreur réelle au réseau.

**Un piège de mesure, dans la même minute.** La console montrait deux `404`
inquiétants. Ils venaient des `fetch` du contrôle lui-même, qui redemandait
l'ancien chunk disparu au déploiement : aucune requête de la page n'a échoué.
*Se méfier des mesures que l'on produit soi-même* vaut aussi pour les erreurs
qu'elles fabriquent.

## La séance du 31 août, seconde partie : les passages reviennent

Demande du propriétaire du dépôt : enregistrer plusieurs lectures à la suite
sans quitter la page. La fonction avait existé jusqu'au 28 août et avait été
retirée le jour même — sa formulation exacte le dit : « c'est une fonction que
j'avais avant seulement, cela n'était pas ergonomique ». **Ce n'est donc pas un
retour en arrière, c'est la même fonction à une autre place.**

### Deux temps dans la même journée, et le second corrige le premier

La première version rendait la fonction telle qu'elle avait été décrite : un
bouton « Ajouter ce passage » dans le panneau, et des notes attachées à chaque
passage. Le propriétaire l'a essayée et tranché en une phrase — « ce passage est
inutile », « l'ergonomie de l'application est trop lourde ». **Valider un
passage doit suffire à le porter au panneau.**

Le bouton aura vécu une demi-journée, et il faisait exactement le doublon que le
commit du 28 août reprochait déjà à son prédécesseur. La leçon est moins sur le
bouton que sur la façon dont il est revenu : **une fonction retirée pour son
ergonomie revient rarement sous la même forme**, et la rétablir telle qu'elle
était consiste à réintroduire ce qui avait motivé son retrait.

### Le point d'accroche n'était pas celui qu'on croit

Le flux porte **deux** validations : celle du sélecteur de versets, puis celle
de l'aperçu du texte. La seconde semblait désigner la lecture — le commit du
28 août la nommait d'ailleurs comme le doublon du bouton retiré.

Mais son bouton est **`disabled` quand le texte n'est pas téléchargé**. Y
accrocher l'ajout au panneau aurait fermé la saisie hors ligne, c'est-à-dire
exactement la situation qui a produit le ticket 25 le matin même. L'ajout se
fait donc à la validation du **sélecteur**, qui répond toujours ; l'aperçu garde
son seul rôle, faire lire le texte.

Trouvé en lisant `PassagePreview` avant de coder, et non après. C'est le genre
de régression qu'aucun test n'aurait signalée — le bouton se serait contenté de
ne rien faire, pour les seuls utilisateurs sans texte en cache.

Corollaire traité du même geste : « Modifier », depuis l'aperçu, **retire la
ligne du panneau** avant de rouvrir le sélecteur. Corriger ce qu'on vient de
valider ne doit pas laisser un doublon derrière soi.

### Le partage des champs, décidé par la conséquence

Le passage part au panneau **avant** que les notes et les médias soient saisis —
ils sont plus bas dans la colonne. Ils ne peuvent donc plus lui appartenir. Le
choix se réduisait à deux options, et le propriétaire a retenu la première :

| Option | Ce qu'elle coûte |
|---|---|
| **Communs à la séance**, recopiés sur chaque ligne | trois passages annotés d'une même photo font **trois copies** en base64 |
| Attachés au dernier passage validé | l'annotation dépend de l'ordre des gestes, et rien à l'écran ne le rappelle |

C'est la prévisibilité qui l'a emporté sur le volume. Le prix est réel et il est
écrit dans l'en-tête de `lib/lectures/seance.ts`, là où quelqu'un le relira
avant de s'étonner de la taille des lignes.

Ce qui **ne** change pas : une lecture par passage en base. Les statistiques, la
progression et les plans raisonnent tous par lecture, et `lib/lectures/saisies.ts`
les rassemble à l'affichage. Les lignes partent à la suite sans attente entre
elles, pour que leur proximité dans le temps les fasse reconnaître comme une
seule saisie — le regroupement du 28 août s'applique donc aux séances neuves
sans qu'on y touche.

### Le bandeau, et pourquoi cette place

Le bandeau de droite montrait le seul passage en cours. Il porte maintenant la
liste de la séance, chaque ligne avec sa croix, et rien d'autre : ni bouton, ni
geste. Il est **collé en haut au défilement**, donc sous les yeux pendant qu'on
désigne le passage suivant. C'est la place que le propriétaire lui a donnée.

Le bouton flottant devient « Enregistrer les N lectures », et **ne quitte plus
la page** : tout repart à neuf, date, contexte et notes compris. Un message
prend la place du retour que la navigation donnait — sans lui, plus rien ne
dirait que les lignes sont parties. La garde de sortie se réarme dans la foulée.

### Un doublon écrit puis retiré avant d'être commis

`decrirePassage` avait été ajoutée au module de séance : elle refaisait
exactement le calcul de `describeRange`, déjà employée dans **six** fichiers.
C'est le piège 5 du dépôt — « extraire un module ne retire pas le calcul qu'il
remplace » — sous sa forme symétrique : **ajouter un module peut aussi
dupliquer un calcul qui existait déjà**. Repérée par `tsc`, qui a signalé les
deux appels restants de `describeRange` dans la page, et non par une relecture.

### Le sondage d'un déploiement, et l'instrument qu'il fallait vérifier

Sans session, la seule façon de prouver qu'un déploiement est passé est de
chercher dans les chunks publics de `/` un texte que le build précédent ne
portait pas. La première sonde — « La séance » — n'a rien trouvé, et elle
n'aurait **jamais** rien trouvé : le minifieur échappe les caractères Latin-1
(`La s\xe9ance`) tout en laissant l'arabe brut, si bien que la clé arabe
`أضف هذا المقطع` se trouve quand son équivalent français ne se trouve pas.

C'est ce qu'une sonde de contrôle a révélé : `saveOne`, clé ancienne **sans
accent**, était présente quand `previewEmpty`, clé tout aussi ancienne **avec
accent**, ne l'était pas. Deux clés du même dictionnaire ne pouvaient pas
diverger — donc c'était l'instrument.

**Choisir une sonde sans accent**, et le déploiement se lit d'un coup :
« Ajouter ce passage » et « Add this passage » sont apparus ensemble dans le
chunk `5954-2b359b46da2a9caf`, quand le build précédent portait
`5954-d58ed0ea1624f782`. Le fragment récupéré autour de la clé montre
`sessionHint` entière et correctement accentuée : c'est la preuve que les cinq
dictionnaires sont servis, l'arabe compris, et que l'aller-retour UTF-8 tient
jusqu'en production.

Vérifié du même geste : **la table de versification n'est pas revenue** sur la
page d'accueil.

### Ce qui n'a pas été vu

**L'écran, encore une fois.** `/new-reading` demande une session que l'agent n'a
pas. `typecheck`, `lint` et **650 tests** passent, la page compile en 2,4 s après
cache vidé, et les clés sont servies en production — rien de tout cela ne dit ce
que le bandeau affiche, ni comment la liste se comporte, ni son rendu en mode
sombre et en arabe.

### Le contrôle du déploiement, dans les deux sens

La sonde du matin ne cherchait qu'une chose ajoutée. Celle-ci en cherche deux, et
c'est plus concluant : **« Ajouter ce passage » doit avoir disparu** des chunks
servis, et la nouvelle formulation anglaise « Confirm a passage and it joins the
list » doit y être. Les deux ont été constatés ensemble sur le chunk
`5954-e8f23addc167aad4`, quand le build précédent portait `5954-2b359b46da2a9caf`.

Une clé retirée qui disparaît vraiment prouve davantage qu'une clé ajoutée : elle
dit que c'est bien le nouveau bundle qui est servi, et non un cache qui
contiendrait par hasard les deux.

Rappel de méthode, payé le matin même : **la sonde doit être sans accent.** Le
minifieur échappe le Latin-1 en `\xe9` et laisse l'arabe brut, si bien qu'une
sonde française accentuée ne trouve jamais rien, quel que soit l'état du
déploiement.

### L'écran, enfin — et ce qu'il a seul montré

Le propriétaire du dépôt a ouvert une session dans le panneau. Trois
fonctionnalités livrées dans la journée avaient été poussées sans qu'aucune ait
été vue ; elles l'ont été d'un coup.

| Constat | Ce qui a été vu |
|---|---|
| **Ticket 25** | Proverbes 1 propose **33** versets, Proverbes 18 en propose **24**, Jean 3 en propose **36** — leurs comptes exacts |
| **Le geste du ticket** | « Tout le chapitre » rend **« Proverbes 18:1-24 »**, là où le matin il rendait 1-200 |
| Validation d'un passage | il tombe **aussitôt au panneau**, et le formulaire se vide |
| Deux passages | « Proverbes 18:1-24 » et « Jean 3:16-17 » listés, bouton **« Enregistrer les 2 lectures »** |
| La croix | retire la ligne ; le bouton repasse à **« Enregistrer la lecture »** |
| RTL | panneau aligné à droite, croix passée à gauche, bouton flottant à gauche — les propriétés logiques tiennent |

### Le défaut que seul le mode sombre pouvait montrer

**`bg-[--primary-light]` reste clair en mode sombre, et pour toutes les
chartes.** `globals.css` le remappe pourtant en `#1a2840` sous `html.dark` — mais
`applyTheme()` pose la variable en **style inline sur `<html>`**, et un style
inline l'emporte toujours sur une feuille de style. Le remap existe et n'est
jamais atteint.

Sur ce fond resté clair, `--text-secondary` bascule au gris clair du thème
sombre : **2,15** de contraste, mesuré. C'est le troisième cas de la même
famille après la barre latérale (1,01) et les badges (1,06), et c'est la
règle 15 sous un visage de plus — sauf que la cause n'est pas ici l'absence de
remap, mais un remap **écrasé par une spécificité supérieure**.

Le panneau de séance est corrigé : tout ce qui est posé sur ce fond porte
désormais `text-[--primary]`, foncé dans les dix chartes puisque
`--primary-light` en est précisément l'éclaircissement à 92 % vers le blanc. Le
couple tient donc par construction, et non par chance — **11,02** pour le texte
plein, **5,57** avec `opacity-75`, qui atténue sans changer de teinte là où une
classe grise retomberait dans les remaps.

**Le défaut, lui, dépasse cette page** : **13 fichiers** emploient
`bg-[--primary-light]`, dont Réglages sept fois et Support six. Ils n'ont pas
été mesurés, et rien ne dit qu'ils portent tous des textes gris — mais la cause
leur est commune. Le corriger à la racine supposerait que `applyTheme()` cesse
de poser cette variable en mode sombre, ou en pose une valeur assombrie : cela
changerait l'apparence de treize écrans, et c'est une décision du propriétaire,
pas de l'agent.

Symptôme visible du même défaut, laissé tel quel : dans le panneau, les lignes
de passages sont des cartes **sombres** — `bg-[--surface]`, lui, est bien
remappé — posées sur un fond **clair**. Lisible, mais incohérent. Empiler une
rustine ici aurait masqué la cause.

### Ce qui n'a pas été vu, même avec la session

**L'enregistrement lui-même.** Le serveur de développement écrit dans la base de
**production** : une lecture d'essai y serait une vraie lecture, dans les données
du propriétaire. Le message de confirmation et la remise à neuf de la page
restent donc non vus, et c'est délibéré.

Aucune écriture n'a eu lieu pendant cette revue. La note d'essai et le passage
posés au panneau vivaient dans l'état React ; ils ont été retirés avant de
rendre la main.

## Nommer la séance — la quatrième demande du 31 août

Un bandeau après le clic sur « Enregistrer », pour donner un nom à la séance ;
ce nom sert ensuite de première clé de tri dans « Mes lectures ». Première
évolution du schéma depuis le 21 août.

### La migration d'abord, et l'ordre n'est pas négociable

Le code envoie `sessionTitle` à chaque écriture. **Tant que la colonne n'existe
pas, PostgREST rejette la ligne et les lectures cessent de se synchroniser** —
pour tout le monde, dès le déploiement. La migration a donc été appliquée
**avant** le push, et relue dans une instruction séparée, comme le veut le piège
des CTE sœurs.

C'est un ordre que ce dépôt n'avait pas encore eu à respecter : les migrations
précédentes ajoutaient des tables ou des colonnes que le code d'alors ignorait
encore. Celle-ci est lue et écrite par du code qui part en même temps.

### Aucun `grant`, et c'est mesuré

La règle 2 d'`AGENTS.md` — « toute colonne ajoutée à `profiles` exige son propre
`grant update (…)` » — ne vaut **pas** pour `readings`, et la différence se lit
en une requête, avec `profiles` en témoin pour prouver que l'instrument
distingue bien les deux cas :

| Table | Au niveau table |
|---|---|
| `profiles` | `SELECT` seulement — d'où la règle 2 |
| `readings` | `SELECT, INSERT, UPDATE, DELETE` |

`information_schema.column_privileges` ne suffisait pas : il décompose un grant
de table en autant de lignes que de colonnes, si bien qu'il montre la même chose
dans les deux cas. C'est `table_privileges` qui tranche. Vérifié après coup sur
la colonne neuve : `INSERT, SELECT, UPDATE` pour `anon` comme pour
`authenticated`, sans qu'aucun `grant` ait été écrit.

### Il y a cinq points de création d'une lecture, pas trois

Le piège documenté du dépôt nomme **trois chemins** — `toRemote` à la création,
`rowToReading` à la lecture, le payload de mise à jour. Ils ont été traités.
Mais rendre `sessionTitle` obligatoire sur `ReadingEntry` a fait échouer la
compilation en **quatre endroits de plus** :

| Écran | Ce qu'il écrit |
|---|---|
| Recherche biblique | une lecture ajoutée depuis un résultat |
| Verset du jour | la lecture qui entre dans les statistiques |
| Plans de lecture | une lecture par passage, au cochage d'un jour |
| `objectifs.test.ts` | une lecture de laboratoire |

**Aucun n'a été trouvé par relecture : tous par `tsc`.** C'est l'exact inverse
du piège des trois chemins, où le typage ne voyait rien parce que le champ était
facultatif. Un champ obligatoire transforme la compilation en inventaire.

Chacun pose une chaîne vide, ce qui est exact : ce sont des lectures isolées,
qui n'appartiennent à aucune séance de saisie. Pour les plans, le nom du plan
aurait fait un titre tentant — ce serait décider à la place de l'utilisateur, et
c'est noté dans le code plutôt que fait.

### Le titre trie, le temps regroupe

Décision du propriétaire, entre deux options présentées :

- **Retenue** : le regroupement reste temporel, le titre s'affiche en tête et
  sert de première clé de tri dans la journée. Deux séances homonymes du même
  jour restent deux entrées, voisines.
- Écartée : le titre regroupe aussi. Elle réunissait deux moments distincts
  nommés pareil, sans qu'on puisse les séparer ensuite.

Les séances **non nommées ferment la marche**. Sans cette règle, une chaîne vide
se rangerait avant toutes les autres dans n'importe quelle collation, et ce
seraient les 360 lectures sans titre qui décideraient de l'ordre de la journée.

Le nommage est **facultatif** — « Enregistrer sans nommer » est une issue de
plein droit. C'est ce qui fait des lignes antérieures un cas déjà traité plutôt
qu'une exception à gérer : une séance neuve non nommée se comporte exactement
comme elles.

### Ce qui a été vu, et ce qui ne l'a pas été

Vu à l'écran, session ouverte par le propriétaire : le bandeau et ses trois
issues, l'accord au singulier de « 1 lecture va être enregistrée », l'explication
présente à la fois dans le bandeau et sous la liste du panneau, et la
non-régression de « Mes lectures » sur 158 lectures. Psaume 23 propose ses
6 versets, ce qui éprouve le correctif du ticket 25 sur un troisième livre après
Proverbes et Jean.

**Non vu, et c'est un choix du propriétaire** : le titre écrit en base, puis
affiché en tête de groupe et trié dans sa journée. Le vérifier demandait
d'enregistrer une vraie séance dans ses données ; il a préféré s'en tenir là.
Le maillon est donc éprouvé par huit tests et par le typage, pas par l'écran —
et c'est exactement le genre de chose que ce document existe pour dire.

## Les cinq demandes du 1er septembre 2026

Cinq modifications d'un coup, dont deux touchant la base. Ce qu'elles ont appris
dépasse chacune d'elles.

### Rien ne se généralise sur les droits d'écriture

Trois tables, trois vérifications, deux réponses opposées **en deux jours** :

| Table | `UPDATE` au niveau table | Conséquence pour une colonne neuve |
|---|---|---|
| `readings` | oui | couverte d'office — aucun `grant` à écrire |
| `profiles` | non | `grant update (…)` obligatoire (règle 2) |
| `messages` | non | `grant update (…)` obligatoire |

La veille, la mesure sur `readings` avait conclu qu'aucun `grant` n'était
nécessaire, et c'était juste. Le lendemain, la même question sur `messages` a
donné l'inverse. **La règle 2 n'est donc pas « toujours » ni « jamais » : elle
est « à vérifier », et la vérification tient en une requête** sur
`information_schema.table_privileges` — jamais sur `column_privileges`, qui
décompose un grant de table en autant de lignes que de colonnes et montre donc
la même chose dans les deux cas.

L'enjeu n'est pas théorique : sans le grant, l'écriture échoue **sans message
exploitable**. C'est ce qui rend ce piège coûteux, et pourquoi l'archivage a été
exercé pour de vrai plutôt que supposé.

### Le verset du jour se déplaçait lui-même

Son tirage est déterministe depuis l'origine, et le module le dit en toutes
lettres. Mais il vaut `condense(jour) % matiere.length`, et la matière vient des
lectures de l'utilisateur : **toute lecture enregistrée change la longueur, donc
le reste, donc le verset**. Or marquer le verset « lu » enregistre une lecture.

Le défaut était auto-référentiel, et invisible à la lecture du module : celui-ci
est correct. C'est le contrat entre le module et son appelant qui ne l'était
pas — « une matière stable », dit le commentaire de la page, sur une matière qui
ne l'est pas.

Le choix est désormais retenu dans les réglages, avec le jour pour lequel il
vaut. Les réglages sont la colonne `jsonb` : ni migration, ni piège des trois
chemins, et la mémoire se synchronise entre appareils — ce que le module
promettait sans pouvoir le tenir.

La mémoire n'est suivie que si le verset **existe encore dans la matière** :
désactiver une version vide le cache de ses versets, et servir une référence
dont on n'a plus le texte afficherait un cadre vide toute la journée.

### Un statut de feuille de route ne coûte rien à la base

`roadmap_items.status` n'a **aucune contrainte `CHECK`** — vérifié avant
d'écrire quoi que ce soit. « Suspendu » tient donc dans le typage, l'ordre
d'affichage, une couleur et cinq traductions. Le déclencheur `roadmap-done` ne
vise que `status = 'done'` : un item suspendu ne notifie personne, ce qui est
l'intention.

L'identifiant est `suspendu` et non `suspended` : il suit `projet`, déjà en
français, et évite l'homonymie avec `profiles.suspended`, qui désigne un compte
et non un chantier.

### Une lecture ne s'éditait qu'à moitié

L'écran de détail savait changer la date, le livre, le passage, la version, le
contexte et les notes — mais ni les liens, ni les photos, ni l'audio, ni le
titre de séance. On pouvait donc tout saisir à la création et n'en corriger
qu'une partie ensuite, ce que rien ne signalait.

C'est le pendant du défaut des « trois chemins » : là, un champ ne partait pas
jusqu'à la base ; ici, quatre champs n'avaient jamais eu de contrôle pour les
reprendre. **Un formulaire de création plus riche que son formulaire de
modification est une dette qui ne se voit qu'à l'usage.**

### Ce qui a été vu à l'écran

Session ouverte par le propriétaire, sur le serveur de développement — donc sur
la base de production.

| Écran | Constat |
|---|---|
| Détail d'une lecture | **treize champs**, dont les quatre neufs ; quitté par « Annuler », aucune lecture modifiée |
| Barre de sélection | le champ « Nommer la séance » à côté du contexte, désactivé tant que rien n'est coché |
| « Mes lectures » | bouton **flottant** à 24 px du bas et de la droite, masqué en mode sélection |
| Messages | onglets « Actifs 10 » / « Archivés 0 », deux actions par message |
| Long message | l'annonce de rentrée du 28 août tient dans **256 px** avec son ascenseur |
| Archivage | **exercé pour de vrai**, confirmé en base, puis annulé — la base est rendue intacte |

**Non vu** : le statut « Suspendu » à l'écran de la feuille de route, et le
verset du jour d'un jour à l'autre — ce dernier demanderait d'attendre demain,
ou de manipuler l'horloge.

## Les fonctions avancées, et la page d'accueil au choix

### Une section réservée, volontairement vide

`/avance` rejoint `NAV_COMPTE` juste après `/admin` : un écran de compte, donc
hors du réordonnancement et du masquage. La **règle 16 est faite en entier** —
l'entrée, l'étape du parcours avec ses cinq traductions, la ligne
d'`ECRANS_REELS` — et le parcours savait déjà réserver une étape par `adminOnly`.

Elle est vide, et c'est son état juste : c'est un cadre, pas une
fonctionnalité. Elle dit néanmoins ce qu'elle attend, un emplacement blanc sans
explication se lisant comme un écran cassé.

**Réserve écrite dans le fichier lui-même** : `isAdmin` vient d'`AuthContext`,
donc du navigateur. Il décide de ce qui s'affiche, jamais de ce qui est permis.
Toute fonction posée là qui touchera aux données d'autrui devra porter sa propre
barrière — RLS ou clé service_role. **Une page réservée n'est pas une donnée
protégée**, et c'est la phrase à relire avant d'y mettre quoi que ce soit.

### Un test qui avait raison de s'arrêter

`« ne retire qu'elle »` vérifiait que le filtre du parcours ôte **une** étape aux
comptes ordinaires. Il a échoué à l'arrivée de la seconde.

Son intention était juste — le filtre ne retire que les étapes réservées — mais
son énoncé figeait un nombre. Il compte désormais les étapes `adminOnly`, et
vérifie du même geste qu'aucune autre n'est retirée. **Un test qui encode un
comptage plutôt qu'une règle réclame une modification à chaque ajout**, et cette
modification est le moment où l'on risque de le relâcher au lieu de le corriger.

### La page d'accueil : où la lire, et ce que ça coûte

La redirection vivait en dur dans le middleware. Elle est désormais un réglage,
lu **dans le middleware** — donc sur le serveur, dans `settings.data`.

Le coût est borné, et c'est ce qui rendait la chose acceptable : la requête n'a
lieu que sur `/` et `/auth/*`, les deux seuls chemins qui redirigent. Une
connexion, un retour à la racine — jamais une navigation ordinaire. Le
middleware interrogeait déjà `profiles` sur tous les autres chemins.

**Trois raisons de revenir au défaut**, dont la dernière est la moins évidente :
rien n'est choisi ; la page n'existe plus ; ou **elle a été masquée**.
`homePage` et `hiddenPages` vivent dans le même `jsonb` et peuvent donc se
contredire — atterrir sur une page cachée donnerait un écran qu'on ne pourrait
plus quitter par la barre latérale.

### Deux listes, et un garde-fou qu'il a fallu inventer

`PAGES_ACCUEIL` ne peut pas être `NAV_LINKS` : le middleware s'exécute sur le
serveur, `NAV_LINKS` porte des icônes React. C'est exactement la configuration
de la règle 13 — deux tables indépendantes décrivant la même réalité.

Le test les compare en **lisant le fichier source** de `Sidebar.tsx`, parce que
vitest n'a pas de plugin JSX ici : ce dépôt ne teste que des modules purs, et
importer un `.tsx` échoue à l'analyse. C'est inhabituel et c'est assumé — un
garde-fou inhabituel vaut mieux que pas de garde-fou, et celui-ci cassera au
moment précis où le format des entrées changera, c'est-à-dire quand quelqu'un
devra le relire.

**Le piège 10 s'est présenté sous un autre visage** : `matchAll` rend un
itérateur, que vitest étale volontiers et que `tsc` refuse sans
`--downlevelIteration`. Ce n'était pas un `Set`, c'était la même famille.

### Ce qui a été éprouvé de bout en bout

Session ouverte par le propriétaire, sur la base de production. C'était le seul
contrôle capable de prouver que le middleware lit vraiment le réglage — un test
unitaire ne dit rien du chaînage.

| Étape | Constat |
|---|---|
| Choix « Mes lectures » | écrit en base à 08:44:42 UTC |
| `/` | mène à `/history` — « Mes lectures » |
| La même page **masquée** | `/` ramène à `/new-reading` : le middleware passe bien `hiddenPages` |
| Remise à l'état initial | `homePage = /new-reading`, `/history` de nouveau visible, vérifié en base |

Vu aussi : la page `/avance`, et l'ordre du menu — Réglages, Administration,
Fonctions avancées.

**Une omission de méthode, notée** : l'état initial de `hiddenPages` n'a pas été
relevé **avant** l'essai. Il portait `/profil` après coup, et le raisonnement dit
qu'il le portait déjà — le clic n'a touché que « Mes lectures » — mais c'est un
raisonnement, pas une mesure. Relever l'état d'un réglage avant d'y toucher,
comme on vérifie l'identifiant d'un cobaye avant d'écrire.

## Le 2 septembre : le réglage qui n'avait rien changé

### Quatre chemins, et l'essai n'en avait vu qu'un

Le choix de page d'accueil a été livré le 1er septembre et **n'a rien changé
pour son demandeur**. Il l'a signalé le lendemain : « lorsque je quitte
l'application, cela revient à la page initiale ».

Le middleware ne décide que sur `/` et `/auth/*`. Quatre chemins ne passaient
pas par là :

| Chemin | Ce qu'il faisait |
|---|---|
| `manifest.json` | `start_url: "/new-reading"` — la PWA rouvre cette page **directement** |
| `auth/login` | `router.push('/new-reading')` après connexion |
| `auth/callback` | idem après le lien de confirmation |
| Le logo de la barre latérale | `href="/new-reading"` en dur |

Le premier explique le symptôme au mot près : une PWA lancée depuis l'écran
d'accueil ouvre son `start_url` sans traverser la racine.

**L'essai de la veille naviguait explicitement vers `/`** — c'est-à-dire vers le
seul chemin qui fonctionnait déjà. Il n'a donc prouvé que ce qu'il avait
traversé, et il était sincère : la chaîne réglage → base → middleware →
redirection marchait, sur ce chemin-là.

C'est « un `200` ne prouve que ce qu'il a traversé », transposé à une
redirection. La leçon qui s'y ajoute : **une fonction qui s'active sur un chemin
demande l'inventaire de tous ceux qui y mènent.** Un `grep` sur la destination
en dur — ici `/new-reading` — l'aurait donné en dix secondes, et c'est le geste
qui manquait. Trois tests veillent désormais sur les quatre chemins.

**Réserve sur le manifeste** : `start_url` est lu par le système à
l'installation. Un appareil qui a déjà installé la PWA peut garder l'ancienne
valeur jusqu'à ce qu'il relise le manifeste — délai que ni le dépôt ni l'agent
ne maîtrisent. Réinstaller le raccourci tranche.

### Trois pages descendues sous Réglages, sans rien perdre d'autre

Feuille de route, Support et Soutenir rejoignent le bloc du bas, entre Réglages
et les écrans réservés. Le bloc était jusqu'ici **tout entier fixe**, pour deux
raisons qui ne valent que pour ses occupants d'alors : Réglages ne peut pas se
masquer sans rendre tout réglage irréversible, et un écran réservé n'a pas à
l'être.

Ces trois-là sont d'une autre nature — ordinaires, ouvertes à tous, masquables
depuis toujours. Les fixer ne devait pas leur retirer cette propriété : elles
perdent le **réordonnancement**, ce qui est le sens même de la demande, et rien
d'autre. D'où un `masquable` sur `NAV_COMPTE`, et une seconde liste dans les
Réglages, sans flèches mais avec ses cases.

**Un piège évité de justesse** : le sélecteur de page d'accueil filtrait
`NAV_LINKS`, d'où les trois venaient de sortir. Elles auraient disparu du choix
sans que rien ne le signale — ni `tsc`, ni le lint, ni les tests, puisque la
liste se serait simplement raccourcie. C'est la même famille que la règle 13 :
deux endroits qui décrivent la même réalité, et l'un qui bouge sans l'autre.

### Une erreur de découpage, à ma charge

`git add -A` a mis **les deux travaux dans un seul commit**, `e569dac`, dont le
message ne décrit que le correctif de la page d'accueil. Le déplacement des
trois pages y est aussi, sans être annoncé.

`AGENTS.md` met en garde contre exactement cela, et pour les cinq dictionnaires
en particulier — ici c'est la totalité de deux demandes qui a fusionné.
L'historique était déjà poussé quand je l'ai vu ; le réécrire aurait été pire
que le consigner. **Le geste qui manquait est de nommer les fichiers à
`git add`, plutôt que de balayer l'arbre**, et il ne coûte rien quand on sait ce
qu'on vient de toucher.

## Le 2 septembre, seconde partie : les trois premiers correctifs de l'audit

L'audit d'interface du 2 septembre 2026 classait six correctifs. Les trois
premiers — cibles du menu, intitulés de champs, sections en titres — étaient
annoncés comme ne touchant à aucune décision de design, et ils tiennent cette
promesse. Mais **aucun des trois n'était exact tel qu'il était écrit**, et c'est
la mesure qui l'a montré à chaque fois.

### L'audit se trompait de quatre pixels sur son propre correctif

Il proposait `py-2.5` → `py-3` en annonçant 48 px. La mesure sur le thème réel
donne 44 :

| Classe | Boîte de ligne `text-sm` | Padding | Hauteur |
|---|---|---|---|
| `py-2.5` | 20 px | 2 × 10 | **40** — le relevé de l'audit est juste |
| `py-3` | 20 px | 2 × 12 | **44**, le seuil Apple |
| `py-3.5` | 20 px | 2 × 14 | **48**, le seuil Google |

L'erreur est d'avoir pris **14 px pour la hauteur du texte**. C'est la taille de
police ; ce qui occupe la place est la boîte de ligne, `1.25rem` pour `text-sm`.

Son propre chiffrage le contredisait : « huit pixels de plus chacune allongent
la colonne de 120 px » décrit `py-3.5`, pas `py-3` qui n'en ajoute que quatre.
**La classe proposée et le coût annoncé ne décrivaient pas le même correctif** —
et c'est cette incohérence interne, plus que le calcul, qui a fait rouvrir la
question.

### « Une seule ligne » en était quatre, dont une à ne pas toucher

`Sidebar.tsx` porte quatre `py-2.5`. Trois sont à 40 px et relèvent du
correctif ; le **lien de profil est déjà à 52 px**, son avatar de 32 px
gouvernant la hauteur. L'allonger n'aurait ajouté que de la hauteur à une
colonne qui déborde déjà.

Et la mesure a trouvé une cible que l'audit affichait sans la corriger : **le
logo, à 36 px**. Son graphique le montre — « Logo · 36 px » — mais son remède ne
visait que les entrées. Passé à `py-2.5`, il atteint 48. Relevé après correctif,
au navigateur : **19 cibles sur 19 à 48 px ou plus.**

### Les dix champs, et ce que trois relevés successifs ont dit

Un `grep` sur les balises sans `htmlFor` compte **~64 champs sur 11 écrans**.
L'audit en mesure **10 sur 3**. C'est le `grep` qui a tort, et de la manière
prévisible : il ne sait pas qu'une case enveloppée dans son `<label>` n'a besoin
de rien, ni qu'un `aria-label` fait le travail. **Le relevé compte des balises,
l'audit a regardé l'écran** — la leçon du 15 août sur Progression, prise dans
l'autre sens.

Le même travers a frappé une seconde fois dans la séance : un `grep` sur `<h2`
donne **1** pour Réglages, quand l'écran en rend **16**. `SectionCard` est une
source unique rendue quinze fois.

Trois motifs différents ont été nécessaires, là où l'audit n'en proposait qu'un :

| Cas | Motif | Pourquoi pas `htmlFor` |
|---|---|---|
| Version, Notes (Nouvelle lecture) | `htmlFor` / `id` | rien — c'est le cas nominal |
| Les trois listes de Réglages | `aria-label` | leur nom visible est le **titre de la `SectionCard`**, un `<h2>` ; il n'y a pas de `<label>` où s'accrocher |
| Titre et adresse d'un lien, recherche et dates de Mes lectures | `aria-label` | aucun `<label>`, et le `placeholder` s'efface à la première frappe |

**Une correction à l'audit** : il écrivait que ces dix champs « portent tous un
intitulé visible ». C'est faux des deux dates de Mes lectures. Elles portaient un
`placeholder`, et **un `placeholder` sur `<input type="date">` n'est jamais
rendu** — le navigateur y affiche son format. Ces deux champs n'avaient aucun
nom, ni visible ni programmatique.

L'adresse d'un lien n'avait même pas de clé de dictionnaire : un `https://…` en
dur. `linkUrlLabel` a été ajoutée aux cinq langues.

### Les sections en titres, et la promesse qui ne valait que pour un écran

« Les passer en `<h2>` ne change pas un pixel si la classe reste la même » est
vrai de Nouvelle lecture, où « Liens », « Audio » et « Photos » existaient déjà
comme `<label>` visibles n'étiquetant rien. Ce sont désormais des `<h2>`, aux
classes inchangées.

**« Notes » n'a pas suivi**, et c'est délibéré : il nomme un champ unique, pas
une section. L'audit le rangeait avec les trois autres ; en faire un titre lui
aurait retiré son association. Il est resté `<label>`, avec son `htmlFor`.

Sur **Mes lectures** et **Verset du jour**, la prémisse ne tenait pas : il n'y
avait **aucun libellé à convertir**. Créer des titres visibles aurait redécoré
deux écrans que personne n'a demandé à redécorer — Verset du jour est
volontairement dépouillé. Décision du propriétaire : des titres **`sr-only`**,
qui donnent les repères au lecteur d'écran sans rien afficher. Le motif existait
déjà dans `history/page.tsx`, sur les intitulés de la barre de sélection.
Mesuré : `1 × 1 px`, position absolue, aucun décalage.

### Trois sauts de niveau que l'audit n'avait pas relevés

Traités dans le même lot, sur décision du propriétaire. Les trois avaient un
`<h3>` sans `<h2>` au-dessus, et ce n'était pas le même défaut :

| Écran | Ce que le `<h3>` était | Correctif |
|---|---|---|
| Feuille de route | le titre d'un **item**, sous un groupe de statut dont l'en-tête est un `<button>` sans balise de titre | le `<h2>` **enveloppe** le bouton — motif du dépliant accessible ; l'ordre devient statut puis item |
| Détail d'un plan | le titre du panneau d'édition, sous le nom du plan | `<h3>` → `<h2>` |
| Recherche biblique | le titre d'une **fenêtre modale** | `<h3>` → `<h2>` |

Aucun changement visuel : le `preflight` de Tailwind remet `font-size`,
`font-weight` et `margin` des titres à ceux du parent.

**Réserve laissée ouverte** : la fenêtre d'ajout de Recherche biblique n'a ni
`role="dialog"`, ni `aria-modal`, ni `aria-labelledby`, là où Nouvelle lecture
les pose sur ses deux boîtes. C'est un autre sujet, qui va avec la question du
piège de focus, et il est noté dans le fichier plutôt que traité en passant.

### Ce qui a été vu à l'écran, et ce qui ne l'a pas été

Session ouverte par le propriétaire, sur le serveur de développement — donc sur
la base de production. Aucune écriture : rien n'a été enregistré, et le panneau
d'édition du plan 3 a été rouvert puis refermé sans rien soumettre.

| Écran | Constat, relevé dans le DOM |
|---|---|
| Barre latérale | **19 cibles sur 19 à 48 px ou plus** ; la liste défile toujours, le bloc du bas reste entier |
| Nouvelle lecture | **0 champ sans nom accessible** ; plan `H1 → H2 ×3` |
| Mes lectures | **0 champ sans nom** ; plan `H1 → H2 Filtres → H2 Lectures` |
| Réglages | **12 listes, 0 sans nom** ; 16 `<h2>` rendus |
| Verset du jour | `H1 → H2 Le verset → H2 Statistiques` |
| Feuille de route | `H1 → H2 statut → H3 item` — le saut est fermé |
| Détail d'un plan | `H1 → H2 Modifier le plan` |

**Non vu, et pour une raison assumée** : le `<h2>` de la fenêtre d'ajout de
Recherche biblique. L'ouvrir demande de cliquer « ajouter aux lectures » sur un
résultat, c'est-à-dire de s'engager sur un chemin qui mène à une écriture dans
les données du propriétaire. Le correctif y est éprouvé par le typage seul.

**Non vu non plus** : rien en arabe, ni en mode sombre. Les quatre clés neuves
sont traduites dans les cinq langues et l'aller-retour UTF-8 est vérifié, mais
aucun de ces écrans n'a été repassé en RTL.

## Le 2 septembre, troisième partie : les colonnes, le dialogue, et l'arabe

### Le quatrième correctif de l'audit ne tient pas sa promesse, et la mesure dit pourquoi

L'audit annonçait : « Gain estimé : Progression passe sous trois écrans ». Le
correctif a été fait, mesuré avant et après, et il ne le rend pas.

| Écran | Avant | Après | Écrans de défilement |
|---|---|---|---|
| Progression | 3 820 px | **3 462 px** | 4,70 → 4,26 |
| Statistiques | 2 126 px | **1 878 px** | 2,62 → 2,31 |

Les deux chiffres de départ reproduisent exactement ceux de l'audit : sur ses
**relevés**, l'instrument est bon. C'est son **diagnostic** qui ne l'est pas.
« La cause n'est pas le contenu mais sa disposition », écrivait-il. La
décomposition dit l'inverse :

| Bloc de Progression | Hauteur | Part |
|---|---|---|
| Succès & Récompenses | 836 px | **22 %** |
| Les quatre cartes | 625 px | 16 % |
| Progression par contexte | 598 px | 16 % |
| Progression par catégorie | 550 px | 14 % |
| Détail par livre | 466 px | 12 % |
| Testaments | 244 px | 6 % |

**84 % de la hauteur est dans cinq sections de liste.** Deux colonnes ne peuvent
récupérer que ce que les cartes occupent, soit 358 px sur les 1 384 qu'il
faudrait pour descendre sous trois écrans. Raccourcir vraiment cet écran suppose
de traiter les listes — replier, paginer, ou déplacer —, ce qui est une décision
de produit et non une disposition. **Un gain annoncé sans décomposition du
budget est une estimation, pas une mesure.**

Corrigé au passage : l'audit disait la carte Niveau « la seule qui porte une
barre de progression ». La carte Série en porte une aussi, plus ses pastilles de
palier — c'est même la plus haute des quatre, 194 px contre 130, et c'est elle
qui fixe la hauteur de la première ligne.

### Le mode sombre a livré pire que ce que l'audit avait mesuré

L'audit avait relevé `--primary-light` resté clair, et un texte gris par-dessus
à **2,15**. En regardant Progression en thème sombre, le symétrique apparaît, et
il est plus grave :

| Élément | Couleur | Fond | Contraste |
|---|---|---|---|
| `h1` — **sonde de contrôle** | `#f1f5f9` | `#0f172a` | **16,30** |
| « 14 jours », série | `orange-500` | `#1e293b` | 5,22 |
| « 1 / 12 », objectif | `green-600` | `#1e293b` | 4,44 |
| **« 141 / 1189 », chapitres lus** | `text-[--primary]` = `#4a1a5e` | `#1e293b` | **1,11** |

La sonde de contrôle a été posée **avant** de conclure, comme l'audit lui-même
l'enseigne : un titre parfaitement lisible mesure 16,30, donc l'instrument dit
vrai. Le « 141 » est bien invisible.

**C'est la même cause que `--primary-light`, retournée.** `applyTheme()` pose
`--primary` en style inline sur `<html>` ; `html.dark` ne peut donc pas le
remapper. Sur un fond qui, lui, est remappé en sombre, un texte à `--primary`
devient illisible. Le correctif du 31 août sur le panneau de séance employait
justement `text-[--primary]` — et il était juste **là**, sur `bg-[--primary-light]`
qui reste clair. Les deux règles sont en tension :

| Fond | `text-[--primary]` |
|---|---|
| `bg-[--primary-light]` — jamais remappé | **juste**, 11,02 |
| `bg-[--surface]` — remappé sombre | **1,11** |

Étendue : **87 occurrences dans 29 fichiers**. Toutes ne sont pas sur un fond
remappé, et aucune n'a été corrigée ici : c'est la même décision de racine que
`--primary-light`, et elle appartient au propriétaire.

Ce défaut est **antérieur** au passage en deux colonnes ; celui-ci n'a touché
aucune couleur. Il n'a été trouvé que parce que le mode sombre a été regardé.

### La fenêtre d'ajout de Recherche biblique

La réserve laissée ouverte le matin est levée. Elle porte désormais
`role="dialog"`, `aria-modal="true"` et `aria-labelledby` désignant son `<h2>` —
le motif des sept autres fenêtres du dépôt, qu'elle était seule à ne pas suivre.
Échap la ferme, comme les cinq autres.

**Elle cachait deux champs de plus sans intitulé programmatique**, la date et les
notes. L'audit ne pouvait pas les compter : il a marché dix écrans, et **une
fenêtre fermée est invisible à ses deux instruments** — ni le relevé ni la marche
à l'écran ne l'ouvrent. Le compte de « dix champs » était donc juste pour ce
qu'il pouvait voir, et incomplet pour l'application.

Vu à l'écran : la fenêtre ouverte porte les trois attributs, ses trois champs
ont tous un nom, et **Échap la referme par une vraie frappe** — les 71 résultats
de la recherche restent en place, rien n'a été enregistré.

### L'arabe, et le seul texte qui échappait aux dictionnaires

Progression, Statistiques et Mes lectures ont été vues en arabe. **Ce sont les
premiers écrans internes de ce dépôt jamais vus en RTL** — jusqu'ici seuls
`/auth/login` et `/auth/signup`, les deux publics, l'avaient été.

Les fondations tiennent : grilles inversées, barres de progression remplies
depuis la droite, testaments dans le bon ordre, aucun débordement horizontal, et
les clés neuves — les deux dates, les deux titres `sr-only` — toutes rendues en
arabe.

**Et l'arabe a trouvé ce qu'aucun relevé n'aurait vu.** Le lien d'évitement de
`AppShell.tsx` portait « Aller au contenu » **écrit en dur**, donc français dans
les cinq langues, et `focus:left-2`, une propriété physique qui l'aurait posé du
mauvais côté en RTL. C'est le seul texte visible du dépôt qui échappait aux
dictionnaires, et il y a une raison : **il ne s'affiche qu'au clavier.** Ni un
relevé sur les accents, ni une marche à l'écran à la souris ne le rencontrent —
il a fallu lire le texte du corps de la page dans une langue où le français
saute aux yeux.

### La discipline de l'essai, et son résidu

Le mode sombre a été éprouvé **sans aucune écriture**, en posant la classe
`dark` à la main : `applyTheme()` pose les mêmes variables de charte dans les
deux thèmes, si bien que la classe seule reproduit fidèlement la situation.

L'arabe, lui, n'avait pas d'équivalent : changer la langue est une écriture dans
la colonne `jsonb`. L'état a donc été relevé **avant** — `theme: light`,
`language: fr`, `homePage: /progress`, `updatedAt` au 1er septembre 10:25:49 —,
puis restauré et **vérifié après**, identique. Seul l'`updatedAt` a bougé, au
2 septembre 13:09:57. C'est le seul résidu de la séance, et il est noté.

Incident d'outillage : le panneau Navigateur a expiré sur un clic, sans que le
clic n'aboutisse. Vérifié par lecture du DOM plutôt que repris à l'aveugle, puis
contourné par un pilotage en script — ce qui éprouve le rendu, pas le clic, et
c'est bien le rendu qui était en question. Et **une capture a montré
« Chargement… » quand le DOM disait la page pleine** : le serveur de
développement recompilait. Le relevé DOM fait foi, une fois de plus.

## La séance du 9 septembre 2026 : lire avant de cocher, compter juste, replier le menu

Trois demandes du propriétaire, plus une quatrième qu'il traite lui-même — les
lettres de demande de droits, voir `spec/DROITS.md`.

### Le comptage des chapitres mentait, et la mesure a décidé de la forme du correctif

L'écran Progression comptait un chapitre dès qu'une lecture le touchait. Cocher
Jean 3:16-18 — trois versets sur trente-six — marquait tout Jean 3 comme lu.

**Ce défaut n'était pas corrigeable avant le 31 août** : distinguer « entamé »
de « lu en entier » suppose de connaître la longueur réelle de chaque chapitre,
et cette table est née du correctif du ticket 25. La demande du 9 septembre
devient possible grâce à un correctif de neuf jours plus tôt, ce que ni l'un ni
l'autre n'avait prévu.

La mesure, faite **avant** de proposer quoi que ce soit : sur les 169 chapitres
touchés par le propriétaire, **40 seulement sont entiers** au relevé SQL, et
**38** au calcul juste. 129 sont partiels, soit 76 %, et beaucoup ne portent
qu'un seul verset — `1 Ch 6:76 sur 81`, `2 Ch 7:14 sur 22`, `Ga 3:28 sur 29`.

**C'est ce chiffre qui a écarté le comptage strict.** 40 chapitres au lieu de
169 ramènent du niveau 4 au niveau 2 et font disparaître les badges
« cinquante » et « cent », déjà obtenus — pour le propriétaire comme pour les
trente-trois autres comptes. Retirer une récompense acquise donne exactement
l'envie de tout couper que le 14 août avait relevée à propos des notifications.

Décision du propriétaire : **le nombre garde sa valeur et change de nom**. La
carte annonce « Chapitres entamés · 169 / 1189 », et une ligne dessous dit
« Lus en entier : 38 ». Le niveau et les badges restent sur les entamés ; un
test l'exige, en comparant le nouveau comptage à l'ancien `Set`.

La règle vit dans `lib/progression/chapitres.ts`, et **l'ancien calcul a été
retiré, pas doublé** — le piège 5, rencontré quatre fois.

#### Ma contre-épreuve était circulaire, et c'est le navigateur qui l'a dit

Le module rendait 40 sur les données du relevé SQL, ce que j'ai pris pour un
accord entre deux instruments. L'écran, lui, rend **38**.

L'explication tient à l'agrégation : le SQL réduisait chaque chapitre à
`min(premier)` et `max(dernier)`, c'est-à-dire à un **empan** — un chapitre lu
1-2 puis 4-6 y devenait « 1-6 », donc entier. J'ai ensuite nourri le module avec
cette sortie **déjà aplatie**, et il a naturellement retrouvé le même chiffre.
Le navigateur part des lectures brutes et fusionne réellement les intervalles :
les deux chapitres d'écart sont ceux qui ont un trou au milieu.

**Deux instruments ne se contrôlent que s'ils sont indépendants.** Le second ne
doit pas consommer la sortie du premier, faute de quoi il ne mesure que sa
propre fidélité à une agrégation.

#### Le piège 10, pour la troisième fois

Itérer une `Map` a fait échouer `tsc` quand les quatorze tests passaient déjà
sous vitest. Après un `Set` le 21 août et un `matchAll` le 1er septembre, c'est
la troisième famille. `Array.from` partout.

#### Un libellé pour deux réalités

`progress.chaptersRead` servait aussi d'en-tête à une colonne de l'écran
d'administration — qui affiche `u.readings`, le **nombre de lectures**, jamais
des chapitres. Elle était donc déjà mal intitulée avant la séance. Elle a
désormais sa clé, `admin.colReadings`. C'est la famille de la règle 13 : deux
endroits décrivant des choses différentes sous un seul nom.

### Le texte à lire dans un plan, et ce que le cochage écrivait vraiment

Un jour de plan n'affichait que sa **référence** ; il fallait quitter l'écran
pour lire ce qu'il demandait. La fenêtre est celle de Nouvelle lecture,
`PassagePreview`, dont trois propriétés sont devenues facultatives — un jour de
plan n'a rien à « Modifier », et un jour déjà coché n'a rien à valider.

**Le cochage reste sur la ligne, et ce n'est pas un doublon.** Le bouton de la
fenêtre est `disabled` tant que le texte n'est pas téléchargé : en faire le seul
chemin fermerait le plan à qui lit hors ligne, ce qui est le piège exact du
31 août sur la validation de l'aperçu.

**Le défaut trouvé en chemin est plus grave que la demande.** Un plan daté
« raisonne au chapitre et pose 1:1 » : ses `verseStart` et `verseEnd` sont un
remplissage. Trois conséquences, toutes fausses, et aucune n'avait été vue :

| Endroit | Ce qu'il faisait |
|---|---|
| L'intitulé | annonçait « Genèse **1-4:1** » |
| L'aperçu, tel que je l'avais d'abord écrit | n'aurait chargé que le verset 1 du chapitre 4 |
| `markRead`, **depuis toujours** | enregistrait une lecture s'arrêtant à Genèse 4:1 |

Le troisième est le vrai : cocher un jour de plan écrivait en base une lecture
plus courte que ce que le plan fait lire. Personne ne l'avait vu **parce que la
progression ne regardait pas les versets** — elle les regarde depuis ce jour, et
le défaut serait devenu visible sous la forme d'un dernier chapitre
éternellement « entamé ». Les trois endroits passent désormais par
`bornesReelles`, et la description du jour est **factorisée** avec celle de la
ligne plutôt que recopiée.

Vu à l'écran : « Genèse 1-4 » rend **106 versets** — 31 + 25 + 24 + 26 —, et un
jour non lu offre « Fermer » et « Marquer comme lu », sans « Modifier ».
**Non vu : le cochage depuis la fenêtre**, qui écrirait une vraie lecture dans
les données du propriétaire.

### La barre latérale réduite aux icônes

260 px en permanence sur grand écran, soit un quart d'un écran de 1024. Elle
tient désormais dans **80 px** : icônes seules, libellé au survol et pour les
lecteurs d'écran. Le contenu passe de 1 020 à **1 193 px** sur un écran de 1 280.

Trois choix qui méritent d'être connus :

- **`lg:sr-only` et non `lg:hidden`** sur chaque libellé : il disparaît de
  l'écran, jamais du lecteur d'écran. Vaut aussi pour le numéro de version.
- **`title` plutôt qu'une infobulle dessinée.** La liste porte
  `overflow-y-auto`, qui crée un contexte de rognage sur les **deux** axes :
  une bulle en `absolute` posée à côté de l'icône y serait coupée net, sans que
  rien ne le signale.
- Le tiroir de téléphone est **inchangé** : le rail ne s'applique qu'à `lg`.

#### Une régression introduite, puis trouvée par la mesure

Après passage en rail, les cibles retombaient à **44 × 40 px** — sous le seuil
de 48 que le 2 septembre avait justement établi. Deux causes qu'aucune relecture
n'aurait données : le libellé sorti du flux ne soutenait plus la hauteur, c'était
l'icône de 16 px qui gouvernait ; et **la barre de défilement de la liste prenait
quinze pixels de large**. D'où `lg:min-h-12` et une largeur portée à 80 px.
Relevé après correctif : **19 cibles sur 19 à 48 px ou plus.**

#### Le correctif RTL que ce chantier a mis à découvert

`lg:ml-[var(--nav-width)]` est une propriété **physique**. La barre se place par
`start-0`, donc à droite en arabe — le contenu, lui, restait poussé depuis la
gauche et passait sous la barre. Passé en `ms-`, vérifié en posant `dir="rtl"` à
la main : la marge bascule bien à droite, sans chevauchement.

**Pourquoi ne l'avais-je pas vu le 2 septembre ?** Parce que l'arabe n'avait été
regardé qu'à **375 px**, où `--nav-width` vaut `0px`. C'est « un essai ne prouve
que le chemin qu'il a emprunté », appliqué à ma propre vérification — et la
preuve qu'une revue en RTL doit se faire aux deux largeurs.

### Ce qui n'a pas été vu

Le cochage depuis la fenêtre d'aperçu, pour ne pas écrire dans les données du
propriétaire. Le rail en arabe **avec du texte arabe réel** — seul le sens
d'écriture a été éprouvé, pas le rendu des libellés au survol. Et rien en mode
sombre.

## Le zoom de Safari iOS, ou ce qu'une mesure vide a fait trouver

Signalé le 9 septembre 2026 par le propriétaire du dépôt : à chaque
reconnexion, la page d'accueil choisie — Progression, pour lui — « prend plus
d'espace que d'habitude », et il faut **quitter l'application et la relancer**
pour qu'elle revienne à la normale.

### Deux hypothèses tuées, et une mesure à zéro

L'échelle d'interface d'abord : `applyFonts` retombe sur `normal` (100 %) quand
le réglage manque, ce qui aurait agrandi une interface réglée en `compact`. La
requête l'a écartée en une ligne — **`uiScale` vaut `null`** pour ce compte, donc
le défaut *est* ce qu'il a toujours eu.

Le `data-preset` ensuite, absent sur `/auth/*` puisque `LayoutClient` n'y est pas
monté. Écarté aussi : cet attribut ne commande que la **hauteur minimale** des
boutons et des champs, donc son absence les rendrait plus petits, pas plus
grands.

Puis l'essai décisif, mené sur une session ouverte par le propriétaire : seize
mesures relevées juste après la connexion — style inline de `<html>`, taille de
police calculée, `data-preset`, largeurs, hauteur du document, débordement —,
puis la même page rechargée, et les deux jeux comparés. **Zéro écart.**

**C'est ce zéro qui a fait avancer le diagnostic.** Il disait que la cause tenait
à ce que le panneau n'a pas, et la seule chose qu'un navigateur de bureau n'a pas
est un doigt. Une mesure qui ne trouve rien n'est pas une mesure ratée, à
condition de savoir ce qu'elle élimine.

### La cause, et pourquoi le garde-fou ne couvrait pas le cas

iOS agrandit la page dès qu'on met le doigt dans un champ dont le texte fait
moins de 16 px, et ce grossissement ne se défait pas. Cela explique les trois
symptômes d'un coup : le défaut n'apparaît qu'à la connexion — le seul moment où
l'on tape —, la page est zoomée, et seul un redémarrage la rend à sa taille.

Le dépôt s'en protégeait, mais **par la largeur** :

| Protection | Portée | Pourquoi elle manquait |
|---|---|---|
| `@media (max-width: 767px)` | 16 px sur les champs | un iPad n'y entre pas, ni un iPhone à l'horizontale |
| `[data-preset="smartphone"]` | 16 px | `LayoutClient` n'est pas monté sur `/auth/*` : l'attribut y est absent |
| `[data-preset="tablet"]` | hauteur seule | **n'imposait aucune taille de texte** |

Les trois manquaient à l'endroit exact où l'on saisit son mot de passe. Mesuré en
production à 768 px : les deux champs de `/auth/login` rendaient **15 px**.

**La condition juste n'est pas la largeur mais le tactile** — c'est le doigt qui
déclenche le zoom, pas la taille de l'écran. D'où
`@media (pointer: coarse) { input, select, textarea { font-size: 16px } }`, posé
sur les seuls champs de saisie : un bouton ne reçoit jamais de frappe.

### Ce qui n'est pas vérifié

Le panneau n'émule le tactile qu'**en dessous de 768 px**, largeur où l'ancienne
règle agit déjà. Est donc prouvé que le média s'évalue à vrai sur un appareil
tactile et que la règle est compilée dans la feuille servie ; **n'est pas prouvé
qu'elle est celle qui agit à 768 px et au-delà**. La preuve décisive appartient
au propriétaire, sur son appareil, après déploiement.

## Les plans du lecteur avant le catalogue

Le catalogue passait toujours en premier, avec une raison écrite dans le code :
« c'est la porte d'entrée pour qui n'a encore aucun plan, et elle ne doit pas se
mériter par un défilement ». Elle est juste — **et ne vaut que dans ce cas**.
Dès qu'un plan existe, on vient reprendre sa lecture, pas en choisir une autre.

L'ordre est donc conditionnel, obtenu par `order` sur un conteneur `flex` plutôt
que par un second rendu, et les deux classes sont écrites en toutes lettres de
part et d'autre du ternaire — une classe Tailwind construite à l'exécution
n'existe pas. Le catalogue reste premier tant que la liste est vide : un état
vide placé au-dessus de lui n'aurait rien à montrer.

Vu à l'écran, session ouverte par le propriétaire : trois plans en tête à
y = 124, « Plans proposés » à y = 396.

## Ce que le propriétaire a confirmé le 9 septembre 2026

**Le cochage depuis la fenêtre d'aperçu d'un plan fonctionne.** C'est la réserve
que la livraison du jour portait explicitement : l'agent avait ouvert la fenêtre,
mesuré ses 106 versets et ses deux boutons, mais **n'avait pas cliqué** — le
serveur de développement écrit dans la base de production, et « Marquer comme
lu » y aurait enregistré une vraie lecture dans le plan du propriétaire.

C'est donc une preuve d'écran **qui ne vient pas de l'agent**, et sur le seul
chemin qu'il s'était interdit. Elle rejoint celles des notifications push, du
parcours découverte et de la synchronisation de langue.

### Deux sujets parqués, à ne pas resservir

Ils ne sont pas des réserves ouvertes, et les lister comme telles à chaque
livraison est une friction que ce document doit supprimer.

| Sujet | État |
|---|---|
| La revue de l'arabe, et le rendu RTL des écrans | **En pause depuis le 19 août 2026**, sur décision du propriétaire, rappelée le 9 septembre. Ne pas la relancer, et ne pas la porter en réserve d'une livraison : les fondations logiques sont posées et vérifiées au cas par cas, la revue d'ensemble attendra qu'il la demande |
| La relance des quatre éditeurs de bibles sous droits | **Au 30 septembre 2026**, décidée le 9 septembre. Tout ce qu'il faut est dans `spec/DROITS.md` |

Le mode sombre, lui, reste une réserve ouverte : il n'a fait l'objet d'aucune
décision de mise en pause, et le défaut de `--primary-light` — et de `--primary`
en texte, mesuré à 1,11 — attend toujours un arbitrage du propriétaire.

## Le mode sombre corrigé à la racine — 9 septembre 2026

La dernière réserve ouverte, laissée au propriétaire depuis le 31 août parce
qu'elle changeait l'apparence de plusieurs écrans. Il l'a tranchée : corriger.

### L'audit s'était approché sans tenir la cause

Il visait `--primary-light` et la fonction `applyTheme()`. Deux corrections :

- **`applyTheme` ne pose aucune variable** — elle ne fait que basculer la classe
  `dark`. C'est `applyColorTheme` qui écrit la charte en style inline.
- **Le pire défaut n'était pas le fond mais le texte.** L'audit mesurait 2,15 sur
  un texte gris posé sur `--primary-light`. Le chiffre phare de Progression,
  `text-[--primary]` sur `--surface`, mesurait **1,11**.

Et les deux ne se corrigent pas de la même façon, parce que `--primary` sert aux
**deux rôles** : 65 `bg-[--primary]` avec du texte blanc, 96 `text-[--primary]`.

### Pourquoi une seule valeur ne pouvait pas suffire

Ce n'est pas une appréciation, c'est une arithmétique. Sur `--surface`
(#1e293b, luminance 0,0246), un texte au seuil de 4,5 exige une luminance d'au
moins **0,285** ; porter du texte blanc au même seuil en exige au plus **0,183**.
Les deux intervalles ne se croisent pas.

Les rôles sont donc séparés — **sans toucher aux 161 emplois**, par des remaps
de classes sous `html.dark`, ce qui est l'idiome de la règle 15. Un contrôle a
vérifié qu'aucune couleur n'échappe à ce mécanisme : **zéro** `var(--primary)`
en style inline, **zéro** `stroke` ou `fill` SVG l'employant.

| Variable | Rôle en sombre | Mesuré sur les dix chartes |
|---|---|---|
| `--primary` | inchangée : fond, blanc dessus | 5,90 à 13,12 |
| `--primary-clair` | texte et bordures | **6,60 à 8,17** sur `--surface` |
| `--primary-panneau` | remplace `--primary-light` | texte clair dessus : 7,59 à 7,86 |

Elles sont posées **dans les deux modes**, et c'est essentiel : une variable
définie sous `html.dark` seul reperdrait exactement le combat que ce correctif
répare.

### Deux remaps qui n'avaient jamais rien fait

`--primary-light: #1a2840` et `--accent-light: #1e1a3a` figuraient sous
`html.dark` depuis l'origine. Ce sont **précisément les deux seules variables**
que `applyColorTheme` écrit en ligne — les autres, `--bg`, `--surface`,
`--text`, ne le sont pas et fonctionnaient. `--accent-light` n'étant employée
nulle part dans `src`, elle a été retirée plutôt que corrigée.

### Le bloc ne remappait que les gris

Second défaut, antérieur et d'une autre famille, trouvé en balayant les écrans
plutôt qu'en lisant. Le rouge et le vert traversaient le mode sombre inchangés :

| Élément | Avant | Après |
|---|---|---|
| `text-red-600`, « Cette action est irréversible » | 3,03 | 5,29 |
| `bg-red-500` sous du blanc, « Supprimer mon compte » | 3,76 | 6,47 |
| `text-red-500`, « Déconnexion », sur **tous** les écrans | 3,89 | 5,29 |
| `text-green-600`, « Synchronisé automatiquement » | 4,44 | 6,42 |

### Le test qui avait tort, et ce qu'il a appris

Premier énoncé : « le panneau reste plus sombre que la surface ». Échec sur
turquoise — et c'était **le test**. Il transposait une intuition de mode clair,
où la teinte s'éloigne du blanc dans un seul sens. En mode sombre `--surface`
est déjà plus claire que `--bg` : le panneau est **encadré par deux fonds**, et
s'écarter de l'un le rapproche de l'autre.

Le repère du mode clair — ses propres panneaux tiennent 1,064 à 1,191 contre
leurs fonds — s'est révélé inatteignable pour cette raison. Toutes les parts de
0,40 à 0,86 ont été mesurées : le meilleur écart minimal possible est **1,047**,
atteint à 0,72. La valeur choisie d'instinct était l'optimum, mais rien ne le
disait avant la mesure.

Les 46 tests parcourent `COLOR_THEMES` plutôt que d'énumérer dix couleurs, et
une sonde de contrôle y vérifie l'instrument avant toute conclusion.

### Une sonde à laquelle j'ai fait dire n'importe quoi

Le premier relevé au navigateur annonçait 4,39 sur `--surface`, sous le seuil.
J'y avais **saisi une valeur de `--primary-clair` inventée** — `#9d84a8` — au
lieu de la dériver ; la vraie est `#baa8c2`, et elle donne 6,60. *Se méfier des
mesures que l'on produit soi-même* vaut aussi pour leurs entrées.

### Ce qui a été vu, et ce qui ne l'a pas été

Session ouverte par le propriétaire, mode sombre posé **à la main** pour
n'écrire aucun réglage — la même discipline que le 2 septembre.

| Écran | Textes mesurés | Sous 4,5 |
|---|---|---|
| Progression | 208 | **0** — le chiffre phare passé de 1,11 à 6,60 |
| Réglages | 131 | **0** — les trois panneaux au fond teinté |
| Support | 33 | **0** |

Mode clair vérifié inchangé après coup : le chiffre phare y revient à 13,12.

**Signalé sans être corrigé**, hors du périmètre demandé : en mode **clair**,
`text-orange-500` sur blanc donne **2,80**, sous le seuil de 3,0 applicable aux
grands caractères. Les seize autres écrans n'ont pas été balayés en sombre.

## L'échelle typographique — le dernier des six correctifs de l'audit

### L'audit avait mesuré un écran, et un écran ne dit pas la règle du dépôt

Il annonçait une échelle « presque plate » : quatre tailles, vingt-six éléments
en 14 px sur Nouvelle lecture. Le constat se reproduit — relevé du 9 septembre
2026 : **19 des 21 éléments de texte** de cet écran partageaient une seule
taille, et seule la graisse les distinguait.

Mais le relevé sur **tout** le dépôt dit autre chose, et change la nature du
travail :

| Convention d'intitulé | Occurrences |
|---|---|
| `text-xs` + couleur secondaire — l'intitulé recule | **27** |
| `text-sm` + `text-gray-700` — l'intitulé au rang de la valeur | **34** |

**La moitié du dépôt faisait déjà ce que l'audit recommandait.** Il ne
s'agissait donc pas d'inventer une échelle mais de converger sur celle qui
existe — ce qui est mieux fondé, et ce que l'audit ne pouvait pas voir : il
avait mesuré l'écran qui suit la mauvaise convention.

C'est la leçon du 2 septembre retournée. Là, un `grep` avait sur-compté quand
l'écran mesurait juste. Ici, l'écran a sous-compté quand le relevé voit la
structure.

### L'échelle retenue

Décisions du propriétaire : champs à 16 px, intitulés en minuscules — les
petites capitales que l'audit proposait restent aux 13 étiquettes de
statistiques, courtes par nature —, et un écran témoin avant d'étendre.

| Rang | Classe | px |
|---|---|---|
| Titre d'écran | `text-2xl sm:text-3xl font-bold` | 24 / 30 |
| Titre de section | `text-base font-semibold` | 16 |
| Valeur et champ | `text-base` | 16 |
| Corps, boutons | `text-sm` | 14 |
| Intitulé de champ | `text-xs font-medium text-[--text-secondary]` | 12 |
| Aide | `text-xs text-[--text-secondary]` | 12 |

**La hiérarchie ne vient pas d'avoir agrandi mais d'avoir fait reculer.** Ce
sont les intitulés passés de 14 à 12 px et en couleur secondaire qui créent le
rang, plus que les 16 px des champs. L'audit l'avait vu — « l'intitulé recule,
la valeur avance » — mais son exemple ne montrait que la moitié qui avance.

### Les champs : une règle qui en remplace trois

Les 113 champs n'ont pas été édités un par un. `globals.css` imposait déjà 16 px
sous **trois** conditions — `max-width: 767px`, `[data-preset="smartphone"]`, et
le `(pointer: coarse)` posé le matin même contre le zoom iOS. Une seule règle
inconditionnelle les remplace toutes.

**Le correctif a donc moins de CSS après qu'avant**, et le zoom iOS devient
impossible partout plutôt qu'à trois endroits sur quatre. Les 16 px sont à la
fois le rang de l'échelle et le seuil d'iOS : les deux raisons convergent sur le
même nombre, ce qui n'était pas prévu.

**Un piège retiré du même geste** : `label { font-size: 14px !important }`
existait sous les deux conditions de largeur. Il **écrasait les intitulés à
12 px sur téléphone**, c'est-à-dire exactement là où l'audit avait mesuré la
platitude. Sans son retrait, l'échelle n'aurait rien changé sur mobile — et le
relevé de contrôle l'aurait dit à 375 px, pas à 921.

### Ce qui a été vu, et le défaut que la mesure a écarté

Relevés à **375 px**, la largeur de l'audit :

| Écran | Rangs | Champs | Intitulés | Débordement |
|---|---|---|---|---|
| Nouvelle lecture | **6** (contre 3) | 16 px | 12 px | aucun |
| Réglages | **8** | 16 px | 12 px | aucun |
| Profil | **7** | 16 px | 12 px | aucun |

Sur Réglages, 36 intitulés mesurés, dont **10 modifiés** par ce correctif : le
pire des dix tient **4,83** de contraste. Le seul sous 4,5 était « Activée », à
**4,06** — sa classe ne portait ni `block` ni `font-medium`, donc ce correctif
ne l'avait pas touché.

**Corrigé dans la foulée, à la demande du propriétaire.** C'était
`--text-secondary` sur `--primary-light`, la famille que le 31 août avait
traitée sur le panneau de séance — mais **une seule des douze lignes** était en
cause : le fond teinté n'existe que sur la version par défaut, et sur les onze
autres `--text-secondary` tient 4,83 sur blanc. La couleur suit donc la ligne,
exactement comme l'intitulé voisin une ligne plus haut.

`text-[--primary]` et **non** `text-[--primary] opacity-75`, l'idiome du
31 août : ici l'opacité porterait sur le `<label>` entier, **case à cocher
comprise**, qui serait ternie avec le texte. Ce jour-là elle ne portait que sur
du texte — un idiome ne se transpose pas sans regarder le balisage.

Relevé après correctif, les 36 intitulés dans les deux modes : **zéro sous
4,5**. La ligne teintée passe de 4,06 à **11,02** en clair et tient **7,57** en
sombre, le couple `--primary` / `--primary-light` basculant ensemble depuis le
correctif de mode sombre du même jour.

Non vu : les écrans en mode sombre après ce changement, et rien en arabe.

## Les dix-neuf écrans balayés en mode sombre — 9 septembre 2026

Demandé par le propriétaire du dépôt après le correctif de mode sombre, qui
n'avait porté que sur trois écrans. Mené **en production**, session ouverte par
lui, classe `dark` posée à la main pour n'écrire aucun réglage.

| Écran | Textes mesurés | Sous 4,5 |
|---|---|---|
| Progression | 187 | 0 |
| Administration › utilisateurs | 133 | 0 |
| Réglages | 131 | 0 |
| Détail d'un plan | 51 | 0 |
| Plans de lecture | 47 | 0 |
| Mémorisation | 42 | 1 — **faux positif** |
| Support | 33 | 0 |
| Feuille de route | 22 | 1 — **régression, de mon fait** |
| Nouvelle lecture | 21 | 0 |
| Administration | 20 | 2 — **préexistants** |
| Profil | 19 | 0 |
| Verset du jour | 14 | 0 |
| Mes lectures, Statistiques | 12 chacun | 0 · 2 — **seuil mal appliqué** |
| Recherche, Quizz | 11 chacun | 0 |
| Soutenir | 12 | 0 |
| Messages | 9 | 0 |
| Fonctions avancées | 5 | 0 |

### La régression, et ce qu'elle enseigne sur les remaps

Le remap posé le matin même éclaircissait `text-green-600` et `text-red-500`
**sans regarder ce qu'ils rencontrent**. Or une pastille de statut porte sa
propre paire : un texte foncé sur une teinte claire, `text-green-600` sur
`bg-green-50`. Ces fonds ne sont pas remappés — ce sont des îlots clairs,
cohérents en eux-mêmes. Éclaircir le texte sans toucher au fond les casse :
« Terminé » est passé de **3,15 à 2,18**.

**Un remap se juge sur ce qu'il rencontre, pas sur ce qu'il vise.** Les
pastilles sont désormais exclues par `:not([class~="bg-…-50"])` — `~=` et non
`*=`, qui aurait aussi attrapé `bg-green-500`.

Ce défaut n'était trouvable que par un balayage complet. Les trois écrans du
matin n'en portaient aucune.

### Deux relevés qui ne sont pas des défauts

À ne pas rouvrir.

- **Statistiques, 3,52 et 4,38.** Ce sont des caractères de 30 px en gras, dont
  le seuil applicable est **3,0** et non 4,5. La sonde appliquait un seuil
  unique et surdéclarait.
- **Mémorisation, 1,00.** Un bouton `bg-white/15` posé sur un dégradé émeraude,
  avec du texte blanc. Ma fonction s'arrêtait sur cette couche **translucide**
  en la traitant comme opaque. Même famille que le 1,05 de l'audit du
  2 septembre — le sien remontait trop haut dans l'arbre, le mien s'arrêtait
  trop tôt. **Vérifier l'instrument avant d'accuser l'écran**, dans les deux
  sens.

### Le bloc `html.dark` ne remappait que les gris

C'est le constat qui relie tout : le rouge et le vert le matin, le bleu et le
violet le soir — `text-blue-600` à 2,83 et `text-purple-600` à 2,72 sur
`--surface`, portés à `blue-400` (5,75) et `purple-400` (5,54). **Chaque
balayage y découvre une famille de plus.** La règle 15 se paie par tranches, et
seul un balayage systématique en donne le compte.

### Ce qui reste, et qui est antérieur à tout

Les **pastilles de statut** ont été corrigées dans la foulée, à la demande du
propriétaire, par le remède du 19 août — foncer la couleur jusqu'à franchir le
seuil.

**Trois des six statuts de la feuille de route passaient déjà**, ce que je
n'avais pas supposé : `projet` 5,02, `in-progress` 4,75, `suspendu` 4,84. Mesurer
paire par paire a donc évité de retoucher la moitié de la table pour rien.

| Statut | Avant | Après |
|---|---|---|
| `done` | 3,15 | `green-700`, **4,79** |
| `cancelled` | 3,44 | `red-700`, **5,91** |
| `planned` | 4,39 | `gray-600`, **6,87** |

`cancelled` est la seule paire où un seul cran n'a pas suffi : `red-600` ne rend
que 4,41.

**Une seconde table existait, et le balayage d'écrans ne l'aurait pas trouvée** —
les statuts de ticket, dans `lib/tickets.ts`, dont trois des quatre paires
échouaient. La pire de toutes y était : `open`, `text-yellow-600` sur
`bg-yellow-50`, à **2,84**. C'est le fichier pour lequel `src/lib` avait été
ajouté au scan de Tailwind le 18 août ; sans cela, `text-yellow-700` aurait été
purgée sans que rien ne le signale. **Vérifié après déploiement** : la classe
figure bien dans le CSS produit — le seul contrôle qui vaille pour la règle 14.

Relevé en production, dans les deux modes : « Terminé » 4,79, « Projet » 5,02,
« en cours » 4,75, « Suggestion » 5,02. Identiques en clair et en sombre, ce qui
est la propriété recherchée : une pastille est un îlot, une seule paire sert les
deux thèmes.

## La séance du 15 septembre 2026 : l'orange, puis la piste qu'il a fait voir

Deux demandes du propriétaire, la seconde née de la première. La consigne
était « paire par paire », et elle a décidé de la forme des deux correctifs.

### L'orange de la série, et le cran qui tient des deux côtés

Le chiffre de série de Progression — 30 px en gras, `text-orange-500` sur
blanc — tenait **2,80** en mode clair, sous le seuil de 3,0 des grands
caractères. Signalé le 9 septembre, hors du périmètre ce jour-là.

L'inventaire d'abord : quatre paires sur la carte, et pas une seule couleur.
La palette a été lue dans `node_modules/tailwindcss` plutôt que de mémoire,
et la sonde contrôlée avant toute conclusion — 17,74 sur `gray-900` sur blanc,
la valeur connue ; et 2,80 retrouvé sur le chiffre, celui qu'un autre
instrument avait relevé le 9.

| Paire | Seuil | `orange-500` clair / sombre | Décision |
|---|---|---|---|
| Chiffre, 30 px gras | 3,0 | **2,80** / 5,22 | `orange-600` : 3,56 / 4,11 |
| Icône `Flame` | 3,0 | 2,80 / 5,22 | même ton que le chiffre |
| Barre sur sa piste `gray-100` | 3,0 | **2,55** / 5,22 | `orange-600` : 3,23 / 4,11 |
| Pastille `orange-700` sur `orange-50` | 4,5 | 4,88 / 4,88 | inchangée — mesurée le 19 août |

**Le remède du 19 août a une borne dans l'autre thème.** « Foncer jusqu'à
franchir le seuil » vaut pour une pastille, qui est un îlot : sa paire ne
change pas de mode. Sur un texte posé sur `--surface`, chaque cran gagné en
clair est perdu en sombre — `orange-700` aurait donné 5,18 en clair et
**2,82** sur `--surface`. Un seul cran, `orange-600`, est le seul qui tienne
des deux côtés, et il ne demande aucun remap. Cela ne se voit qu'en mesurant
les deux modes *avant* de choisir ; la recette de `cancelled`, deux crans,
aurait ici déplacé le défaut d'un mode à l'autre.

Vu à l'écran sur le serveur de développement, session ouverte par le
propriétaire, classe `dark` posée à la main : 3,56 / 4,11 sur le chiffre,
sonde `h1` à 16,30, plus aucun `orange-500` dans le DOM. La feuille compilée
portait `orange-600` à `#ea580c` et n'avait plus d'`orange-500` — le contrôle
dans les deux sens.

### La piste, que la capture sombre a montrée

La capture en mode sombre prise pour l'orange montrait autre chose : la barre
de palier flottait sans rail, et celle d'« Ancien Testament » plus bas aussi.
`bg-gray-100` et la carte `bg-white` qui la porte sont tous deux remappés sur
`--surface` — **1,00**. Antérieur à tout, et trouvé parce qu'on regardait
l'écran pour une autre raison.

L'inventaire a décidé du remède. Le dépôt compte huit pistes, qui partagent
l'idiome `bg-gray-100 rounded-full overflow-hidden` et sont toutes posées
sur une carte blanche ; les autres `bg-gray-100` sont des boutons de
Recherche, une pastille de statut, un avatar, un `<pre>` d'erreur. **Un remap
global les aurait atteints**, et aucun relevé de pistes ne l'aurait montré.

La piste est donc devenue un rôle nommé, `--piste`, posé **dans les deux
modes** — l'idiome de `--primary-clair` du 9 septembre, plutôt que celui de la
règle 15 : un remap sous `html.dark` se juge après coup sur ce qu'il
rencontre, une variable se juge à l'endroit où elle est définie. `gray-100`
en clair, à l'identique ; `--border` en sombre.

Mesuré avant de choisir : `--border` rend **1,41** sur `--surface`, plus
visible que le repère clair — 1,10, `gray-100` sur blanc — et déjà la teinte
des bordures de ces mêmes cartes. `slate-600` à 1,93 aurait fait un rail trop
lourd pour un `h-1.5`.

#### Six lignes, soixante-douze pistes

Le `grep` comptait huit lignes. L'écran de Progression en rend **66** — une
par contexte, par catégorie, par livre —, le détail d'un plan 1, Administration
› Acquisition 5. Toutes à 1,10 en clair et 1,41 en sombre, par styles calculés,
classe `dark` posée à la main. C'est le piège du 2 septembre retourné : là un
`grep` sur-comptait, ici il sous-compte, et seul l'écran voit la structure.

#### L'instrument, encore : une page masquée ne se repeint pas

Deux captures identiques et claires après un `scrollTo(0, 0)` et une classe
`dark` posée. La classe tenait — vérifiée toutes les 400 ms pendant 2,4 s,
`body` à `rgb(15, 23, 42)` — et `scrollY` valait 0 quand la capture montrait
1121. **`document.visibilityState` valait `hidden`** : le panneau se déclarait
affiché, le document se savait masqué, et le navigateur ne peint pas ce qu'on
ne voit pas. La capture rend alors le dernier cadre peint, indéfiniment.

Les mesures par styles calculés, elles, ne dépendent pas du peint : les 72
pistes ont été relevées dans cet état. **Les captures sombres de la piste
n'ont pas été prises**, et le propriétaire a demandé de pousser sur la foi
des mesures.

### Le déploiement, vu passer l'un puis l'autre

Sonde sans accent, discriminante dans les deux sens, sur la feuille servie par
`bible-ouverte.vercel.app` :

| Essai | Feuille | `--piste` | `.bg-[--piste]` | `orange-500` | `orange-600` |
|---|---|---|---|---|---|
| 1 | `f277f675…` | absente | absente | 0 | `#ea580c` |
| 2, 45 s plus tard | `f75e1e22…` | `#f3f4f6` et `#334155` | compilée | 0 | `#ea580c` |

Le premier essai est `adfd835` déjà en ligne, le second `344a9ca`. Le hachage
neuf dit qu'il y a eu un déploiement ; le contenu dit lequel.

### Ce qui n'a pas été vu

L'écran de production lui-même, dans une session, après ces deux
déploiements — seule la feuille servie l'a été. Les captures de la piste en
sombre, pour la raison dite plus haut. Et rien en arabe.

### Relevé en chemin, laissé en l'état

Trois défauts de remplissage, mesurés paire par paire et non corrigés,
antérieurs à cette séance :

| Remplissage | Où | Mesure |
|---|---|---|
| `bg-[--primary]`, sans texte dessus | détail de plan, Acquisition | **1,27** sur la piste et 1,11 sur la carte en sombre |
| `bg-gray-300`, provenance inconnue | Acquisition | **1,34** sur la piste en clair, 7,03 en sombre |
| dégradés `to-orange-400` / `to-orange-500` sous du blanc | Quizz, Verset du jour | environ 2,2 au calcul, non mesurés à l'écran |

Le premier mérite une phrase : le 9 septembre a séparé les rôles de
`--primary` en texte et en fond-sous-du-blanc. **Un remplissage qui ne porte
rien est un troisième rôle**, que ni `--primary` ni le remap de texte ne
servent — sur la charte du propriétaire, `rgb(74, 26, 94)`, la barre est de la
couleur de la carte. `--primary-clair` tient 6,60 sur `--surface` et serait la
piste. Les catégories de Progression, en couleurs inline, portent la même
famille : `rgb(109, 76, 65)` rend 1,36 sur la piste en sombre.

## Le 15 septembre, seconde partie : les remplissages, et le dégradé mesuré au coin du texte

« Corrige », après la liste des trois remplissages relevés en chemin. Trois
commits — `04c3e71`, `19bbc24`, `619ce72` — et le troisième répare une sonde
que le deuxième avait désarmée.

### Le remplissage d'une barre est un troisième rôle de `--primary`

Le 9 septembre avait séparé deux rôles en sombre : le texte, remappé sur
`--primary-clair`, et le fond sous du blanc, inchangé. Une barre de
progression est un fond qui ne porte rien, et aucun des deux ne la servait.

La mesure a été faite **sur les dix chartes plus la personnalisée**, et non
sur la seule charte du propriétaire — c'est ce qui change une observation en
règle : `--primary` en remplissage rend de **1,02 à 1,76** sur la piste en
sombre, pour toutes ; `--primary-clair` y tient 4,67 à 5,77, et 6,60 à 8,15
sur la carte. D'où `--remplissage`, posée dans les deux modes comme `--piste`
et pour la même raison, `var(--primary)` en clair et `var(--primary-clair)`
en sombre. Elle s'appuie sur la variable que `applyColorTheme` pose en ligne,
comme les remaps de `text-[--primary]` s'y fient déjà.

La provenance inconnue d'Acquisition, en `bg-gray-300`, rendait 1,34 en
clair. **Aucun gris Tailwind ne sert les deux modes** — `gray-400` 2,31 /
4,08, `gray-500` 4,39 / 2,14 — quand `--text-secondary`, déjà posée dans les
deux, tient 4,39 et 4,04. Vu dans les deux modes sur les deux écrans,
captures prises : le panneau était `visible` cette fois.

### Un dégradé n'a pas une couleur, il en a une par point

Le bouton « Commencer une partie » de Quizz posait du blanc sur
`to bottom right`, du violet 600 à l'orange 400 en passant par le fuchsia
500. Le blanc tient 5,70 sur le premier arrêt et 2,26 sur le dernier : la
seule question est **où passe le texte**, et la ligne de dégradé de
`to bottom right` dépend du rapport largeur/hauteur de la boîte — donc de
l'écran, et de la langue qui décide de la longueur du texte.

Le calcul, au pire coin du texte français : 3,89 sur le titre et 3,43 sur
l'aide à 745 px ; **3,41 et 2,65 à 343 px**, l'aide étant en blanc à 80 %,
qui laisse passer le fond.

#### Deux instruments corrigés avant de conclure

- Tailwind range le `via` dans `--tw-gradient-stops`, pas dans une variable
  dédiée : la première lecture n'a vu que deux arrêts sur trois. Lire
  `background-image` calculé, qui porte les trois résolus — et un `via` sans
  position vaut 50 %.
- C'est le rectangle du **texte** qu'il faut, par un `Range`, et non celui
  du `<p>`, qui occupe toute la largeur du bouton.

#### Le remède est cherché, pas choisi

Parmi les dégradés violet / fuchsia / orange de Tailwind, le plus proche de
l'actuel qui tienne 4,5 **au pire cas** — texte sur toute la largeur, aide
sur deux lignes, ce que l'espagnol ou l'italien peuvent produire à 343 px —
et sous `hover:brightness-105`, qui éclaircit le fond au survol :

| Dégradé | Repos | Survol |
|---|---|---|
| actuel | 2,64 | 2,40 |
| fuchsia 600, orange 700 | 4,88 | **4,49** |
| fuchsia 700, orange 700 | 5,71 | 5,28 |

Le premier candidat échoue au survol d'un centième. Et **aucun ne passait
avec l'aide à 80 %** : l'opacité est le premier défaut, le dégradé le second.
L'aide est opaque.

La carte de résultat porte le même dégradé et suit. Son bouton « Rejouer »
avait un voile `bg-white/15 hover:bg-white/25` : **un voile blanc qui
s'épaissit au survol éclaircit le fond sous du texte blanc** — 3,84 au
calcul, à l'endroit même où l'utilisateur regarde. Un voile noir fait
l'inverse. Cet écran n'a pas été vu par l'agent : il ne s'affiche qu'après
une partie, qui s'écrit en base.

Vu aux deux largeurs sur le serveur de développement : 6,03 / 6,23 à 745 px,
6,04 / 6,12 à 343 px, au pire coin du texte réel.

Non touchés, décoratifs — un libellé porte le sens à côté : les carrés
d'icône ambre-orange de Quizz et du Verset du jour, dont l'icône blanche
tient 1,90 au pire coin.

### Un commentaire n'est pas hors du scan de Tailwind

La sonde de déploiement a trouvé les deux anciennes classes **encore
compilées** en production, alors que plus aucun composant ne les portait.
Elles survivaient dans le commentaire qui expliquait leur retrait : Tailwind
lit les fichiers scannés comme du texte, et un nom de classe écrit dans un
commentaire est généré comme un autre. C'est le corollaire inverse de la
règle 14 — une classe construite à l'exécution n'existe pas, **une classe
écrite dans un commentaire existe**. Sans dégât, sinon quelques octets ; mais
cela désarme la sonde « clé retirée qui disparaît », la moitié la plus
probante du contrôle.

Le commentaire nomme désormais les teintes en prose. Vérifié **à froid** par
le CLI de Tailwind sur `tailwind.config.ts` : le serveur de développement
garde toute classe déjà générée dans la session et ne sait pas montrer une
suppression. Les deux classes tombent à zéro, les nouvelles restent.

### Trois instruments pris en défaut dans une seule sonde de déploiement

Aucun n'accusait l'écran, et tous les trois ont d'abord dit « absent » ou
« zéro » sur des clés dont la présence était acquise — ce qui est le signal.

| Instrument | Défaut | Comment il s'est vu |
|---|---|---|
| `head -1` sur les feuilles de `/` | la page en charge désormais **deux**, et la sonde lisait la première, 10 Ko, propre à la présentation | `--piste`, connue présente la veille, « absente » |
| `for f in $feuilles` sous **zsh** | zsh ne découpe pas une variable non citée sur les sauts de ligne — les deux chemins passés en un seul, `curl` rend vide sans erreur | tout à zéro, y compris `--remplissage` que la feuille précédente portait |
| le serveur de développement | accumule les classes générées, ne montre jamais une suppression | `via-fuchsia-500` encore là après retrait du commentaire |

Relu correctement, sur `c7499bb3…` : les clés retirées à 0, `via-fuchsia-700`
à 1, `--remplissage` à 2, `bg-black/25` au survol à 1. Le hachage neuf dit
qu'il y a eu un déploiement ; le contenu dit lequel.

### Ce que le propriétaire a vu

**Il a regardé la production après les trois déploiements et a dit « c'est
bon »**, sans détailler les écrans. C'est une preuve d'écran qui ne vient pas
de l'agent, et elle couvre potentiellement le seul chemin qu'il s'était
interdit — l'écran de résultat de Quizz, après une partie.

### Ce qui reste, mesuré et non corrigé

| Élément | Mesure | Nature |
|---|---|---|
| Couleurs de catégorie de Progression, en style inline | `rgb(109, 76, 65)` à 1,36 sur la piste en sombre | palette de sept couleurs, une table |
| Bouton `bg-white/15` de Mémorisation, sur son dégradé émeraude | non mesuré ; même famille que « Rejouer » | le faux positif du 9 septembre en cachait peut-être un vrai |
| Graphique « Inscriptions par mois » d'Acquisition | barres presque effacées en sombre sur la capture | remplissage Recharts, à mesurer |
| Carrés d'icône ambre-orange | 1,90 au pire coin | décoratifs, un libellé porte le sens |

## Le 15 septembre, troisième partie : un passage de son choix en mémorisation

Demande du propriétaire : en plus du verset au hasard, mémoriser un passage
choisi — un verset ou un groupe de versets — avec le sélecteur commun de
l'application. Un commit, `f0448a4`, et une migration appliquée en production.

### La décision qui a tout commandé n'était pas d'interface

Une ligne par groupe, ou une par verset. Elle s'est prise en lisant la table
avant tout composant : `memorised_verses` ne portait qu'un verset par ligne,
et une ligne par verset aurait fait réviser Psaume 23 en six séances sans
lien, chacune à son niveau et à son échéance. **Un groupe de versets est un
seul texte appris, donc une seule ligne.** Tout le reste en découle, dans cet
ordre : la migration, l'unicité, le type, les deux stores, deux fonctions
pures, l'assemblage du texte. Le sélecteur commun, lui, n'a coûté qu'un
renommage.

### La migration, et le nom qu'il fallait citer

`20260915120000_memorised_verse_ranges.sql` ajoute `chapterEnd` et
`verseEnd`, remplies avec le verset de chaque ligne — aucune ne change de
sens —, pose une contrainte d'ordre, et fait passer l'unicité du verset de
départ à l'intervalle entier : Jean 3:16 et Jean 3:16-17 sont deux textes.

Deux relevés faits avant d'écrire, et non supposés :

- `authenticated` a l'`UPDATE` **au niveau table**, par
  `information_schema.table_privileges` — donc aucun `grant` colonne, comme
  `readings` et à l'inverse de `profiles` et `messages`.
- L'ancienne contrainte s'appelle
  `memorised_verses_user_id_book_chapter_verse_versionId_key`, **avec la
  majuscule de `versionId`**, relevée dans `pg_constraint`. Un `drop
  constraint if exists` sans guillemets aurait replié le nom en minuscules,
  *réussi* sans rien supprimer, et laissé l'unicité de départ en place :
  Jean 3:16-17 aurait été refusé après Jean 3:16, sans message exploitable.

Appliquée par l'outil MCP, comme le 18 août, après accord du propriétaire.
Relu après coup : l'ancienne unicité a disparu, la nouvelle et la contrainte
d'ordre sont là, les deux colonnes `not null`, **7 lignes sur 7** avec leur
fin égale à leur début, journal à `20260915123038` — 30 fichiers, 28
enregistrées, l'écart étant toujours celui du 9 août.

### Ce que `tsc` a trouvé, et pourquoi le champ est obligatoire

`chapterEnd` et `verseEnd` sont obligatoires dans `MemorisedVerse`, pas
facultatifs. C'est ce qui a fait trouver le **sixième point de création** — le
bouton d'un candidat de « Parmi tes lectures » —, que j'avais laissé. Un
`chapterEnd?` l'aurait laissé écrire des lignes sans fin d'intervalle, que
PostgREST aurait refusées en silence derrière une écriture locale réussie.
Le cache local, lui, normalise à la lecture les lignes d'avant la migration.

Deux fonctions pures dans `lib/memorisation/revision.ts`, huit tests :
`memeIntervalle`, parce que la page et le store comparaient chacun à leur
façon — le piège 5, une comparaison de plus à oublier d'un côté — et
`texteDe`, qui joint les versets d'un groupe sans leur numéro : un numéro
n'est pas un mot à retrouver.

`PlanEntryAdder` devient `PassageAdder`. Il faisait exactement le geste
demandé — livre, puis chapitres et versets dans la même fenêtre — mais son nom
disait « plan », et un nom qui ment se paie plus tard. Deux libellés
facultatifs ; le détail de plan garde les siens. Trois clés dans les cinq
dictionnaires, dont un message pour la séance qui ne trouve pas son texte —
elle se taisait, et un bouton muet passe pour cassé.

### Ce qui a été vu, sur le compte du propriétaire, sans trace

Le serveur de développement écrit dans la base de production ; l'essai a donc
été un aller-retour. Psaumes 23:1-3 posé par la fenêtre — **6 versets
proposés pour le Psaume 1**, la versification réelle et non les 200 du repli
—, la ligne 41 écrite avec `23:1 → 23:3` et `ls1910`, « 1 à revoir
aujourd'hui », la séance **d'entraînement** sur les trois versets assemblés
en un texte, onze mots masqués, référence « Psaumes 23:1-3 ». Puis le retrait
par le bouton de la liste : ligne disparue, table revenue à 7 lignes,
**aucune séance écrite** — vérifié dans `game_sessions`.

Le détail de plan compile et se sert toujours ; l'erreur de console sur
`PlanEntryAdder` datait du renommage lui-même, le graphe du serveur de
développement l'ayant gardée.

**Le propriétaire a regardé la production et a dit « c'est parfait ».**

### Ce qui n'a pas été vu

Une séance **réelle** terminée sur un groupe — elle écrirait niveau et
échéance dans ses données —, et un groupe qui enjambe un chapitre : le
sélecteur le permet, la base et `getPassagesForRange` le savent, personne ne
l'a exercé. Les captures du panneau sont restées un état en arrière,
`visibilityState` à `hidden` de nouveau.

### La sonde de déploiement, et quatre instruments pour une clé

Une clé de dictionnaire vit dans un chunk **partagé**, que `/auth/login` —
page traduite et publique — charge sans session : c'est de là qu'on la sonde.
Une classe de composant, non : elle vit dans le chunk de route. Et le App
Router n'écrit pas de `buildId` dans le HTML ; le manifeste de build n'est
pas atteignable par ce chemin. **Faux, corrigé le 16 septembre** : il y est,
dans le flux RSC de `/` — voir la séance du 16.

Pour y arriver, quatre instruments se sont succédé, et trois ont cédé :
**zsh** ne découpe pas `$var` sur les sauts de ligne et s'étrangle sur du
minifié (« character not in range ») ; **Node** ne voit pas le mandataire du
bac à sable ; **`urllib`** lit incomplet derrière lui. Seul **`curl`**
traverse proprement, et la boucle demande `bash` explicitement. La
combinaison qui tient : `curl` télécharge, Python lit des fichiers.

Résultat : `mettreEnApprentissage` cinq fois dans `5954-51fe5ec2…`, avec les
cinq valeurs — français, anglais, espagnol, italien, arabe.

## La séance du 16 septembre 2026 : un groupe qui enjambe, et les couleurs choisies pour aucun mode

Deux points de la liste du 16 : voir une séance *réelle* sur un groupe et un
groupe à cheval sur deux chapitres (point 2), puis les quatre restes de
contraste (point 3). Trois commits — `6063c17`, `1fe6a19`, et celui-ci.

### Le groupe qui enjambe, vu de bout en bout et effacé

Sur le serveur de développement, session ouverte par le propriétaire.
L'état relevé avant d'écrire : 7 lignes dans `memorised_verses`, dernier
`id` 38 ; 111 lignes dans `game_sessions`, dernier `id` 113, dont 17 de
mémorisation.

**Psaumes 23:6 – 24:2** posé par la fenêtre — 6 versets proposés pour le
Psaume 23, 10 pour le 24, la versification réelle. La ligne **43** écrite
avec `23:6 → 24:2` : la contrainte d'ordre accepte `verse 6 > verseEnd 2`
parce que les chapitres diffèrent, ce qu'elle promettait. Puis « Réviser »,
pas « S'entraîner » : les trois versets assemblés en un texte à travers la
jonction — « …Jusqu'à la fin de mes jours. Psaume de David. A l'Eternel la
terre… » —, 55 mots, aucun masqué au niveau 0. « J'ai terminé » : 100 %,
« acquis d'un cran de plus », prochaine révision le jeudi 17. En base, à
133 ms d'écart : la ligne 43 au **niveau 1, échéance 2026-09-17**, et la
séance **114** (`memorisation`, 0/0, `details` portant `chapterEnd 24,
verseEnd 2`).

L'effacement : la ligne par le bouton de la liste, la séance par un `delete`
SQL relu avant et prouvé par `returning`. Base revenue à 7 / 111 / 113. Un
second aller-retour, plus court — Genèse 9:23 au hasard, séance 115 —, pour
voir la date formatée ; effacé de la même façon. **Aucune trace des deux.**

#### Deux choses que seule une séance réelle montre

- **La liste écrivait « À revoir le 2026-09-17 »**, la date ISO brute, là où
  le bilan disait « jeudi 17 septembre » : `revoirLe` recevait `v.prochain`
  sans `formatDate`. Invisible tant qu'aucun passage n'a été révisé — les
  lignes neuves sont dues le jour même. Corrigé dans `1fe6a19`, vu à
  l'écran : « Genèse 9:23 · À revoir le 17 septembre · Niveau 1/4 ».
- **Le sélecteur écrit « Psaumes 23-24:6-2 »** pour un intervalle à cheval,
  et la liste de mémorisation aussi. `describeRange` compose chapitres et
  versets séparément — ce qui vaut sur un même chapitre et ne dit plus à quel
  chapitre appartient quel verset dès qu'on en change. **Ce n'est pas un
  accident du 15 septembre** : `referenceDe` dans `lib/lectures/saisies.ts`
  fait exactement la même chose pour l'historique (« Jean 3-4:1-5 »), depuis
  août, et un commentaire documente la forme. C'est donc la convention de
  l'application, en double — le piège 5 —, et la changer pour l'écriture
  usuelle « Psaumes 23:6-24:2 » touche Nouvelle lecture, Recherche, les
  plans, l'historique et Mémorisation. **Non fait : décision de produit,
  soumise au propriétaire.**

### Les couleurs qui n'ont été choisies pour aucun mode

Le reste du 15 disait « `rgb(109,76,65)` à 1,36 sur la piste en sombre » et
parlait de catégories. La mesure a dit autre chose : ce sont les **contextes**
— couleur choisie par l'utilisateur, douze par défaut, `#6d4c41` est
« Bible » — et **les deux modes échouent, pas seulement le sombre**.

| Couleur | Clair, sur `gray-100` | Sombre, sur `--border` |
|---|---|---|
| Méditation `#2ecc71` | **1,91** | 4,93 |
| Radio `#f39c12` | **1,99** | 4,72 |
| Autre `#95a5a6` | **2,32** | 4,05 |
| Bible `#6d4c41` | 6,91 | **1,36** |
| Podcast `#c0392b` | 4,94 | **1,90** |
| Prédication `#9b59b6` | 4,24 | **2,22** |

Huit sur douze sous 3,0 en clair, sept en sombre, et les deux constantes de
catégorie (`#16a34a` 2,99 / 3,14, `#4a90d9` 3,04 / 3,10) au fil du rasoir.
**Aucune part fixe ne remédie à une couleur arbitraire** : les 62 % vers le
blanc de `--primary-clair` sauvent les douze en sombre, mais un jaune pâle
éclairci reste pâle, et en clair il faudrait 44 % vers le noir pour
garantir n'importe quelle couleur — ce qui rend le brun de « Bible » noir.

Le remède retenu, `remplissageLisible` dans `lib/themes.ts` : pousser la
couleur **du minimum nécessaire**, par pas de 5 %, vers le noir en clair et
vers le blanc en sombre, jusqu'à 3,0 sur la piste — et la laisser telle
quelle si elle tient déjà. Bible reste `#6d4c41` en clair et devient
`#a08b84` en sombre (3,22) ; Méditation reste `#2ecc71` en sombre et devient
`#239955` en clair (3,31). La piste est la contrainte qui lie : en clair la
carte est plus claire qu'elle, en sombre plus sombre, si bien que se
détacher de la piste suffit.

**Le composant ne sait pas dans quel mode il est rendu, et n'a pas à le
savoir** — c'est ce qui compte pour le mode « Système ». Il pose les deux
teintes en variables inline (`--teinte-claire`, `--teinte-sombre`), et
`.remplissage-teinte` de `globals.css` retient l'une ou l'autre sous
`html.dark`. Une couleur posée directement en `background-color` inline
aurait battu toute feuille — le défaut du 9 septembre, évité ici dès la
conception.

`contraste` sort de l'exécution ; le test garde sa propre sonde, comme
avant — deux instruments ne se contrôlent que s'ils sont indépendants. 36
tests : les douze contextes **lus dans `seed.ts`**, désormais exporté,
plutôt que recopiés ; les deux catégories ; blanc, noir, jaune pâle.

Vu sur Progression, par styles calculés, classe `dark` posée à la main :
**22 barres, ≥ 3,04 en clair, ≥ 3,05 en sombre**, sonde `h1` à 16,30. Les
quatre contextes personnels du propriétaire en `#6366f1` sont pris (3,26 en
sombre). Captures des deux modes prises — le panneau était `visible`, et il
se repeignait.

### Les trois autres restes

- **Acquisition** : pas du Recharts, des `div` en `bg-[--primary]` posées à
  même la carte, sans piste. 1,11 en sombre ; `--remplissage`, le rôle du 15,
  donne **13,12 / 6,60**. Vu dans les deux modes.
- **Mémorisation** : la famille de « Rejouer », et le faux positif du 9
  cachait bien un vrai. Le blanc tenait **2,54** sur le premier arrêt du
  dégradé de rang 500, 2,21 pour l'aide à 85 %, et le voile blanc du bouton
  l'abaissait encore (2,22 au repos, **2,03** au survol). Le petit texte est
  au coin du premier arrêt : un cran de 600 (3,77) n'aurait pas suffi, les
  trois arrêts passent au rang 700, l'aide est opaque, les voiles noirs.
  Mesuré au pire coin du rectangle du texte réel, par `Range` : 5,48 / 5,48
  à 793 px, 5,49 / 5,48 à 343 px sur la carte de tête ; **5,44 à 5,46 sur la
  carte de bilan**, vue grâce à la séance réelle ; boutons 6,95 au repos,
  8,21 au survol.
- **Les carrés d'icône** ne sont pas touchés : décision acquise, un libellé
  porte le sens à côté.

### La compilation à froid, avant de pousser

Le serveur de développement ne sait pas montrer une suppression (piège 25) ;
la feuille compilée par le CLI de Tailwind sur `tailwind.config.ts` dit ce
que la sonde de déploiement devra discriminer : `via-teal-700`,
`to-cyan-700`, `from-emerald-700` à 1, `.remplissage-teinte` à 2 ; les
classes retirées — le teal et le cyan de rang 500 en `via` et `to`, les deux
voiles blancs, le blanc à 85 % — à **0**, et la sonde elle-même contrôlée sur
`bg-black\/15`, présent, qui rend 1.

### L'écriture usuelle, décidée et faite

« Pousse et passe à l'écriture usuelle partout. » Les trois commits sont
partis (`c11a90d`), puis `ecrireReference` dans `lib/lectures/reference.ts`
a remplacé les **trois** écritures à la main — la troisième, dans le
dialogue d'ajout de Recherche, n'était apparue dans aucun `grep` sur les
deux noms de fonction : c'est en cherchant l'idiome `chapterEnd !==
chapterStart` qu'elle s'est vue. « Jean 3:16 », « Jean 3:16-18 »,
« Jean 3:16-4:2 » ; `describeRange` garde son nom, neuf écrans l'importent.
Le test de l'historique figeait « Jean 3-4:16 » — un seul verset sur deux
chapitres, ce qui ne veut rien dire — et attend « Jean 3:16-4:16 ».

Vu : « Psaumes 23:6-24:2 » en tête de la fenêtre du sélecteur, sans rien
enregistrer ; « Tite 1:1-3:15 », « 2 Timothée 1:1-4:22 » sur l'historique.
Les lectures d'un plan daté y rendent « Genèse 17:1-20:1 » : leur `verseEnd`
à 1 est le remplissage connu, que l'ancienne écriture exposait de même
(« Genèse 17-20:1 »). Écrire « Genèse 17-20 » pour des chapitres entiers
demanderait de reconnaître ce remplissage comme `bornesReelles` le fait
dans le détail de plan — non fait, non demandé.

Les deux formatteurs restants n'écrivent que des chapitres, à raison : la
liste des dernières lectures d'une fiche d'administration et les plans datés
(« Genèse 1-3 »).

### Deux déploiements, et l'instrument qui a menti le 15

Le premier push (`c11a90d`) s'est sondé comme d'habitude, sur les deux
feuilles de `/` : les trois arrêts du rang 700 et `.remplissage-teinte`
présents, les cinq classes retirées à **0**, `--piste` (4) et `bg-black\/15`
(1) en contrôle. Le second (`c5b3113`) ne change que du JavaScript, dans
des chunks de route qu'aucune page publique ne charge, et le MCP Vercel
répond **403** sur cette équipe.

**Le `buildId` est dans le HTML de `/`** — `buildId\":\"h9NqeKTKtAtc…` dans
le flux RSC —, ce que la note du 15 septembre niait : elle l'avait cherché
ailleurs. Il ne dit pas *quel* commit est servi, mais il change à chaque
déploiement : `h9NqeK…` à 17:28 UTC, quand la feuille était déjà celle du
premier push, puis `ervnNE6…` à 17:39. Deux pushes, deux identifiants,
dans l'ordre — le second est `c5b3113`. C'est une preuve par élimination,
et elle vaut ce que vaut son inventaire : elle tiendrait moins avec un
troisième push entre les deux relevés.

**Ne pas lancer `npm run build` à côté du serveur de développement.** Les
deux écrivent dans le même `.next` ; la compilation lancée pour lire le
nom haché des chunks de route s'est figée après une minute, et le serveur
de développement répondait 500 derrière elle. Arrêtée, `.next` retiré,
serveur relancé, session intacte. La lecture des hachages locaux reste une
piste pour sonder un chunk de route — dans un clone séparé, ou le serveur
arrêté.

### « Genèse 17-20 » : une règle d'écriture, une réparation, et un piège trouvé en chemin

« Écris Genèse 17-20 pour les chapitres entiers. » La règle, dans
`ecrireReference` : du premier verset au dernier du chapitre de fin **ou
au-delà** — les anciens replis à 200, « Psaumes 65:1-20 » pour 13 versets,
sont des chapitres entiers, pas des intervalles. « Tite 3 », « Tite 1-3 » ;
« Psaumes 40:1-12 » reste en versets, à raison. La versification est celle de
Louis Segond, repli assumé : une version qui compte moins verra sa lecture
entière écrite en versets, défaut d'écriture et non de comptage.
`describeRange` reçoit le code du livre, `tsc` a nommé les onze appels.

**La règle ne suffisait pas**, et c'est la base qui l'a dit : « Genèse
17:1-20:1 » n'est pas une écriture, c'est `verseEnd = 1` — le remplissage des
plans datés d'avant le 9 septembre. Mesuré sur les 745 lectures : **111**
portent `1:1`, dont **108** reconnaissables sans doute par le contexte « Plan
de lecture » **et** la note « Plan : … » — 7 comptes, 33 livres, jusqu'à des
dates d'octobre. La migration `20260916120000_plan_readings_last_verse`,
première migration de **données** du dépôt, leur donne le dernier verset réel
par la table que `bornesReelles` emploie pour les lignes neuves. Compte à
blanc de la clause `where` avant, trois témoins relevés, puis appliquée sur
accord : 108 modifiées, témoins justes (Genèse 8 → 22, 12 → 20, 16 → 16),
43 lignes `1:1` restantes toutes hors critère, journal à 29. Effet double :
l'écriture, et la progression, qui tenait ces derniers chapitres pour
entamés.

**Les trois lignes hors critère ont appris quelque chose.** `877`
« Colossiens 3:1-4:1 » et `884` « Osée 14:1 », créées les **14 et 15
septembre** par un lecteur, séance « Plan Roberts », à la main — donc après
le correctif du 9. Le sélecteur posait `1:1` dès qu'on touchait un chapitre,
et valider sans toucher aux versets enregistrait le premier verset seul. Les
**39** lectures `1:1` hors plan — « Marc 16:1 » ×4, « Ésaïe 53:1 » — ont
probablement la même origine, et ne se distinguent pas d'un vrai verset 1 :
non touchées. Un « 1:1 » a trois sens, et un seul laisse une trace en base.

Le correctif, `chapitreEntier` dans `features/bible/versets.ts` : un chapitre
touché est posé **en entier**, par le cache ou par la table, l'intervalle qui
se ferme va au bout de son dernier chapitre, un effet suit le cache quand il
répond après coup, et les quatre écrans qui remettaient `1:1` au choix du
livre partent du chapitre 1 entier. Vu sur Nouvelle lecture, le geste exact du
14 septembre — Colossiens, 3, 4, valider : « Colossiens 3-4 », premier verset
1 et dernier verset 18 déjà posés, l'aperçu titré de même. Rien enregistré :
745 lectures avant, 745 après.

### Le troisième push, et le `buildId` qui a changé deux fois

`e7771c4` poussé à 18:05 UTC. La sonde a vu le `buildId` passer de
`ervnNE6…` à `NwSnFG…` à 18:07:29, **puis à `2kfltc…` à 18:08:31**. Deux
changements pour les deux pushes faits depuis le relevé précédent — les docs
de `c76e32e`, dont la construction avait attendu dix-huit minutes, puis
celui-ci. C'est exactement la réserve écrite plus haut qui s'est produite :
sans le second relevé, le premier changement aurait été pris pour le bon.
**Attendre un second changement avant de conclure, quand un push s'est
intercalé.** Vu sur l'historique du propriétaire, serveur de développement :
« Genèse 17-20 — Plan : 2026 (jour 5) » à la place du « 17:1-20:1 » du
matin.

### Ce qui n'a pas été vu

La production à l'écran, dans une session, après les déploiements — seules la
feuille et le `buildId` l'ont été. Rien en arabe. La progression des sept
comptes réparés, elle, a été relue le soir même — voir ci-dessous.

## Le 16 septembre, au soir : la progression après la réparation

La séance du 16 laissait une chose non regardée : l'effet de la migration
`plan_readings_last_verse` sur l'écran Progression, que le code promettait
— cinq chapitres passant d'« entamé » à « lu en entier » — et que personne
n'avait vu. Relu sur le compte du propriétaire, le seul des sept dont la
session était ouverte.

**La prédiction d'abord, par le module de l'écran lui-même.** Les 294
lectures du compte, lues en base, passées à `compterChapitres` de
`lib/progression/chapitres.ts` — le fichier copié tel quel, une ligne
changée pour l'alias `@/`, exécuté par Node 22 qui dépouille les types.
Deux fois : sur la base d'aujourd'hui, et en remettant `verseEnd = 1` sur
les cinq lignes « Plan : 2026 ».

| | Entamés | Lus en entier |
|---|---|---|
| Avant la migration | 184 | 42 |
| Après | **184** | **47** |

**Puis l'écran**, serveur de développement, session du propriétaire,
`visibilityState` relevé à `visible` : « 184 / 1189 », « Lus en entier :
47 », Genèse « 20 / 50 », niveau 4 « Dévoué » à 184 / 250. Capture prise.

Deux choses que la relecture établit au-delà du chiffre :

- **Le gain est de +5 exactement**, un par ligne réparée : les chapitres 4,
  8, 12, 16 et 20 de Genèse n'étaient couverts par aucune autre lecture
  allant jusqu'au bout. Un compte où une lecture couvrait déjà l'un de ces
  chapitres gagnerait moins que ses lignes réparées — c'est la fusion des
  intervalles, pas un défaut.
- **Le niveau et les badges n'ont bougé pour aucun des sept**, et cela se
  démontre sans les relire : `couvertureDe` indexe par `livre:chapitre`, et
  `verseEnd` n'entre jamais dans cette clé. Une migration qui ne touche que
  `verseEnd` ne peut changer qu'`entiers`. Les six autres comptes (56, 16,
  15, 13, 2 et 1 lignes réparées) n'ont pas été vus à l'écran ; leur
  `entames` est intact par construction, leur `entiers` a grandi d'au plus
  autant.

Le port 3000 était tenu par une autre conversation : `autoPort` posé dans
`.claude/launch.json` — ignoré par git —, le serveur a pris le 58465. Rien
dans le dépôt n'exige le 3000 : la connexion se fait par mot de passe, sans
redirection vers `localhost`.

Sur qui l'a vu : l'agent, sur le serveur de développement. La production
après les trois déploiements du 16 reste non vue dans une session.

## Le 16 septembre, au soir : les couleurs de contexte hors Progression

Le point 5 de la liste parlait de « pastilles, points dans l'historique et
la barre latérale ». **L'inventaire les a démentis** : l'historique montre un
contexte par son emoji et son nom, la barre latérale n'en porte aucune
couleur, `ContextPicker` ne fait que poser `#6366f1` à la création. Une
couleur de contexte n'est rendue inline qu'en deux endroits — les barres de
Progression, corrigées la veille, et le graphique « Répartition par
contexte » de Statistiques, un `<Cell fill={ctx.color}>` Recharts. Chercher
la propriété (`.color`, `backgroundColor`, `style={{`) plutôt que les mots
de la liste : le `grep` a trouvé ce que la liste n'avait pas vu, et n'a pas
trouvé ce qu'elle annonçait.

### La mesure, contre la carte et non contre une piste

Les barres de Statistiques n'ont pas de piste : elles sont posées à même la
carte, blanc en clair, `--surface` en sombre — un seuil *moins* sévère que
celui du 16 au matin. Sonde contrôlée à 17,74 sur `gray-900`/blanc.

| | Échecs sous 3,0 |
|---|---|
| Treize contextes du propriétaire, clair | **4** — Autre 2,56, Livre 2,85, Méditation 2,10, Radio 2,19 |
| Idem, sombre | **2** — Bible 1,92, Podcast 2,69 |
| Palette fixe des autres graphiques (7), clair | **3** — `#2ecc71` 2,10, `#f39c12` 2,19, `#95a5a6` 2,56 |
| Idem, sombre | **1** — `#1e3a5f`, le bleu nuit de la charte par défaut, **1,27** |

### Le même mécanisme, porté au SVG

`Cell` transmet `className`, `style` et `fill` jusqu'au `<path>` (vérifié
dans `filterProps` de Recharts 2.15.4). `.remplissage-teinte` pose donc
aussi `fill`, dans les deux modes : la propriété CSS bat l'attribut `fill`
de présentation, qui reste en repli si la feuille manquait. `teintesDe` est
**sortie** de `progress/page.tsx` vers `lib/themes.ts` — la définition
locale retirée, non doublée (piège 5) —, et les quatre graphiques passent
par elle, la palette fixe comprise : la règle « respectée où elle se voit,
poussée du minimum là où elle ne se voit pas » vaut pour une constante comme
pour un choix. La palette a déménagé dans `lib/statistiques/palette.ts`,
parce qu'un fichier de page ne peut rien exporter d'autre que sa page, et
que le test la lit plutôt que de la recopier.

Vu, serveur de développement, session du propriétaire, classe `dark` posée
à la main, `visibilityState` à `visible` : **51 barres sur quatre
graphiques, ≥ 3,34 en clair, ≥ 4,31 en sombre**, sonde `h1` 16,30 en
sombre. Le `#1e3a5f` de « Répartition par version » rend 4,66. Captures
des deux modes prises. Progression relue après le déplacement : 22 barres,
3,04 / 3,05 — les valeurs de la veille au centième.

**Un chiffre à comprendre** : en sombre, 9 contextes sur 12 changent de
teinte quand 2 seulement échouaient contre la carte. `remplissageLisible`
mesure contre la piste, plus sévère que `--surface` — et c'est ce qui donne
à un contexte **la même teinte sur Progression et sur Statistiques**. Une
couleur par contexte et par mode, quel que soit l'écran ; le surcroît est
le prix de cette cohérence.

811 tests : les sept couleurs de la palette rejoignent les douze contextes,
les deux catégories et les trois extrêmes dans `themes-sombre.test.ts` ;
deux tests pour `teintesDe`.

### Le déploiement, sondé

`5a70e34` poussé à 18:47:24 UTC. Relevé de départ à 18:47:51 : `buildId`
`wA1b7HjL…` — déjà différent du `2kfltc…` de la veille, le push des docs
ayant déployé entre-temps —, clés `fill` à 0, contrôles à 1. À 18:49:04 :
`buildId` **`n6Zx1C-t…`**, la seconde feuille renommée (`0b45c0…` →
`bf3895…`) et portant `fill:var(--teinte-claire)` et
`fill:var(--teinte-sombre)` à **1**, contrôles
`background-color:var(--teinte-claire)` et `bg-black\/15` à 1. Un seul
changement de `buildId` attendu, un seul vu. Ce commit ne retirait
rien : la discrimination tient à la clé ajoutée et au nouveau hachage de
feuille, pas à une clé disparue.

### Les libellés d'axe, relevés en chemin puis corrigés

Les libellés d'axe Recharts — `#666`, 11 px, la valeur par défaut de la
bibliothèque — tenaient 5,74 en clair et **2,55 en sombre** sur la carte :
du texte sous 4,5, antérieur à tout. Mesuré sur les 52 graduations de
Statistiques ; les traits d'axe et de graduation portent la même couleur,
donc les mêmes chiffres.

Candidates mesurées contre la carte : `gray-600` 7,56 / **1,94**, `gray-500`
4,83 / 3,03, `--text-secondary` **4,83 / 5,71**. Retenue la troisième — la
couleur de tout texte secondaire de l'application, qui suit le mode par la
variable. Une règle dans `globals.css` sur
`.recharts-cartesian-axis-tick-value`, la classe que Recharts pose déjà :
la propriété CSS bat l'attribut `fill="#666"`, aucun `tick={{ fill }}` par
axe, et tout graphique à venir est couvert. Vu : 52 libellés à 4,83 en
clair, 5,71 en sombre, capture en sombre prise.

Les **traits** d'axe et de graduation restent au `#666` de Recharts, 2,55
en sombre : décoratifs, l'information est dans les libellés. Non touchés,
à dessein.

`2271fb3` poussé à 19:12:58 UTC, sondé : départ à 19:13:08 avec `buildId`
`n6Zx1C-t…` et la clé à 0 ; à **19:14:35**, `buildId` `BHohzycx…`, la
seconde feuille renommée (`bf3895…` → `1c846d3a…`),
`.recharts-cartesian-axis-tick-value{fill:var(--text-secondary)}` à **1**,
les quatre contrôles à 1. La forme minifiée de la clé avait été lue sur la
règle `.remplissage-teinte` déjà en production avant d'attendre — une clé
mal écrite aurait fait attendre l'expiration de la sonde pour rien.

### Les trois nombres de Statistiques — le point 6

« Incohérence, pas défaut » : « Cette semaine » et « Ce mois » tenaient 3,34
et 4,15 en clair, 4,38 et 3,52 en sombre — au-dessus du seuil de 3,0 des
grands caractères —, mais figés sur `#4a90d9` et `#7b68ee`, l'accent de la
seule charte Marine, quand « Total » suivait la charte du lecteur par
`--primary`.

Deux remèdes, et la mesure a fermé le second. **A** : les trois nombres en
`--primary`, le rôle déjà remappé en sombre (`--primary-clair`) et mesuré
sur les dix chartes — 5,90 à 13,12 en clair, 6,60 à 8,15 en sombre. **B** :
« Ce mois » en `--accent`, pour garder une seconde couleur de charte. Mais
l'accent en texte ne tient 3,0 des deux côtés que sur **cinq chartes sur
dix** — Forêt 2,10 et Ocre 2,19 sur le blanc, Rubis 2,82, Indigo 2,57 et
Café 2,97 sur `--surface` —, et un accent personnalisé serait n'importe
quoi. Le rendre lisible aurait demandé un mécanisme neuf pour un rôle que
l'accent ne joue nulle part ailleurs dans `src`. Retenu **A**.

Vu, charte Pourpre du propriétaire : les trois nombres à **13,12 en clair,
6,60 en sombre**, la ligne « pourpre » du tableau au centième. Compilation
à froid (piège 25) : `text-\[\#4a90d9\]` passe à **0** — la clé que la
sonde de déploiement verra disparaître, présente à 1 dans la feuille
`1c846d3a…` d'aujourd'hui — ; `text-\[\#7b68ee\]` reste à 1, la page de
présentation l'emploie deux fois, et ne dira donc rien.

`26556a6` poussé à 19:21:39 UTC avec `0aae7c6`, un seul déploiement. Le
premier relevé de départ a rendu **0** pour `text-\[\#4a90d9\]` sur la
feuille `1c846d3a…` où `grep` l'avait trouvé à 1 dix minutes plus tôt :
l'instrument, pas la feuille — un `sed` sur un `heredoc` avait doublé les
barres obliques de la clé. Redressé et recontrôlé **avant** d'attendre :
19:22:04, `buildId` `BHohzycx…`, la clé à 1, `text-\[\#7b68ee\]` à 1. À
**19:23:04** : `buildId` `qhyuLBvB…`, feuille `3f8289be…`,
`text-\[\#4a90d9\]` à **0**, `text-\[\#7b68ee\]` resté à **1**, les cinq
autres contrôles à 1. Une clé disparue, une voisine restée : la sonde a
discriminé dans les deux sens. Une mesure qui dit « absent » sur une clé
connue présente est fausse avant d'être inquiétante — et le relevé de
départ est là pour la prendre en défaut avant qu'elle ne fasse attendre.

Non vu : la production dans une session, en arabe, et les autres comptes.

## La séance du 17 septembre 2026 : l'import de lectures, premier étage

La fonction avancée demandée la veille — `spec/IMPORT-IA.md` porte la
demande, les sept décisions du propriétaire et les deux tensions ouvertes.
Commencé par ce qui ne dépend d'aucun arbitrage : l'analyseur déterministe
de références, puis l'écran de validation avec le presse-papier pour première
entrée. Le détail est dans `IMPORT-IA.md`, section « Ce qui est construit ».

Trois choses à retenir ici.

**Deux règles posées plutôt que devinées** : un livre à tomes sans ordinal est
rejeté ; un verset hors du chapitre est rejeté, non rogné. Les deux se lisent
dans les rejets de l'écran, avec leur raison.

**`BY_LOCALE` de `i18n/books.ts` est un `Partial` à deux langues** : l'espagnol,
l'italien et l'arabe lisent les livres en français. Connu d'`AGENTS.md`
(« fr et en »), mais c'est le piège 9 — et l'import, qui promet « plusieurs
langues », bute dessus le premier. Non touché ce jour.

**L'aller-retour d'essai a un chemin propre** : une lecture créée se retire
par l'écran Détail de la lecture, qui efface aussi le cache IndexedDB ; un
`delete` SQL laisserait la ligne locale jusqu'à la prochaine synchronisation.
Le `confirm()` du navigateur a été intercepté depuis le panneau pour répondre
oui — la boîte de dialogue native n'est pas cliquable par l'outil.

Le serveur de développement avait été arrêté par l'application pendant la
pause ; relancé, il a repris le 3000, l'autre conversation l'ayant libéré.

Non vu : les quatre autres langues à l'écran, la production, l'arabe.

### Les fichiers, et le défaut que seul un texte réel a montré

Deuxième étage le même jour — `spec/IMPORT-IA.md`, « Les fichiers ». Deux
choses pour ce document.

**Une dépendance évitée par un fait du navigateur.** Word, Excel, PowerPoint
et OpenDocument sont des zip de XML, et `DecompressionStream('deflate-raw')`
dégonfle sans bibliothèque : cinquante lignes de lecteur zip plutôt que
`mammoth` et `xlsx`. La règle 6 tient, et `npm audit` n'a rien gagné de neuf.
Le PDF reste refusé avec sa raison — `pdfjs-dist` ou le modèle, ni l'un ni
l'autre n'est décidé.

**Cinquante-trois tests écrits d'avance n'avaient pas le cas que des notes de
culte ont eu du premier coup** : « Romains 8:28-30 ; 1 Jean 4:8 » lisait
l'ordinal comme un chapitre. Les tests encodaient ce que j'imaginais qu'on
écrit ; le texte réel a écrit autre chose. La leçon est celle du dépôt sur
les preuves d'écran, transposée : **un test dit ce qu'on a pensé, un essai
réel dit ce qui arrive.** Faire l'essai réel avant de croire la suite verte.

Le panneau ne sait pas ouvrir le sélecteur de fichiers natif ; un `File`
fabriqué en JavaScript et posé sur `input.files` avec un événement `change`
traverse React comme un vrai choix. Le serveur de développement a été arrêté
par l'application à chaque pause entre nos échanges ; relancé deux fois.

### La photo, et trois choses sur l'outillage

Troisième étage — `spec/IMPORT-IA.md`, « La photo ». Ici, ce qui concerne le
poste plutôt que la fonction.

**Le cache npm n'est pas inscriptible depuis le bac à sable.** `npm view` et
`npm install` échouent en `EPERM` sur `~/.npm/_cacache` — le message parle de
fichiers « root-owned », c'est la liste d'écriture du bac à sable, qui ne
laisse que `~/.npm/_logs`. `npm --cache "$TMPDIR/npm-cache" …` contourne.

**`npm audit` compte 31 vulnérabilités, pas 7.** Mesuré avant et après
l'installation de `tesseract.js` : 31 et 31 — toutes antérieures (`next`,
`postcss`, `eslint`, `vitest`, `dompurify`…). La note d'`AGENTS.md` datait ;
rafraîchie.

**`next build` ne passe pas dans le bac à sable — hypothèse.** Deux essais
dans un `worktree` de `$TMPDIR`, `node_modules` en lien, aucun serveur voisin :
tous deux figés après le côté serveur, la trace arrêtée dans les modules
client, dix minutes sans un octet. Google Fonts répond 200 par `curl`, ce
n'est pas `next/font`. Le piège 28 du 16 septembre — « ne pas lancer
`npm run build` à côté du serveur » — avait peut-être la même cause et pas
celle qu'on lui a donnée. Non prouvé : `ps` est interdit, on ne voit pas ce
que fait le processus. Conséquence pratique : la compilation de production
se juge au push, par Vercel et la sonde.

### Le déploiement de `d00dc14`, et l'instrument qui manquait depuis le 15

Six commits poussés à 05:55:50 UTC, dont la première dépendance de l'import.
Départ à 05:56:00 : `buildId` `qhyuLBvB…`, `.resize-y{` — la classe du
champ de texte, absente de la feuille de production — à 0. **Vercel :
`success` à 05:57:13**, « Deployment has completed » ; sonde à 05:57:17 :
`buildId` `M9zsGR91…`, feuille `24c6a693…`, `resize-y` à **1**, les six
contrôles inchangés. `tesseract.js` compile en production — ce que le bac à
sable n'avait pas pu dire.

**Le statut de commit GitHub est l'instrument qui manquait.** Vercel pose sur
chaque commit un statut `Vercel` — `pending` « is deploying », puis `success`
ou `failure`, avec l'URL du déploiement en `target_url`. Il dit *quel* commit
est déployé et *si* la compilation a échoué, deux choses que le `buildId` ne
dit jamais, et il rend inutile la règle « attendre un second changement ». Le
MCP Vercel répond 403 sur cette équipe, `gh api` bute sur le certificat du
bac à sable (`x509: OSStatus -26276`), mais **`curl` avec le jeton de
`gh auth token`** passe :

```bash
curl -sS -H "Authorization: Bearer $(gh auth token)" \
  https://api.github.com/repos/francisallebee/bible-ouverte/commits/<sha>/status
```

Désormais : pousser, lire ce statut jusqu'à sa sortie de `pending`, puis
sonder la feuille pour la preuve de contenu. La sonde garde son rôle — elle
prouve ce qui est servi —, le statut dit si et quoi.

### Les retours du propriétaire, et la première route de l'import

Le propriétaire a vu la fonction **en production** : presse-papier et photo
fonctionnent — deux preuves d'écran qui ne viennent pas de l'agent. Six
retours ont suivi ; `spec/IMPORT-IA.md` les détaille. Ici, ce qui vaut
au-delà de la fonction.

**Une route qui va chercher ce qu'on lui dit est une porte vers le réseau du
serveur.** `api/import/lien` existe pour le CORS, pas pour un droit de plus,
et elle est bornée comme telle : `adresseAdmise` refuse `localhost`, les
plages privées, `169.254.x` et les `.local`/`.internal` — et **rejuge
l'adresse finale après redirection**, sans quoi une adresse publique pourrait
renvoyer vers une interne. La lecture s'arrête net à quatre mégaoctets même si
le serveur n'annonce pas sa taille. 23 tests sur la règle d'admission, le
nom de fichier et les plages — `172.32` n'est pas privé, `172.31` l'est.

**Kindle est refusé pour de bon, et le message le dit.** `mobi`, `azw`,
`azw3`, `kfx` : format binaire propriétaire, et les livres achetés sont
chiffrés par une clé que seul le compte Amazon détient. Promettre de les lire
aurait été mentir ; le message propose de convertir en EPUB — que le lecteur
zip lit — ou de copier le texte.

**Troisième texte réel, troisième défaut.** La page Wikipédia « Jean 3:16 »
a fait signaler « p. 490 » et « P52 » comme des tomes manquants de Pierre :
`p` est une abréviation, et une abréviation d'une ou deux lettres sans
ordinal n'est presque jamais un livre. Ignorée en silence désormais. Après
le point-virgule devant un ordinal (le `.docx`) et la barre oblique (la
photo du propriétaire), c'est la troisième règle que l'usage a écrite et
que l'imagination n'avait pas.

`a1dc711` poussé à 07:08:45 UTC ; Vercel `success` à 07:10:15, `buildId`
`M9zsGR91…` → `VRpnX1ID…`. Aucune classe CSS neuve à discriminer — un
changement de JavaScript et d'une route —, le statut de commit a suffi. Et
une sonde de plus, propre aux routes : `POST /api/import/lien` **sans
session** rend `307 → /auth/login` en production — le middleware intercepte
avant la route, `requireAdmin` est la seconde barrière derrière lui. Deux
verrous, l'un devant l'autre ; c'est le premier que la sonde a vu.

### Le PDF et l'audio, et deux façons de ne pas ajouter une dépendance

Les arbitrages du propriétaire ont tranché le soir même — `spec/IMPORT-IA.md`.
Deux choses pour ce document.

**Une bibliothèque de navigateur peut venir du CDN plutôt que de npm.**
`@huggingface/transformers` tire `sharp` et `onnxruntime-node`, des binaires
natifs pour Node dont le navigateur n'a que faire, et dont l'installation
dans le bac à sable aurait été un combat. `import(/* webpackIgnore: true */
url)` laisse le navigateur charger la bibliothèque depuis jsDelivr, version
épinglée — ce que `tesseract.js` fait déjà pour son moteur et `pdf.js` pour
son worker. Le prix : une origine tierce à laquelle on fait confiance à
chaque chargement, et pas de workers sans détours (`numThreads = 1`).

**Un repli qui réemploie ce qui existe.** Une page de PDF scannée passe par
l'OCR de la photo : `reconnaitreCanevas` a été extrait d'`ocr.ts` pour ça,
et le moteur en cache sert aux deux. Le chunk de Tesseract demandé pendant
un PDF sans texte l'a prouvé.

Le WAV de sinusoïde transcrit en « ... » n'est pas une preuve de qualité :
seulement que décodage, CDN, modèle et WASM tiennent ensemble. La qualité de
Whisper tiny sur une vraie voix est au propriétaire de la voir.

`aaf045a` poussé à 07:24:57 UTC ; Vercel `success` à 07:26:29, `buildId`
`VRpnX1ID…` → `ZLB9T74V…`. Le déploiement le plus exposé de la journée —
`pdfjs-dist` à compiler, un `import()` d'URL sous `webpackIgnore` — est
passé du premier coup. Les cinq entrées demandées le 16 sont en production.

### `multiple` et `capture` ne vont pas ensemble sur iOS — vu par le propriétaire

Le multi-pages par photo « ne semblait pas fonctionner » en production. Sur
iOS, `<input type="file" accept="image/*" multiple>` propose l'appareil et la
photothèque ; l'appareil ne prend **qu'une** image par ouverture, et
`multiple` ne vaut que pour la photothèque. Le panneau de séance, qui dépose
des `File` par script, ne pouvait pas le montrer : c'est l'iPhone qui l'a
dit. La forme a changé plutôt que le réglage : `capture="environment"`, une
prise à la fois, le texte **ajouté** au champ. Une fonctionnalité pensée
comme « plusieurs fichiers » était en fait « plusieurs fois une photo ».

Et un bouton retiré le jour même de sa naissance : l'audio à part « ne sert à
rien » quand « Choisir un fichier » peut le prendre. Le code de la
transcription n'a pas bougé ; seule la porte a changé. Moins de boutons,
même chemin.

`bfbc517` poussé à 09:12:04 UTC ; le relevé de départ portait déjà le
`buildId` du push de docs de 07:39 (`QqcVluvz…`) ; Vercel `success` à
09:13:42, `buildId` `hAqhc_56…`. La production porte la forme revue : appareil
direct et prises cumulées, audio par le sélecteur de fichiers.

### Un plan depuis un document : la sortie qui manquait

Demande du propriétaire le 17 au soir — `spec/IMPORT-IA.md`. Tout existait
sauf la sortie : l'import produisait des lectures, il fallait des jours de
plan. Trois choses pour ce document.

**La règle a été choisie sur la forme des plans qu'on imprime** — une ligne
par jour, tous ses passages —, et le second découpage (un passage par jour)
offert plutôt qu'imposé. L'aperçu avant création est ce qui rend le choix
sans risque : on voit les jours, on change le découpage, le document n'est
pas relu.

**« Depuis un document » n'est pas un `PlanKind`.** Il produit un plan daté
ou libre selon le rythme choisi ; en base et dans l'écran du plan, rien de
neuf. Une troisième forme de formulaire, pas une troisième sorte de plan.

**Le compte à blanc vaut pour les plans comme pour les lectures** : 26 plans
et 4 099 jours avant, plan 70 créé et relu en base — deux passages dans
`passages`, un seul dans les colonnes, la règle de `toDayColumns` vérifiée
sur du réel —, supprimé par le bouton, 26 et 4 099 après.

### La page du jour : la première migration de l'import, et ce qu'elle a coûté

Rien, ou presque — et c'est la leçon. « Lire le document dans son intégralité »
est devenu **une colonne** sur la table qui a déjà la maille du jour, la
décision de `passages` le 19 août : ni table jointe, ni RLS, ni reprise, ni
`grant` (vérifié avant d'écrire, `plan_days` est dans le cas de `readings`).
Le typage a nommé les deux chemins de correspondance (`rowToDay`,
`dayToRow`) ; le troisième — la mise à jour partielle au cochage — n'écrit
que `date`, `isRead`, `readingId`, et n'avait rien à apprendre.

**Où vit une donnée se décide par sa maille.** La page d'un document est une
donnée du *jour* : elle va sur `plan_days`. Elle ne rejoint la *lecture* qu'au
cochage, copiée dans ses notes, parce qu'à ce moment elle devient l'affaire
de l'historique. Deux tables, deux moments, aucune duplication avant l'acte.

Aller-retour réel complet — plan 71, lecture 962, décochage, suppression —,
base revenue à l'octet près sur les tables touchées. Les 53 lectures de plus
au total sont celles des lecteurs de la journée, dont le propriétaire sur de
vraies notes de prédication : la fonction sert.

### « Sinon c'est illisible » : la structure d'abord, la fenêtre ensuite

Un texte aplati ne se relit pas, et une belle fenêtre n'y aurait rien
changé : il fallait que l'extraction **garde** ce que les formats savent —
titres, listes, paragraphes — et que le PDF, qui ne sait rien, se le fasse
déduire des positions. La notation choisie est la plus petite qui tienne
(`#`, `-`, ligne vide) ; elle traverse l'analyseur de références sans le
gêner, et un seul composant la rend.

Deux pièges d'expressions régulières, en chemin. `<w:p/>` satisfait aussi
`<w:p[^>]*>` : la branche ouvrante avalait le paragraphe suivant tant que la
branche auto-fermante ne passait pas d'abord. Et une marque insérée avant
une balise plus la ligne rendue par sa fermante font une ligne vide entre
deux titres ou deux puces — retirée devant les marques, et sous un titre en
PDF où la grande police creuse l'interligne.

Le propriétaire a essayé la fonction **sur le serveur de développement,
depuis sa propre machine**, entre deux de mes essais : le plan 72 porte six
pages d'un vrai manuel. Le serveur de développement écrit dans la base de
production — piège 7 —, et c'est ici une chance : sa donnée réelle est là
pour juger la fenêtre.

`10f6b4d` poussé à 11:01:05 UTC avec `3ba053c` et `9de57f6` ; Vercel
`success` à 11:02:40, `buildId` `Dj7y2S9o…` → `cAspNO-a…`, feuille
`e45ed0d8…` → `d9b115a2…`, `.max-w-prose{` et `.list-disc{` de 0 à **1** —
les deux classes de la fenêtre de lecture. La production porte le plan depuis
un document, ses deux contenus, et la fenêtre. La migration `plan_day_texte`
l'y attendait déjà.

### « Vraiment illisible » : quand il faut arrêter de reconstruire

Le propriétaire a lu son vrai cahier d'étude dans la fenêtre — plan 75, 203
jours — et l'a dit sans détour. Avant de proposer, j'ai lu la base : ce
n'était pas un défaut, mais deux, et le lecteur de PDF qu'il suggérait n'en
réglait qu'un. Le **découpage** « une ligne à référence = un jour » tranche un
cahier qui cite dans la prose au hasard de ses citations (11 000 caractères
pour le jour 1, 297 pour le jour 2, coupé au milieu d'une phrase). Et le
**texte extrait d'un PDF** est une reconstruction — lignes devenues
paragraphes, césures, ligatures cassées — qu'aucun rendu ne sauve. La règle du
dépôt tient ici : mesurer avant d'affirmer, et nommer ce que la mesure dit.

Deux réponses, tranchées par le propriétaire (« stockage, une page par jour
par défaut »). **Le PDF est gardé et dessiné** : premier fichier stocké par
l'application, seau `documents` créé **par la migration** — pas au dashboard,
ce que le README regrettait pour `photos` et `audio` —, et le dépôt réservé à
l'administrateur **dans la policy** (`private.is_admin()`), parce qu'un
`isAdmin` du navigateur ne protège rien. `pdf.js`, qui extrayait déjà le
texte, dessine maintenant les pages ; c'est la même bibliothèque, chargée une
fois (`chargerPdfjs`). **Le découpage devient un rythme** : une section à
références fait un jour, une section muette rejoint la suivante — parce qu'un
jour de plan compte au moins un passage et que le cochage repose dessus. Un
seul algorithme pour les pages d'un PDF et les titres d'un Word.

Deux pièges de plus pour la liste. `pdf.js` **transfère** au worker le tampon
qu'on lui donne, qui en ressort vide : ce que le cache rend est une copie
(`slice(0)`), sans quoi la seconde lecture dessinerait une page blanche. Et
la console du navigateur **accumule** : le « Module not found » qu'elle
montrait après coup datait de l'instant où `plan-store.ts` importait un
fichier que je n'avais pas encore écrit ; ce sont les journaux du serveur qui
disent l'état présent, et ils disaient « Compiled ».

La barrière a été éprouvée **en base**, pas supposée : un bloc `do` qui pose
les `request.jwt.claims` d'un compte non-admin, tente l'insertion, et se
termine par `raise` — donc s'annule quoi qu'il arrive — a rendu « new row
violates row-level security policy ». Aller-retour réel : plan 76 depuis un
PDF de six pages fabriqué, objet à 2 566 octets, trois jours avec leurs pages
(p. 1-3, p. 4, p. 5-6 : les pages muettes rattachées), lu à 100 % et 150 %
(trois canevas de 2 184 px réels, de l'encre sur chacun), supprimé par
l'écran — plan, jours, objet, cache IndexedDB à zéro. Base : 27 plans, 4 302
jours, 798 lectures, comme avant. 963 tests. Rien n'est poussé.

`2839bdf` poussé à 13:38:09 UTC ; Vercel `success` à 13:39:23, `buildId`
`2tJN9afw…` → `rzHCuXFq…`, feuille `d9b115a2…` → `789d0b74…`,
`sm\:max-w-4xl{` de 0 à **1** — la fenêtre large du lecteur de pages. Deux
clés candidates (`tabular-nums`, `w-11`) se sont révélées **déjà présentes**
à la validation préalable : gardées en contrôles, pas en preuves — c'est à ça
que sert de lire la feuille avant d'attendre. La migration `plan_documents`
attendait en base ; la production sait créer, déposer, lire et supprimer.

### « Pas concluant » : lire ce que la base dit avant de défendre

Le propriétaire a jugé la fonction « pas concluante » ; la base disait qu'il
n'avait pas créé de plan par pages (26 plans, 0 objet). Je l'ai dit une fois,
sans en faire un argument : ce qu'il décrivait — références ajoutées là où il
n'en veut pas, un mode page caché dans une liste de découpages, « une page par
jour » sans autre choix — était vrai de la fonction telle qu'elle était. Sa
réponse a été trois exigences nettes, et la proposition les a prises une à
une : **deux fonctions séparées** (les références d'un document / le document
lui-même), **aucune référence** sur le document entier, **un éditeur de
jours** — et le rendu autre que texte, déjà là mais invisible.

Le pivot technique tient en une phrase : **un jour de plan peut ne porter
aucun passage.** Jusqu'ici tout reposait sur « au moins un » (`toDayColumns`
le refuse, `dayPassages` fabrique depuis les colonnes). Plutôt que de rendre
`book` optionnel dans tout le code, une sentinelle — le livre vide — et une
migration qui rend les colonnes nullables ; `dayPassages` rend `[]`, et
`markRead` avec zéro passage ne crée rien. Le reste du produit n'a pas eu à
apprendre : statistiques et progression comptent des lectures, pas des jours.

L'éditeur est **pur d'abord** (`portions.ts`, 13 tests), l'écran ensuite : des
portions contiguës, aucune vide, et chaque geste rend la suite inchangée
plutôt que de la casser. Deux choses vues en l'essayant, pas en le pensant :
un champ numérique qui borne à la frappe empêche de taper « 12 » quand le
minimum est 5 — validation à la sortie ; et « commencer à la page 3 » quand
le jour 1 lit 1-2 doit **avaler** le jour 1, pas le réduire à une page —
`commencerA`/`finirA`, distinctes de `deplacerDebut`.

Trois enseignements de l'aller-retour. **La création n'est pas atomique** : un
plan créé une minute avant la migration a eu son fichier et sa ligne, puis ses
jours refusés — refus avalé par le magasin local-d'abord, plan vide en base
avec un PDF de 5,2 Mo orphelin. **Le cache de schéma de PostgREST** ne voit
pas une colonne neuve tout de suite (« Could not find the 'titre' column …
in the schema cache ») : après une migration qui ajoute une colonne, attendre
avant d'écrire. Et **les journaux PostgREST disent qui fait quoi** : des
`PATCH` et un `POST` avec la colonne `titre` que je n'avais pas faits — le
propriétaire essayait la fonction depuis sa machine, sur le serveur de
développement, pendant mon essai ; c'est ce qui a expliqué un jour « décoché »
que je croyais perdu. Le serveur de développement écrit dans la base de
production, et le propriétaire y a la main en même temps que moi : lire les
journaux avant de conclure à un défaut.

Base revenue à 26 plans, 4 099 jours, 798 lectures, 0 objet, 0 jour sans
livre. 981 tests. Rien n'est poussé.
