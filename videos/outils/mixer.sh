#!/bin/bash
# Pose la musique sous la voix d'une vidéo, avec ducking (la musique baisse quand la voix parle).
# La voix de l'entrée doit déjà être normalisée (-16 LUFS). Gain fixe : pas de loudnorm dynamique,
# qui remonterait la musique dans les silences.
# Usage : mixer.sh entree.mp4 musique.wav sortie.mp4 [gain_musique]
set -e
G=${4:-0.11}
ffmpeg -v error -y -i "$1" -i "$2" -filter_complex "
[0:a]aresample=48000,asplit=2[voix][cle];
[1:a]aresample=48000,volume=$G[mus];
[mus][cle]sidechaincompress=threshold=0.02:ratio=4:attack=60:release=900[musduck];
[voix][musduck]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.89:level=false[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$3"
