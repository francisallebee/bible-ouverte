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

L'interface est traduite, **et le texte biblique l'est désormais aussi, en
partie** : depuis le 16 août 2026, `public/bibles/` porte sept versions
françaises — dont la Bible Annotée de Neuchâtel 1900 —, une anglaise (King
James 1611), une italienne (Diodati 1649), une
arabe (Smith & Van Dyck 1865) et une espagnole (Reina-Valera 1909) — **une par
langue de l'interface**. Toutes du domaine public, toutes complètes : leurs 66
livres et les chapitres qui avaient trahi Sacy ont été comptés avant
téléchargement.

Deux sources, et la seconde a été trouvée parce que la première ne suffisait
pas. `midvash/bible-data` porte 22 langues mais pas l'espagnol ;
`scrollmapper/bible_databases` en porte 140 versions, dont la Reina-Valera. Ses
livres n'ont pas d'abréviation et portent des noms anglais, si bien que la
correspondance s'y fait **par position** — les deux listes suivant l'ordre
canonique, ce que le script vérifie plutôt que de le supposer.

Deux choses ne se confondent pas : **la langue de l'interface et celle du texte
lu**. Un lecteur peut consulter la Van Dyck dans une application réglée en
français. C'est pourquoi le bloc de versets porte son propre `dir`, donné par
`textDirection(version.language)` et non par la langue de l'interface — voir
`search`, `new-reading` et `reading/[id]`.

Le français fait référence. Le type des autres langues en découle
(`type Dictionary = typeof fr`, sans `as const`, qui figerait le contenu au lieu
de la forme), si bien qu'**une clé oubliée dans une traduction ne compile pas**.
C'est le seul garde-fou qui tienne sur 520 clés.

Ajouter une langue tient en **un fichier** à côté de `ui/fr.ts` et **une ligne**
au registre `ui/index.ts`. Une langue déclarée dans `LOCALES` mais sans
dictionnaire n'apparaît pas au sélecteur : on ne choisit pas une langue à
moitié faite.

**Les cinq langues sont livrées** : français, anglais, espagnol, italien, arabe.
Les trois dernières le 15 août 2026, et elles ont confirmé la promesse — un
fichier, une ligne, rien d'autre à toucher.

Le pluriel se décide **dans chaque dictionnaire**, et c'est ce que les valeurs
en fonction achètent. `es.ts` et `it.ts` testent `n !== 1` là où `fr.ts` teste
`n > 1` : « 0 lectura » se dit au pluriel en espagnol quand « 0 lecture » reste
au singulier en français. L'italien va plus loin — `lettura` fait `letture`,
`capitolo` fait `capitoli` — et écrit donc les deux formes en entier.

**L'arabe pousse ce choix à son terme, et le justifie à lui seul.** Il a *six*
formes cardinales, pas deux : zéro, un, le duel, le petit nombre (3 à 10), le
grand nombre (11 à 99), et le reste — et le nom **repasse au singulier après
11**, la forme étant décidée par `n % 100` et non par la grandeur. `ar.ts`
porte donc un `pluriel()` local qui applique les règles CLDR, et chaque
compteur lui fournit ses six formes. Aucun `{n} lectures` à trous n'aurait pu
exprimer cela. Couvert par `i18n.test.ts`.

`en.ts` teste encore `n > 1`, ce qui rend « 0 reading » : petit défaut connu,
sans conséquence tant que zéro ne s'affiche pas.

Deux limites de l'arabe, assumées : les chiffres restent **occidentaux** dans
les compteurs (ils viennent de `${n}`, pas d'`Intl` — les dates et nombres
formatés, eux, suivent `tag: 'ar'`), et **un seul écran sur dix-neuf a été vu
en RTL**, `/auth/login`, le seul accessible sans session.

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
| `public/bibles/` | 12 versions libres de droits : 8 fr, 1 en, 1 it, 1 ar, 1 es (82 Mo) |
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
   l'installation. L'arabe pèse **10 Mo** là où les autres font 6 à 7 : le
   texte vocalisé coûte deux octets par caractère en UTF-8.
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
12. **Tout `<form>` qui porte un mot de passe déclare `method="post"`**, même
    quand un `onSubmit` avec `preventDefault()` le rend inutile. Il ne sert pas
    au serveur : il sert à la fenêtre où la page n'est pas encore hydratée —
    script en vol, chunk en erreur, JavaScript coupé. Un `<form>` sans `method`
    se soumet alors en **GET**, et le mot de passe part dans la query string,
    donc dans l'historique du navigateur et dans les journaux du serveur. Ce
    n'est pas une hypothèse : c'est arrivé le 15 août 2026 sur le serveur de
    développement, avec un vrai compte.
    Ce qui décide, c'est **le HTML prérendu, pas le code source** : `auth/login`
    n'y met aucun formulaire — son `<Suspense fallback={null}>`, imposé par
    `useSearchParams()`, l'avale — quand `auth/signup` l'y met bel et bien, et
    le servait sans `method` à tout visiteur. Vérifier dans
    `.next/server/app/…​.html` avant de conclure qu'une page est à l'abri, et ne
    pas se fier à une protection fortuite qu'un crochet retiré ferait tomber.

