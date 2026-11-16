"""Briques communes des épisodes HyperFrames (à partir de l'épisode 3).

Un épisode = narration-epXX.json → voix.py → plan.json → construire-epXX.py → index.html.
Ce module fournit le fond, le téléphone, les titres d'étape, les sous-titres, l'audio,
la scène d'appel final et l'en-tête HTML, pour que chaque épisode ne décrive que ses
écrans et son minutage.
"""
import html
import json
import pathlib
import re


class Episode:
    def __init__(self, projet: pathlib.Path):
        self.projet = projet
        self.plan = json.loads((projet / "plan.json").read_text())
        self.S = {s["id"]: s for s in self.plan["scenes"]}
        self.total = self.plan["total"]

    # instants -----------------------------------------------------------------
    def a(self, scene: str, dt: float) -> float:
        """Instant absolu : début de la voix de la scène + dt secondes."""
        return round(self.S[scene]["voix_debut"] + dt, 2)

    def debut(self, scene: str) -> float:
        return self.S[scene]["debut"]

    def fin(self, scene: str) -> float:
        s = self.S[scene]
        return round(s["debut"] + s["duree"], 2)

    # éléments -----------------------------------------------------------------
    def scene(self, sid: str, contenu: str) -> str:
        s = self.S[sid]
        return (f'<section id="sc-{sid}" class="clip scene" data-start="{s["debut"]}" '
                f'data-duration="{s["duree"]}" data-track-index="1">{contenu}</section>')

    def etape(self, sid: str, n: int, titre: str) -> str:
        return self.scene(sid, f'<div class="etape"><span class="num">{n}</span><span class="et-titre">{titre}</span></div>')

    def titre(self, sid: str, html_titre: str, haut: int = 170) -> str:
        return self.scene(sid, f'<h1 class="titre-scene" style="top:{haut}px">{html_titre}</h1>')

    def sous_titres(self) -> str:
        sortie = []
        i = 0
        for s in self.plan["scenes"]:
            ps = [x.strip() for x in re.split(r"(?<=[.?!…])\s+", s["texte"]) if x.strip()]
            ps = [p[0].upper() + p[1:] for p in ps]
            tot = sum(len(p) for p in ps)
            t = s["voix_debut"]
            for k, p in enumerate(ps):
                d = s["voix_duree"] * len(p) / tot
                fin = t + d if k < len(ps) - 1 else s["debut"] + s["duree"] - 0.15
                sortie.append(f'<div class="clip st" id="st{i}" data-start="{round(t, 2)}" '
                              f'data-duration="{round(fin - t, 2)}" data-track-index="5"><span>{html.escape(p)}</span></div>')
                t += d
                i += 1
        return "\n".join(sortie)

    def audio(self, volume_musique: float = 0.11) -> str:
        lignes = [
            f'<audio id="voix-{s["id"]}" class="clip" src="assets/voix/{s["id"]}.wav" data-start="{s["voix_debut"]}" '
            f'data-duration="{s["voix_duree"]}" data-track-index="10"></audio>'
            for s in self.plan["scenes"]
        ]
        lignes.append(f'<audio id="musique" class="clip" src="assets/musique.wav" data-start="0" data-duration="{self.total}" '
                      f'data-volume="{volume_musique}" data-fade-out="2" data-track-index="11"></audio>')
        return "\n".join(lignes)

    def appel(self, titre_html: str, sous: str) -> str:
        return self.scene("appel", f'''
  <div id="ap"><img id="ap-icone" src="assets/img/icon-512.png"/>
  <h1>{titre_html}</h1>
  <div id="ap-sous">{sous}</div>
  <div id="ap-url">bible-ouverte.vercel.app</div></div>''')

    # scripts ------------------------------------------------------------------
    def js_commun(self, etapes: list[str]) -> str:
        S = self.S
        a = S["appel"]["debut"]
        return f"""
const tl = gsap.timeline({{ paused: true }});
const E = "power3.out";
tl.to("#t1", {{ x: 70, y: 90, duration: {self.total}, ease: "sine.inOut" }}, 0);
tl.to("#t2", {{ x: -80, y: -60, duration: {self.total}, ease: "sine.inOut" }}, 0);
tl.to("#t3", {{ x: 60, y: -70, duration: {self.total}, ease: "sine.inOut" }}, 0);
document.querySelectorAll(".st span").forEach((el) => {{
  tl.fromTo(el, {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: E }}, parseFloat(el.parentElement.dataset.start));
}});
{json.dumps(etapes)}.forEach((id) => {{
  const t0 = parseFloat(document.getElementById("sc-" + id).dataset.start);
  tl.fromTo("#sc-" + id + " .etape, #sc-" + id + " .titre-scene", {{ opacity: 0, y: -30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: E }}, t0 + 0.05);
}});
const tap = (x, y, t) => {{
  tl.set("#tap", {{ left: x - 45, top: y - 45, scale: 0.5 }}, t);
  tl.to("#tap", {{ opacity: 1, scale: 1, duration: 0.18, ease: E }}, t);
  tl.to("#tap", {{ opacity: 0, scale: 1.5, duration: 0.35, ease: "power1.out" }}, t + 0.22);
}};
const montre = (sel, t) => tl.fromTo(sel, {{ opacity: 0, x: 60 }}, {{ opacity: 1, x: 0, duration: 0.45, ease: E }}, t);
const cache = (sel, t) => tl.to(sel, {{ opacity: 0, x: -60, duration: 0.35, ease: "power2.in" }}, t);
tl.fromTo("#ap-icone", {{ opacity: 0, scale: 0.6 }}, {{ opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)" }}, {a + 0.1});
tl.fromTo("#ap h1", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.6, ease: E }}, {a + 0.5});
tl.fromTo("#ap-sous", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.6, ease: E }}, {a + 1.1});
tl.fromTo("#ap-url", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.6, ease: E }}, {a + 2.4});
"""

    def ecrire(self, corps: str, css: str, js: str) -> None:
        page = f"""<!doctype html>
<html lang="fr" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="vendor/gsap.min.js"></script>
<style>
{CSS_BASE}
{css}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{self.total}" data-width="1080" data-height="1920">
<div id="fond" class="clip" data-start="0" data-duration="{self.total}" data-track-index="0">
  <div class="tache" id="t1"></div><div class="tache" id="t2"></div><div class="tache" id="t3"></div><div id="grille"></div>
</div>
{corps}
{self.sous_titres()}
{self.audio()}
</div>
<script>
{js}
window.__timelines = window.__timelines || {{}};
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
"""
        (self.projet / "index.html").write_text(page)
        print("index.html :", self.total, "s")


