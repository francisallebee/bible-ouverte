"""Épisode 5 — Les mots hébreux et grecs (texte original et lexique Strong).
Usage : python3 construire-ep05.py ep05-hebreu-grec

Les définitions du lexique Strong sont en anglais dans l'application : la vidéo
les montre telles quelles et la voix le dit.
"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S

GREC = ["Ἐν", "ἀρχῇ", "ἦν", "ὁ", "λόγος,", "καὶ", "ὁ", "λόγος", "ἦν", "πρὸς", "τὸν", "θεόν,", "καὶ", "θεὸς", "ἦν", "ὁ", "λόγος."]
HEBREU = ["בְּרֵאשִׁ֖ית", "בָּרָ֣א", "אֱלֹהִ֑ים", "אֵ֥ת", "הַשָּׁמַ֖יִם", "וְאֵ֥ת", "הָאָֽרֶץ׃"]
grec_html = " ".join(f'<span class="mot" id="g{i}">{w}</span>' for i, w in enumerate(GREC))
hebreu_html = " ".join(f'<span class="mot" id="h{i}">{w}</span>' for i, w in enumerate(HEBREU))

ecrans = f'''
<div class="panneau" id="p-reglages">
  <div class="app-h">Réglages</div>
  <div class="app-sous">Lexiques Strong</div>
  <p class="aide">Activer une langue télécharge son texte original et son lexique sur cet appareil — environ 19&nbsp;Mo pour l’hébreu, 11&nbsp;Mo pour le grec. Tu pourras alors cliquer un mot hébreu ou grec pour en lire la définition.</p>
  <div class="lex"><div><b>Lexique Strong hébreu</b><p id="st-h">19 Mo</p></div><span class="bascule" id="b-h"><i></i></span></div>
  <div class="lex"><div><b>Lexique Strong grec</b><p id="st-g">11 Mo</p></div><span class="bascule" id="b-g"><i></i></span></div>
  <div class="piste"><div id="dl"></div></div>
</div>

<div class="panneau" id="p-lecture">
  <div class="app-h" id="ref-titre">Jean 1:1</div>
  <div class="app-sous" id="ref-sous">Louis Segond 1910 · Méditation</div>
  <div class="texte-fr" id="fr-jn">Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu.</div>
  <div class="texte-fr" id="fr-gn" style="display:none">Au commencement, Dieu créa les cieux et la terre.</div>
  <div class="bouton" id="b-orig"><span id="bo-a">Voir le texte original</span></div>
  <div class="orig" id="orig-g"><div class="lab">Texte original</div><div class="o-txt grec">{grec_html}</div></div>
  <div class="orig" id="orig-h"><div class="lab">Texte original</div><div class="o-txt hebreu" dir="rtl">{hebreu_html}</div></div>
</div>

<div id="fiche-g" class="fiche">
  <div class="f-mot grec">λόγος</div>
  <div class="f-num">G3056 · lógos</div>
  <div class="f-def">something said (including the thought); by implication, a topic (subject of discourse), also reasoning (the mental faculty) or motive; by extension, a computation; specially, (with the article in John) the Divine Expression (i.e. Christ)</div>
  <div class="f-der">from G3004 (λέγω);</div>
  <div class="f-att">Strong’s Exhaustive Concordance (1890), domaine public · Open Scriptures, CC BY-SA</div>
</div>
<div id="fiche-h" class="fiche">
  <div class="f-mot hebreu" dir="rtl">בְּרֵאשִׁ֖ית</div>
  <div class="f-num">H7225 · rêʼshîyth · ray-sheeth’</div>
  <div class="f-def">the first, in place, time, order or rank (specifically, a firstfruit)</div>
  <div class="f-der">from the same as H7218 (רֹאשׁ);</div>
  <div class="f-att">Strong’s Exhaustive Concordance (1890), domaine public · Open Scriptures, CC BY-SA</div>
</div>
'''

corps = f'''
{ep.scene("accroche", """
  <h1 class="titre-scene" style="top:230px">Au plus près<br/><span class="degrade">de la source</span></h1>
  <div id="duo"><div class="d-col"><b class="grec">λόγος</b><span>grec</span></div><div class="d-col"><b class="hebreu">בְּרֵאשִׁית</b><span>hébreu</span></div></div>
