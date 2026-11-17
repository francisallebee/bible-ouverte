"""Construit index.html (composition HyperFrames) de l'épisode 2 à partir de plan.json.
Le minutage vient de la voix : chaque animation est posée en secondes absolues."""
import html, json, pathlib, re, sys

projet = pathlib.Path(sys.argv[1])
plan = json.loads((projet / "plan.json").read_text())
S = {s["id"]: s for s in plan["scenes"]}
TOTAL = plan["total"]

def a(scene, dt):
    """Instant absolu : début de la voix de la scène + dt secondes."""
    return round(S[scene]["voix_debut"] + dt, 2)

# ---------------------------------------------------------------- sous-titres
def phrases(texte):
    p = [x.strip() for x in re.split(r"(?<=[.?!…])\s+", texte) if x.strip()]
    return [x[0].upper() + x[1:] for x in p]

sous_titres = []
for s in plan["scenes"]:
    ps = phrases(s["texte"])
    tot = sum(len(p) for p in ps)
    t = s["voix_debut"]
    for p in ps:
        d = s["voix_duree"] * len(p) / tot
        fin = t + d if p is not ps[-1] else s["debut"] + s["duree"] - 0.15
        sous_titres.append((round(t, 2), round(fin - t, 2), p))
        t += d

# ---------------------------------------------------------------- audio
audio = "\n".join(
    f'<audio id="voix-{s["id"]}" class="clip" src="assets/voix/{s["id"]}.wav" data-start="{s["voix_debut"]}" '
    f'data-duration="{s["voix_duree"]}" data-track-index="10"></audio>'
    for s in plan["scenes"]
)
audio += f'\n<audio id="musique" class="clip" src="assets/musique.wav" data-start="0" data-duration="{TOTAL}" data-volume="0.11" data-fade-out="2" data-track-index="11"></audio>'

st_html = "\n".join(
    f'<div class="clip st" id="st{i}" data-start="{d}" data-duration="{du}" data-track-index="5"><span>{html.escape(p)}</span></div>'
    for i, (d, du, p) in enumerate(sous_titres)
)

def scene_clip(sid, contenu, extra=""):
    s = S[sid]
    return f'<section id="sc-{sid}" class="clip scene {extra}" data-start="{s["debut"]}" data-duration="{s["duree"]}" data-track-index="1">{contenu}</section>'

def etape(sid, n, titre):
    return scene_clip(sid, f'<div class="etape"><span class="num">{n}</span><span class="et-titre">{titre}</span></div>')

telephone_debut = S["ouvrir"]["debut"]
telephone_duree = round(S["appel"]["debut"] - telephone_debut, 2)

MENU = ["Nouvelle lecture", "Plans de lecture", "Recherche", "Progression", "Historique", "Statistiques", "Quiz", "Verset du jour", "Mémorisation"]
menu_html = "".join(f'<div class="m-item{" m-actif" if i == 0 else ""}" id="m{i}">{m}</div>' for i, m in enumerate(MENU))
CONTEXTES = ["Bible", "Méditation", "Église", "Prédication", "Podcast", "Radio", "Livre", "YouTube"]
ctx_html = "".join(f'<span class="chip" id="ctx-{i}">{c}</span>' for i, c in enumerate(CONTEXTES))

