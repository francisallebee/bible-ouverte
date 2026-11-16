"""Épisode 7 — Le verset du jour et les rappels.
Usage : python3 construire-ep07.py ep07-verset-du-jour

Textes des notifications repris de supabase/functions/send-notifications/schedule.ts.
"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S

ecrans = '''
<div class="panneau" id="p-verset">
  <div class="app-h">Verset du jour</div>
  <div class="app-sous">Un verset tiré de tes lectures, le même toute la journée.</div>
  <div class="carte-verset">
    <div class="vj-lab">Aujourd’hui</div>
    <div class="vj-txt">« L’Eternel est mon berger : je ne manquerai de rien. »</div>
    <div class="vj-ref">Psaumes 23:1 · Louis Segond 1910</div>
  </div>
  <div class="bouton" id="b-lu"><span id="lu-a">J’ai lu ce verset</span><span id="lu-b" style="opacity:0;position:absolute;left:0;right:0">Lu aujourd’hui ✓</span></div>
  <div class="aide" id="aj">Il sera ajouté à tes lectures, contexte « Bible ».</div>
  <div class="stats"><div class="st-c"><b id="sj">11</b><span>Jours suivis</span></div><div class="st-c"><b id="sv">11</b><span>Versets lus</span></div></div>
</div>

<div class="panneau" id="p-notif">
  <div class="app-h">Notifications</div>
  <div class="app-sous">Réglages</div>
  <div class="bouton" id="b-autoriser">Autoriser les notifications</div>
  <div class="lab" style="margin:22px 0 10px">Ce qui déclenche une notification</div>
  <div class="trig" id="tr-daily"><div><b>Rappel quotidien</b><p>À l’heure de ton choix, pour ne pas oublier ta lecture.</p><div class="heure" id="heure">À <span id="h-val">07:30</span></div></div><span class="bascule" id="bs-daily"><i></i></span></div>
  <div class="trig" id="tr-plan"><div><b>Plan de lecture en retard</b><p>Quand un jour prévu n’a pas été coché.</p></div><span class="bascule" id="bs-plan"><i></i></span></div>
  <div class="trig"><div><b>Anniversaire</b><p>Le jour de ton anniversaire.</p></div><span class="bascule"><i></i></span></div>
</div>

<div id="permission"><b>« Bible Ouverte » souhaite vous envoyer des notifications</b><div class="perm-btns"><span>Refuser</span><span id="perm-ok">Autoriser</span></div></div>
'''

corps = f'''
{ep.scene("accroche", """
  <div id="verrou">
    <div id="heure-v">7:30</div>
    <div id="date-v">Chaque matin</div>
    <div class="notif" id="n1"><img src="assets/img/icon-512.png"/><div><b>Bible Ouverte</b><p>C’est l’heure de ta lecture du jour.</p></div></div>
  </div>
