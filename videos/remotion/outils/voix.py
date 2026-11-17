"""Génère la voix off d'une vidéo : un WAV par scène, et leurs durées.
Usage : python voix.py narration/pourquoi.json"""
import json, os, subprocess, sys, wave, pathlib
racine = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1])
n = json.loads(src.read_text())
sortie = racine / "public" / "voix" / n["id"]; sortie.mkdir(parents=True, exist_ok=True)
modele = racine.parent / "outils" / "modeles" / f'{n["voix"]}.onnx'
durees = {}
for s in n["scenes"]:
    wav = sortie / f'{s["id"]}.wav'
    subprocess.run([os.environ.get("PIPER", "piper"), "-m", str(modele), "-f", str(wav),
                    "--length-scale", str(n.get("lenteur", 1.08)), "--sentence-silence", "0.35"],
                   input=s["texte"].encode(), check=True, capture_output=True)
    with wave.open(str(wav)) as w: durees[s["id"]] = round(w.getnframes() / w.getframerate(), 3)
gen = racine / "src" / "generated"; gen.mkdir(exist_ok=True)
(gen / f'{n["id"]}.json').write_text(json.dumps({**n, "durees": durees}, ensure_ascii=False, indent=2))
print(durees, "total", round(sum(durees.values()), 1))
