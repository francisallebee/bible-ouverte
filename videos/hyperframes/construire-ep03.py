"""Épisode 3 — Les plans de lecture, à plusieurs.
Usage : python3 construire-ep03.py ep03-plans"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S

CATALOGUE = [
    ("Le Nouveau Testament", "Les vingt-sept livres, de Matthieu à l’Apocalypse."),
    ("Un proverbe par jour", "Les trente et un chapitres des Proverbes."),
    ("Les Évangiles et les Psaumes", "Deux flux en parallèle, chaque jour."),
    ("Psaumes de confiance", "Huit psaumes quand la peur se rapproche."),
]
cartes = "".join(
    f'<div class="cat" id="cat{i}"><b>{n}</b><p>{d}</p><span class="demarrer">Démarrer</span></div>'
    for i, (n, d) in enumerate(CATALOGUE)
)
MEMBRES = [("M", "#e67e22", "Marie"), ("J", "#3498db", "Jean"), ("A", "#2ecc71", "Awa"), ("P", "#9b59b6", "Paul")]
avatars = "".join(f'<span class="av" id="av{i}" style="background:{c}">{l}</span>' for i, (l, c, _) in enumerate(MEMBRES))

ecrans = f'''
<div class="panneau" id="p-cat">
  <div class="app-h">Plans de lecture</div>
  <div class="app-sous">Plans proposés</div>
  {cartes}
</div>

<div class="panneau" id="p-creer">
  <div class="app-h">Créer un plan</div>
  <div class="app-sous" style="margin-bottom:18px">de lecture</div>
  <div class="champ"><div class="lab">Nom</div><div class="val">Les Évangiles</div></div>
  <div class="champ"><div class="lab">Type de plan</div><div class="chips"><span class="chip choisi">Daté</span><span class="chip">Libre</span></div></div>
  <div class="champ" id="c-livres"><div class="lab">Livres</div><div class="val"><span id="livres-vide" style="color:#94a3b8;font-weight:400">Tous les livres</span><span id="livres-plein" style="position:absolute;opacity:0;left:56px">Matthieu, Marc, Luc, Jean</span></div></div>
  <div class="champ"><div class="lab">Durée</div><div class="chips"><span class="chip" id="d0">1 mois</span><span class="chip" id="d1">3 mois</span><span class="chip" id="d2">6 mois</span><span class="chip" id="d3">1 an</span></div></div>
  <div class="champ" id="c-date"><div class="lab">Date de début</div><div class="val" id="date-val">—</div></div>
  <div class="bouton" id="b-creer">Créer le plan</div>
</div>

<div class="panneau" id="p-jour">
  <div style="display:flex;justify-content:space-between;align-items:center"><div class="app-h">Les Évangiles</div><span class="partager" id="b-partager">Partager</span></div>
  <div class="app-sous" id="prog-txt"><span id="prog-a">11/91 jours lus (12 %)</span><span id="prog-b" style="opacity:0;position:absolute;left:0;top:0">12/91 jours lus (13 %)</span></div>
  <div class="piste"><div id="prog-barre"></div></div>
  <div class="jour fait"><div><b>Jour 11</b><p>Matthieu 11</p></div><span class="ok">Lu</span></div>
  <div class="jour" id="j12"><div><b>Jour 12</b><p>Matthieu 12</p></div><span class="marquer" id="m12">Marquer comme lu</span><span class="ok" id="ok12" style="opacity:0;position:absolute;right:24px">Lu</span></div>
  <div class="jour"><div><b>Jour 13</b><p>Matthieu 13</p></div><span class="pas-encore">Pas encore lu</span></div>
</div>

<div class="panneau" id="p-partage">
  <div class="app-h">Partager ce plan</div>
  <p class="expl">Un plan partagé est un plan commun : cocher un jour le coche pour tout le monde. Chacun garde ses propres lectures et ses statistiques.</p>
  <div class="champ"><div class="lab">Par un lien</div>
    <p class="aide">À transmettre comme tu veux. Qui l’ouvre peut rejoindre le plan.</p>
    <div class="bouton" id="b-lien">Créer un lien</div>
    <div id="lien" style="opacity:0"><span class="url">bible-ouverte.vercel.app/invitation/…</span><span class="copier" id="copier">Copier</span></div>
  </div>
  <div class="champ" style="opacity:.55"><div class="lab">Par adresse courriel</div><div class="val" style="color:#94a3b8;font-weight:400">adresse@exemple.fr</div></div>
</div>

<div class="panneau" id="p-ensemble">
  <div class="app-h">Les Évangiles</div>
  <div class="app-sous">Membres</div>
  <div class="avs">{avatars}<span class="av-txt">4 lecteurs</span></div>
  <div class="jour fait" id="e13"><div><b>Jour 13</b><p>Matthieu 13</p></div><span class="lupar">Lu par Marie</span></div>
  <div class="jour fait" id="e14" style="opacity:0"><div><b>Jour 14</b><p>Matthieu 14</p></div><span class="lupar">Lu par Jean</span></div>
  <div class="aussi" id="aussi"><span id="aussi-a">Je l’ai lu aussi</span><span id="aussi-b" style="opacity:0;position:absolute;left:0;right:0">Tu l’as déjà enregistré</span></div>
</div>

<div id="toast" class="toast">Lien copié</div>
'''

corps = f'''
{ep.scene("accroche", """
  <h1 class="titre-scene" style="top:240px">Toute la Bible…</h1>
  <div id="gros"><b id="nb">1 189</b><span>chapitres</span></div>
  <div id="auj"><span>Aujourd’hui</span><b>Jean 3</b></div>
