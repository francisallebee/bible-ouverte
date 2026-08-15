# AGENTS.md — Bible Ouverte

Guide de travail sur le dépôt. Pour le produit et le périmètre, voir
[spec/SPEC.md](spec/SPEC.md) ; pour la base de données, [supabase/README.md](supabase/README.md) ;
pour l'état des travaux en cours et les mesures déjà faites,
[spec/REPRISE.md](spec/REPRISE.md).

## Ce qu'est l'application

Application web (Next.js 14, App Router) de suivi de lectures bibliques.
Comptes Supabase, données synchronisées entre appareils, cache local IndexedDB
pour la consultation hors ligne. Déployée sur Vercel.

## Architecture des données

C'est le point à comprendre avant tout le reste.

**Supabase fait foi, IndexedDB est un cache.** Chaque mutation écrit dans les
deux : d'abord le cloud via `src/lib/supabase/store.ts`, puis le cache local.
À la lecture, les stores de `src/lib/storage/` synchronisent depuis le cloud
quand le réseau est là, et servent le cache sinon.

Le navigateur parle **directement** à Supabase avec la clé anon ; la RLS est
donc la seule barrière sur les données personnelles. Les routes `src/app/api/`
sont réservées aux opérations qui exigent la clé service_role : back-office,
suppression de compte, mise à jour de profil. Il n'existe volontairement pas de
route API pour les lectures, les plans ou les contextes.

Conséquence pratique : **une fonctionnalité qui touche aux données commence par
une migration SQL**, pas par un composant.

## Les langues

L'interface est traduite ; **le texte biblique ne l'est pas** — `public/bibles/`
ne porte que sept versions françaises, et rien sur la feuille de route n'en
ajoute d'autres langues.

Le français fait référence. Le type des autres langues en découle
(`type Dictionary = typeof fr`, sans `as const`, qui figerait le contenu au lieu
de la forme), si bien qu'**une clé oubliée dans une traduction ne compile pas**.
C'est le seul garde-fou qui tienne sur 520 clés.

Ajouter une langue tient en **un fichier** à côté de `ui/fr.ts` et **une ligne**
au registre `ui/index.ts`. Une langue déclarée dans `LOCALES` mais sans
dictionnaire n'apparaît pas au sélecteur : on ne choisit pas une langue à
moitié faite.

La langue vit dans la colonne `jsonb` des réglages — l'exception documentée plus
bas : ni migration, ni piège des trois chemins. Ordre de préséance :
choix explicite, puis langue du navigateur, puis français (`resolveLocale`).

**Ce qui est libellé et ce qui est logique ne se mélangent pas.** Les
identifiants restent dans le code — ce sont des clés de base ou de réglages, et
ils ne doivent jamais bouger ; les libellés vivent dans les dictionnaires,
indexés par ces mêmes identifiants. C'est le cas des déclencheurs de
notification, des délais de déconnexion, des durées de plan, des statuts de la
feuille de route, des badges et niveaux, des catégories de livres, des chartes
graphiques et des 17 étapes du parcours découverte.

Trois tables méritent d'être connues :

| Table | Clé | Pourquoi ce n'est pas de la donnée |
|---|---|---|
| `i18n/books.ts` | abréviation USFM | `readings.book` stocke déjà `GEN`, `2CH` — traduire ne touche aucune ligne |
| `i18n/contexts.ts` | `slug` | les 11 contextes système ; ceux créés par l'utilisateur gardent son texte |
| `i18n/format.ts` | — | dates et nombres par `Intl`, jamais par une table de mois |

Les crochets `useBookName`, `useContextName` et `useBooks` passent par le
contexte : un appel direct à `bookName(locale, …)` figé dans une fonction de
module ne redessinerait pas l'écran au changement de langue. Quand l'un d'eux
sert dans un `useMemo`, il doit figurer dans ses dépendances.

**Les propriétés logiques sont la règle** — `ps-`, `pe-`, `ms-`, `me-`,
`start-`, `end-`, `border-e`, `text-start` — et la variante `rtl:` pour ce qui
change de signe. L'arabe est prévu ; rattraper ces fondations plus tard
coûterait une passe complète sur les 19 écrans.

## Carte du code

| Chemin | Rôle |
|---|---|
| `src/app/` | Écrans (App Router) et routes API |
| `src/components/landing/` | Page de présentation servie sur `/` |
| `src/lib/supabase/store.ts` | Accès Supabase depuis le navigateur |
| `src/lib/storage/` | Cache IndexedDB et logique métier par domaine |
| `src/lib/i18n/` | Langues, dictionnaires, noms de livres et de contextes, dates |
| `src/contexts/` | Fournisseurs React : session (`AuthContext`), langue (`I18nContext`) |
| `src/features/bible/` | Livres, classification, import des versions |
| `public/bibles/` | 7 versions françaises libres de droits (47 Mo) |
| `supabase/migrations/` | Schéma et RLS, appliqués dans l'ordre des noms |
| `scripts/` | Téléchargement et conversion des textes bibliques |

## Règles

