#!/bin/bash
# Image de blog 1200×630 d'un épisode.
# Usage : couverture.sh NN "Titre," "accent" sortie.png
# (mettre une espace insécable après un mot d'une lettre : "à lire")
set -e
SORTIE=$(realpath -m "$4")
cd "$(dirname "$0")/couverture"
export HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1 HYPERFRAMES_SKIP_SKILLS=1
[ -e node_modules ] || ln -s ../node_modules node_modules
T=$(mktemp -d)
V=$(python3 -c "import json,sys;print(json.dumps({'surtitre':'Bible Ouverte · Épisode '+str(int(sys.argv[1])),'titre':sys.argv[2],'accent':sys.argv[3]}))" "$1" "$2" "$3")
npx hyperframes render --format png-sequence --fps 1 --workers 1 -o "$T/png" --variables "$V" >/dev/null 2>&1
ffmpeg -v error -y -f lavfi -i color=c=0x0a1626:s=1200x630 -i "$T/png/frame_000001.png" \
  -filter_complex "[0][1]overlay=format=auto,format=rgb24" -frames:v 1 "$SORTIE"
rm -rf "$T"
echo "$SORTIE"
