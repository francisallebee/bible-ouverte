"""Voix off d'un épisode HyperFrames : un WAV par scène + un plan de montage (minutage).
Usage : python voix.py narration.json dossier_projet"""
import json, os, subprocess, sys, wave, pathlib
n = json.loads(pathlib.Path(sys.argv[1]).read_text())
projet = pathlib.Path(sys.argv[2])
modele = pathlib.Path(__file__).resolve().parent.parent / "outils" / "modeles" / f'{n["voix"]}.onnx'
out = projet / "assets" / "voix"; out.mkdir(parents=True, exist_ok=True)
DEBUT, QUEUE = 0.35, 0.75   # marge avant la voix, silence après
t = 0.0; plan = []
for s in n["scenes"]:
    wav = out / f'{s["id"]}.wav'
    subprocess.run([os.environ.get("PIPER", "piper"), "-m", str(modele), "-f", str(wav),
                    "--length-scale", "1.08", "--sentence-silence", "0.35"], input=s["texte"].encode(), check=True, capture_output=True)
    with wave.open(str(wav)) as w: d = w.getnframes() / w.getframerate()
    duree = round(DEBUT + d + QUEUE, 2)
    plan.append({**s, "debut": round(t, 2), "duree": duree, "voix_debut": round(t + DEBUT, 2), "voix_duree": round(d, 2)})
    t += duree
(projet / "plan.json").write_text(json.dumps({"id": n["id"], "total": round(t, 2), "scenes": plan}, ensure_ascii=False, indent=2))
for p in plan: print(f'{p["id"]:12} {p["debut"]:6.2f} +{p["duree"]:.2f}')
print("total", round(t, 2))
