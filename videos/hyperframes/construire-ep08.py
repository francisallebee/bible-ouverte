"""Épisode 8 — Le quiz de révision.
Usage : python3 construire-ep08.py ep08-quiz

Tenu au code : 10 questions (app/quiz › NOMBRE_DE_QUESTIONS), tirées des seules
lectures (lib/quiz), quatre consignes, « C'était … » après la réponse,
« Très bien joué ! » à partir de 70 %, meilleur score affiché en pourcentage.
"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S


def question(qid, num, consigne, verset, choix, bonne):
    boutons = "".join(f'<div class="choix" id="{qid}c{i}">{c}</div>' for i, c in enumerate(choix))
    return f'''<div class="q" id="{qid}">
    <div class="q-prog">Question {num} sur 10</div>
    <div class="q-cons">{consigne}</div>
    <div class="q-vers">{verset}</div>
    <div class="q-choix">{boutons}</div>
    <div class="q-fin" id="{qid}-fin"></div>
  </div>'''


Q1 = question("q1", 3, "De quel livre vient ce verset ?", "« Vous êtes la lumière du monde. Une ville située sur une montagne ne peut être cachée ; »", ["Jean", "Matthieu", "Psaumes", "Romains"], 1)
Q2 = question("q2", 4, "Quel mot manque ?", "« L’Eternel est mon <span class=\"trou\">______</span> : je ne manquerai de rien. »", ["rocher", "roi", "berger", "salut"], 2)
Q3 = question("q3", 5, "Quelle est sa référence ?", "« Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. »", ["Jean 3:16", "Jean 14:27", "Matthieu 5:14", "Psaumes 23:1"], 1)

ecrans = f'''
<div class="panneau" id="p-acc">
  <div class="app-h">Quizz de révision</div>
  <div class="app-sous">Révise ce que tu as lu, à ton rythme.</div>
  <div class="depart"><svg width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="#7b68ee" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L19 8.2l-3.8 3.4 1.1 5L12 14.1 7.7 16.6l1.1-5L5 8.2l5.1-.6z"/></svg>
  <div class="bouton" id="b-go">Commencer une partie</div><p class="aide">10 questions tirées de tes lectures</p></div>
  <div class="mes-lect"><div class="lab">Tes lectures</div><span class="chip">Psaumes 23</span><span class="chip">Jean 3</span><span class="chip">Matthieu 5</span><span class="chip">Jean 14</span><span class="chip">Genèse 1</span></div>
</div>

<div class="panneau" id="p-q">{Q1}{Q2}{Q3}</div>

<div class="panneau" id="p-res">
  <div class="app-h">Résultat</div>
  <div class="score"><b>8</b><span>bonnes réponses sur 10</span></div>
  <div class="bravo">Très bien joué !</div>
  <div class="stats4"><div class="s4"><b>5</b><span>Parties</span></div><div class="s4"><b>78 %</b><span>Réussite</span></div><div class="s4"><b>90 %</b><span>Meilleur</span></div><div class="s4"><b>4</b><span>Jours joués</span></div></div>
  <div class="bouton" style="margin-top:22px">Rejouer</div>
</div>
'''

corps = f'''
{ep.scene("accroche", """
  <h1 class="titre-scene" style="top:240px">T’en<br/><span class="degrade">souviens-tu ?</span></h1>
  <div id="bulles"><span class="bq">?</span><span class="bq">?</span><span class="bq">?</span></div>