""")}
{ep.etape("activer", 1, "Active le lexique")}
{ep.etape("ouvrir", 2, "Le texte original")}
{ep.etape("mot", 3, "Touche un mot")}
{ep.etape("hebreu", 4, "En hébreu aussi")}
{telephone(ep, "activer", ecrans)}
{ep.appel('Lis à <span class="degrade">la source</span>', 'Le grec et l’hébreu, mot à mot, sur ton téléphone.')}
'''

css = """
@font-face { font-family: 'Noto Serif Hebrew'; src: url(assets/fonts/noto-serif-hebrew-hebrew-500-normal.woff2); font-weight: 500; }
@font-face { font-family: 'Noto Serif'; src: url(assets/fonts/noto-serif-greek-500-normal.woff2); font-weight: 500; unicode-range: U+0370-03FF; }
@font-face { font-family: 'Noto Serif'; src: url(assets/fonts/noto-serif-greek-ext-500-normal.woff2); font-weight: 500; unicode-range: U+1F00-1FFF; }
@font-face { font-family: 'Noto Serif'; src: url(assets/fonts/noto-serif-latin-ext-500-normal.woff2); font-weight: 500; unicode-range: U+0100-02FF, U+1E00-1EFF; }
.grec { font-family: 'Noto Serif', serif; font-weight: 500; }
.hebreu { font-family: 'Noto Serif Hebrew', serif; font-weight: 500; }
#duo { position: absolute; top: 720px; left: 80px; right: 80px; display: flex; justify-content: space-around; }
.d-col { display: flex; flex-direction: column; align-items: center; gap: 14px; opacity: 0; }
.d-col b { font-size: 132px; color: var(--or); line-height: 1.3; }
.d-col span { font-size: 40px; color: var(--t2); }
.aide { font-size: 23px; color: var(--app-gris); line-height: 1.45; margin-bottom: 22px; }
.lex { display: flex; justify-content: space-between; align-items: center; background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 20px 24px; margin-bottom: 14px; }
.lex b { font-size: 27px; } .lex p { font-size: 22px; color: var(--app-gris); margin-top: 4px; }
.bascule { width: 84px; height: 48px; border-radius: 24px; background: #cbd5e1; position: relative; }
.bascule i { position: absolute; top: 5px; left: 5px; width: 38px; height: 38px; border-radius: 50%; background: #fff; }
.piste { height: 14px; border-radius: 7px; background: #e2e8f0; overflow: hidden; margin-top: 10px; opacity: 0; }
#dl { height: 100%; width: 0; background: var(--vert); }
.texte-fr { font-family: Lora, serif; font-size: 28px; line-height: 1.5; color: #78350f; background: #fffbeb; border: 2px solid #fde68a; border-radius: 20px; padding: 20px 24px; margin-bottom: 18px; }
#b-orig { background: #fff; color: var(--bleu); border: 3px solid var(--bleu); }
.orig { position: absolute; top: 420px; left: 34px; right: 34px; background: #fff; border: 2px solid var(--app-bord); border-radius: 22px; padding: 22px 24px; opacity: 0; }
.o-txt { font-size: 38px; line-height: 1.9; color: var(--app-texte); margin-top: 6px; }
.o-txt.hebreu { font-size: 44px; text-align: right; }
.mot { border-bottom: 2px dotted #94a3b8; border-radius: 6px; padding: 0 3px; }
.fiche { position: absolute; left: 18px; right: 18px; bottom: 18px; background: #fff; border-radius: 30px; padding: 30px 32px; z-index: 13; opacity: 0; box-shadow: 0 -20px 60px -10px rgba(15,23,42,.35); color: var(--app-texte); }
.f-mot { font-size: 62px; color: var(--bleu); }
.f-mot.hebreu { text-align: right; }
.f-num { font-size: 23px; color: var(--app-gris); margin-top: 6px; font-family: 'Noto Serif', Inter, sans-serif; }
.f-def { font-size: 25px; line-height: 1.45; margin-top: 12px; }
.f-der { font-size: 21px; color: var(--app-gris); margin-top: 10px; }
.f-att { font-size: 16px; color: #94a3b8; margin-top: 14px; line-height: 1.35; }
"""

AC, AV, OU, MO, HE = S["accroche"], S["activer"], S["ouvrir"], S["mot"], S["hebreu"]
js = ep.js_commun(["activer", "ouvrir", "mot", "hebreu"]) + f"""
// 0. accroche
tl.fromTo("#sc-accroche h1", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.fromTo(".d-col", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.7, stagger: 0.6, ease: E }}, {a("accroche", 3.4)});

// 1. réglages
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {AV["debut"]});
tl.set("#p-reglages", {{ opacity: 1 }}, {AV["debut"]});
const bascule = (id, t) => {{
  tl.to(id, {{ backgroundColor: "#2ecc71", duration: 0.2 }}, t);
  tl.to(id + " i", {{ x: 36, duration: 0.2, ease: "power2.out" }}, t);
}};
tap(540, 498, {a("activer", 2.2)});
bascule("#b-g", {a("activer", 2.3)});
tap(540, 400, {a("activer", 3.0)});
bascule("#b-h", {a("activer", 3.1)});
tl.to(".piste", {{ opacity: 1, duration: 0.2 }}, {a("activer", 4.4)});
tl.to("#dl", {{ width: "100%", duration: 2.6, ease: "power1.inOut" }}, {a("activer", 4.4)});
tl.set("#st-g", {{ textContent: "Activé · 11 Mo" }}, {a("activer", 7.0)});
tl.set("#st-h", {{ textContent: "Activé · 19 Mo" }}, {a("activer", 7.0)});

// 2. lecture + texte original grec
cache("#p-reglages", {OU["debut"]});
montre("#p-lecture", {OU["debut"] + 0.2});
tap(313, 400, {a("ouvrir", 2.2)});
tl.to("#b-orig", {{ opacity: 0, duration: 0.2 }}, {a("ouvrir", 2.4)});
tl.fromTo("#orig-g", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: E }}, {a("ouvrir", 2.5)});
tl.fromTo("#orig-g .mot", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2, stagger: 0.12 }}, {a("ouvrir", 4.6)});

// 3. un mot, sa fiche
tl.to("#g7", {{ backgroundColor: "#fde68a", duration: 0.2 }}, {a("mot", 1.1)});
tap(270, 590, {a("mot", 1.1)});
tl.fromTo("#fiche-g", {{ opacity: 0, y: 260 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: E }}, {a("mot", 1.5)});
tl.fromTo("#fiche-g .f-num", {{ backgroundColor: "rgba(233,185,73,0)" }}, {{ backgroundColor: "rgba(233,185,73,.35)", duration: 0.3, yoyo: true, repeat: 1 }}, {a("mot", 4.4)});
tl.fromTo("#fiche-g .f-def", {{ backgroundColor: "rgba(233,185,73,0)" }}, {{ backgroundColor: "rgba(233,185,73,.25)", duration: 0.4, yoyo: true, repeat: 1 }}, {a("mot", 6.6)});

// 4. hébreu
tl.to("#fiche-g", {{ opacity: 0, y: 200, duration: 0.4 }}, {HE["debut"]});
tl.to("#orig-g", {{ opacity: 0, duration: 0.3 }}, {HE["debut"]});
tl.set("#ref-titre", {{ textContent: "Genèse 1:1" }}, {HE["debut"] + 0.3});
tl.set("#fr-jn", {{ display: "none" }}, {HE["debut"] + 0.3});
tl.set("#fr-gn", {{ display: "block" }}, {HE["debut"] + 0.3});
tl.fromTo("#orig-h", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: -40, duration: 0.5, ease: E }}, {HE["debut"] + 0.4});
tl.fromTo("#orig-h .mot", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2, stagger: 0.15 }}, {HE["debut"] + 0.7});
tl.to("#h0", {{ backgroundColor: "#fde68a", duration: 0.2 }}, {a("hebreu", 2.8)});
tap(520, 470, {a("hebreu", 2.8)});
tl.fromTo("#fiche-h", {{ opacity: 0, y: 260 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: E }}, {a("hebreu", 3.1)});
tl.to("#tel", {{ opacity: 0, y: 60, duration: 0.45 }}, {round(S["appel"]["debut"] - 0.45, 2)});
"""

ep.ecrire(corps, css, js)
