"""Épisode 6 — Progression, séries et badges.
Usage : python3 construire-ep06.py ep06-progression

Chiffres tenus au code : niveaux à 10/50/100/250/500/1000 chapitres
(src/app/progress/page.tsx › getLevel), paliers de série 7/30/100/365
(lib/objectifs › PALIERS), 929 + 260 chapitres. Les chiffres montrés se tiennent entre eux : 34 + 18 = 52 chapitres entamés.
"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S

MEDAILLE = '<svg viewBox="0 0 24 24" width="62" height="62" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><circle cx="12" cy="14" r="6"/><path d="M8.5 3h7l-2 6h-3z"/><path d="M12 11.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 13.3l2-.3z" fill="currentColor"/></svg>'
BADGES = [
    ("Premiers pas", "Lire son premier chapitre", "ok"),
    ("Découvreur", "Lire 10 chapitres", "ok"),
    ("Explorateur", "Lire 50 chapitres", "ok"),
    ("Régulier", "Une série de 3 jours", "ok"),
    ("Persévérant", "Une série de 7 jours", "neuf"),
    ("Légende vivante", "Une série de 100 jours", "verrou"),
]
badges_html = "".join(
    f'<div class="badge {etat}" id="bd{i}"><span class="ic">{MEDAILLE}</span><b>{n}</b><p>{d}</p></div>'
    for i, (n, d, etat) in enumerate(BADGES)
)

ecrans = f'''
<div class="panneau" id="p-prog" style="opacity:1">
  <div id="defile">
    <div class="app-h">Ma progression</div>
    <div class="carte-niv">
      <div class="niv-haut"><span id="niv-num">Niveau 2</span></div>
      <div class="niv-titre" id="niv-titre">Lecteur du dimanche</div>
      <div class="niv-piste"><div id="niv-barre"></div></div>
      <div class="niv-txt" id="niv-txt">47 / 50 chapitres</div>
    </div>

    <div class="carte" id="c-serie">
      <div class="lab">Série actuelle</div>
      <div class="serie"><b id="serie-n">6</b><span>jours</span><span class="flamme"></span></div>
      <div class="paliers"><span class="pal" id="pal7">7 jours</span><span class="pal">30 jours</span><span class="pal">100 jours</span><span class="pal">365 jours</span></div>
      <div class="petit" id="prochain">Prochain palier : 7 jours · Meilleure : 12 jours</div>
    </div>

    <div class="carte" id="c-test">
      <div class="t-ligne"><b>Ancien Testament</b><span>34 / 929 chapitres</span></div>
      <div class="piste2"><div class="entier" id="at-e"></div><div class="entame" id="at-n"></div></div>
      <div class="t-ligne" style="margin-top:20px"><b>Nouveau Testament</b><span>18 / 260 chapitres</span></div>
      <div class="piste2"><div class="entier" id="nt-e"></div><div class="entame" id="nt-n"></div></div>
      <div class="legende"><span><i style="background:#1e3a5f"></i>Lu en entier</span><span><i style="background:#93c5fd"></i>Entamé</span><span class="petit">dont 38 lus en entier</span></div>
    </div>

    <div class="app-h" style="font-size:32px;margin:26px 0 14px">Succès &amp; Récompenses</div>
    <div class="badges">{badges_html}</div>
  </div>
</div>
'''

corps = f'''
{ep.scene("accroche", """
  <h1 class="titre-scene" style="top:240px">Chaque chapitre<br/><span class="degrade">compte</span></h1>
  <svg id="chemin" viewBox="0 0 900 700" width="900" height="700"><path id="trace" d="M60 640 C 260 620, 220 420, 420 400 S 640 220, 840 60" fill="none" stroke="#e9b949" stroke-width="10" stroke-linecap="round" stroke-dasharray="1200" stroke-dashoffset="1200"/>
  <circle cx="60" cy="640" r="18" fill="#9d8dff"/><circle id="arrivee" cx="840" cy="60" r="26" fill="#e9b949" opacity="0"/></svg>