page = f"""<!doctype html>
<html lang="fr" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="vendor/gsap.min.js"></script>
<style>
@font-face {{ font-family: Lora; src: url(assets/fonts/lora-latin-600-normal.woff2); font-weight: 600; }}
@font-face {{ font-family: Lora; src: url(assets/fonts/lora-latin-400-italic.woff2); font-weight: 400; font-style: italic; }}
@font-face {{ font-family: Inter; src: url(assets/fonts/inter-latin-400-normal.woff2); font-weight: 400; }}
@font-face {{ font-family: Inter; src: url(assets/fonts/inter-latin-600-normal.woff2); font-weight: 600; }}
@font-face {{ font-family: Inter; src: url(assets/fonts/inter-latin-700-normal.woff2); font-weight: 700; }}
:root {{
  --nuit: #0a1626; --bleu: #1e3a5f; --or: #e9b949; --or-clair: #f0d089; --violet: #9d8dff; --violet-f: #7b68ee;
  --vert: #2ecc71; --blanc: #fff; --t2: rgba(255,255,255,.68); --bord: rgba(255,255,255,.14);
  --app-fond: #f8f9fb; --app-texte: #1e293b; --app-gris: #64748b; --app-bord: #e2e8f0;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: var(--nuit); }}
#root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: Inter, sans-serif; color: var(--blanc); }}
.clip {{ position: absolute; inset: 0; }}
/* fond */
.tache {{ position: absolute; border-radius: 50%; filter: blur(140px); }}
#t1 {{ left: -320px; top: -260px; width: 1100px; height: 1100px; background: var(--bleu); opacity: .75; }}
#t2 {{ left: 520px; top: 300px; width: 900px; height: 900px; background: var(--violet-f); opacity: .28; }}
#t3 {{ left: 60px; top: 1350px; width: 900px; height: 900px; background: var(--or); opacity: .13; }}
#grille {{ position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size: 90px 90px; -webkit-mask-image: radial-gradient(ellipse at 50% 35%, black 20%, transparent 75%); }}
.degrade {{ background: linear-gradient(90deg, var(--or), var(--or-clair) 45%, var(--violet)); -webkit-background-clip: text; background-clip: text; color: transparent; }}
h1 {{ font-family: Lora, serif; font-weight: 600; font-size: 104px; line-height: 1.06; letter-spacing: -1px; text-align: center; }}
/* accroche */
#acc-titre {{ position: absolute; top: 330px; left: 80px; right: 80px; }}
#chrono {{ position: absolute; left: 340px; top: 800px; width: 400px; height: 400px; }}
#chrono-txt {{ position: absolute; left: 340px; top: 800px; width: 400px; height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; }}
#chrono-txt b {{ font-family: Lora, serif; font-size: 120px; font-weight: 600; color: var(--or); line-height: 1; }}
#chrono-txt span {{ font-size: 36px; color: var(--t2); margin-top: 8px; }}
/* étapes */
.etape {{ position: absolute; top: 150px; left: 80px; right: 80px; display: flex; align-items: center; justify-content: center; gap: 26px; }}
.num {{ width: 86px; height: 86px; border-radius: 50%; background: var(--or); color: var(--nuit); font-weight: 700; font-size: 48px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }}
.et-titre {{ font-family: Lora, serif; font-weight: 600; font-size: 74px; letter-spacing: -1px; }}
/* téléphone */
#tel {{ position: absolute; inset: auto; left: 215px; top: 300px; width: 650px; height: 1150px; border-radius: 84px; background: #0b1220; border: 12px solid #26334a; box-shadow: 0 60px 120px -30px rgba(0,0,0,.7), 0 0 0 2px rgba(255,255,255,.08); }}
#ecran {{ position: absolute; inset: 0; border-radius: 72px; overflow: hidden; background: var(--app-fond); }}
#encoche {{ position: absolute; top: 18px; left: 50%; width: 150px; height: 36px; margin-left: -75px; border-radius: 20px; background: #0b1220; z-index: 9; }}
#barre {{ position: absolute; top: 0; left: 0; right: 0; height: 128px; padding: 66px 40px 0; background: var(--bleu); color: #fff; font-weight: 700; font-size: 30px; display: flex; gap: 16px; align-items: center; z-index: 5; }}
#barre img {{ width: 44px; height: 44px; border-radius: 12px; }}
#contenu {{ position: absolute; top: 128px; left: 0; right: 0; padding: 34px 34px 200px; color: var(--app-texte); }}
.app-h {{ font-size: 40px; font-weight: 700; }}
.app-sous {{ font-size: 25px; color: var(--app-gris); margin-top: 6px; margin-bottom: 26px; }}
.champ {{ background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 16px 22px; margin-bottom: 18px; }}
.lab {{ font-size: 21px; color: var(--app-gris); font-weight: 600; margin-bottom: 4px; }}
.val {{ font-size: 29px; font-weight: 600; color: var(--app-texte); position: relative; height: 38px; }}
.val .vide {{ position: absolute; inset: 0; color: #94a3b8; font-weight: 400; }}
.val .plein {{ position: absolute; inset: 0; opacity: 0; }}
.focus {{ border-color: var(--bleu); box-shadow: 0 0 0 4px rgba(30,58,95,.15); }}
#apercu {{ background: #fffbeb; border: 2px solid #fde68a; border-radius: 20px; padding: 18px 22px; margin-bottom: 18px; font-family: Lora, serif; font-style: italic; font-size: 25px; line-height: 1.45; color: #78350f; }}
#apercu sup {{ font-family: Inter; font-style: normal; font-size: 16px; color: #b45309; margin-right: 4px; }}
.chips {{ display: flex; flex-wrap: wrap; gap: 12px; }}
.chip {{ font-size: 24px; font-weight: 600; padding: 10px 20px; border-radius: 999px; background: #eef2f7; color: var(--bleu); border: 2px solid transparent; }}
#notes-val {{ font-size: 26px; line-height: 1.45; color: var(--app-texte); min-height: 120px; }}
.ligne-note {{ display: block; overflow: hidden; white-space: nowrap; width: 0; }}
.pj {{ display: flex; gap: 14px; margin-top: 4px; }}
.pj span {{ font-size: 23px; font-weight: 600; padding: 12px 20px; border-radius: 16px; background: #f1f5f9; color: var(--app-gris); border: 2px dashed #cbd5e1; }}
.pj span.ok {{ background: #ecfdf5; color: #047857; border: 2px solid #6ee7b7; }}
#bouton {{ margin-top: 12px; background: var(--bleu); color: #fff; font-size: 30px; font-weight: 700; text-align: center; padding: 26px; border-radius: 22px; }}
#toast {{ position: absolute; left: 40px; right: 40px; bottom: 60px; background: #065f46; color: #fff; font-size: 28px; font-weight: 600; padding: 24px 28px; border-radius: 22px; display: flex; gap: 16px; align-items: center; opacity: 0; z-index: 8; }}
#tap {{ position: absolute; width: 90px; height: 90px; border-radius: 50%; background: rgba(233,185,73,.55); border: 4px solid var(--or); opacity: 0; z-index: 10; }}
/* menu */
#menu {{ position: absolute; top: 128px; left: 0; bottom: 0; width: 100%; background: #fff; padding: 30px 26px; z-index: 6; }}
.m-item {{ font-size: 30px; font-weight: 600; color: #334155; padding: 22px 24px; border-radius: 18px; margin-bottom: 6px; }}
.m-actif {{ background: #e8eef5; color: var(--bleu); }}
/* écran final du téléphone : progression */
#suite {{ position: absolute; top: 128px; left: 0; right: 0; bottom: 0; background: var(--app-fond); padding: 40px 34px; color: var(--app-texte); z-index: 7; opacity: 0; }}
.carte-hist {{ background: #fff; border: 2px solid var(--app-bord); border-radius: 22px; padding: 22px 24px; margin-top: 18px; }}
.carte-hist b {{ font-size: 30px; }}
.carte-hist p {{ font-size: 24px; color: var(--app-gris); margin-top: 6px; }}
.badge {{ display: inline-block; font-size: 21px; font-weight: 600; background: #f0eeff; color: #5a49c9; padding: 6px 14px; border-radius: 999px; margin-top: 10px; }}
.pistebar {{ height: 26px; border-radius: 13px; background: #e2e8f0; overflow: hidden; margin-top: 16px; }}
#remplissage {{ height: 100%; width: 0; background: var(--or); border-radius: 13px; }}
/* appel */
#ap {{ position: absolute; top: 330px; left: 80px; right: 80px; display: flex; flex-direction: column; align-items: center; text-align: center; }}
#ap-icone {{ width: 250px; height: 250px; border-radius: 62px; box-shadow: 0 0 140px 30px rgba(233,185,73,.35); }}
#ap h1 {{ margin-top: 64px; }}
#ap-sous {{ font-size: 44px; color: var(--t2); margin-top: 26px; line-height: 1.3; }}
#ap-url {{ margin-top: 80px; font-size: 50px; font-weight: 700; color: var(--nuit); background: var(--or); padding: 28px 50px; border-radius: 999px; }}
/* sous-titres */
.st {{ display: flex; justify-content: center; align-items: flex-end; padding: 0 80px 150px; }}
.st span {{ font-weight: 600; font-size: 44px; line-height: 1.3; text-align: center; background: rgba(5,12,24,.72); border: 1px solid var(--bord); border-radius: 28px; padding: 22px 34px; }}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">

<div id="fond" class="clip" data-start="0" data-duration="{TOTAL}" data-track-index="0">
  <div class="tache" id="t1"></div><div class="tache" id="t2"></div><div class="tache" id="t3"></div><div id="grille"></div>
</div>

{scene_clip("accroche", '''
  <h1 id="acc-titre">Ta première<br/><span class="degrade">lecture</span></h1>
  <svg id="chrono" viewBox="0 0 400 400"><circle cx="200" cy="200" r="180" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="18"/>
  <circle id="chrono-arc" cx="200" cy="200" r="180" fill="none" stroke="#e9b949" stroke-width="18" stroke-linecap="round" stroke-dasharray="1131" stroke-dashoffset="1131" transform="rotate(-90 200 200)"/></svg>
  <div id="chrono-txt"><b>&lt; 1</b><span>minute</span></div>
''')}

{etape("ouvrir", 1, "Ouvre le menu")}
{etape("passage", 2, "Choisis le passage")}
{etape("contexte", 3, "Le contexte")}
{etape("notes", 4, "Ce qu’il t’a laissé")}
{etape("enregistrer", 5, "Enregistre")}

<div id="tel" class="clip" data-start="{telephone_debut}" data-duration="{telephone_duree}" data-track-index="2">
  <div id="ecran">
    <div id="encoche"></div>
    <div id="barre"><img src="assets/img/icon-512.png"/>Bible Ouverte</div>
    <div id="contenu">
      <div class="app-h">Nouvelle lecture</div>
      <div class="app-sous">Enregistre ta lecture du jour</div>
      <div class="champ"><div class="lab">Date</div><div class="val">Aujourd’hui</div></div>
      <div class="champ" id="ch-livre"><div class="lab">Livre</div><div class="val"><span class="vide" id="livre-vide">Sélectionner un livre</span><span class="plein" id="livre-plein">Psaumes</span></div></div>
      <div class="champ" id="ch-ref"><div class="lab">Chapitres et versets</div><div class="val"><span class="vide" id="ref-vide">Sélectionne d’abord un livre</span><span class="plein" id="ref-plein">23 : 1 – 6</span></div></div>
      <div class="champ"><div class="lab">Version</div><div class="val">Louis Segond 1910</div></div>
      <div id="apercu"><sup>1</sup>Cantique de David. L’Eternel est mon berger : je ne manquerai de rien. <sup>2</sup>Il me fait reposer dans de verts pâturages, Il me dirige près des eaux paisibles. <sup>3</sup>Il restaure mon âme…</div>
      <div class="champ" id="ch-ctx"><div class="lab">Contexte</div><div class="chips" style="margin-top:8px">{ctx_html}</div></div>
      <div class="champ" id="ch-notes"><div class="lab">Notes</div>
        <div id="notes-val"><span class="ligne-note" id="n1">Il me conduit près des eaux paisibles :</span><span class="ligne-note" id="n2">je n’ai pas à tout porter seul.</span></div>
        <div class="pj"><span id="pj-photo">Photos</span><span id="pj-audio">Audio</span><span id="pj-lien">Liens</span></div>
      </div>
      <div id="bouton">Enregistrer la lecture</div>
    </div>
    <div id="menu">{menu_html}</div>
    <div id="suite">
      <div class="app-h">Historique</div>
      <div class="carte-hist"><b>Psaumes 23 : 1 – 6</b><p>Aujourd’hui · Louis Segond 1910</p><span class="badge">Méditation</span></div>
      <div class="carte-hist"><b>Psaumes</b><p>Ta progression dans ce livre</p><div class="pistebar"><div id="remplissage"></div></div></div>
    </div>
    <div id="toast"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>1 lecture enregistrée</div>
    <div id="tap"></div>
  </div>
</div>

{scene_clip("appel", '''
  <div id="ap"><img id="ap-icone" src="assets/img/icon-512.png"/>
  <h1>À toi de <span class="degrade">jouer</span></h1>
  <div id="ap-sous">Note le passage que tu as lu aujourd’hui.</div>
  <div id="ap-url">bible-ouverte.vercel.app</div></div>
''')}

{st_html}
{audio}
</div>

<script>
const tl = gsap.timeline({{ paused: true }});
const E = "power3.out";
// fond : aurores lentes
tl.to("#t1", {{ x: 70, y: 90, duration: {TOTAL}, ease: "sine.inOut" }}, 0);
tl.to("#t2", {{ x: -80, y: -60, duration: {TOTAL}, ease: "sine.inOut" }}, 0);
tl.to("#t3", {{ x: 60, y: -70, duration: {TOTAL}, ease: "sine.inOut" }}, 0);
// sous-titres : apparition douce
document.querySelectorAll(".st span").forEach((el) => {{
  const t0 = parseFloat(el.parentElement.dataset.start);
  tl.fromTo(el, {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: E }}, t0);
}});
// étapes : titre qui entre
["ouvrir","passage","contexte","notes","enregistrer"].forEach((id) => {{
  const t0 = parseFloat(document.getElementById("sc-" + id).dataset.start);
  tl.fromTo("#sc-" + id + " .etape", {{ opacity: 0, y: -30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: E }}, t0 + 0.05);
}});
// 0. accroche
tl.fromTo("#acc-titre", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.fromTo("#chrono, #chrono-txt", {{ opacity: 0, scale: 0.85 }}, {{ opacity: 1, scale: 1, duration: 0.6, ease: E }}, 0.8);
tl.to("#chrono-arc", {{ attr: {{ "stroke-dashoffset": 160 }}, duration: 4.4, ease: "none" }}, 1.2);

// 1. téléphone + menu
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {S["ouvrir"]["debut"]});
const tap = (x, y, t) => {{
  tl.set("#tap", {{ left: x - 45, top: y - 45, scale: 0.5 }}, t);
  tl.to("#tap", {{ opacity: 1, scale: 1, duration: 0.18, ease: E }}, t);
  tl.to("#tap", {{ opacity: 0, scale: 1.5, duration: 0.35, ease: "power1.out" }}, t + 0.22);
}};
tap(220, 196, {a("ouvrir", 1.3)});
tl.to("#menu", {{ x: -700, duration: 0.55, ease: "power3.inOut" }}, {a("ouvrir", 1.75)});
tl.fromTo("#contenu .champ:nth-of-type(1)", {{ backgroundColor: "#fff7d6" }}, {{ backgroundColor: "#ffffff", duration: 1.6 }}, {a("ouvrir", 3.0)});

// 2. passage
tap(330, 380, {a("passage", 0.3)});
tl.set("#ch-livre", {{ className: "champ focus" }}, {a("passage", 0.4)});
tl.to("#livre-vide", {{ opacity: 0, duration: 0.2 }}, {a("passage", 1.2)});
tl.to("#livre-plein", {{ opacity: 1, duration: 0.3 }}, {a("passage", 1.2)});
tl.set("#ch-livre", {{ className: "champ" }}, {a("passage", 2.0)});
tap(330, 488, {a("passage", 2.0)});
tl.set("#ch-ref", {{ className: "champ focus" }}, {a("passage", 2.1)});
tl.to("#ref-vide", {{ opacity: 0, duration: 0.2 }}, {a("passage", 2.9)});
tl.to("#ref-plein", {{ opacity: 1, duration: 0.3 }}, {a("passage", 2.9)});
tl.set("#ch-ref", {{ className: "champ" }}, {a("passage", 4.0)});
tl.fromTo("#apercu", {{ opacity: 0.25, scale: 0.97 }}, {{ opacity: 1, scale: 1, duration: 0.6, ease: E }}, {a("passage", 6.4)});
tl.fromTo("#apercu", {{ boxShadow: "0 0 0 0 rgba(233,185,73,0)" }}, {{ boxShadow: "0 0 0 8px rgba(233,185,73,.45)", duration: 0.5, yoyo: true, repeat: 1 }}, {a("passage", 6.6)});

// 3. contexte : défilement de l'écran puis choix
tl.to("#contenu", {{ y: -440, duration: 0.9, ease: "power2.inOut" }}, {S["contexte"]["debut"]});
[1, 2, 3, 4].forEach((i, k) => {{
  tl.fromTo("#ctx-" + i, {{ scale: 1 }}, {{ scale: 1.12, duration: 0.18, yoyo: true, repeat: 1 }}, {a("contexte", 1.5)} + k * 0.55);
}});
tap(300, 830, {a("contexte", 4.2)});
tl.to("#ctx-1", {{ backgroundColor: "#1e3a5f", color: "#ffffff", duration: 0.25 }}, {a("contexte", 4.3)});

// 4. notes : frappe, puis pièces jointes
tl.to("#contenu", {{ y: -640, duration: 0.8, ease: "power2.inOut" }}, {S["notes"]["debut"]});
tl.set("#ch-notes", {{ className: "champ focus" }}, {a("notes", 0.3)});
tl.to("#n1", {{ width: 545, duration: 1.4, ease: "steps(38)" }}, {a("notes", 0.4)});
tl.to("#n2", {{ width: 545, duration: 1.2, ease: "steps(31)" }}, {a("notes", 1.9)});
tl.set("#ch-notes", {{ className: "champ" }}, {a("notes", 3.2)});
tl.set("#pj-photo", {{ className: "ok", textContent: "1 photo" }}, {a("notes", 3.6)});
tl.set("#pj-audio", {{ className: "ok", textContent: "Audio joint" }}, {a("notes", 4.6)});
tl.set("#pj-lien", {{ className: "ok", textContent: "1 lien" }}, {a("notes", 5.5)});
["#pj-photo", "#pj-audio", "#pj-lien"].forEach((id, k) => {{
  tl.fromTo(id, {{ scale: 0.8 }}, {{ scale: 1, duration: 0.35, ease: "back.out(3)" }}, {a("notes", 3.6) } + [0, 1.0, 1.9][k]);
}});

// 5. enregistrer
tl.to("#contenu", {{ y: -760, duration: 0.6, ease: "power2.inOut" }}, {S["enregistrer"]["debut"]});
tap(325, 1010, {a("enregistrer", 1.0)});
tl.to("#bouton", {{ scale: 0.96, duration: 0.12, yoyo: true, repeat: 1 }}, {a("enregistrer", 1.0)});
tl.fromTo("#toast", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: E }}, {a("enregistrer", 1.3)});
tl.to("#suite", {{ opacity: 1, duration: 0.5 }}, {a("enregistrer", 2.6)});
tl.to("#toast", {{ opacity: 0, duration: 0.3 }}, {a("enregistrer", 3.0)});
tl.fromTo(".carte-hist", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.45, stagger: 0.35, ease: E }}, {a("enregistrer", 2.8)});
tl.to("#remplissage", {{ width: "18%", duration: 1.4, ease: E }}, {a("enregistrer", 4.0)});
tl.to("#tel", {{ opacity: 0, y: 60, duration: 0.45 }}, {round(S["appel"]["debut"] - 0.45, 2)});

// 6. appel
tl.fromTo("#ap-icone", {{ opacity: 0, scale: 0.6 }}, {{ opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)" }}, {S["appel"]["debut"] + 0.1});
tl.fromTo("#ap h1", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.6, ease: E }}, {S["appel"]["debut"] + 0.5});
tl.fromTo("#ap-sous", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.6, ease: E }}, {S["appel"]["debut"] + 1.1});
tl.fromTo("#ap-url", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.6, ease: E }}, {S["appel"]["debut"] + 2.4});

window.__timelines = window.__timelines || {{}};
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
"""
(projet / "index.html").write_text(page)
print("index.html :", TOTAL, "s,", len(sous_titres), "sous-titres")
