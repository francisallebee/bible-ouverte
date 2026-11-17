#!/bin/bash
# Prépare un épisode HyperFrames : dossier, ressources, voix, musique.
# Usage : nouvel-episode.sh NN dossier graine style   (ex. 04 ep04-recherche 31 lumineux)
# Prérequis : narration-epNN.json écrit, PIPER pointant vers piper, voix téléchargée.
set -e
cd "$(dirname "$0")"
NN=$1; P=$2; GRAINE=${3:-7}; STYLE=${4:-calme}
PY=${PYTHON:-python3}
mkdir -p "$P/assets/img" "$P/assets/fonts" "$P/vendor"
cp ep02-premiere-lecture/assets/img/icon-512.png "$P/assets/img/"
cp ep02-premiere-lecture/assets/fonts/*.woff2 "$P/assets/fonts/"
cp ep02-premiere-lecture/vendor/gsap.min.js "$P/vendor/"
cp ep02-premiere-lecture/hyperframes.json ep02-premiere-lecture/package.json "$P/"
printf '{\n  "id": "%s",\n  "name": "%s"\n}\n' "$P" "$P" > "$P/meta.json"
[ -e "$P/node_modules" ] || ln -s ../node_modules "$P/node_modules" 2>/dev/null || true
$PY voix.py "narration-ep$NN.json" "$P"
TOTAL=$(python3 -c "import json;print(json.load(open('$P/plan.json'))['total'])")
$PY ../outils/musique.py "$TOTAL" "$P/assets/musique.wav" "$GRAINE" "$STYLE"
