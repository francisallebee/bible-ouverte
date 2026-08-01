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
  lignes Supabase et le cache IndexedDB. Le passage au Storage Supabase reste à
  faire, et demande de reprendre les lignes existantes (une route d'upload
  existait, retirée faute d'appelant — voir l'historique git).
- Les buckets de stockage `photos` et `audio` sont configurés hors du dépôt et
  leurs policies n'ont pas été auditées.
- La couverture de tests se limite aux deux modules les plus critiques
  (génération de plans, classification des livres). Les agrégations de
  statistiques ne sont pas couvertes.
- `npm audit` signale deux vulnérabilités dans une dépendance interne de Next
  14 ; le correctif passe par une montée en version majeure de Next.
