# Articles du blog — import Ghost

`bible-ouverte-articles-ghost.zip` contient les 13 articles de la série, **en brouillons**,
avec leurs images à la une et leurs étiquettes. Il est produit par
`videos/outils/export-ghost.py` à partir de `videos/livrables/`.

## Importer

1. Ghost Admin (`blog.oappliday.tech/ghost`) → **Paramètres** → **Advanced** → **Import/Export**.
2. **Import content** → choisir `bible-ouverte-articles-ghost.zip`.
3. Les 13 articles apparaissent dans **Posts → Drafts**. Rien n'est publié.

## Avant de publier chaque article

- En tête de chaque brouillon, un paragraphe « Vidéo à insérer ici » nomme le fichier MP4
  (dans `videos/livrables/`) : ajouter une carte **Vidéo** à cet endroit, puis retirer le
  paragraphe.
- Les adresses des articles suivent les liens des messages WhatsApp
  (`blog.oappliday.tech/<slug>/`) : ne pas changer les slugs, ou corriger les messages.

## Pourquoi un fichier d'import

L'API d'administration de Ghost exige un jeton signé avec la clé secrète d'une intégration,
renouvelé toutes les cinq minutes : il faudrait déposer cette clé dans l'environnement de
travail. L'import évite d'y faire circuler un secret.
