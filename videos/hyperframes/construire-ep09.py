"""Épisode 9 — La mémorisation (révision espacée et masquage progressif).
Usage : python3 construire-ep09.py ep09-memorisation

Tenu au code (lib/memorisation/revision.ts) : intervalles 1, 3, 7, 21, 60 jours ;
masquage 0, 25, 50, 75, 100 % ; niveaux 0 à 4 ; 80 % de réussite pour monter.
"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S

MOTS = ["Ta", "parole", "est", "une", "lampe", "à", "mes", "pieds,", "Et", "une", "lumière", "sur", "mon", "sentier."]
MASQUE_50 = {1, 4, 6, 7, 10, 13}  # la moitié des mots, à peu près
mots_html = " ".join(
    f'<span class="m{" cache" if i in MASQUE_50 else ""}" id="w{i}"><span class="mt">{w}</span></span>' for i, w in enumerate(MOTS)
)
INTERVALLES = ["1 jour", "3 jours", "7 jours", "21 jours", "60 jours"]
frise = "".join(f'<div class="pt" id="pt{i}"><i></i><span>{t}</span></div>' for i, t in enumerate(INTERVALLES))

ecrans = f'''
<div class="panneau" id="p-liste" style="opacity:1">
  <div class="app-h">Mémorisation</div>
  <div class="app-sous">Apprends un verset, et retrouve-le quand il revient.</div>
  <div class="sources">
    <div class="src" id="s-hasard">Un verset au hasard</div>
    <div class="src" id="s-lect">Parmi tes lectures</div>
    <div class="src" id="s-choix">Un passage de ton choix</div>
  </div>
  <div class="cand" id="cand"><b>Psaumes 119:105</b><p>Ta parole est une lampe à mes pieds, Et une lumière sur mon sentier.</p><span class="bouton petit-b">Mettre en apprentissage</span></div>
</div>

<div class="panneau" id="p-exo">
  <div class="niv-chip" id="niv">Niveau 0/4</div>
  <div class="app-h" style="font-size:34px;margin-top:12px">Psaumes 119:105</div>
  <div class="consigne" id="consigne">Premier passage : lis ce verset en entier. Des mots seront masqués aux révisions suivantes.</div>
  <div class="verset-m" id="vm">{mots_html}</div>
  <div class="bouton" id="b-fini">J’ai terminé</div>
  <div class="monte" id="monte">Verset acquis d’un cran de plus.</div>
  <div class="prochaine" id="prochaine">Prochaine révision le 23 novembre</div>
  <div class="frise">{frise}</div>
</div>

<div class="panneau" id="p-jour">
  <div class="app-h">Mémorisation</div>
  <div class="du-jour"><b>2</b> à revoir aujourd’hui</div>
  <div class="rev"><div><b>Psaumes 119:105</b><p>Niveau 2/4</p></div><span class="bouton petit-b">Réviser</span></div>
  <div class="rev"><div><b>Jean 14:27</b><p>Niveau 1/4</p></div><span class="bouton petit-b">Réviser</span></div>
  <div class="rev calme"><div><b>Psaumes 23:1</b><p>Niveau 4/4 · À revoir dans 60 jours</p></div></div>
</div>
'''

corps = f'''
{ep.scene("accroche", """
  <h1 class="titre-scene" style="top:240px">Par <span class="degrade">cœur</span></h1>
  <div id="coeur-v">« Ta parole est une lampe à mes pieds,<br/>Et une lumière sur mon sentier. »<span>Psaumes 119:105</span></div>
