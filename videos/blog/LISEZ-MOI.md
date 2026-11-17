# Articles du blog — import Ghost

`bible-ouverte-articles-ghost.zip` contient les 13 articles de la série, **en brouillons**,
avec leurs images à la une et leurs étiquettes. Il est produit par
`videos/outils/export-ghost.py` à partir de `videos/livrables/`.

## Importer

1. Ghost Admin (`blog.oappliday.tech/ghost`) → **Paramètres** → **Advanced** → **Import/Export**.
2. **Import content** → choisir `bible-ouverte-articles-ghost.zip`.
3. Les 13 articles apparaissent dans **Posts → Drafts**. Rien n'est publié.

## Ajouter les vidéos (après l'import)

`ajouter-videos-ghost.mjs` envoie les 13 MP4 et leurs aperçus (`apercus/`) dans Ghost et
remplace le paragraphe « Vidéo à insérer ici » de chaque brouillon par une carte Vidéo.
À lancer **sur votre ordinateur** (Node 18+, aucune dépendance) avec une clé d'intégration
Ghost (Settings → Integrations → Add custom integration → Admin API key) :

```bash
GHOST_ADMIN_KEY='<id>:<secret>' node videos/blog/ajouter-videos-ghost.mjs --essai
GHOST_ADMIN_KEY='<id>:<secret>' node videos/blog/ajouter-videos-ghost.mjs
```

`--essai` ne modifie rien. Relancer le script ne crée pas de doublon. Les articles restent
des brouillons.

## Avant de publier chaque article

- Vérifier que la vidéo est en place (voir ci-dessus).
- Les adresses des articles suivent les liens des messages WhatsApp
  (`blog.oappliday.tech/<slug>/`) : ne pas changer les slugs, ou corriger les messages.

## Pourquoi un fichier d'import

L'API d'administration de Ghost exige un jeton signé avec la clé secrète d'une intégration,
renouvelé toutes les cinq minutes : il faudrait déposer cette clé dans l'environnement de
travail. L'import évite d'y faire circuler un secret.
