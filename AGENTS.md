# AGENTS.md — Bible Ouverte

Guide de travail sur le dépôt. Pour le produit et le périmètre, voir
[spec/SPEC.md](spec/SPEC.md) ; pour la base de données, [supabase/README.md](supabase/README.md).

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

## Carte du code

| Chemin | Rôle |
|---|---|
| `src/app/` | Écrans (App Router) et routes API |
| `src/components/landing/` | Page de présentation servie sur `/` |
| `src/lib/supabase/store.ts` | Accès Supabase depuis le navigateur |
| `src/lib/storage/` | Cache IndexedDB et logique métier par domaine |
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
- **Les déploiements de preview Vercel restent bloqués, à moitié.** Les cinq
  routes API portent désormais `export const dynamic = 'force-dynamic'` : Next
  ne les exécute plus pendant la génération statique, et `createAdminClient()`
  ne lève donc plus d'exception faute de clés. Reste l'autre moitié, qui ne se
  règle pas dans le dépôt : les variables Supabase n'existent que dans
  l'environnement Production, et le middleware planterait à chaque requête sans
  elles. Il faut ajouter `NEXT_PUBLIC_SUPABASE_URL` et
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` à l'environnement Preview depuis le tableau
  de bord. La clé `service_role` n'a rien à y faire : chaque branche poussée y
  est déployée sur une URL publique.
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
- Les écrans **Plans de lecture**, **Détail d'un plan**, **Détail d'une
  lecture** et **Administration** n'ont toujours jamais été vus fonctionner :
  typage, lint, tests et build passent, ce qui n'est pas la même chose. Les
  autres écrans (Nouvelle lecture, Recherche, Historique, Statistiques,
  Progression, Réglages, Profil, Support, Feuille de route, Soutenir) ont été
  vérifiés au navigateur le 9 août 2026.
