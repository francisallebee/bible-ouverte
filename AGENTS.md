# Session: Multi-utilisateurs

## Objective
Ajouter une gestion multi-utilisateurs locale — chaque personne a son espace personnel (lectures, plans, progression).

## What was done

### Architecture
- Les données sont filtrées par `userId` dans toutes les requêtes (lectures, plans, jours de plan)
- Le `userId` est lu depuis les réglages (`AppSettings.currentUserId`) à chaque appel de store
- Rétrocompatibilité : les données existantes sans `userId` sont traitées comme appartenant à "default"

### Types (src/lib/storage/types.ts)
- `UserProfile { id, name, color, createdAt }`
- `ReadingEntry.userId: string`
- `ReadingPlan.userId: string`
- `PlanDay.userId: string`
- `AppSettings.currentUserId: string`

### DB (src/lib/storage/db.ts)
- Version bump 2 → 3
- Nouveau store `users` (keyPath: 'id')

### Stores
- `src/lib/storage/user-store.ts` : `getCurrentUserId()`, `getCurrentUser()`, `getAllUsers()`, `addUser()`, `switchUser()`, `deleteUser()`
- `src/lib/storage/reading-store.ts` : toutes les fonctions filtrent par `userId` via `getCurrentUserId()`
- `src/lib/storage/plan-store.ts` : `getAllPlans()`, `getPlan()` filtrent par `userId`
- `src/lib/storage/seed.ts` : crée un utilisateur "default" au premier lancement

### UI
- **Page /profiles** : liste des utilisateurs, créer (nom + couleur), switch, supprimer avec confirmation
- **Sidebar** : affiche l'utilisateur actif en bas avec son avatar (initiale + couleur), lien vers /profiles
- **Réglages** : nouvelle section "Utilisateurs" avec bouton "Gérer les utilisateurs"

### Fichiers modifiés
- src/lib/storage/types.ts, db.ts, seed.ts, index.ts
- src/lib/storage/reading-store.ts, plan-store.ts (user-store.ts new)
- src/components/Sidebar.tsx
- src/app/plans/page.tsx, src/app/plans/[id]/page.tsx
- src/app/settings/page.tsx
- src/app/profiles/page.tsx (new)

## Build Status
- `npx tsc --noEmit` : passe
- `npx next build` : passe (14 routes)

## Utilisation
1. Va dans Réglages → Utilisateurs → Gérer les utilisateurs
2. Ajoute des profils (prénom + couleur)
3. Clique "Utiliser" pour changer d'utilisateur
4. Chaque utilisateur a ses propres lectures, plans et progression

## Next Steps (suggested)
1. Export/import d'un utilisateur spécifique
2. Protection par mot de passe (simpliste, localStorage)
3. Mode invité sans création de profil
4. Stats comparatives entre utilisateurs
