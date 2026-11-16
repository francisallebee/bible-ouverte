"""Épisode 4 — La recherche dans les 15 versions.
Usage : python3 construire-ep04.py ep04-recherche"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S

# Textes réels, tirés de public/bibles/ (Jean 3:16 et le thème « Paix »).
J316 = [
    ("Louis Segond 1910", "Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle.", "ltr", "Lora, serif"),
    ("Bible Darby 1885", "Car Dieu a tant aimé le monde, qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu’il ait la vie éternelle.", "ltr", "Lora, serif"),
    ("King James 1611", "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", "ltr", "Lora, serif"),
    ("Reina-Valera 1909", "Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.", "ltr", "Lora, serif"),
    ("Smith & Van Dyck 1865", "لِأَنَّهُ هَكَذَا أَحَبَّ ٱللهُ ٱلْعَالَمَ حَتَّى بَذَلَ ٱبْنَهُ ٱلْوَحِيدَ، لِكَيْ لَا يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونُ لَهُ ٱلْحَيَاةُ ٱلْأَبَدِيَّةُ.", "rtl", "'Noto Naskh Arabic', serif"),
]
versions_html = "".join(
    f'<div class="v-texte" id="vt{i}" dir="{d}" style="font-family:{f}">{t}</div>' for i, (_, t, d, f) in enumerate(J316)
)
versions_noms = "".join(f'<span class="v-nom" id="vn{i}">{n}</span>' for i, (n, *_r) in enumerate(J316))

RESULTATS = [
    ("Matthieu 5:14", "Vous êtes la <mark>lumière du monde</mark>. Une ville située sur une montagne ne peut être cachée ;"),
    ("Jean 8:12", "Je suis la <mark>lumière du monde</mark> ; celui qui me suit ne marchera pas dans les ténèbres…"),
    ("Jean 9:5", "Pendant que je suis dans le monde, je suis la <mark>lumière du monde</mark>."),
]
res_html = "".join(
    f'<div class="res" id="r{i}"><div class="res-ref">{r}<span class="plus">+ Ajouter</span></div><div class="res-txt">{t}</div></div>'
    for i, (r, t) in enumerate(RESULTATS)
)
THEMES = ["Amour", "Foi", "Espérance", "Paix", "Consolation", "Pardon", "Prière", "Courage", "Sagesse", "Joie", "Reconnaissance", "Humilité", "Patience", "Création", "Salut"]
themes_html = "".join(f'<span class="chip th" id="th{i}">{t}</span>' for i, t in enumerate(THEMES))

ecrans = f'''
<div class="panneau" id="p-rech" style="opacity:1">
  <div class="app-h">Recherche biblique</div>
  <div class="onglets"><span class="ong" id="o-ref">Référence</span><span class="ong" id="o-libre">Libre</span><span class="ong" id="o-theme">Thème</span></div>

  <div class="zone" id="z-libre">
    <div class="champ"><div class="lab">Mot-clé</div><div class="val"><span class="frappe" id="kw">lumière du monde</span><span class="curseur" id="curseur"></span></div></div>
    <div class="ligne2"><div class="champ" style="flex:1;margin:0"><div class="lab">Version</div><div class="val">Louis Segond 1910</div></div><div class="bouton" id="b-chercher">Chercher</div></div>
    <div class="compte" id="compte">3 résultats pour « lumière du monde »</div>
    {res_html}
  </div>

  <div class="zone" id="z-ref">
    <div class="ligne3"><div class="champ"><div class="lab">Livre</div><div class="val">Jean</div></div><div class="champ"><div class="lab">Chapitre</div><div class="val">3</div></div><div class="champ"><div class="lab">Verset</div><div class="val">16</div></div></div>
    <div class="champ"><div class="lab">Version</div><div class="val noms">{versions_noms}</div></div>
    <div class="carte-v"><div class="res-ref">Jean 3:16</div><div class="v-pile">{versions_html}</div></div>
  </div>

  <div class="zone" id="z-theme">
    <div class="lab" style="margin-bottom:10px">Chercher par thème</div>
    <div class="chips">{themes_html}</div>
    <div class="compte" id="th-compte">6 passages · Louis Segond 1910</div>
    <div class="res" id="tp0"><div class="res-ref">Jean 14:27<span class="plus" id="plus-ajout">+ Ajouter</span></div><div class="res-txt">Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre cœur ne se trouble point…</div></div>
    <div class="res" id="tp1"><div class="res-ref">Ésaïe 26:3<span class="plus">+ Ajouter</span></div><div class="res-txt">A celui qui est ferme dans ses sentiments Tu assures la paix, la paix, Parce qu’il se confie en toi.</div></div>
  </div>
</div>

<div id="voile"></div>
<div id="modale">
  <div class="app-h" style="font-size:34px">Ajouter une lecture</div>
  <div class="app-sous" style="margin-bottom:16px">Jean 14:27 · Louis Segond 1910</div>
  <div class="champ"><div class="lab">Date</div><div class="val">Aujourd’hui</div></div>
  <div class="champ"><div class="lab">Contexte (optionnel)</div><div class="chips"><span class="chip" id="m-ctx">Méditation</span></div></div>
  <div class="bouton" id="b-ajouter"><span id="aj-a">Ajouter aux lectures</span><span id="aj-b" style="opacity:0;position:absolute;left:0;right:0">Ajouté ✓</span></div>
</div>
'''

corps = f'''
{ep.scene("accroche", """
  <h1 class="titre-scene" style="top:230px">Où est<br/><span class="degrade">ce verset ?</span></h1>
  <div id="bribe">« … la <span class="flou">lumière</span> du <span class="flou">monde</span> … »</div>
  <svg id="loupe" width="260" height="260" viewBox="0 0 24 24" fill="none" stroke="#e9b949" stroke-width="1.6" stroke-linecap="round"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6"/></svg>
