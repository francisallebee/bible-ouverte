"""Construit un fichier d'import Ghost (.zip) avec les articles de la série, en BROUILLONS.

Usage : python export-ghost.py videos/livrables videos/blog/bible-ouverte-articles-ghost.zip

Le zip contient :
- bible-ouverte-articles.json : 13 articles, statut « draft », slug, titre, extrait,
  étiquettes, image à la une ;
- content/images/bible-ouverte/NN-*.png : les couvertures, que Ghost importe avec le zip.

À importer dans Ghost : Paramètres → Advanced → Import/Export → Import content.
Rien n'est publié : chaque article arrive en brouillon.

Les vidéos ne passent pas par l'import : chaque brouillon porte, en tête, un encadré
qui dit quel fichier MP4 insérer à cet endroit (carte Vidéo de l'éditeur Ghost).
"""
import json
import pathlib
import re
import sys
import time
import zipfile

import markdown

src = pathlib.Path(sys.argv[1])
dest = pathlib.Path(sys.argv[2])
dest.parent.mkdir(parents=True, exist_ok=True)

now_iso = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
posts, tags, posts_tags = [], {}, []


def front_matter(texte):
    m = re.match(r"^---\n(.*?)\n---\n", texte, re.S)
    meta = {}
    for ligne in m.group(1).splitlines():
        cle, _, val = ligne.partition(":")
        val = val.strip()
        if val.startswith("[") and val.endswith("]"):
            meta[cle.strip()] = [v.strip() for v in val[1:-1].split(",") if v.strip()]
        else:
            meta[cle.strip()] = val.strip('"')
    return meta, texte[m.end():]


with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as z:
    for i, article in enumerate(sorted(src.glob("[0-9][0-9]-*-article.md")), start=1):
        meta, corps = front_matter(article.read_text())
        corps = re.sub(r"^# .*\n", "", corps.lstrip(), count=1)  # le titre est un champ à part
        html = markdown.markdown(corps, extensions=["tables"])
        video = meta.get("video", "")
        encadre = (
            f'<p><strong>🎬 Vidéo à insérer ici :</strong> <code>{video}</code> '
            f"(dossier <code>videos/livrables</code> du dépôt). Retire ce paragraphe une fois la vidéo ajoutée.</p>"
        )
        image = meta["image"]
        chemin_image = f"content/images/bible-ouverte/{image}"
        z.write(src / image, chemin_image)
        post_id = f"bo-serie-{i:02d}"
        posts.append({
            "id": post_id,
            "title": meta["titre"],
            "slug": meta["slug"],
            "html": encadre + html,
            "status": "draft",
            "type": "post",
            "visibility": "public",
            "custom_excerpt": meta["description"][:300],
            "feature_image": f"/{chemin_image}",
            "created_at": now_iso,
            "updated_at": now_iso,
            "published_at": None,
        })
        for nom in meta.get("categories", []):
            slug = re.sub(r"[^a-z0-9]+", "-", nom.lower().replace("é", "e").replace("è", "e")).strip("-")
            tags.setdefault(slug, {"id": f"bo-tag-{slug}", "name": nom, "slug": slug})
            posts_tags.append({"post_id": post_id, "tag_id": tags[slug]["id"]})

    export = {"db": [{"meta": {"exported_on": int(time.time() * 1000), "version": "6.0.0"},
                      "data": {"posts": posts, "tags": list(tags.values()), "posts_tags": posts_tags}}]}
    z.writestr("bible-ouverte-articles.json", json.dumps(export, ensure_ascii=False, indent=1))

print(f"{dest} : {len(posts)} brouillons, {len(tags)} étiquettes")