13. **Ajouter une version de la Bible demande trois gestes, pas deux.** Une
    entrée dans `scripts/download-bible-versions.mjs` pour produire le fichier,
    une ligne dans `TEXT_VERSIONS` (`lib/storage/seed.ts`) pour qu'elle
    apparaisse aux Réglages, et une dans `VERSIONS` (`features/bible/import.ts`)
    pour que `loadData` sache où le chercher. Oublier la troisième donne une
    version qui s'affiche, se laisse cocher, et échoue au téléchargement sans
    autre explication — c'est arrivé le 16 août 2026, en production.
    `import.test.ts` compare désormais les deux tables dans les deux sens.

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
  **Le même défaut, à une autre échelle, a paralysé l'écran Administration** :
  `GET /api/admin/users` comptait par une requête PostgREST par ligne et par
  table, soit 337 allers-retours et de 19,5 à 94 secondes mesurées au
  navigateur. Ramené à sept requêtes le 18 août 2026. La leçon vaut au-delà de
  cette route : **un comptage dans une boucle sur les lignes est une requête
  par ligne**, et rien ne le signale tant que la table est petite.
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
  désormais été vus. **Ses actions ont été exercées le 18 août 2026**, par
  l'agent, sur le compte de test *Teste* : suspendre, réactiver, promouvoir,
  rétrograder, changer le statut d'un ticket et **supprimer un compte** passent
  toutes, chacune vue à l'écran **et** confirmée en base. Plus aucune action de
  cet écran n'est inconnue. Le compte de test a été consommé par la
  suppression : en recréer un pour la prochaine vérification. Voir un écran
  s'afficher n'est pas voir ses boutons agir — et un `200` sur l'action ne dit
  rien de la relecture qui suit, voir `spec/REPRISE.md`.
  Hors de cet écran, **le changement de mot de passe a été exercé le 16 août
  2026** depuis Profil, sur un compte réel, par le propriétaire du dépôt. Il
  reste la suppression d'un ticket support et la suppression en bloc de
  l'historique.
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
- **Un composant serveur ne peut pas lire le dictionnaire**, et c'est ainsi que
  le gabarit de `/auth` est resté français jusqu'au 15 août 2026 : le formulaire
  était traduit, son cadre — « Accueil », « Par Ôappliday — Ressources et
  Vous » — ne l'était pas. Trouvé à l'écran, pas par un relevé.
  `src/app/auth/layout.tsx` est désormais client. **Le prérendu n'en a pas
  souffert** : `/`, `/auth/login` et `/auth/signup` restent `○ (Static)` au
  build, un composant client étant tout de même rendu en HTML à ce moment-là.
  Vérifié, non supposé. Les trois autres composants serveur de `src/app/` sont
  propres — et `soutenir/page.tsx` montre le cas où le serveur se justifie : il
  porte un `metadata`, qu'un composant client n'a pas le droit d'exporter.
- **La traduction ne couvre pas tout, et le reste est délibéré.** La page de
  présentation `/` et les titres d'onglet (`metadata`) restent français : ils
  sont rendus côté serveur, un visiteur sans session n'a pas de réglage de
  langue à lire, et les traduire au client détruirait le prérendu que la règle 9
  protège. Les faire proprement suppose des pages statiques par langue.
  Restent français aussi les messages d'erreur des routes `src/app/api/`, et
  **les notifications push**, rédigées dans la fonction Edge :
  `notification_data()` devra remonter `settings.language` et
  `send-notifications` porter ses propres dictionnaires. C'est le seul endroit
  où la traduction sort du navigateur.
- **La réversion de langue est mesurée et corrigée**, le 15 août 2026 au soir.
  La piste était la bonne : `getSettings` poussait une ligne locale `_dirty`
  **sans jamais lire le distant**, si bien qu'un appareil dont la poussée avait
  échoué ramenait sa vieille valeur à chaque session. Le test
  `settings-store.test.ts` reproduit la condition — local `en` en attente,
  distant `fr` plus récent — et l'a vue rendre `en` avant correctif.
  La lecture du distant est désormais inconditionnelle, et le plus récent des
  deux gagne : `updateSettings` date chaque écriture dans le `jsonb`
  (`updatedAt`), que le distant porte donc aussi. Une ligne locale non datée —
  toutes celles écrites avant ce correctif — laisse gagner le distant.
  **Conséquence assumée** : une modification faite hors ligne et jamais poussée
  est abandonnée si le serveur a reçu autre chose entre-temps. C'est le
  dernier-écrivain-gagne, et c'est ce qui surprend le moins l'utilisateur.
  **Non vérifié au navigateur** : le chemin corrigé demande une session
  connectée, que l'agent n'a pas.