""")}
{ep.etape("verset", 1, "Ton verset du jour")}
{ep.etape("lu", 2, "Lu !")}
{ep.etape("rappel", 3, "Ton rappel")}
{ep.etape("autres", 4, "Et ton plan")}
{telephone(ep, "verset", ecrans)}
<div id="n-plan" class="clip" data-start="{a("autres", 0.6)}" data-duration="{round(ep.fin("autres") - a("autres", 0.6), 2)}" data-track-index="3">
  <div class="notif" id="n2"><img src="assets/img/icon-512.png"/><div><b>Les Évangiles</b><p>Une lecture de ton plan attend depuis hier.</p></div></div>
  <div class="ios" id="ios"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><rect x="4" y="11" width="16" height="10" rx="2"/></svg>Sur iPhone : Partager → « Sur l’écran d’accueil »</div>
</div>
{ep.appel('Un verset <span class="degrade">chaque jour</span>', 'Active ton rappel dans les Réglages.')}
'''

css = """
#verrou { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; }
#heure-v { margin-top: 300px; font-size: 230px; font-weight: 300; letter-spacing: -6px; color: #fff; line-height: 1; opacity: 0; }
#date-v { font-size: 46px; color: var(--t2); margin-top: 10px; opacity: 0; }
.notif { display: flex; gap: 24px; align-items: center; width: 900px; padding: 30px 34px; border-radius: 40px; background: rgba(255,255,255,.92); color: #0f172a; box-shadow: 0 40px 80px -20px rgba(0,0,0,.6); }
.notif img { width: 96px; height: 96px; border-radius: 24px; }
.notif b { font-size: 36px; } .notif p { font-size: 34px; color: #334155; margin-top: 4px; }
#n1 { margin-top: 120px; opacity: 0; }
.carte-verset { background: linear-gradient(160deg, #fffbeb, #fef3c7); border: 2px solid #fde68a; border-radius: 26px; padding: 34px 30px; margin-bottom: 20px; }
.vj-lab { font-size: 21px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 3px; }
.vj-txt { font-family: Lora, serif; font-style: italic; font-size: 40px; line-height: 1.4; color: #78350f; margin-top: 16px; }
.vj-ref { font-size: 23px; color: #92400e; margin-top: 16px; font-weight: 600; }
#b-lu { position: relative; }
.aide { font-size: 22px; color: var(--app-gris); margin-top: 12px; text-align: center; opacity: 0; }
.stats { display: flex; gap: 16px; margin-top: 22px; }
.st-c { flex: 1; background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 18px; text-align: center; }
.st-c b { display: block; font-family: Lora, serif; font-size: 58px; color: var(--bleu); line-height: 1.1; }
.st-c span { font-size: 21px; color: var(--app-gris); }
.trig { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 18px 22px; margin-bottom: 12px; }
.trig b { font-size: 25px; } .trig p { font-size: 20px; color: var(--app-gris); margin-top: 4px; line-height: 1.35; }
.heure { margin-top: 10px; font-size: 24px; font-weight: 600; color: var(--app-gris); opacity: .4; }
.heure span { display: inline-block; background: #f1f5f9; border-radius: 10px; padding: 6px 14px; color: var(--app-texte); }
.bascule { width: 84px; height: 48px; border-radius: 24px; background: #cbd5e1; position: relative; flex-shrink: 0; }
.bascule i { position: absolute; top: 5px; left: 5px; width: 38px; height: 38px; border-radius: 50%; background: #fff; }
#permission { position: absolute; left: 60px; right: 60px; top: 380px; background: #f8fafc; border-radius: 28px; padding: 30px; z-index: 14; text-align: center; box-shadow: 0 30px 80px -10px rgba(15,23,42,.5); opacity: 0; color: var(--app-texte); }
#permission b { font-size: 26px; line-height: 1.35; display: block; }
.perm-btns { display: flex; gap: 12px; margin-top: 22px; } .perm-btns span { flex: 1; padding: 16px; border-radius: 16px; background: #e2e8f0; font-size: 24px; font-weight: 600; }
#perm-ok { background: var(--bleu) !important; color: #fff; }
#n-plan { display: flex; flex-direction: column; align-items: center; padding-top: 1300px; gap: 26px; }
#n2 { opacity: 0; }
.ios { display: flex; align-items: center; gap: 18px; font-size: 34px; font-weight: 600; color: #fff; padding: 18px 30px; border-radius: 999px; background: rgba(255,255,255,.1); border: 1px solid var(--bord); opacity: 0; }
"""

V, L, R, AU = S["verset"], S["lu"], S["rappel"], S["autres"]
js = ep.js_commun(["verset", "lu", "rappel", "autres"]) + f"""
// 0. accroche : l'écran verrouillé, la notification du matin
tl.fromTo("#heure-v", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.8, ease: E }}, 0.2);
tl.to("#date-v", {{ opacity: 1, duration: 0.6 }}, 0.7);
tl.fromTo("#n1", {{ opacity: 0, y: -80, scale: 0.95 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.5)" }}, {a("accroche", 3.4)});

// 1. le verset
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {V["debut"]});
tl.set("#p-verset", {{ opacity: 1 }}, {V["debut"]});
tl.fromTo(".carte-verset", {{ opacity: 0, scale: 0.92 }}, {{ opacity: 1, scale: 1, duration: 0.7, ease: E }}, {V["debut"] + 0.5});
tl.fromTo(".vj-ref", {{ backgroundColor: "rgba(233,185,73,0)" }}, {{ backgroundColor: "rgba(233,185,73,.4)", duration: 0.4, yoyo: true, repeat: 1 }}, {a("verset", 1.8)});

// 2. lu
tl.to(".aide", {{ opacity: 1, duration: 0.3 }}, {L["debut"]});
tap(313, 610, {a("lu", 1.5)});
tl.to("#lu-a", {{ opacity: 0, duration: 0.15 }}, {a("lu", 1.65)});
tl.to("#lu-b", {{ opacity: 1, duration: 0.25 }}, {a("lu", 1.65)});
tl.to("#b-lu", {{ backgroundColor: "#047857", duration: 0.25 }}, {a("lu", 1.65)});
tl.set("#sj", {{ textContent: "12" }}, {a("lu", 3.6)});
tl.set("#sv", {{ textContent: "12" }}, {a("lu", 3.8)});
tl.fromTo(".st-c b", {{ scale: 1.4 }}, {{ scale: 1, duration: 0.45, stagger: 0.2, ease: "back.out(2)", immediateRender: false }}, {a("lu", 3.6)});

// 3. rappel
cache("#p-verset", {R["debut"]});
montre("#p-notif", {R["debut"] + 0.2});
tap(313, 330, {a("rappel", 1.4)});
tl.fromTo("#permission", {{ opacity: 0, scale: 0.9 }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: E }}, {a("rappel", 1.6)});
tap(440, 530, {a("rappel", 2.9)});
tl.to("#permission", {{ opacity: 0, duration: 0.25 }}, {a("rappel", 3.1)});
tl.to("#b-autoriser", {{ opacity: 0.4, duration: 0.2 }}, {a("rappel", 3.1)});
tl.to("#bs-daily", {{ backgroundColor: "#2ecc71", duration: 0.2 }}, {a("rappel", 3.8)});
tl.to("#bs-daily i", {{ x: 36, duration: 0.2 }}, {a("rappel", 3.8)});
tl.to("#heure", {{ opacity: 1, duration: 0.3 }}, {a("rappel", 4.0)});
tl.fromTo("#h-val", {{ backgroundColor: "#f1f5f9" }}, {{ backgroundColor: "#fde68a", duration: 0.3, yoyo: true, repeat: 1 }}, {a("rappel", 4.8)});

// 4. plan en retard + iPhone
tl.to("#bs-plan", {{ backgroundColor: "#2ecc71", duration: 0.2 }}, {a("autres", 0.3)});
tl.to("#bs-plan i", {{ x: 36, duration: 0.2 }}, {a("autres", 0.3)});
tl.to("#tel", {{ y: -120, scale: 0.86, duration: 0.6, ease: "power2.inOut" }}, {a("autres", 0.4)});
tl.fromTo("#n2", {{ opacity: 0, y: -40 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" }}, {a("autres", 0.8)});
tl.fromTo("#ios", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: E }}, {a("autres", 4.6)});
tl.to("#tel", {{ opacity: 0, duration: 0.45 }}, {round(S["appel"]["debut"] - 0.45, 2)});
"""

ep.ecrire(corps, css, js)