""")}
{ep.etape("catalogue", 1, "Un plan tout prêt")}
{ep.etape("creer", 2, "Ou le tien")}
{ep.etape("jour", 3, "Chaque jour")}
{ep.etape("partager", 4, "Partage-le")}
{ep.etape("ensemble", 5, "Lisez ensemble")}
{telephone(ep, "catalogue", ecrans)}
<div id="bulle" class="clip" data-start="{a("partager", 4.6)}" data-duration="{round(ep.fin("partager") - a("partager", 4.6), 2)}" data-track-index="3">
  <div class="msg"><div class="msg-qui">Groupe Bible-Ouverte.app</div>
  <div class="msg-txt">On lit les Évangiles ensemble en 3&nbsp;mois&#8239;? Rejoignez le plan&#8239;:</div>
  <div class="msg-lien"><b>Rejoindre « Les Évangiles »</b><span>bible-ouverte.vercel.app</span></div></div>
</div>
{ep.appel('Lisez <span class="degrade">ensemble</span>', 'Lance un plan, et partage le lien dans le groupe.')}
'''

css = """
#gros { position: absolute; top: 560px; left: 0; right: 0; text-align: center; }
#gros b { display: block; font-family: Lora, serif; font-size: 220px; color: var(--or); line-height: 1; }
#gros span { font-size: 48px; color: var(--t2); }
#auj { position: absolute; top: 1000px; left: 240px; right: 240px; padding: 40px; border-radius: 40px; background: #fff; color: var(--app-texte); text-align: center; box-shadow: 0 40px 80px -20px rgba(0,0,0,.6); opacity: 0; }
#auj span { display: block; font-size: 32px; color: var(--app-gris); font-weight: 600; }
#auj b { font-family: Lora, serif; font-size: 96px; color: var(--bleu); }
.cat { background: #fff; border: 2px solid var(--app-bord); border-radius: 22px; padding: 22px 24px; margin-bottom: 16px; position: relative; }
.cat b { font-size: 29px; } .cat p { font-size: 22px; color: var(--app-gris); margin-top: 6px; padding-right: 10px; }
.demarrer { display: inline-block; margin-top: 12px; font-size: 22px; font-weight: 700; color: #fff; background: var(--bleu); padding: 8px 18px; border-radius: 12px; }
.chip.choisi, .chip.sel { background: var(--bleu); color: #fff; }
#c-livres .val { position: relative; }
.partager { font-size: 24px; font-weight: 700; color: var(--bleu); background: #e8eef5; padding: 10px 18px; border-radius: 14px; }
.piste { height: 22px; border-radius: 11px; background: #e2e8f0; overflow: hidden; margin: -8px 0 22px; }
#prog-barre { height: 100%; width: 12%; background: var(--or); border-radius: 11px; }
#prog-txt { position: relative; }
.jour { background: #fff; border: 2px solid var(--app-bord); border-radius: 22px; padding: 20px 24px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; position: relative; }
.jour b { font-size: 28px; } .jour p { font-size: 23px; color: var(--app-gris); margin-top: 4px; }
.jour.fait { background: #f0fdf4; border-color: #bbf7d0; }
.ok { font-size: 24px; font-weight: 700; color: #047857; background: #dcfce7; padding: 10px 20px; border-radius: 14px; }
.marquer { font-size: 22px; font-weight: 700; color: #fff; background: var(--bleu); padding: 12px 18px; border-radius: 14px; }
.pas-encore { font-size: 22px; color: #94a3b8; }
.lupar { font-size: 22px; font-weight: 600; color: #047857; }
.expl { font-size: 24px; line-height: 1.45; color: var(--app-gris); margin: 14px 0 22px; }
.aide { font-size: 22px; color: var(--app-gris); margin-bottom: 14px; line-height: 1.4; }
#lien { display: flex; gap: 12px; align-items: center; margin-top: 14px; }
.url { flex: 1; font-size: 21px; background: #f1f5f9; border-radius: 12px; padding: 14px; color: var(--app-texte); white-space: nowrap; overflow: hidden; }
.copier { font-size: 22px; font-weight: 700; color: var(--bleu); background: #e8eef5; padding: 14px 18px; border-radius: 12px; }
.toast { position: absolute; left: 40px; right: 40px; bottom: 60px; background: #065f46; color: #fff; font-size: 28px; font-weight: 600; padding: 24px 28px; border-radius: 22px; opacity: 0; z-index: 25; text-align: center; }
.avs { display: flex; align-items: center; margin-bottom: 26px; }
.av { width: 76px; height: 76px; border-radius: 50%; border: 5px solid var(--app-fond); margin-left: -14px; color: #fff; font-weight: 700; font-size: 32px; display: flex; align-items: center; justify-content: center; }
.av:first-child { margin-left: 0; }
.av-txt { font-size: 26px; color: var(--app-gris); margin-left: 20px; font-weight: 600; }
.aussi { position: relative; margin-top: 10px; text-align: center; font-size: 28px; font-weight: 700; color: var(--bleu); border: 3px solid var(--bleu); border-radius: 22px; padding: 22px; }
#bulle { display: flex; justify-content: flex-end; align-items: flex-start; padding: 1040px 60px 0 0; }
.msg { width: 640px; background: #fff; color: var(--app-texte); border-radius: 34px 34px 8px 34px; padding: 28px 32px; box-shadow: 0 40px 80px -20px rgba(0,0,0,.65); }
.msg-qui { font-size: 24px; font-weight: 700; color: var(--violet-f); }
.msg-txt { font-size: 30px; line-height: 1.35; margin-top: 8px; }
.msg-lien { margin-top: 16px; border-left: 6px solid var(--or); background: #f8fafc; border-radius: 12px; padding: 16px 20px; }
.msg-lien b { display: block; font-size: 27px; color: var(--bleu); } .msg-lien span { font-size: 22px; color: var(--app-gris); }
"""

js = ep.js_commun(["catalogue", "creer", "jour", "partager", "ensemble"]) + f"""
// 0. accroche
tl.fromTo("#sc-accroche h1", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.fromTo("#gros", {{ opacity: 0, scale: 0.8 }}, {{ opacity: 1, scale: 1, duration: 0.8, ease: E }}, 0.9);
tl.to("#gros", {{ opacity: 0.18, scale: 0.85, duration: 0.6 }}, {a("accroche", 3.4)});
tl.fromTo("#auj", {{ opacity: 0, y: 80, scale: 0.9 }}, {{ opacity: 1, y: -180, scale: 1, duration: 0.8, ease: "back.out(1.4)" }}, {a("accroche", 3.6)});

// 1. catalogue
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {ep.debut("catalogue")});
tl.set("#p-cat", {{ opacity: 1 }}, {ep.debut("catalogue")});
[[0, 3.0], [1, 4.5], [2, 6.0]].forEach(([i, t]) => {{
  tl.to("#cat" + i, {{ borderColor: "#e9b949", boxShadow: "0 0 0 5px rgba(233,185,73,.35)", duration: 0.25 }}, {a("catalogue", 0)} + t);
  tl.to("#cat" + i, {{ borderColor: "#e2e8f0", boxShadow: "0 0 0 0 rgba(233,185,73,0)", duration: 0.3 }}, {a("catalogue", 0)} + t + 1.3);
}});

// 2. créer
cache("#p-cat", {ep.debut("creer")});
montre("#p-creer", {ep.debut("creer") + 0.2});
tap(330, 470, {a("creer", 1.2)});
tl.to("#livres-vide", {{ opacity: 0, duration: 0.2 }}, {a("creer", 1.4)});
tl.to("#livres-plein", {{ opacity: 1, duration: 0.3 }}, {a("creer", 1.4)});
tl.set("#livres-plein", {{ position: "static" }}, {a("creer", 1.45)});
tl.set("#livres-vide", {{ display: "none" }}, {a("creer", 1.45)});
["#d0", "#d3", "#d1"].forEach((id, k) => {{
  tl.to(id, {{ backgroundColor: "#1e3a5f", color: "#ffffff", duration: 0.15 }}, {a("creer", 2.4)} + k * 0.55);
  if (k < 2) tl.to(id, {{ backgroundColor: "#eef2f7", color: "#1e3a5f", duration: 0.15 }}, {a("creer", 2.4)} + k * 0.55 + 0.45);
}});
tl.set("#date-val", {{ textContent: "Lundi prochain" }}, {a("creer", 4.2)});
tl.fromTo("#c-date", {{ backgroundColor: "#fff7d6" }}, {{ backgroundColor: "#ffffff", duration: 1.0 }}, {a("creer", 4.2)});
tap(325, 1030, {a("creer", 5.0)});

// 3. un jour
cache("#p-creer", {ep.debut("jour")});
montre("#p-jour", {ep.debut("jour") + 0.2});
tl.fromTo("#j12", {{ boxShadow: "0 0 0 0 rgba(233,185,73,0)" }}, {{ boxShadow: "0 0 0 6px rgba(233,185,73,.45)", duration: 0.4, yoyo: true, repeat: 1 }}, {a("jour", 1.0)});
tap(500, 486, {a("jour", 2.3)});
tl.to("#m12", {{ opacity: 0, duration: 0.15 }}, {a("jour", 2.45)});
tl.to("#ok12", {{ opacity: 1, duration: 0.25 }}, {a("jour", 2.45)});
tl.to("#j12", {{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", duration: 0.25 }}, {a("jour", 2.45)});
tl.to("#prog-a", {{ opacity: 0, duration: 0.2 }}, {a("jour", 3.0)});
tl.to("#prog-b", {{ opacity: 1, duration: 0.3 }}, {a("jour", 3.0)});
tl.to("#prog-barre", {{ width: "13.2%", duration: 0.8, ease: E }}, {a("jour", 3.0)});

// 4. partager
tap(520, 165, {a("partager", 1.8)});
cache("#p-jour", {a("partager", 2.1)});
montre("#p-partage", {a("partager", 2.3)});
tap(313, 525, {a("partager", 3.4)});
tl.to("#b-lien", {{ opacity: 0.35, duration: 0.2 }}, {a("partager", 3.6)});
tl.to("#lien", {{ opacity: 1, duration: 0.3 }}, {a("partager", 3.6)});
tap(530, 610, {a("partager", 4.2)});
tl.set("#copier", {{ textContent: "Copié" }}, {a("partager", 4.3)});
tl.fromTo("#toast", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.3 }}, {a("partager", 4.3)});
tl.to("#toast", {{ opacity: 0, duration: 0.3 }}, {a("partager", 5.6)});
tl.to("#tel", {{ x: -110, scale: 0.92, duration: 0.6, ease: "power2.inOut" }}, {a("partager", 4.4)});
tl.fromTo("#bulle .msg", {{ opacity: 0, y: 80, scale: 0.9 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.4)" }}, {a("partager", 4.6)});

// 5. ensemble
tl.to("#tel", {{ x: 0, scale: 1, duration: 0.6, ease: "power2.inOut" }}, {ep.debut("ensemble")});
cache("#p-partage", {ep.debut("ensemble")});
montre("#p-ensemble", {ep.debut("ensemble") + 0.2});
[0, 1, 2, 3].forEach((i) => tl.fromTo("#av" + i, {{ scale: 0 }}, {{ scale: 1, duration: 0.35, ease: "back.out(2.5)" }}, {ep.debut("ensemble")} + 0.6 + i * 0.18));
tl.fromTo("#e13", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: E }}, {a("ensemble", 2.4)});
tl.fromTo("#e14", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: E }}, {a("ensemble", 4.0)});
tap(313, 770, {a("ensemble", 6.6)});
tl.to("#aussi-a", {{ opacity: 0, duration: 0.15 }}, {a("ensemble", 6.75)});
tl.to("#aussi-b", {{ opacity: 1, duration: 0.25 }}, {a("ensemble", 6.75)});
tl.to("#aussi", {{ backgroundColor: "#f0fdf4", borderColor: "#6ee7b7", color: "#047857", duration: 0.25 }}, {a("ensemble", 6.75)});
tl.to("#tel", {{ opacity: 0, y: 60, duration: 0.45 }}, {round(ep.debut("appel") - 0.45, 2)});
"""

ep.ecrire(corps, css, js)