1. Toute évolution du schéma passe par un **nouveau** fichier dans
   `supabase/migrations/`. Ne jamais modifier une migration déjà appliquée, ne
   jamais écrire de `drop table`.
2. `is_admin` et `suspended` ne sont modifiables que par la clé service_role.
   Le contrôle est à la fois dans les GRANT colonne et dans un trigger — si tu
   touches à `profiles`, vérifie que les deux tiennent toujours.
3. Vérifier l'impact hors ligne de chaque changement : le cache local ne doit
   jamais être purgé sur un simple échec réseau (voir le commentaire en tête de
   `select()` dans `store.ts`).
4. Les traductions vivent dans `public/bibles/` et se chargent par `fetch()`,
   une version à la fois. Ne jamais les faire passer par `import()` : webpack
   en ferait 47 Mo de chunks.
   Une version n'est téléchargée que si elle est active (`isEnabled`). La case
   des réglages commande réellement le cache : l'activer importe le texte, la
   désactiver l'efface. Seule la version par défaut est active à
   l'installation.
5. `npm run typecheck`, `npm run lint` et `npm test` doivent passer avant
   chaque commit.
6. Pas de dépendance nouvelle sans raison sérieuse.
7. Toute ressource servie avant connexion doit être exclue du `matcher` du
   middleware, sans quoi elle répond une redirection vers `/auth/login`.
8. `seedIfNeeded` partage une exécution unique entre tous ses appelants
   simultanés, et un échec de l'import des traductions n'y remonte jamais. Ces
   deux garde-fous ne sont pas décoratifs : la barre latérale et le `useEffect`
   de chaque écran appellent la fonction en parallèle à chaque montage, et
   l'écran restait bloqué sur « Chargement… » quand l'un des deux échouait.
   `src/lib/storage/seed.test.ts` les couvre.
9. Deux chemins seulement sont servis sans session : `/` et `/auth`. Ils sont
   listés dans `isPublicPath` (`src/lib/supabase/middleware.ts`), pas dans le
   `matcher` — le middleware doit continuer à s'exécuter sur `/` pour renvoyer
   un utilisateur déjà connecté vers `/new-reading`. C'est cette redirection,
   et non un contrôle dans `src/app/page.tsx`, qui laisse la page de
   présentation entièrement prérendue.
10. **Tout texte visible passe par les dictionnaires.** Une chaîne écrite en dur
    dans un composant est un défaut, pas un raccourci : elle restera française
    dans les quatre autres langues. Vérifier après coup au navigateur, langue
    basculée — un relevé par `grep` sur les accents laisse passer ce qui n'en
    porte pas, et c'est arrivé.
11. Ne jamais nommer `t` une variable de boucle : c'est le dictionnaire, et le
    typage ne signale pas le masquage quand les deux objets ont un `.name`. Le
    piège s'est présenté deux fois, dans Réglages et Administration.

## Commandes

```bash
npm run dev        # serveur de développement
npm run build      # build de production
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest
```

## Dette connue

- Les photos sont stockées en base64 dans une colonne `text` : cela gonfle les
  lignes Supabase et le cache IndexedDB. Les buckets Storage sont désormais
  prêts et cloisonnés par utilisateur, mais le code ne les utilise pas encore,
  et basculer demande de reprendre les lignes existantes (une route d'upload
  existait, retirée faute d'appelant — voir l'historique git).
- `supabase/config.toml` n'est pas fidèle à la production : sa section `[auth]`
  garde les valeurs par défaut de `supabase init`, dont un `site_url` en
  localhost. **Ne jamais lancer `supabase config push`** avant de l'avoir
  reconstruite — cela casserait l'authentification. Voir `supabase/README.md`.
- La couverture de tests se limite aux modules les plus critiques (génération de
  plans, classification des livres, robustesse des mots de passe, amorçage). Les
  agrégations de statistiques ne sont pas couvertes.
- `npm audit` signale **7 vulnérabilités** (1 modérée, 6 hautes) : `dompurify`
  et `nanoid` se corrigent par un simple `npm audit fix` ; `glob`, `postcss` et
  `next` lui-même demandent un `--force`, donc une montée en version majeure.
- **Le temps de chargement tient désormais aux appels Supabase**, plus à
  l'import des traductions. L'identité du compte est mémorisée pour la session
  (`getUserId` dans `lib/supabase/store.ts`, sur lequel s'appuie
  `getCurrentUserId`) : ne pas réintroduire d'appel direct à `auth.getUser()`
  ailleurs, c'était la cause de quatre allers-retours par ouverture d'écran.
  Reste à traiter : chaque écran resynchronise contextes, lectures et réglages
  à son ouverture sans mémoire de ce qui vient d'être récupéré — une vingtaine
  d'appels pour environ cinq secondes cumulées sur trois navigations.
