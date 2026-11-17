"""Épisode 12 — Ta voix compte : Messages, Support & Suggestions, Feuille de route.
Usage : python3 construire-ep12.py ep12-ta-voix

Libellés repris de fr.ts › messages, support, roadmap. Les éléments de feuille de
route marqués « Terminé » sont des fonctionnalités réellement livrées (partage de
plan, texte original, cinq langues) ; le reste est un exemple, sans promesse.
"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S

ecrans = '''
<div class="panneau" id="p-msg">
  <div class="app-h">Messages</div>
  <div class="ongl"><span class="chip sel">Actifs</span><span class="chip">Archivés</span></div>
  <div class="msg" id="m1"><div class="m-h"><b>Bible Ouverte</b><span class="nonlu" id="nonlu">Non lu</span></div>
    <p class="m-suj">Merci pour ta réponse au sondage !</p>
    <p class="m-txt">Une série de vidéos arrive pour montrer chaque fonction de l’application. Dis-nous laquelle tu attends.</p></div>
  <div class="msg toi" id="m2"><div class="m-h"><b>Toi</b></div><p class="m-txt">Les plans de lecture, pour mon groupe de maison !</p></div>
  <div class="ecrire" id="ecrire"><span class="ph" id="ph">Écris ton message…</span><span class="frappe" id="fr">Les plans de lecture, pour mon groupe de maison !</span><span class="bouton mini">Répondre</span></div>
</div>

<div class="panneau" id="p-sup">
  <div class="app-h">Support &amp; Suggestions</div>
  <div class="app-sous">Signale un bug ou propose une amélioration</div>
  <div class="form" id="form">
    <div class="types"><span class="chip" id="t-bug">Bug</span><span class="chip" id="t-sug">Suggestion</span></div>
    <div class="champ" style="margin:12px 0 10px"><div class="lab">Message</div><div class="val" style="font-size:24px;font-weight:400"><span class="ph2" id="ph2">Décris ton idée d’amélioration…</span><span class="frappe" id="fr2">Pouvoir écouter la Bible en audio</span></div></div>
    <div class="bouton" id="b-env">Envoyer</div>
  </div>
  <div class="ticket" id="tk"><div class="m-h"><b>Suggestion · Awa</b><span class="rep" id="rep">0 réponse</span></div>
    <p class="m-txt">Pouvoir écouter la Bible en audio</p>
    <div class="com" id="c1"><b>Jean</b> Oui, pour le trajet en voiture !</div>
    <div class="com admin" id="c2"><b>Admin</b> Merci, c’est noté. On en parle dans la feuille de route.</div></div>
</div>

<div class="panneau" id="p-route">
  <div class="app-h">Feuille de route</div>
  <div class="item"><div><b>Partager un plan de lecture</b><p>Lire à plusieurs, par un lien</p></div><span class="statut done">Terminé</span></div>
  <div class="item"><div><b>Texte original hébreu et grec</b><p>Avec le lexique Strong</p></div><span class="statut done">Terminé</span></div>
  <div class="item"><div><b>Cinq langues</b><p>Français, anglais, espagnol, italien, arabe</p></div><span class="statut done">Terminé</span></div>
  <div class="item" id="it-x"><div><b>Ta prochaine idée ?</b><p>Propose-la dans Support &amp; Suggestions</p></div><span class="statut projet" id="st-x">Projet</span></div>
</div>
'''

corps = f'''
{ep.scene("accroche", """
  <h1 class="titre-scene" style="top:240px">Ta voix<br/><span class="degrade">compte</span></h1>
  <div id="trois"><div class="tr"><b>Messages</b></div><div class="tr"><b>Support</b></div><div class="tr"><b>Feuille de route</b></div></div>