""")}
{ep.etape("tirees", 1, "Tes lectures")}
{ep.etape("types", 2, "Réponds")}
{ep.etape("reponse", 3, "Apprends")}
{ep.etape("resultat", 4, "Ton score")}
{telephone(ep, "tirees", ecrans)}
{ep.appel('Lance <span class="degrade">une partie</span>', 'Dix questions, rien que sur ce que tu as lu.')}
'''

css = """
#bulles { position: absolute; top: 700px; left: 0; right: 0; display: flex; justify-content: center; gap: 70px; }
.bq { width: 210px; height: 210px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: Lora, serif; font-size: 150px; color: var(--nuit); background: var(--or); opacity: 0; }
.bq:nth-child(2) { background: var(--violet); } .bq:nth-child(3) { background: #fff; }
.depart { background: #fff; border: 2px solid var(--app-bord); border-radius: 26px; padding: 34px; text-align: center; }
.depart .bouton { margin-top: 20px; } .depart .aide { font-size: 22px; color: var(--app-gris); margin-top: 12px; }
.mes-lect { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.mes-lect .lab { width: 100%; }
.q { position: absolute; top: 34px; left: 34px; right: 34px; opacity: 0; }
.q-prog { font-size: 21px; font-weight: 700; color: var(--violet-f); text-transform: uppercase; letter-spacing: 2px; }
.q-cons { font-size: 33px; font-weight: 700; margin-top: 10px; }
.q-vers { font-family: Lora, serif; font-style: italic; font-size: 29px; line-height: 1.45; color: #78350f; background: #fffbeb; border: 2px solid #fde68a; border-radius: 20px; padding: 22px; margin-top: 18px; }
.trou { font-style: normal; color: #b45309; letter-spacing: 2px; }
.q-choix { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 22px; }
.choix { font-size: 27px; font-weight: 600; text-align: center; padding: 26px 10px; border-radius: 20px; background: #fff; border: 3px solid var(--app-bord); color: var(--app-texte); }
.q-fin { font-size: 25px; font-weight: 700; margin-top: 20px; text-align: center; color: #047857; opacity: 0; }
.score { text-align: center; margin-top: 40px; } .score b { display: block; font-family: Lora, serif; font-size: 170px; color: var(--violet-f); line-height: 1; } .score span { font-size: 30px; color: var(--app-gris); }
.bravo { text-align: center; font-size: 36px; font-weight: 700; margin-top: 16px; }
.stats4 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 30px; }
.s4 { background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 18px; text-align: center; }
.s4 b { display: block; font-size: 42px; color: var(--bleu); } .s4 span { font-size: 21px; color: var(--app-gris); }
"""

TI, TY, RE, RS = S["tirees"], S["types"], S["reponse"], S["resultat"]
js = ep.js_commun(["tirees", "types", "reponse", "resultat"]) + f"""
const VERT = {{ backgroundColor: "#dcfce7", borderColor: "#22c55e", color: "#14532d", duration: 0.2 }};
const ROUGE = {{ backgroundColor: "#fee2e2", borderColor: "#ef4444", color: "#7f1d1d", duration: 0.2 }};
// 0. accroche
tl.fromTo("#sc-accroche h1", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.fromTo(".bq", {{ opacity: 0, scale: 0.4 }}, {{ opacity: 1, scale: 1, duration: 0.5, stagger: 0.35, ease: "back.out(2)" }}, 1.2);
tl.to(".bq", {{ y: -30, duration: 0.8, stagger: 0.2, yoyo: true, repeat: 3, ease: "sine.inOut" }}, 2.6);

// 1. départ : les lectures sont la matière
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {TI["debut"]});
tl.set("#p-acc", {{ opacity: 1 }}, {TI["debut"]});
tl.fromTo(".mes-lect .chip", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.3, stagger: 0.18, ease: E }}, {a("tirees", 1.8)});
tap(313, 511, {a("tirees", 5.6)});

// 2. trois questions, trois consignes
cache("#p-acc", {TY["debut"]});
tl.set("#p-q", {{ opacity: 1 }}, {TY["debut"]});
tl.to("#q1", {{ opacity: 1, duration: 0.3 }}, {TY["debut"] + 0.1});
tap(453, 523, {a("types", 1.4)});
tl.to("#q1c1", VERT, {a("types", 1.5)});
tl.to("#q1", {{ opacity: 0, duration: 0.25 }}, {a("types", 2.2)});
tl.to("#q2", {{ opacity: 1, duration: 0.3 }}, {a("types", 2.4)});
tl.to("#q2", {{ opacity: 0, duration: 0.25 }}, {a("types", 4.4)});
tl.to("#q3", {{ opacity: 1, duration: 0.3 }}, {a("types", 4.6)});
tap(453, 523, {a("types", 6.9)});
tl.to("#q3c1", VERT, {a("types", 7.0)});
tl.set("#q3-fin", {{ textContent: "Bonne réponse — c’était Jean 14:27" }}, {a("types", 7.1)});
tl.to("#q3-fin", {{ opacity: 1, duration: 0.25 }}, {a("types", 7.1)});

// 3. se tromper, et apprendre
tl.to("#q3", {{ opacity: 0, duration: 0.25 }}, {RE["debut"]});
tl.to("#q2", {{ opacity: 1, duration: 0.3 }}, {RE["debut"] + 0.2});
tap(167, 523, {a("reponse", 0.8)});
tl.to("#q2c0", ROUGE, {a("reponse", 0.9)});
tl.to("#q2c2", VERT, {a("reponse", 1.4)});
tl.set(".trou", {{ textContent: "berger" }}, {a("reponse", 1.4)});
tl.set("#q2-fin", {{ textContent: "C’était Psaumes 23:1" }}, {a("reponse", 1.8)});
tl.to("#q2-fin", {{ opacity: 1, duration: 0.25 }}, {a("reponse", 1.8)});
tl.fromTo("#q2-fin", {{ scale: 1 }}, {{ scale: 1.1, duration: 0.25, yoyo: true, repeat: 1 }}, {a("reponse", 2.2)});

// 4. résultat
tl.set("#p-q", {{ opacity: 0 }}, {RS["debut"]});
montre("#p-res", {RS["debut"] + 0.1});
tl.fromTo(".score b", {{ scale: 0.5 }}, {{ scale: 1, duration: 0.6, ease: "back.out(2)", immediateRender: false }}, {RS["debut"] + 0.4});
tl.fromTo(".s4", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.3, stagger: 0.25, ease: E }}, {a("resultat", 2.2)});
tl.to("#tel", {{ opacity: 0, y: 60, duration: 0.45 }}, {round(S["appel"]["debut"] - 0.45, 2)});
"""

ep.ecrire(corps, css, js)
