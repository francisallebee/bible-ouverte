# SPEC.md — Application de suivi des lectures bibliques

> **État du document.** Les sections 1 à 9 décrivent la V1 telle qu'elle avait
> été cadrée. Le produit a depuis dépassé ce périmètre : il a des comptes
> distants et une synchronisation multi-appareils, explicitement exclus à
> l'origine. Les sections marquées **[V2]** décrivent l'application telle
> qu'elle est aujourd'hui ; les autres restent la trace de l'intention initiale.

## 1. Vision du produit

Créer une application web progressive (PWA) offline-first permettant d'enregistrer, consulter et analyser des lectures bibliques personnelles ou liées au ministère.

L'application doit permettre à l'utilisateur de :
- saisir une lecture biblique rapidement,
- associer cette lecture à un contexte,
- afficher le texte biblique correspondant,
- consulter l'historique,
- visualiser des statistiques,
- travailler sans connexion internet,
- utiliser l'application ensuite comme base pour une future expérience desktop macOS.

## 2. Objectif de la V1

La V1 doit permettre de :
- enregistrer une lecture biblique,
- choisir un contexte de lecture,
- afficher le texte biblique dans une ou plusieurs versions françaises libres de droits,
- retrouver l'historique localement,
- consulter des statistiques simples,
- fonctionner entièrement hors ligne sur le navigateur.

## 3. Périmètre

### Inclus
- Application web installable en PWA.
- Mode offline-first.
- Stockage local des données utilisateur.
- Gestion des lectures bibliques.
- Gestion de plusieurs contextes de lecture.
- Gestion de plusieurs versions bibliques françaises libres de droits.
- Statistiques de consultation.
- Interface optimisée pour desktop, prioritairement macOS.

### Exclus pour la V1
- Compte utilisateur distant. *(livré en V2)*
- Synchronisation multi-appareils. *(livré en V2)*
- Partage social.
- Collaboration en temps réel.
- Éditeur de notes avancé.
- Gestion de plans de lecture complexes. *(livré en V2)*
- Fonctionnalités desktop natives via Tauri.

### [V2] Ajouté depuis
- Comptes utilisateurs Supabase (inscription, connexion, suppression de compte).
- Synchronisation multi-appareils, le cloud faisant foi.
- Plans de lecture avec génération et suivi jour par jour.
- Back-office d'administration (utilisateurs, tickets).
- Support et feuille de route partagés entre utilisateurs connectés.
- Photos, notes audio et liens attachés à une lecture.

## 4. Public cible

- Utilisateur personnel qui veut suivre ses lectures bibliques.
- Pasteur ou prédicateur qui veut distinguer la lecture personnelle de la préparation de message.
- Utilisateur qui souhaite travailler hors ligne.
- Utilisateur desktop first, principalement sur macOS.

## 5. Principes de conception

1. Offline-first par défaut.
2. Lecture locale prioritaire.
3. Simplicité de saisie.
4. Données compréhensibles et exportables.
5. Architecture modulaire.
6. Préparation à une future version desktop.
7. Code structuré pour être piloté par OpenCode.

## 6. Stack technique recommandée

### Frontend
- Next.js 14+ (App Router).
- TypeScript.
- TailwindCSS.
- Recharts (statistiques).

### PWA
- Manifest PWA.
- Service worker manuel (network-first, cache-fallback).
- Cache statique et dynamique.

### Stockage local
- IndexedDB via `idb` comme couche d'abstraction.

### [V2] Stockage distant
- Supabase : authentification, PostgreSQL, Row Level Security, Storage.
- Supabase fait foi, IndexedDB devient un cache de consultation hors ligne.
- Schéma et policies versionnés dans `supabase/migrations/`.

### Données bibliques
- Fichiers JSON locaux (bundled).
- Première version centrée sur Louis Segond 1910 (domaine public).

### Déploiement
- GitHub pour le versioning.
- Vercel pour le déploiement web.

## 7. Données bibliques

### Versions prévues pour la V1
- Louis Segond 1910.

### [V2] Versions effectivement embarquées
Sept traductions françaises libres de droits, dans `public/bibles/` :
Louis Segond 1910, Darby, Martin 1744, Ostervald, Crampon 1923, Sacy,
Perret-Gentil et Rilliet 1861.

Seule Louis Segond 1910 est téléchargée à l'installation ; les autres
s'importent quand l'utilisateur les active dans les réglages.

### Règles
- Ne pas dépendre du réseau pour l'affichage d'un passage déjà disponible localement.
- Prévoir une structure permettant d'ajouter d'autres versions libres de droits plus tard.
- Chaque version doit contenir :
  - identifiant,
  - nom,
  - langue,
  - statut de droits,
  - source de données,
  - structure des livres, chapitres et versets.

## 8. Modèle métier

