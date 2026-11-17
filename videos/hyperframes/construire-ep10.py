"""Épisode 10 — Les statistiques.
Usage : python3 construire-ep10.py ep10-statistiques

Sections reprises de src/app/stats/page.tsx. Chiffres d'exemple cohérents entre
eux et avec l'épisode 6 (52 chapitres entamés, dont 38 lus en entier) :
64 lectures = somme des contextes = somme des versions.
"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S

JOURS = [1, 0, 2, 1, 1, 0, 0, 3, 2, 1, 2, 0, 1, 1, 2, 3, 1, 0, 1, 2, 2, 1, 0, 0, 1, 2, 3, 2, 1, 2]
barres = "".join(f'<i class="b" id="j{i}" data-h="{h}"></i>' for i, h in enumerate(JOURS))
LIVRES = [("Psaumes", 14), ("Jean", 9), ("Matthieu", 7), ("Proverbes", 6), ("Romains", 5), ("Genèse", 4), ("Marc", 3), ("Luc", 3), ("Actes", 2), ("Ésaïe", 2)]
COULEURS = ["#4a90d9", "#7b68ee", "#2ecc71", "#e67e22", "#e74c3c", "#16a085", "#9b59b6", "#f39c12", "#3498db", "#d35400"]
livres = "".join(
    f'<div class="hb"><span class="hb-l">{n}</span><span class="hb-p"><i id="lv{i}" style="background:{COULEURS[i]}" data-w="{c / 14 * 100:.0f}"></i></span><span class="hb-v">{c}</span></div>'
    for i, (n, c) in enumerate(LIVRES)
)
CONTEXTES = [("Méditation", 26, "#2ecc71"), ("Bible", 18, "#6d4c41"), ("Église", 9, "#7b68ee"), ("Prédication", 6, "#9b59b6"), ("Podcast", 5, "#c0392b")]
contextes = "".join(
    f'<div class="hb"><span class="hb-l">{n}</span><span class="hb-p"><i id="cx{i}" style="background:{c}" data-w="{v / 26 * 100:.0f}"></i></span><span class="hb-v">{v}</span></div>'
    for i, (n, v, c) in enumerate(CONTEXTES)
)
VERSIONS = [("Louis Segond 1910", 48, "#1e3a5f"), ("Bible Darby 1885", 10, "#e9b949"), ("King James 1611", 6, "#9d8dff")]
versions = "".join(
    f'<div class="hb"><span class="hb-l large">{n}</span><span class="hb-p"><i id="vs{i}" style="background:{c}" data-w="{v / 48 * 100:.0f}"></i></span><span class="hb-v">{v}</span></div>'
    for i, (n, v, c) in enumerate(VERSIONS)
)

ecrans = f'''
<div class="panneau" id="p-stats" style="opacity:1">
 <div id="defile">
  <div class="app-h">Statistiques</div>
  <div class="tuiles">
    <div class="tu"><span>Total lectures</span><b id="n-tot">0</b></div>
    <div class="tu"><span>Cette semaine</span><b id="n-sem">0</b></div>
    <div class="tu"><span>Ce mois</span><b id="n-mois">0</b></div>
  </div>
  <div class="carte"><div class="lab">Chapitres de la Bible</div><div class="petit">52 sur 1 189 entamés, dont 38 lus en entier</div>
    <div class="piste2"><div class="entier" id="ch-e"></div><div class="entame" id="ch-n"></div></div></div>
  <div class="carte" id="c-jours"><div class="sec">Lectures par jour (30 jours)</div><div class="histo">{barres}</div></div>
  <div class="carte" id="c-livres"><div class="sec">Top 10 livres</div>{livres}</div>
  <div class="carte" id="c-ctx"><div class="sec">Répartition par contexte</div>{contextes}</div>
  <div class="carte" id="c-vers"><div class="sec">Répartition par version</div>{versions}</div>
 </div>
</div>
'''

corps = f'''
{ep.scene("accroche", """
  <h1 class="titre-scene" style="top:240px">Ta façon<br/><span class="degrade">de lire</span></h1>
  <div id="mini"><i style="height:120px"></i><i style="height:220px"></i><i style="height:160px"></i><i style="height:300px"></i><i style="height:240px"></i></div>