- Les déploiements de preview Vercel ont été débloqués le 13 août 2026 :
  `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont désormais
  dans l'environnement Preview, en plus du `export const dynamic =
  'force-dynamic'` des cinq routes API. Les URL de preview sont derrière la
  protection de déploiement Vercel : il faut être connecté au compte pour les
  ouvrir. La clé `service_role` reste malgré tout sur le seul environnement
  Production et doit y rester — cette protection est un réglage du tableau de
  bord, pas une garantie. Ne pas déployer une preview par `vercel deploy`
  depuis le poste : 62,5 Mo à téléverser, l'envoi n'aboutit pas ; les previews
  passent par git.
- **Le texte de Sacy est amputé** : Genèse 49 chapitres sur 50, Exode 39/40,
  Psaumes 149/150, Cantique 6/8, et d'autres. Le défaut vient du fichier source
  (`heb12/gratis.json`), pas de la conversion. Le corriger suppose de trouver
  une meilleure source ou d'écarter cette version. Les six autres traductions
  ont été vérifiées livre par livre et sont complètes — seul Malachie compte
  3 chapitres au lieu de 4 dans Crampon et Darby, ce qui est une différence de
  versification légitime et non un manque.
- Un appareil qui active les sept versions garde environ 216 000 versets et
  42 Mo en cache. C'est désormais un choix de l'utilisateur et non plus le
  comportement par défaut, mais rien ne l'avertit du volume au-delà de la
  mention « environ 6 Mo chacune » dans les réglages.
- **L'espace n'est pas rendu tout de suite** quand une version est désactivée.
  Les lignes sont bien supprimées — vérifiable au compteur — mais le navigateur
  ne récupère les octets qu'à sa prochaine compaction, qu'on ne peut ni
  déclencher ni observer. Ne pas promettre à l'utilisateur un gain immédiat.
- L'écran **Administration a enfin été vu fonctionner**, le 15 août 2026, et par
  l'agent cette fois : 101 comptes, 111 lectures, 7 plans, 808 contextes, les
  deux onglets et le tableau. Tous les écrans de l'application ont donc
  désormais été vus. **Mais aucune de ses actions n'a été exercée** — suspendre,
  promouvoir, supprimer un compte, changer le statut d'un ticket restent non
  essayés. Voir un écran s'afficher n'est pas voir ses boutons agir.
- **Les notifications push et le parcours découverte fonctionnent**, vus par le
  propriétaire du dépôt le 14 août 2026 — pas par l'agent, qui n'a jamais eu de
  session pour le constater. L'item 17 est terminé de bout en bout.
- **`envoyes` n'est pas un accusé de réception.** Ce compteur ne dit que
  l'acceptation du message par le service de push. Ce qui suit — remise, réveil
  du service worker, réglages iOS — n'y figure pas. La leçon tient toujours,
  même si la remise avait bien lieu : elle a fait chercher le défaut au bon
  endroit plutôt qu'à l'aveugle.
- Sur `send-notifications` **et `notify-new-user`**, `verify_jwt` doit rester à
  `false` : `pg_cron` n'envoie pas d'en-tête `Authorization`, et la passerelle
  rejetterait l'appel par un `401` impossible à distinguer d'un mauvais secret.
  `config.toml` fige le réglage pour les deux.
- L'**alerte d'inscription** (`notify-new-user`, Brevo) n'attend plus qu'un seul
  secret : **`BREVO_API_KEY`**. `NEW_USER_ALERT_FROM`, `NEW_USER_ALERT_TO` et le
  planificateur `alerte-nouvel-utilisateur` sont en place. En attendant, le cron
  échoue toutes les quinze minutes sur `secret manquant : BREVO_API_KEY`, sans
  dégât : la fonction rend son `500` **avant** d'écrire la moindre trace, si
  bien qu'aucun compte n'est consommé en silence. Un agent ne dépose pas de clé
  d'API — c'est une commande pour le propriétaire.
  Sa migration a amorcé `new_user_alerts` avec les comptes existants : ne pas la
  vider, le prochain passage signalerait tout le monde comme nouveau.
- **La traduction ne couvre pas tout, et c'est délibéré.** La page de
  présentation `/` et les titres d'onglet (`metadata`) restent français : ils
  sont rendus côté serveur, un visiteur sans session n'a pas de réglage de
  langue à lire, et les traduire au client détruirait le prérendu que la règle 9
  protège. Les faire proprement suppose des pages statiques par langue.
  Restent français aussi les messages d'erreur des routes `src/app/api/`, et
  **les notifications push**, rédigées dans la fonction Edge :
  `notification_data()` devra remonter `settings.language` et
  `send-notifications` porter ses propres dictionnaires. C'est le seul endroit
  où la traduction sort du navigateur.
- **La langue peut-elle revenir seule en arrière ?** Le 15 août, un réglage
  remis en français est reparti en anglais quelques minutes plus tard,
  horodatage à l'appui. Refait en onglet unique, il tient à travers rechargement,
  dans IndexedDB comme dans Supabase. La condition qui a échoué comptait trois
  onglets, dont un chargé avant l'existence du champ. La piste : dans
  `getSettings`, une ligne locale marquée `_dirty` est poussée vers le nuage
  **avant** toute lecture — une modification locale ancienne peut donc écraser
  une valeur distante plus récente. **Non vérifiée.** À éprouver en
  multi-onglets : trois appareils sont concernés.
