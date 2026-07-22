# SPEC.md — Application de suivi des lectures bibliques

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
- Compte utilisateur distant.
- Synchronisation multi-appareils.
- Partage social.
- Collaboration en temps réel.
- Éditeur de notes avancé.
- Gestion de plans de lecture complexes.
- Fonctionnalités desktop natives via Tauri.

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

### Données bibliques
- Fichiers JSON locaux (bundled).
- Première version centrée sur Louis Segond 1910 (domaine public).

### Déploiement
- GitHub pour le versioning.
- Vercel pour le déploiement web.

## 7. Données bibliques

### Versions prévues pour la V1
- Louis Segond 1910.

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

### 10.7 Versions (/versions)
- Activation/désactivation, version par défaut

### 10.8 Réglages (/settings)
- Thème, export, import, infos app

## 11. Statistiques

Indicateurs minimum :
- Total lectures
- Lectures par semaine/mois
- Répartition par contexte, livre, version

## 12. Qualité

- Code typé TypeScript.
- Composants réutilisables.
- Fonctions pures pour les calculs.
- Tests unitaires sur les fonctions critiques.
- Validation offline manuelle.

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
