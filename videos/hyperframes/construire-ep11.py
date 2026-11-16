"""Épisode 11 — L'historique (« Mes lectures ») et le détail d'une lecture.
Usage : python3 construire-ep11.py ep11-historique

Libellés repris de fr.ts › history et readingDetail. Les lectures montrées
reprennent celles des épisodes précédents (Psaumes 23, Jean 14:27, Matthieu 5…).
"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S

LECTURES = [
    ("l0", "16 nov.", "Psaumes 23:1-6", "Méditation", "#2ecc71", "Il me conduit près des eaux paisibles : je n’ai pas à tout porter seul."),
    ("l1", "15 nov.", "Jean 14:27", "Méditation", "#2ecc71", "La paix qu’il donne n’est pas celle du monde."),
    ("l2", "15 nov.", "Matthieu 5:13-16", "Prédication", "#9b59b6", "Sel et lumière : être, pas seulement faire."),
    ("l3", "14 nov.", "Jean 10:1-18", "Église", "#7b68ee", "Le bon berger connaît ses brebis."),
    ("l4", "12 nov.", "Psaumes 119:105", "Bible", "#6d4c41", ""),
]
lignes = "".join(
    f'''<div class="lec" id="{i}"><div class="lec-h"><b>{r}</b><span class="d">{d}</span></div>
    <div class="lec-m"><span class="ctx" style="background:{c}22;color:{c}">{ctx}</span></div>
    {f'<p class="note">{n}</p>' if n else ''}<span class="coche" id="{i}-c"></span></div>'''
    for i, d, r, ctx, c, n in LECTURES
)

ecrans = f'''
<div class="panneau" id="p-liste" style="opacity:1">
  <div class="app-h">Mes lectures</div>
  <div class="resume" id="resume"><b id="r-n">12 lectures</b> · <span id="r-l">6 livres</span> · <span id="r-p">du 1 nov. au 16 nov.</span></div>
  <div class="rech"><span class="loupe"></span><span class="rech-ph" id="rech-ph">Rechercher dans les notes ou le texte…</span><span class="rech-t" id="rech-t">berger</span></div>
  <div class="grp"><span class="lab" style="margin:0">Regrouper par</span><span class="chip sel" id="g-date">Date</span><span class="chip" id="g-livre">Livre</span><span class="chip" id="g-ctx">Contexte</span></div>
  <div class="barre-sel" id="barre-sel"><b id="nsel">0 sélectionnée</b><span class="chip sel">Méditation</span><span class="bouton mini">Appliquer</span></div>
  <div id="liste">{lignes}</div>
</div>

<div class="panneau" id="p-detail">
  <div class="retour">← Retour à l’historique</div>
  <div class="app-h" style="margin-top:8px">Psaumes 23:1-6</div>
  <div class="app-sous">16 novembre · Version : Louis Segond 1910 · <span style="color:#16a34a;font-weight:700">Méditation</span></div>
  <div class="texte-b"><span class="lab">Texte biblique</span><sup>1</sup>Cantique de David. L’Eternel est mon berger : je ne manquerai de rien. <sup>2</sup>Il me fait reposer dans de verts pâturages, Il me dirige près des eaux paisibles…</div>
  <div class="bloc" id="d-notes"><span class="lab">Notes</span><p>Il me conduit près des eaux paisibles : je n’ai pas à tout porter seul.</p></div>
  <div class="bloc" id="d-photo"><span class="lab">Photos</span><div class="photo"><i></i><i></i><i></i><i></i></div></div>
  <div class="bloc" id="d-audio"><span class="lab">Audio</span><div class="audio"><span class="play"></span><div class="onde">{"".join(f'<i style="height:{h}px"></i>' for h in [10,22,34,18,40,28,14,36,24,12,30,20,38,16,26,10,32,22])}</div><span>0:42</span></div></div>
  <div class="bloc" id="d-lien"><span class="lab">Liens</span><p class="lien">Prédication du dimanche — Psaume 23</p></div>
</div>
'''

corps = f'''
{ep.scene("accroche", """
  <h1 class="titre-scene" style="top:240px">Tout est<br/><span class="degrade">gardé</span></h1>
  <div id="pile"><div class="fiche f3"></div><div class="fiche f2"></div><div class="fiche f1"><b>Psaumes 23:1-6</b><p>Il me conduit près des eaux paisibles : je n’ai pas à tout porter seul.</p></div></div>
