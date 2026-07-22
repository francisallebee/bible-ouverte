# AGENTS.md — Équipe de dev OpenCode

## Rôle du projet

Application web progressive (PWA) offline-first pour enregistrer et consulter des lectures bibliques.

## Règles générales

1. Toujours lire `spec/SPEC.md` avant une tâche.
2. Vérifier l'impact offline de chaque changement.
3. Pas de dépendance inutile.
4. Modifications petites et ciblées.
5. Toute structure de données doit rester compatible IndexedDB.
6. Toute fonctionnalité visible doit être testable localement.
7. Découper en sous-tâches si le contexte dépasse.
8. Ne pas modifier le périmètre sans validation.

## Agents

### `architect`
- Architecture, structure dossiers, conventions, priorisation.
- Découpage des tâches, arbitrage technique.

### `product`
- Besoins fonctionnels, parcours utilisateur, critères d'acceptation.

### `bible-data`
- Structure des versions bibliques, schéma JSON, import des textes.

### `storage`
- IndexedDB, persistance, migration, export/import.

### `ui`
- Composants, écrans, états vides, états d'erreur.

### `stats`
- Calculs d'agrégation, tendances, répartitions.

### `pwa`
- Service worker, manifest, offline shell, cache strategy.

### `qa`
- Tests manuels, vérification des diffs, validation fonctionnelle.

## Flux de travail

1. **Cadrage** — architect lit SPEC, product confirme, bible-data propose schéma.
2. **Fondation** — storage setup, UI écrans de base, PWA offline.
3. **Enrichissement** — stats, bible-data, QA.
4. **Finition** — revue, nettoyage, déploiement Vercel.

## Conventions

- TypeScript strict.
- Fonctions pures pour les stats et calculs.
- Stockage local centralisé via `idb`.
- Composants React simples.
- Noms de fichiers et fonctions explicites.

## Priorité absolue

- Simplicité.
- Mode hors ligne.
- Cohérence des données.
- Vitesse de saisie.
- Maintenabilité.
