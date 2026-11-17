#!/bin/bash
# Télécharge la voix française Piper utilisée par la série (≈ 63 Mo, non versionnée).
# Source : rhasspy/piper-voices sur Hugging Face. Licence de la voix siwis : CC BY 4.0.
set -e
cd "$(dirname "$0")/modeles"
B=https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium
for f in fr_FR-siwis-medium.onnx fr_FR-siwis-medium.onnx.json; do
  [ -f "$f" ] || curl -fL -o "$f" "$B/$f"
done
ls -la
