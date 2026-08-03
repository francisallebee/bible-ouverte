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
| `src/lib/supabase/store.ts` | Accès Supabase depuis le navigateur |
| `src/lib/storage/` | Cache IndexedDB et logique métier par domaine |
| `src/features/bible/` | Livres, classification, import des versions |
| `src/data/bibles/` | 6 versions françaises libres de droits (~40 Mo) |
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
   en ferait 40 Mo de chunks.
5. `npm run typecheck`, `npm run lint` et `npm test` doivent passer avant
   chaque commit.
6. Pas de dépendance nouvelle sans raison sérieuse.
7. Toute ressource servie avant connexion doit être exclue du `matcher` du
   middleware, sans quoi elle répond une redirection vers `/auth/login`.

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
  plans, classification des livres, robustesse des mots de passe). Les
  agrégations de statistiques ne sont pas couvertes.
- `npm audit` signale deux vulnérabilités dans une dépendance interne de Next
  14 ; le correctif passe par une montée en version majeure de Next.
- **Le texte de Sacy est amputé** : Genèse 49 chapitres sur 50, Exode 39/40,
  Psaumes 149/150, Cantique 6/8, et d'autres. Le défaut vient du fichier source
  (`heb12/gratis.json`), pas de la conversion. Le corriger suppose de trouver
  une meilleure source ou d'écarter cette version. Les six autres traductions
  ont été vérifiées livre par livre et sont complètes — seul Malachie compte
  3 chapitres au lieu de 4 dans Crampon et Darby, ce qui est une différence de
  versification légitime et non un manque.
- **Toutes les versions sont importées au premier chargement** :
  `importAllBibleData` ne connaît pas le chargement à la demande. À sept
  versions, cela représente environ 220 000 versets en IndexedDB par appareil.
  Tenable aujourd'hui, bloquant au-delà d'une dizaine de versions.
- Les écrans Nouvelle lecture, Historique, Statistiques, Progression, Profil et
  Réglages ont été modifiés en profondeur sans **vérification visuelle** : ils
  sont derrière l'authentification. Typage, lint, tests et build passent, ce
  qui n'est pas la même chose que de les avoir vus fonctionner.