""")}
{ep.etape("totaux", 1, "En un coup d’œil")}
{ep.etape("jours", 2, "Ton rythme")}
{ep.etape("livres", 3, "Tes livres")}
{ep.etape("versions", 4, "Tes versions")}
{telephone(ep, "totaux", ecrans)}
{ep.appel('Découvre <span class="degrade">ta façon de lire</span>', 'Tout est dans les Statistiques.')}
'''

css = """
#mini { position: absolute; top: 700px; left: 0; right: 0; height: 320px; display: flex; justify-content: center; align-items: flex-end; gap: 40px; }
#mini i { width: 110px; border-radius: 18px 18px 6px 6px; background: linear-gradient(180deg, var(--or), var(--violet)); transform-origin: bottom; }
#defile { position: absolute; top: 34px; left: 34px; right: 34px; }
.tuiles { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 18px; }
.tu { background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 16px 12px; text-align: center; }
.tu span { display: block; font-size: 18px; color: var(--app-gris); } .tu b { display: block; font-size: 52px; color: var(--bleu); margin-top: 4px; }
.carte { background: #fff; border: 2px solid var(--app-bord); border-radius: 22px; padding: 20px 22px; margin-top: 16px; }
.petit { font-size: 21px; color: var(--app-gris); margin-top: 4px; }
.piste2 { display: flex; height: 20px; border-radius: 10px; background: #e2e8f0; overflow: hidden; margin-top: 12px; }
.entier { background: #1e3a5f; width: 0; } .entame { background: #93c5fd; width: 0; }
.sec { font-size: 25px; font-weight: 700; margin-bottom: 14px; }
.histo { display: flex; align-items: flex-end; gap: 5px; height: 190px; border-bottom: 2px solid #e2e8f0; }
.histo .b { flex: 1; background: #4a90d9; border-radius: 5px 5px 0 0; height: 0; }
.hb { display: flex; align-items: center; gap: 10px; margin: 7px 0; }
.hb-l { width: 140px; font-size: 20px; color: #475569; text-align: right; flex-shrink: 0; } .hb-l.large { width: 210px; }
.hb-p { flex: 1; height: 22px; } .hb-p i { display: block; height: 100%; width: 0; border-radius: 0 6px 6px 0; }
.hb-v { width: 34px; font-size: 20px; font-weight: 700; color: var(--app-texte); }
"""

T, J, L, V = S["totaux"], S["jours"], S["livres"], S["versions"]
js = ep.js_commun(["totaux", "jours", "livres", "versions"]) + f"""
const compte = (sel, n, t) => {{ const o = {{ v: 0 }}; tl.to(o, {{ v: n, duration: 1.0, ease: "power2.out", onUpdate: () => {{ document.querySelector(sel).textContent = Math.round(o.v); }} }}, t); }};
// 0. accroche
tl.fromTo("#sc-accroche h1", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.fromTo("#mini i", {{ scaleY: 0 }}, {{ scaleY: 1, duration: 0.6, stagger: 0.15, ease: "back.out(1.6)" }}, 1.0);

// 1. totaux
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {T["debut"]});
compte("#n-tot", 64, {a("totaux", 0.6)});
compte("#n-sem", 5, {a("totaux", 2.0)});
compte("#n-mois", 18, {a("totaux", 2.6)});
tl.to("#ch-e", {{ width: "3.2%", duration: 1.0, ease: E }}, {a("totaux", 4.6)});
tl.to("#ch-n", {{ width: "1.2%", duration: 0.8, ease: E }}, {a("totaux", 5.2)});

// 2. trente jours
tl.to("#defile", {{ y: -330, duration: 0.6, ease: "power2.inOut" }}, {J["debut"]});
document.querySelectorAll(".histo .b").forEach((el, i) => {{
  tl.to(el, {{ height: (parseInt(el.dataset.h) / 3 * 100) + "%", duration: 0.35, ease: E }}, {a("jours", 0.4)} + i * 0.06);
}});
["#j5", "#j6", "#j22", "#j23"].forEach((id) => tl.fromTo(id, {{ backgroundColor: "#4a90d9" }}, {{ backgroundColor: "#e9b949", duration: 0.3 }}, {a("jours", 3.8)}));

// 3. livres et contextes
tl.to("#defile", {{ y: -620, duration: 0.6, ease: "power2.inOut" }}, {L["debut"]});
document.querySelectorAll("#c-livres .hb-p i").forEach((el, i) => tl.to(el, {{ width: el.dataset.w + "%", duration: 0.5, ease: E }}, {L["debut"] + 0.5} + i * 0.08));
tl.to("#defile", {{ y: -1010, duration: 0.7, ease: "power2.inOut" }}, {a("livres", 3.4)});
document.querySelectorAll("#c-ctx .hb-p i").forEach((el, i) => tl.to(el, {{ width: el.dataset.w + "%", duration: 0.5, ease: E }}, {a("livres", 4.0)} + i * 0.25));

// 4. versions
tl.to("#defile", {{ y: -1110, duration: 0.6, ease: "power2.inOut" }}, {V["debut"]});
document.querySelectorAll("#c-vers .hb-p i").forEach((el, i) => tl.to(el, {{ width: el.dataset.w + "%", duration: 0.6, ease: E }}, {V["debut"] + 0.6} + i * 0.3));
tl.to("#tel", {{ opacity: 0, y: 60, duration: 0.45 }}, {round(S["appel"]["debut"] - 0.45, 2)});
"""

ep.ecrire(corps, css, js)