def telephone(ep: Episode, de: str, contenu: str, barre: str = "Bible Ouverte") -> str:
    """Un téléphone visible de la scène `de` jusqu'à la scène d'appel (exclue)."""
    debut = ep.debut(de)
    duree = round(ep.debut("appel") - debut, 2)
    return f'''<div id="tel" class="clip" data-start="{debut}" data-duration="{duree}" data-track-index="2">
  <div id="ecran">
    <div id="encoche"></div>
    <div id="barre"><img src="assets/img/icon-512.png"/>{barre}</div>
    {contenu}
    <div id="tap"></div>
  </div>
</div>'''


CSS_BASE = """
@font-face { font-family: Lora; src: url(assets/fonts/lora-latin-600-normal.woff2); font-weight: 600; }
@font-face { font-family: Lora; src: url(assets/fonts/lora-latin-400-italic.woff2); font-weight: 400; font-style: italic; }
@font-face { font-family: Inter; src: url(assets/fonts/inter-latin-400-normal.woff2); font-weight: 400; }
@font-face { font-family: Inter; src: url(assets/fonts/inter-latin-600-normal.woff2); font-weight: 600; }
@font-face { font-family: Inter; src: url(assets/fonts/inter-latin-700-normal.woff2); font-weight: 700; }
:root {
  --nuit: #0a1626; --bleu: #1e3a5f; --or: #e9b949; --or-clair: #f0d089; --violet: #9d8dff; --violet-f: #7b68ee;
  --vert: #2ecc71; --blanc: #fff; --t2: rgba(255,255,255,.68); --bord: rgba(255,255,255,.14);
  --app-fond: #f8f9fb; --app-texte: #1e293b; --app-gris: #64748b; --app-bord: #e2e8f0;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1080px; height: 1920px; overflow: hidden; background: var(--nuit); }
#root { position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: Inter, sans-serif; color: var(--blanc); }
.clip { position: absolute; inset: 0; }
.tache { position: absolute; border-radius: 50%; filter: blur(140px); }
#t1 { left: -320px; top: -260px; width: 1100px; height: 1100px; background: var(--bleu); opacity: .75; }
#t2 { left: 520px; top: 300px; width: 900px; height: 900px; background: var(--violet-f); opacity: .28; }
#t3 { left: 60px; top: 1350px; width: 900px; height: 900px; background: var(--or); opacity: .13; }
#grille { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size: 90px 90px; -webkit-mask-image: radial-gradient(ellipse at 50% 35%, black 20%, transparent 75%); }
.degrade { background: linear-gradient(90deg, var(--or), var(--or-clair) 45%, var(--violet)); -webkit-background-clip: text; background-clip: text; color: transparent; }
h1 { font-family: Lora, serif; font-weight: 600; font-size: 104px; line-height: 1.06; letter-spacing: -1px; text-align: center; }
.titre-scene { position: absolute; left: 80px; right: 80px; }
.etape { position: absolute; top: 150px; left: 80px; right: 80px; display: flex; align-items: center; justify-content: center; gap: 26px; }
.num { width: 86px; height: 86px; border-radius: 50%; background: var(--or); color: var(--nuit); font-weight: 700; font-size: 48px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.et-titre { font-family: Lora, serif; font-weight: 600; font-size: 74px; letter-spacing: -1px; }
#tel { position: absolute; inset: auto; left: 215px; top: 300px; width: 650px; height: 1150px; border-radius: 84px; background: #0b1220; border: 12px solid #26334a; box-shadow: 0 60px 120px -30px rgba(0,0,0,.7), 0 0 0 2px rgba(255,255,255,.08); }
#ecran { position: absolute; inset: 0; border-radius: 72px; overflow: hidden; background: var(--app-fond); color: var(--app-texte); }
#encoche { position: absolute; top: 18px; left: 50%; width: 150px; height: 36px; margin-left: -75px; border-radius: 20px; background: #0b1220; z-index: 20; }
#barre { position: absolute; top: 0; left: 0; right: 0; height: 128px; padding: 66px 40px 0; background: var(--bleu); color: #fff; font-weight: 700; font-size: 30px; display: flex; gap: 16px; align-items: center; z-index: 15; }
#barre img { width: 44px; height: 44px; border-radius: 12px; }
.panneau { position: absolute; top: 128px; left: 0; right: 0; bottom: 0; padding: 34px 34px; background: var(--app-fond); opacity: 0; }
.app-h { font-size: 40px; font-weight: 700; }
.app-sous { font-size: 25px; color: var(--app-gris); margin-top: 6px; margin-bottom: 24px; }
.champ { background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 16px 22px; margin-bottom: 16px; }
.lab { font-size: 21px; color: var(--app-gris); font-weight: 600; margin-bottom: 6px; }
.val { font-size: 29px; font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 12px; }
.chip { font-size: 24px; font-weight: 600; padding: 10px 20px; border-radius: 999px; background: #eef2f7; color: var(--bleu); }
.bouton { background: var(--bleu); color: #fff; font-size: 29px; font-weight: 700; text-align: center; padding: 24px; border-radius: 22px; }
#tap { position: absolute; width: 90px; height: 90px; border-radius: 50%; background: rgba(233,185,73,.55); border: 4px solid var(--or); opacity: 0; z-index: 30; }
#ap { position: absolute; top: 330px; left: 80px; right: 80px; display: flex; flex-direction: column; align-items: center; text-align: center; }
#ap-icone { width: 250px; height: 250px; border-radius: 62px; box-shadow: 0 0 140px 30px rgba(233,185,73,.35); }
#ap h1 { margin-top: 64px; }
#ap-sous { font-size: 44px; color: var(--t2); margin-top: 26px; line-height: 1.3; }
#ap-url { margin-top: 80px; font-size: 50px; font-weight: 700; color: var(--nuit); background: var(--or); padding: 28px 50px; border-radius: 999px; }
.st { display: flex; justify-content: center; align-items: flex-end; padding: 0 80px 150px; }
.st span { font-weight: 600; font-size: 44px; line-height: 1.3; text-align: center; color: #fff; background: rgba(5,12,24,.72); border: 1px solid var(--bord); border-radius: 28px; padding: 22px 34px; }
"""