""")}
{ep.etape("liste", 1, "Mes lectures")}
{ep.etape("chercher", 2, "Retrouve")}
{ep.etape("detail", 3, "Tout y est")}
{ep.etape("plusieurs", 4, "D’un seul geste")}
{telephone(ep, "liste", ecrans)}
{ep.appel('Relis <span class="degrade">ton chemin</span>', 'Toutes tes lectures, et ce qu’elles t’ont laissé.')}
'''

css = """
#pile { position: absolute; top: 640px; left: 190px; right: 190px; height: 420px; }
.fiche { position: absolute; inset: 0; border-radius: 34px; background: #fff; box-shadow: 0 40px 80px -20px rgba(0,0,0,.6); }
.f3 { transform: rotate(-7deg) translateY(30px); opacity: .5; } .f2 { transform: rotate(4deg) translateY(14px); opacity: .75; }
.f1 { padding: 44px; color: var(--app-texte); } .f1 b { font-size: 44px; color: var(--bleu); } .f1 p { font-family: Lora, serif; font-style: italic; font-size: 40px; line-height: 1.45; color: #78350f; margin-top: 20px; }
.resume { margin-top: 12px; font-size: 23px; color: var(--app-gris); background: #f1f5f9; border-radius: 14px; padding: 12px 16px; }
.resume b { color: var(--app-texte); }
.rech { position: relative; margin-top: 14px; background: #fff; border: 2px solid var(--app-bord); border-radius: 16px; padding: 14px 16px 14px 54px; font-size: 24px; height: 62px; }
.loupe { position: absolute; left: 18px; top: 17px; width: 22px; height: 22px; border: 3px solid #94a3b8; border-radius: 50%; }
.rech-ph { color: #94a3b8; position: absolute; left: 54px; top: 15px; } .rech-t { position: absolute; left: 54px; top: 15px; font-weight: 600; overflow: hidden; white-space: nowrap; width: 0; }
.grp { display: flex; align-items: center; gap: 10px; margin: 14px 0; }
.grp .chip { font-size: 21px; padding: 8px 14px; } .chip.sel { background: var(--bleu); color: #fff; }
.barre-sel { display: flex; align-items: center; gap: 10px; background: #eef2ff; border: 2px solid #c7d2fe; border-radius: 16px; padding: 10px 14px; margin-bottom: 12px; opacity: 0; height: 0; overflow: hidden; }
.barre-sel b { font-size: 21px; flex: 1; } .mini { font-size: 20px; padding: 10px 16px; }
.lec { position: relative; background: #fff; border: 2px solid var(--app-bord); border-radius: 18px; padding: 16px 18px 16px 18px; margin-bottom: 10px; }
.lec-h { display: flex; justify-content: space-between; } .lec-h b { font-size: 25px; } .d { font-size: 20px; color: var(--app-gris); }
.ctx { display: inline-block; font-size: 18px; font-weight: 700; padding: 4px 12px; border-radius: 999px; margin-top: 6px; }
.note { font-size: 20px; color: #475569; margin-top: 6px; line-height: 1.35; }
.coche { position: absolute; right: 18px; bottom: 16px; width: 30px; height: 30px; border-radius: 8px; border: 3px solid #cbd5e1; opacity: 0; }
mark { background: #fde68a; color: inherit; border-radius: 4px; padding: 0 2px; }
.retour { font-size: 22px; color: var(--bleu); font-weight: 600; }
.texte-b { font-family: Lora, serif; font-size: 23px; line-height: 1.45; color: #78350f; background: #fffbeb; border: 2px solid #fde68a; border-radius: 18px; padding: 16px 18px; }
.texte-b .lab { display: block; font-family: Inter; } .texte-b sup { font-family: Inter; font-size: 14px; color: #b45309; margin-right: 3px; }
.bloc { background: #fff; border: 2px solid var(--app-bord); border-radius: 18px; padding: 14px 18px; margin-top: 10px; opacity: 0; }
.bloc p { font-size: 22px; line-height: 1.4; margin-top: 2px; }
.photo { display: flex; gap: 8px; margin-top: 4px; } .photo i { width: 110px; height: 76px; border-radius: 10px; background: linear-gradient(135deg, #fde68a, #e9d5ff); }
.photo i:nth-child(2) { background: linear-gradient(135deg, #bfdbfe, #fef3c7); } .photo i:nth-child(3) { background: linear-gradient(135deg, #bbf7d0, #fde68a); } .photo i:nth-child(4) { background: linear-gradient(135deg, #fecaca, #ddd6fe); }
.audio { display: flex; align-items: center; gap: 12px; margin-top: 4px; font-size: 20px; color: var(--app-gris); }
.play { width: 44px; height: 44px; border-radius: 50%; background: var(--bleu); position: relative; flex-shrink: 0; }
.play::after { content: ""; position: absolute; left: 17px; top: 13px; border-left: 14px solid #fff; border-top: 9px solid transparent; border-bottom: 9px solid transparent; }
.onde { flex: 1; display: flex; align-items: center; gap: 4px; height: 44px; } .onde i { flex: 1; background: #93c5fd; border-radius: 3px; }
.lien { color: var(--bleu); text-decoration: underline; }
"""

L, C, D, P = S["liste"], S["chercher"], S["detail"], S["plusieurs"]
js = ep.js_commun(["liste", "chercher", "detail", "plusieurs"]) + f"""
// 0. accroche
tl.fromTo("#sc-accroche h1", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.fromTo("#pile .fiche", {{ opacity: 0, y: 80 }}, {{ opacity: (i) => [0.5, 0.75, 1][i], y: 0, duration: 0.6, stagger: 0.25, ease: E }}, 1.2);

// 1. la liste, ses regroupements, son résumé
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {L["debut"]});
tl.fromTo(".lec", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.3, stagger: 0.12, ease: E }}, {L["debut"] + 0.5});
const regroupe = (on, t) => {{ ["#g-date", "#g-livre", "#g-ctx"].forEach((id) => tl.set(id, {{ className: "chip" + (id === on ? " sel" : "") }}, t)); }};
tap(330, 360, {a("liste", 3.0)}); regroupe("#g-livre", {a("liste", 3.1)});
tap(470, 360, {a("liste", 3.9)}); regroupe("#g-ctx", {a("liste", 4.0)});
regroupe("#g-date", {a("liste", 5.4)});
tl.fromTo("#resume", {{ backgroundColor: "#f1f5f9" }}, {{ backgroundColor: "#fde68a", duration: 0.4, yoyo: true, repeat: 1 }}, {a("liste", 6.6)});

// 2. chercher « berger »
tl.to("#rech-ph", {{ opacity: 0, duration: 0.1 }}, {a("chercher", 2.0)});
tl.to("#rech-t", {{ width: 110, duration: 0.7, ease: "steps(6)" }}, {a("chercher", 2.0)});
tl.to("#l1, #l2, #l4", {{ opacity: 0, duration: 0.25 }}, {a("chercher", 2.9)});
tl.set("#l1, #l2, #l4", {{ display: "none" }}, {a("chercher", 3.15)});
tl.set("#r-n", {{ textContent: "2 lectures" }}, {a("chercher", 2.9)});
tl.set("#r-p", {{ textContent: "du 14 nov. au 16 nov." }}, {a("chercher", 2.9)});
tl.set("#r-l", {{ textContent: "2 livres" }}, {a("chercher", 2.9)});
tl.set("#l3 .note", {{ innerHTML: "Le bon <mark>berger</mark> connaît ses brebis." }}, {a("chercher", 3.1)});

// 3. le détail
tap(313, 470, {a("detail", 0.3)});
cache("#p-liste", {a("detail", 0.5)});
montre("#p-detail", {a("detail", 0.7)});
tl.fromTo(".texte-b", {{ boxShadow: "0 0 0 0 rgba(233,185,73,0)" }}, {{ boxShadow: "0 0 0 6px rgba(233,185,73,.4)", duration: 0.35, yoyo: true, repeat: 1 }}, {a("detail", 1.6)});
["#d-notes", "#d-photo", "#d-audio", "#d-lien"].forEach((id, k) => tl.fromTo(id, {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.35, ease: E }}, {a("detail", 2.6)} + k * [0, 0.9, 1.7, 2.6][k] / Math.max(k, 1)));
tl.fromTo(".onde i", {{ scaleY: 0.3 }}, {{ scaleY: 1, duration: 0.25, stagger: 0.03, yoyo: true, repeat: 3 }}, {a("detail", 4.6)});

// 4. sélection multiple
cache("#p-detail", {P["debut"]});
tl.set("#rech-t", {{ width: 0 }}, {P["debut"]});
tl.set("#rech-ph", {{ opacity: 1 }}, {P["debut"]});
tl.set("#l1, #l2, #l4", {{ display: "block", opacity: 1 }}, {P["debut"]});
tl.set("#r-n", {{ textContent: "12 lectures" }}, {P["debut"]});
tl.set("#r-l", {{ textContent: "6 livres" }}, {P["debut"]});
tl.set("#r-p", {{ textContent: "du 1 nov. au 16 nov." }}, {P["debut"]});
montre("#p-liste", {P["debut"] + 0.2});
tl.to(".coche", {{ opacity: 1, duration: 0.2 }}, {a("plusieurs", 0.3)});
tl.to("#barre-sel", {{ opacity: 1, height: 64, duration: 0.3 }}, {a("plusieurs", 0.3)});
["#l2", "#l3", "#l4"].forEach((id, k) => {{
  tl.to(id + "-c", {{ backgroundColor: "#1e3a5f", borderColor: "#1e3a5f", duration: 0.15 }}, {a("plusieurs", 0.9)} + k * 0.5);
  tl.to(id, {{ borderColor: "#93c5fd", duration: 0.15 }}, {a("plusieurs", 0.9)} + k * 0.5);
  tl.set("#nsel", {{ textContent: (k + 1) + " sélectionnée" + (k ? "s" : "") }}, {a("plusieurs", 0.9)} + k * 0.5);
}});
tap(560, 470, {a("plusieurs", 3.2)});
["#l2", "#l3", "#l4"].forEach((id) => tl.set(id + " .ctx", {{ textContent: "Méditation", color: "#2ecc71", backgroundColor: "#2ecc7122" }}, {a("plusieurs", 3.4)}));
tl.to("#tel", {{ opacity: 0, y: 60, duration: 0.45 }}, {round(S["appel"]["debut"] - 0.45, 2)});
"""

ep.ecrire(corps, css, js)