""")}
{ep.etape("choisir", 1, "Choisis un verset")}
{ep.etape("masquer", 2, "Des mots s’effacent")}
{ep.etape("espacer", 3, "Il revient")}
{ep.etape("aujourdhui", 4, "Chaque jour")}
{telephone(ep, "choisir", ecrans)}
{ep.appel('Garde la Parole <span class="degrade">dans ton cœur</span>', 'Un verset, quelques minutes par jour.')}
'''

css = """
#coeur-v { position: absolute; top: 600px; left: 110px; right: 110px; text-align: center; font-family: Lora, serif; font-style: italic; font-size: 54px; line-height: 1.45; color: #fff; opacity: 0; }
#coeur-v span { display: block; font-family: Inter; font-style: normal; font-size: 34px; color: var(--or); margin-top: 26px; }
.sources { display: flex; flex-direction: column; gap: 12px; }
.src { font-size: 27px; font-weight: 600; padding: 22px 24px; border-radius: 20px; background: #fff; border: 2px solid var(--app-bord); color: var(--bleu); }
.cand { margin-top: 20px; background: #fffbeb; border: 2px solid #fde68a; border-radius: 22px; padding: 22px; opacity: 0; }
.cand b { font-size: 27px; } .cand p { font-family: Lora, serif; font-style: italic; font-size: 25px; line-height: 1.45; color: #78350f; margin: 10px 0 16px; }
.petit-b { font-size: 23px; padding: 14px 20px; display: inline-block; }
.niv-chip { display: inline-block; font-size: 22px; font-weight: 700; color: var(--violet-f); background: #f0eeff; padding: 8px 16px; border-radius: 999px; }
.consigne { font-size: 23px; color: var(--app-gris); margin-top: 10px; line-height: 1.4; min-height: 66px; }
.verset-m { font-family: Lora, serif; font-size: 38px; line-height: 1.75; margin: 18px 0 22px; color: #1e293b; }
.m { position: relative; display: inline-block; }
.m.cache::after { content: ""; position: absolute; left: -2px; right: -2px; top: 16%; bottom: 10%; border-radius: 8px; background: #e2e8f0; border-bottom: 3px solid #94a3b8; opacity: var(--voile, 0); }
.m.cache .mt { opacity: calc(1 - var(--voile, 0)); }
.monte { font-size: 25px; font-weight: 700; color: #047857; text-align: center; margin-top: 16px; opacity: 0; }
.prochaine { font-size: 23px; color: var(--app-gris); text-align: center; margin-top: 6px; opacity: 0; }
.frise { display: flex; justify-content: space-between; margin-top: 30px; position: relative; opacity: 0; }
.frise::before { content: ""; position: absolute; left: 30px; right: 30px; top: 15px; height: 4px; background: #e2e8f0; }
.pt { display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; }
.pt i { width: 34px; height: 34px; border-radius: 50%; background: #e2e8f0; border: 4px solid #fff; }
.pt span { font-size: 19px; font-weight: 600; color: var(--app-gris); }
.du-jour { margin: 18px 0 18px; font-size: 28px; font-weight: 600; color: #b45309; background: #fffbeb; border: 2px solid #fde68a; border-radius: 18px; padding: 16px 20px; }
.du-jour b { font-size: 40px; }
.rev { display: flex; justify-content: space-between; align-items: center; background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 18px 22px; margin-bottom: 12px; opacity: 0; }
.rev b { font-size: 26px; } .rev p { font-size: 21px; color: var(--app-gris); margin-top: 4px; }
.rev.calme { background: #f8fafc; }
"""

C, M, ES, AU = S["choisir"], S["masquer"], S["espacer"], S["aujourdhui"]
js = ep.js_commun(["choisir", "masquer", "espacer", "aujourdhui"]) + f"""
// 0. accroche
tl.fromTo("#sc-accroche h1", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.fromTo("#coeur-v", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.8, ease: E }}, 1.2);

// 1. choisir
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {C["debut"]});
["#s-lect", "#s-choix", "#s-hasard"].forEach((id, k) => tl.fromTo(id, {{ borderColor: "#e2e8f0" }}, {{ borderColor: "#e9b949", duration: 0.2, yoyo: true, repeat: 1 }}, {a("choisir", 1.2)} + k * 1.2));
tap(313, 400, {a("choisir", 1.4)});
tl.fromTo("#cand", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: E }}, {a("choisir", 1.7)});
tap(250, 720, {a("choisir", 5.4)});

// 2. masquer : niveau 0 puis niveau 2
cache("#p-liste", {M["debut"]});
montre("#p-exo", {M["debut"] + 0.2});
tl.set("#niv", {{ textContent: "Niveau 2/4" }}, {a("masquer", 2.6)});
tl.set("#consigne", {{ textContent: "Touche un mot caché pour le révéler." }}, {a("masquer", 2.6)});
tl.to(".m.cache", {{ "--voile": 1, duration: 0.5, stagger: 0.12 }}, {a("masquer", 2.6)});
tap(330, 440, {a("masquer", 6.6)});
tl.to("#w4", {{ "--voile": 0, duration: 0.3 }}, {a("masquer", 6.7)});
tl.set("#consigne", {{ textContent: "1 mot révélé" }}, {a("masquer", 6.7)});
tap(200, 545, {a("masquer", 8.0)});
tl.to("#w10", {{ "--voile": 0, duration: 0.3 }}, {a("masquer", 8.1)});
tl.set("#consigne", {{ textContent: "2 mots révélés" }}, {a("masquer", 8.1)});

// 3. espacer : la frise des rappels
tap(313, 690, {a("espacer", 0.2)});
tl.to("#b-fini", {{ opacity: 0.4, duration: 0.2 }}, {a("espacer", 0.3)});
tl.to("#monte", {{ opacity: 1, duration: 0.3 }}, {a("espacer", 0.4)});
tl.set("#niv", {{ textContent: "Niveau 3/4" }}, {a("espacer", 0.4)});
tl.to("#prochaine", {{ opacity: 1, duration: 0.3 }}, {a("espacer", 0.8)});
tl.to(".frise", {{ opacity: 1, duration: 0.3 }}, {a("espacer", 1.6)});
[0, 1, 2, 3, 4].forEach((i) => {{
  tl.to("#pt" + i + " i", {{ backgroundColor: "#7b68ee", duration: 0.2 }}, {a("espacer", 2.3)} + i * 0.75);
  tl.fromTo("#pt" + i + " i", {{ scale: 1 }}, {{ scale: 1.35, duration: 0.18, yoyo: true, repeat: 1 }}, {a("espacer", 2.3)} + i * 0.75);
}});

// 4. chaque jour
cache("#p-exo", {AU["debut"]});
montre("#p-jour", {AU["debut"] + 0.2});
tl.fromTo(".rev", {{ opacity: 0, y: 25 }}, {{ opacity: 1, y: 0, duration: 0.35, stagger: 0.3, ease: E }}, {a("aujourdhui", 1.0)});
tl.fromTo(".du-jour", {{ scale: 1 }}, {{ scale: 1.05, duration: 0.25, yoyo: true, repeat: 1 }}, {a("aujourdhui", 2.4)});
tl.to("#tel", {{ opacity: 0, y: 60, duration: 0.45 }}, {round(S["appel"]["debut"] - 0.45, 2)});
"""

ep.ecrire(corps, css, js)
