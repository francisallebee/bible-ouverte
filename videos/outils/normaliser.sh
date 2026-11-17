#!/bin/bash
# Amène une vidéo à -16 LUFS intégrés par un gain fixe (pas de pompage), avec limiteur.
# Usage : normaliser.sh entree.mp4 sortie.mp4
set -e
I=$(ffmpeg -hide_banner -i "$1" -vn -af ebur128 -f null /dev/null 2>&1 | grep -A1 "Integrated loudness" | grep -oE -e "-?[0-9]+\.[0-9]+" | head -1)
G=$(python3 -c "print(round(-16-($I),2))")
echo "intégré $I LUFS, gain $G dB"
ffmpeg -v error -y -i "$1" -c:v copy -af "volume=${G}dB,alimiter=limit=0.89:level=false" -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$2"