""")}
{ep.etape("niveau", 1, "Ton niveau")}
{ep.etape("serie", 2, "Ta série")}
{ep.etape("testaments", 3, "Livre après livre")}
{ep.etape("badges", 4, "Tes badges")}
{telephone(ep, "niveau", ecrans)}
{ep.appel('Regarde <span class="degrade">ton chemin</span>', 'Niveau, série, testaments et badges : tout est dans « Ma progression ».')}
'''

css = """
#chemin { position: absolute; left: 90px; top: 640px; }
#defile { position: absolute; top: 34px; left: 34px; right: 34px; }
.carte-niv { margin-top: 20px; border-radius: 26px; padding: 26px 28px; color: #fff; background: linear-gradient(135deg, #1e3a5f, #7b68ee); }
.niv-haut { font-size: 20px; text-transform: uppercase; letter-spacing: 3px; opacity: .8; }
.niv-titre { font-size: 38px; font-weight: 700; margin-top: 6px; }
.niv-piste { height: 16px; border-radius: 8px; background: rgba(255,255,255,.25); margin-top: 18px; overflow: hidden; }
#niv-barre { height: 100%; width: 94%; background: #fde047; border-radius: 8px; }
.niv-txt { font-size: 22px; margin-top: 10px; opacity: .9; }
.carte { background: #fff; border: 2px solid var(--app-bord); border-radius: 24px; padding: 24px 26px; margin-top: 18px; }
.serie { display: flex; align-items: baseline; gap: 12px; margin-top: 4px; }
.serie b { font-size: 92px; font-family: Lora, serif; color: #ea580c; line-height: 1; }
.serie span { font-size: 30px; color: var(--app-gris); font-weight: 600; }
.paliers { display: flex; gap: 10px; margin-top: 16px; }
.pal { font-size: 20px; font-weight: 700; padding: 8px 14px; border-radius: 999px; background: #f1f5f9; color: #94a3b8; }
.petit { font-size: 21px; color: var(--app-gris); margin-top: 12px; }
.t-ligne { display: flex; justify-content: space-between; font-size: 24px; } .t-ligne span { color: var(--app-gris); }
.piste2 { display: flex; height: 22px; border-radius: 11px; background: #e2e8f0; overflow: hidden; margin-top: 10px; }
.entier { background: #1e3a5f; width: 0; } .entame { background: #93c5fd; width: 0; }
.legende { display: flex; gap: 18px; align-items: center; margin-top: 14px; font-size: 20px; color: var(--app-gris); flex-wrap: wrap; }
.legende i { display: inline-block; width: 16px; height: 16px; border-radius: 4px; margin-right: 6px; vertical-align: -2px; }
.legende .petit { margin: 0; }
.badges { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.badge { border-radius: 22px; padding: 18px; text-align: center; border: 2px solid #fde68a; background: #fefce8; }
.badge .ic { color: #ca8a04; display: block; }
.badge b { display: block; font-size: 24px; color: #713f12; margin-top: 6px; }
.badge p { font-size: 18px; color: #854d0e; margin-top: 4px; }
.badge.verrou { background: #f8fafc; border-color: #e2e8f0; } .badge.verrou .ic, .badge.verrou b, .badge.verrou p { color: #94a3b8; }
.badge.neuf { background: #f8fafc; border-color: #e2e8f0; } .badge.neuf .ic, .badge.neuf b, .badge.neuf p { color: #94a3b8; }
"""

N, SE, TE, BA = S["niveau"], S["serie"], S["testaments"], S["badges"]
js = ep.js_commun(["niveau", "serie", "testaments", "badges"]) + f"""
// 0. accroche : un chemin qui se trace
tl.fromTo("#sc-accroche h1", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.to("#trace", {{ attr: {{ "stroke-dashoffset": 0 }}, duration: 4.2, ease: "power1.inOut" }}, 1.0);
tl.to("#arrivee", {{ opacity: 1, duration: 0.3 }}, 5.1);
tl.fromTo("#arrivee", {{ attr: {{ r: 10 }} }}, {{ attr: {{ r: 26 }}, duration: 0.5, ease: "back.out(3)" }}, 5.1);

// 1. niveau : passage de Lecteur du dimanche à Fidèle
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {N["debut"]});
tl.to("#niv-barre", {{ width: "100%", duration: 0.8, ease: E }}, {a("niveau", 3.6)});
tl.set("#niv-num", {{ textContent: "Niveau 3" }}, {a("niveau", 4.6)});
tl.set("#niv-titre", {{ textContent: "Fidèle" }}, {a("niveau", 4.6)});
tl.set("#niv-txt", {{ textContent: "52 / 100 chapitres" }}, {a("niveau", 4.6)});
tl.fromTo("#niv-barre", {{ width: "0%" }}, {{ width: "52%", duration: 0.8, ease: E }}, {a("niveau", 4.6)});
tl.fromTo(".carte-niv", {{ scale: 1 }}, {{ scale: 1.05, duration: 0.25, yoyo: true, repeat: 1 }}, {a("niveau", 4.6)});

// 2. série : 6 → 7 jours, palier atteint
tl.to("#defile", {{ y: -60, duration: 0.6, ease: "power2.inOut" }}, {SE["debut"]});
tl.fromTo("#c-serie", {{ boxShadow: "0 0 0 0 rgba(234,88,12,0)" }}, {{ boxShadow: "0 0 0 6px rgba(234,88,12,.35)", duration: 0.4, yoyo: true, repeat: 1 }}, {a("serie", 0.4)});
tl.set("#serie-n", {{ textContent: "7" }}, {a("serie", 1.6)});
tl.fromTo("#serie-n", {{ scale: 1.6 }}, {{ scale: 1, duration: 0.5, ease: "back.out(2)", immediateRender: false }}, {a("serie", 1.6)});
tl.to("#pal7", {{ backgroundColor: "#ea580c", color: "#ffffff", duration: 0.25 }}, {a("serie", 2.2)});
tl.fromTo("#pal7", {{ scale: 1 }}, {{ scale: 1.25, duration: 0.2, yoyo: true, repeat: 1 }}, {a("serie", 2.2)});
tl.set("#prochain", {{ textContent: "Prochain palier : 30 jours · Meilleure : 12 jours" }}, {a("serie", 3.0)});

// 3. testaments
tl.to("#defile", {{ y: -250, duration: 0.7, ease: "power2.inOut" }}, {TE["debut"]});
tl.to("#at-e", {{ width: "2.6%", duration: 1.2, ease: E }}, {a("testaments", 1.6)});
tl.to("#at-n", {{ width: "1.1%", duration: 1.0, ease: E }}, {a("testaments", 2.4)});
tl.to("#nt-e", {{ width: "5.4%", duration: 1.2, ease: E }}, {a("testaments", 1.9)});
tl.to("#nt-n", {{ width: "1.5%", duration: 1.0, ease: E }}, {a("testaments", 2.7)});

// 4. badges
tl.to("#defile", {{ y: -720, duration: 0.7, ease: "power2.inOut" }}, {BA["debut"]});
tl.fromTo(".badge", {{ opacity: 0, scale: 0.85 }}, {{ opacity: 1, scale: 1, duration: 0.35, stagger: 0.15, ease: E }}, {BA["debut"] + 0.5});
tl.to("#bd4", {{ backgroundColor: "#fefce8", borderColor: "#fde68a", duration: 0.3 }}, {a("badges", 4.4)});
tl.to("#bd4 .ic", {{ color: "#ca8a04", duration: 0.3 }}, {a("badges", 4.4)});
tl.to("#bd4 b", {{ color: "#713f12", duration: 0.3 }}, {a("badges", 4.4)});
tl.to("#bd4 p", {{ color: "#854d0e", duration: 0.3 }}, {a("badges", 4.4)});
tl.fromTo("#bd4", {{ scale: 1 }}, {{ scale: 1.12, duration: 0.25, yoyo: true, repeat: 1 }}, {a("badges", 4.4)});
tl.fromTo("#bd5", {{ boxShadow: "0 0 0 0 rgba(148,163,184,0)" }}, {{ boxShadow: "0 0 0 5px rgba(148,163,184,.45)", duration: 0.4, yoyo: true, repeat: 1 }}, {a("badges", 6.2)});
tl.to("#tel", {{ opacity: 0, y: 60, duration: 0.45 }}, {round(S["appel"]["debut"] - 0.45, 2)});
"""

ep.ecrire(corps, css, js)