### Entité principale : `ReadingEntry`
Champs :
- `id` (auto)
- `date` (ISO string)
- `book` (string)
- `chapterStart` (number)
- `chapterEnd` (number)
- `verseStart` (number)
- `verseEnd` (number)
- `passageText` (string)
- `translationId` (string)
- `contextId` (string)
- `notes` (string)
- `createdAt` (ISO string)
- `updatedAt` (ISO string)

### Entité : `ReadingContext`
Champs :
- `id` (slug)
- `name` (string)
- `slug` (string)
- `color` (string hex)
- `icon` (string)
- `isSystemDefault` (boolean)

### Entité : `BibleVersion`
Champs :
- `id` (slug)
- `name` (string)
- `language` (string)
- `copyrightStatus` (string)
- `source` (string)
- `isEnabled` (boolean)

### Entité : `BiblePassage`
Champs :
- `id` (composite)
- `versionId` (string)
- `book` (string)
- `chapter` (number)
- `verse` (number)
- `text` (string)

### Entité : `AppSettings`
Champs :
- `id` (singleton)
- `defaultVersionId` (string)
- `theme` (string)
- `offlineModeEnabled` (boolean)
- `firstLaunchCompleted` (boolean)

### [V2] Écarts du modèle réel
Le modèle a grandi avec les comptes. Les champs qui font foi sont ceux de
`src/lib/storage/types.ts` et des migrations `supabase/migrations/` :
- toutes les entités personnelles portent un `user_id` et sont cloisonnées par RLS ;
- `ReadingEntry` a gagné `tags`, `links`, `photos`, `audio` ;
- `ReadingEntry.contextId` est enfin relié à l'interface : le champ existait au
  SPEC mais aucune colonne ne le portait et le formulaire enregistrait
  `tags: []`. Un seul contexte par lecture, choisi dans un menu déroulant que
  l'utilisateur peut compléter ;
- `ReadingPlan` et `PlanDay` sont apparus (plans de lecture) ;
- `AppSettings` est stocké côté serveur en un seul `jsonb`, ce qui évite une
  migration à chaque nouveau réglage ;
- `Profile` porte `is_admin` et `suspended` — voir `supabase/README.md` avant
  d'y toucher.

## 9. Contextes de lecture

Contextes par défaut :
- Lecture personnelle
- Église
- YouTube
- Logiciel biblique
- Autres

Le système doit permettre l'ajout, la modification et la désactivation (sans perte d'historique).

## 10. Écrans

### 10.1 Tableau de bord (/)
- Dernière lecture
- Bouton "Nouvelle lecture"
- Résumé statistique (3 cartes)
- Répartition par contexte

### 10.2 Nouvelle lecture (/new-reading)
- Formulaire complet avec aperçu texte biblique

### 10.3 Historique (/history)
- Liste chronologique avec filtres

### 10.4 Détail d'une lecture (/reading/[id])
- Texte complet, métadonnées, édition, suppression

### 10.5 Statistiques (/stats)
- Graphiques (par jour, contexte, livre, version)

### 10.6 Contextes (/contexts)
- CRUD contextes (suppression logique)

### 10.7 Versions
- Activation/désactivation, version par défaut
- **Jamais livré comme écran distinct** : le choix de la version par défaut a été
  intégré aux Réglages.

### 10.8 Réglages (/settings)
- Thème, export, import, infos app

### [V2] 10.9 Écrans ajoutés
- `/auth/login`, `/auth/signup`, `/auth/callback` — comptes
- `/plans` et `/plans/[id]` — plans de lecture
- `/progress` — avancement dans les plans
- `/search` — recherche dans le texte biblique
- `/profil` — profil utilisateur
- `/roadmap` — feuille de route publique
- `/support` — tickets partagés
- `/admin` — back-office (réservé `is_admin`)

## 11. Statistiques

Indicateurs minimum :
- Total lectures
- Lectures par semaine/mois
- Répartition par contexte, livre, version

## 12. Qualité

- Code typé TypeScript. ✅ `npx tsc --noEmit` passe sans erreur.
- Composants réutilisables. ✅
- Fonctions pures pour les calculs. ✅
- Tests unitaires sur les fonctions critiques. ❌ **Aucun test à ce jour**, et
  aucun ESLint configuré. La génération de plans et les agrégations de
  statistiques sont les premières candidates.
- Validation offline manuelle. ⚠️ À refaire : le service worker ne s'installait
  pas jusqu'à la correction du précache (`/offline` → `/offline.html`).

## 13. Plan de livraison

### Phase 1 — Fondation
- Structure projet
- Modèle de données
- Stockage local
- Écran nouvelle lecture

### Phase 2 — Consultation
- Historique
- Détail
- Contextes
- Versions

### Phase 3 — Analyse
- Statistiques
- Recherche et filtres
- Export/Import

### Phase 4 — PWA
- PWA complète
- Validation offline
- Optimisation UX
