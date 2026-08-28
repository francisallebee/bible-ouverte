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
c'est son geste.

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