""")}
{ep.etape("messages", 1, "Messages")}
{ep.etape("support", 2, "Support &amp; idées")}
{ep.etape("feuille", 3, "Feuille de route")}
{telephone(ep, "messages", ecrans)}
<div id="notif-route" class="clip" data-start="{a("feuille", 5.4)}" data-duration="{round(ep.fin("feuille") - a("feuille", 5.4), 2)}" data-track-index="3">
  <div class="notif"><img src="assets/img/icon-512.png"/><div><b>Feuille de route</b><p>« Partager un plan de lecture » est disponible.</p></div></div>
</div>
{ep.appel('Écris-<span class="degrade">nous</span>', 'Une idée, un souci ? C’est comme ça que l’application avance.')}
'''

css = """
#trois { position: absolute; top: 700px; left: 110px; right: 110px; display: flex; flex-direction: column; gap: 26px; }
.tr { padding: 34px 40px; border-radius: 30px; background: rgba(255,255,255,.07); border: 1px solid var(--bord); font-size: 50px; opacity: 0; }
.tr b { font-weight: 600; }
.ongl { display: flex; gap: 10px; margin: 14px 0 16px; } .chip.sel { background: var(--bleu); color: #fff; }
.msg { background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 18px 20px; margin-bottom: 12px; }
.msg.toi { background: #eef2ff; border-color: #c7d2fe; margin-left: 60px; opacity: 0; }
.m-h { display: flex; justify-content: space-between; align-items: center; } .m-h b { font-size: 24px; }
.nonlu { font-size: 18px; font-weight: 700; color: #fff; background: #ef4444; padding: 4px 12px; border-radius: 999px; }
.m-suj { font-size: 24px; font-weight: 700; margin-top: 8px; } .m-txt { font-size: 22px; color: #475569; line-height: 1.4; margin-top: 6px; }
.ecrire { position: relative; display: flex; align-items: center; gap: 10px; background: #fff; border: 2px solid var(--app-bord); border-radius: 18px; padding: 12px 14px; font-size: 21px; min-height: 76px; }
.ph { color: #94a3b8; flex: 1; }
.frappe { position: absolute; left: 14px; top: 24px; overflow: hidden; white-space: nowrap; width: 0; max-width: 380px; }
.mini { font-size: 20px; padding: 10px 14px; margin-left: auto; }
.types { display: flex; gap: 10px; }
.ph2 { color: #94a3b8; }
#fr2 { position: static; display: inline-block; vertical-align: bottom; }
.ticket { background: #fff; border: 2px solid var(--app-bord); border-radius: 20px; padding: 18px 20px; margin-top: 16px; opacity: 0; }
.rep { font-size: 19px; color: var(--app-gris); }
.com { font-size: 20px; color: #475569; background: #f8fafc; border-radius: 12px; padding: 10px 12px; margin-top: 8px; opacity: 0; }
.com b { color: var(--app-texte); margin-right: 6px; } .com.admin { background: #ecfdf5; }
.item { display: flex; justify-content: space-between; align-items: center; gap: 12px; background: #fff; border: 2px solid var(--app-bord); border-radius: 18px; padding: 16px 18px; margin-top: 12px; opacity: 0; }
.item b { font-size: 23px; } .item p { font-size: 19px; color: var(--app-gris); margin-top: 3px; }
.statut { font-size: 18px; font-weight: 700; padding: 6px 12px; border-radius: 999px; white-space: nowrap; }
.statut.done { background: #dcfce7; color: #166534; } .statut.projet { background: #f1f5f9; color: #475569; }
#notif-route { display: flex; justify-content: center; align-items: flex-start; padding-top: 1420px; }
.notif { display: flex; gap: 22px; align-items: center; width: 900px; padding: 26px 30px; border-radius: 36px; background: rgba(255,255,255,.94); color: #0f172a; box-shadow: 0 40px 80px -20px rgba(0,0,0,.6); opacity: 0; }
.notif img { width: 86px; height: 86px; border-radius: 22px; } .notif b { font-size: 32px; } .notif p { font-size: 30px; color: #334155; margin-top: 4px; }
"""

M, SU, F = S["messages"], S["support"], S["feuille"]
js = ep.js_commun(["messages", "support", "feuille"]) + f"""
// 0. accroche
tl.fromTo("#sc-accroche h1", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.fromTo(".tr", {{ opacity: 0, x: -60 }}, {{ opacity: 1, x: 0, duration: 0.5, stagger: 0.35, ease: E }}, 2.0);

// 1. messages
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {M["debut"]});
tl.set("#p-msg", {{ opacity: 1 }}, {M["debut"]});
tl.fromTo("#nonlu", {{ scale: 1 }}, {{ scale: 1.25, duration: 0.2, yoyo: true, repeat: 3 }}, {a("messages", 5.4)});
tl.to("#ph", {{ opacity: 0, duration: 0.1 }}, {a("messages", 2.8)});
tl.to("#fr", {{ width: 380, duration: 1.4, ease: "steps(30)" }}, {a("messages", 2.8)});
tap(540, 470, {a("messages", 4.4)});
tl.to("#ecrire", {{ opacity: 0, duration: 0.2 }}, {a("messages", 4.6)});
tl.fromTo("#m2", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.35, ease: E }}, {a("messages", 4.6)});
tl.to("#nonlu", {{ opacity: 0, duration: 0.3 }}, {a("messages", 6.8)});

// 2. support
cache("#p-msg", {SU["debut"]});
montre("#p-sup", {SU["debut"] + 0.2});
tl.to("#t-sug", {{ backgroundColor: "#1e3a5f", color: "#ffffff", duration: 0.2 }}, {a("support", 2.6)});
tl.to("#ph2", {{ opacity: 0, duration: 0.1 }}, {a("support", 3.2)});
tl.set("#ph2", {{ display: "none" }}, {a("support", 3.25)});
tl.to("#fr2", {{ width: 400, duration: 1.2, ease: "steps(32)" }}, {a("support", 3.3)});
tap(313, 470, {a("support", 4.8)});
tl.to("#form", {{ opacity: 0.35, duration: 0.25 }}, {a("support", 5.0)});
tl.fromTo("#tk", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: E }}, {a("support", 5.0)});
tl.fromTo("#c1", {{ opacity: 0, y: 15 }}, {{ opacity: 1, y: 0, duration: 0.3 }}, {a("support", 6.2)});
tl.set("#rep", {{ textContent: "1 réponse" }}, {a("support", 6.2)});
tl.fromTo("#c2", {{ opacity: 0, y: 15 }}, {{ opacity: 1, y: 0, duration: 0.3 }}, {a("support", 8.0)});
tl.set("#rep", {{ textContent: "2 réponses" }}, {a("support", 8.0)});

// 3. feuille de route
cache("#p-sup", {F["debut"]});
montre("#p-route", {F["debut"] + 0.2});
tl.fromTo(".item", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.3, stagger: 0.3, ease: E }}, {F["debut"] + 0.6});
tl.to("#tel", {{ y: -90, scale: 0.9, duration: 0.6, ease: "power2.inOut" }}, {a("feuille", 5.0)});
tl.fromTo("#notif-route .notif", {{ opacity: 0, y: -40 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" }}, {a("feuille", 5.4)});
tl.to("#tel", {{ opacity: 0, duration: 0.45 }}, {round(S["appel"]["debut"] - 0.45, 2)});
"""

ep.ecrire(corps, css, js)