""")}
{ep.etape("libre", 1, "Quelques mots")}
{ep.etape("reference", 2, "Toutes tes versions")}
{ep.etape("theme", 3, "Par thème")}
{ep.etape("ajouter", 4, "Garde-le")}
{telephone(ep, "libre", ecrans)}
<div id="hl" class="clip" data-start="{a("ajouter", 4.6)}" data-duration="{round(ep.fin("ajouter") - a("ajouter", 4.6), 2)}" data-track-index="3">
  <div class="hl-pill"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round"><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="0.8" fill="#2ecc71"/><path d="M3 3l18 18"/></svg>Même hors ligne</div>
</div>
{ep.appel('Retrouve <span class="degrade">ton verset</span>', 'Libre, par référence ou par thème, dans tes versions.')}
'''

css = """
@font-face { font-family: 'Noto Naskh Arabic'; src: url(assets/fonts/noto-naskh-arabic-arabic-500-normal.woff2); font-weight: 500; }
#bribe { position: absolute; top: 760px; left: 80px; right: 80px; text-align: center; font-family: Lora, serif; font-style: italic; font-size: 66px; color: #fff; }
.flou { filter: blur(14px); color: var(--or); }
#loupe { position: absolute; left: 600px; top: 960px; opacity: 0; }
.onglets { display: flex; gap: 10px; margin: 18px 0 22px; }
.ong { flex: 1; text-align: center; font-size: 25px; font-weight: 700; padding: 14px 0; border-radius: 16px; background: #f1f5f9; color: #475569; }
.ong.actif { background: var(--bleu); color: #fff; }
.zone { position: absolute; top: 190px; left: 34px; right: 34px; opacity: 0; }
.frappe { display: inline-block; overflow: hidden; white-space: nowrap; width: 0; vertical-align: bottom; }
.curseur { display: inline-block; width: 3px; height: 32px; background: var(--bleu); vertical-align: middle; margin-left: 2px; }
.ligne2 { display: flex; gap: 14px; align-items: stretch; margin-bottom: 18px; }
.ligne2 .bouton { display: flex; align-items: center; padding: 0 28px; font-size: 26px; }
.ligne3 { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; }
.ligne3 .champ { margin-bottom: 14px; }
.compte { font-size: 23px; color: var(--app-gris); font-weight: 600; margin: 6px 0 14px; opacity: 0; }
.res { background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 18px 22px; margin-bottom: 14px; opacity: 0; }
.res-ref { font-size: 25px; font-weight: 700; color: var(--bleu); display: flex; justify-content: space-between; align-items: center; }
.res-txt { font-family: Lora, serif; font-size: 23px; line-height: 1.45; color: #334155; margin-top: 8px; }
mark { background: #fde68a; color: inherit; border-radius: 4px; padding: 0 3px; }
.plus { font-family: Inter; font-size: 21px; font-weight: 700; color: var(--bleu); background: #e8eef5; padding: 6px 14px; border-radius: 12px; }
.noms { position: relative; height: 38px; }
.v-nom { position: absolute; left: 0; opacity: 0; }
.carte-v { background: #fffbeb; border: 2px solid #fde68a; border-radius: 22px; padding: 22px 24px; }
.v-pile { position: relative; height: 330px; margin-top: 10px; }
.v-texte { position: absolute; inset: 0; font-size: 30px; line-height: 1.5; color: #78350f; opacity: 0; }
.v-texte[dir=rtl] { font-size: 34px; line-height: 1.75; text-align: right; }
.th { font-size: 22px; padding: 9px 16px; }
#voile { position: absolute; inset: 0; background: rgba(15,23,42,.45); opacity: 0; z-index: 12; }
#modale { position: absolute; left: 22px; right: 22px; bottom: 22px; background: #fff; border-radius: 34px; padding: 34px; z-index: 13; opacity: 0; color: var(--app-texte); }
#b-ajouter { position: relative; }
#hl { display: flex; justify-content: center; align-items: flex-start; padding-top: 1480px; }
.hl-pill { display: flex; align-items: center; gap: 22px; padding: 22px 40px; border-radius: 999px; background: rgba(46,204,113,.16); border: 1px solid rgba(46,204,113,.55); font-size: 42px; font-weight: 600; color: #fff; }
"""

L, R, T, AJ = S["libre"], S["reference"], S["theme"], S["ajouter"]
js = ep.js_commun(["libre", "reference", "theme", "ajouter"]) + f"""
// 0. accroche
tl.fromTo("#sc-accroche h1", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.fromTo("#bribe", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.6 }}, 1.0);
tl.fromTo("#loupe", {{ opacity: 0, x: 120, y: 60 }}, {{ opacity: 1, x: 0, y: 0, duration: 0.8, ease: E }}, {a("accroche", 3.6)});
tl.to("#loupe", {{ x: -380, y: -230, duration: 1.4, ease: "power2.inOut" }}, {a("accroche", 4.3)});
tl.to(".flou", {{ filter: "blur(0px)", duration: 0.8 }}, {a("accroche", 4.6)});

// 1. libre
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {L["debut"]});
tl.set("#o-libre", {{ className: "ong actif" }}, {L["debut"]});
tl.set("#z-libre", {{ opacity: 1 }}, {L["debut"]});
tl.to("#kw", {{ width: 300, duration: 1.3, ease: "steps(16)" }}, {a("libre", 1.6)});
tap(520, 422, {a("libre", 3.4)});
tl.to("#curseur", {{ opacity: 0, duration: 0.1 }}, {a("libre", 3.4)});
tl.to("#compte", {{ opacity: 1, duration: 0.3 }}, {a("libre", 3.7)});
[0, 1, 2].forEach((i) => tl.fromTo("#r" + i, {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: E }}, {a("libre", 3.9)} + i * 0.3));

// 2. référence : la même page, cinq versions
tl.set("#o-libre", {{ className: "ong" }}, {R["debut"]});
tl.set("#o-ref", {{ className: "ong actif" }}, {R["debut"]});
tl.to("#z-libre", {{ opacity: 0, duration: 0.3 }}, {R["debut"]});
tl.to("#z-ref", {{ opacity: 1, duration: 0.4 }}, {R["debut"] + 0.2});
const tv = [{a("reference", 0.0)}, {a("reference", 3.4)}, {a("reference", 4.4)}, {a("reference", 5.4)}, {a("reference", 6.8)}];
tv.forEach((t, i) => {{
  tl.to("#vn" + i + ", #vt" + i, {{ opacity: 1, duration: 0.3 }}, t);
  if (i > 0) tl.to("#vn" + (i - 1) + ", #vt" + (i - 1), {{ opacity: 0, duration: 0.25 }}, t);
}});
tl.to("#vn4, #vt4", {{ opacity: 0, duration: 0.25 }}, {round(T["debut"] - 0.1, 2)});

// 3. thème
tl.set("#o-ref", {{ className: "ong" }}, {T["debut"]});
tl.set("#o-theme", {{ className: "ong actif" }}, {T["debut"]});
tl.to("#z-ref", {{ opacity: 0, duration: 0.3 }}, {T["debut"]});
tl.to("#z-theme", {{ opacity: 1, duration: 0.4 }}, {T["debut"] + 0.2});
[3, 2, 5].forEach((i, k) => tl.fromTo("#th" + i, {{ scale: 1 }}, {{ scale: 1.15, duration: 0.18, yoyo: true, repeat: 1 }}, {a("theme", 2.6)} + k * 0.6));
tl.to("#th3", {{ backgroundColor: "#1e3a5f", color: "#ffffff", duration: 0.25 }}, {a("theme", 4.6)});
tl.to("#th-compte", {{ opacity: 1, duration: 0.3 }}, {a("theme", 4.9)});
tl.fromTo("#tp0", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: E }}, {a("theme", 5.1)});
tl.fromTo("#tp1", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: E }}, {a("theme", 5.4)});

// 4. ajouter
tap(530, 708, {a("ajouter", 1.3)});
tl.to("#voile", {{ opacity: 1, duration: 0.3 }}, {a("ajouter", 1.6)});
tl.fromTo("#modale", {{ opacity: 0, y: 200 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: E }}, {a("ajouter", 1.6)});
tl.to("#m-ctx", {{ backgroundColor: "#1e3a5f", color: "#ffffff", duration: 0.2 }}, {a("ajouter", 2.4)});
tap(313, 1040, {a("ajouter", 3.2)});
tl.to("#aj-a", {{ opacity: 0, duration: 0.15 }}, {a("ajouter", 3.35)});
tl.to("#aj-b", {{ opacity: 1, duration: 0.25 }}, {a("ajouter", 3.35)});
tl.to("#b-ajouter", {{ backgroundColor: "#047857", duration: 0.25 }}, {a("ajouter", 3.35)});
tl.to("#tel", {{ y: -60, duration: 0.6, ease: "power2.inOut" }}, {a("ajouter", 4.4)});
tl.fromTo("#hl .hl-pill", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" }}, {a("ajouter", 4.6)});
tl.to("#tel", {{ opacity: 0, duration: 0.45 }}, {round(S["appel"]["debut"] - 0.45, 2)});
"""

ep.ecrire(corps, css, js)
