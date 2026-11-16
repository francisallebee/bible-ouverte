# Vidéos — « Bible Ouverte, fonction par fonction »

Série de vidéos courtes (verticales 1080 × 1920, ~55 s, voix off française, sous-titres
incrustés, musique de fond) en réponse au sondage des utilisateurs du groupe WhatsApp
**Bible-Ouverte.app** de la communauté Ôappliday. Chaque épisode est accompagné d'un
article et d'une image pour **blog.oappliday.tech**, et d'un message prêt à poster dans
le groupe.

Ce dossier est **indépendant de l'application** : il est exclu de `tsconfig.json` et
d'ESLint, n'est pas servi par Next.js et a ses propres dépendances.

## Où trouver quoi

| Dossier | Contenu |
|---|---|
| `livrables/` | **Ce qui se publie** : les MP4, les images de blog (1200 × 630), les articles (`.md`), les messages WhatsApp (`.txt`), les essais de voix |
| `hyperframes/` | Les épisodes faits avec **HyperFrames** (à partir de l'épisode 2) et le gabarit de couverture de blog |
| `remotion/` | L'épisode 1, fait avec **Remotion** avant que HyperFrames ne soit en place |
| `outils/` | Musique de fond, mixage, normalisation, téléchargement de la voix |

À partir de l'épisode 3, les épisodes HyperFrames s'appuient sur `hyperframes/commun.py` (fond,
téléphone, titres d'étape, sous-titres, audio, scène finale) : `construire-epXX.py` ne décrit
plus que les écrans et le minutage de l'épisode.

## Les épisodes

| # | Titre | Outil | Fichiers |
|---|---|---|---|
| 1 | Pourquoi ouvrir Bible Ouverte ? | Remotion | `livrables/01-*` |
| 2 | Ta première lecture, en moins d'une minute | HyperFrames | `livrables/02-*` |
| 3 | Un plan de lecture, à lire ensemble | HyperFrames | `livrables/03-*` |

Ordre convenu pour la suite : recherche dans les 15 versions,
mots hébreux et grecs, progression et badges, verset du jour et rappels, quiz, mémorisation,
statistiques, historique, messages, réglages et hors-ligne.

Les liens vers le blog écrits dans les messages WhatsApp (`blog.oappliday.tech/<slug>`) sont
des **suppositions** : les corriger une fois l'article publié.

## Feuille de route de la série (suivi)

Un épisode est **fait** quand ses quatre livrables sont dans `livrables/` (`NN-*.mp4`,
`NN-*-couverture.png`, `NN-*-article.md`, `NN-message-whatsapp.txt`), committés et poussés.
Le prochain épisode à faire est le premier de cette liste dont les livrables manquent.

| # | Fonction | Écran / sources à lire avant d'écrire | Fait |
|---|---|---|---|
| 1 | Pourquoi Bible Ouverte | — | ✅ |
| 2 | Noter une lecture | `src/app/new-reading`, `fr.ts › newReading` | ✅ |
| 3 | Plans de lecture à plusieurs | `src/app/plans`, `fr.ts › plans, planCatalog, partage` | ✅ |
| 4 | Recherche dans les 15 versions | `src/app/search`, `fr.ts › search` | |
| 5 | Mots hébreux et grecs (Strong, originaux) | `features/bible/strong.ts`, `originaux.ts`, `fr.ts › strong` | |
| 6 | Progression et badges | `src/app/progress`, `fr.ts › progress` | |
| 7 | Verset du jour et rappels | `src/app/verset-du-jour`, `fr.ts › versetDuJour, notifications` | |
| 8 | Quiz | `src/app/quiz`, `fr.ts › quiz` | |
| 9 | Mémorisation | `src/app/memorisation`, `fr.ts › memorisation` | |
| 10 | Statistiques | `src/app/stats`, `fr.ts › stats` | |
| 11 | Historique | `src/app/history`, `fr.ts › history` | |
| 12 | Messages | `src/app/messages`, `fr.ts › messages` | |
| 13 | Réglages : langues, versions, thème, hors ligne | `src/app/settings`, `fr.ts › settings` | |

Règles tenues sur toute la série : ne rien affirmer que le code ne fait pas (lire l'écran
et `fr.ts` d'abord) ; vérifier les images (`hyperframes snapshot`) avant le rendu ;
`npm run typecheck`, `npm run lint` et `npm test` avant chaque commit ; cocher la ligne
ci-dessus dans le même commit que les livrables.

## Refaire ou modifier un épisode

### Prérequis (une fois)

```bash
python3 -m venv .venv && .venv/bin/pip install piper-tts numpy
export PIPER="$PWD/.venv/bin/piper"
videos/outils/telecharger-voix.sh          # voix française siwis, ≈ 63 Mo
```

`ffmpeg` doit être installé. HyperFrames et Remotion utilisent Chrome / Chromium.

### Épisode HyperFrames (ex. épisode 2)

```bash
cd videos/hyperframes && npm ci
# chaque projet d'épisode utilise ce node_modules :
ln -s ../node_modules ep03-plans/node_modules
# 1. la voix : un WAV par scène + plan.json (minutage)
../../.venv/bin/python voix.py narration-ep02.json ep02-premiere-lecture
# 2. la musique (déterministe : même graine, même musique)
../../.venv/bin/python ../outils/musique.py "$(python3 -c "import json;print(json.load(open('ep02-premiere-lecture/plan.json'))['total'])")" ep02-premiere-lecture/assets/musique.wav 11 lumineux
# 3. la composition, calée sur la voix
python3 construire-ep02.py ep02-premiere-lecture
# 4. vérifier, regarder, rendre
cd ep02-premiere-lecture && npx hyperframes lint && npx hyperframes snapshot --at 8,17,30
npx hyperframes render -o /tmp/ep02.mp4 --quality delivery
# 5. volume final à -16 LUFS
../../outils/normaliser.sh /tmp/ep02.mp4 ../../livrables/02-premiere-lecture.mp4
```

Le texte dit par la voix est dans `narration-epXX.json` : le modifier, puis refaire les
étapes 1 à 5. La musique et la voix suivent toutes seules.

### Couverture de blog

`hyperframes/couverture/index.html` prend ses textes en variables :

```bash
cd videos/hyperframes/couverture
npx hyperframes render --format png-sequence --fps 1 -o /tmp/couv \
  --variables '{"surtitre":"Bible Ouverte · Épisode 3","titre":"Un plan,","accent":"à plusieurs"}'
ffmpeg -f lavfi -i color=c=0x0a1626:s=1200x630 -i /tmp/couv/frame_000001.png \
  -filter_complex "[0][1]overlay=format=auto,format=rgb24" -frames:v 1 couverture.png
```

Le fond uni passé à `ffmpeg` n'est pas décoratif : l'export PNG est en RGBA, et sans
lui les zones semi-transparentes ressortent en couleurs parasites.

### Épisode 1 (Remotion)

```bash
cd videos/remotion && npm ci
../../.venv/bin/python outils/voix.py narration/pourquoi.json
npx remotion render Pourquoi /tmp/ep01.mp4
../outils/normaliser.sh /tmp/ep01.mp4 /tmp/ep01-norm.mp4
../../.venv/bin/python ../outils/musique.py 57 /tmp/ep01-musique.wav 7 calme
../outils/mixer.sh /tmp/ep01-norm.mp4 /tmp/ep01-musique.wav ../livrables/01-pourquoi-bible-ouverte.mp4
```

## Droits

- **Musique** : composée par `outils/musique.py`, synthèse pure, sans échantillon ni
  emprunt. Aucun droit tiers.
- **Voix** : Piper, voix `fr_FR-siwis-medium` (licence CC BY 4.0).
- **Polices** : Lora, Inter, Noto Serif (SIL Open Font License), via Fontsource.
- **Texte biblique** : Louis Segond 1910, domaine public.
- **Remotion** est gratuit pour les structures de trois personnes au plus.
- **HyperFrames** est sous licence Apache 2.0.
