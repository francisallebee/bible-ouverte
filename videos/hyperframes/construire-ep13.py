"""Épisode 13 — Les réglages : langue, apparence, versions, hors ligne.
Usage : python3 construire-ep13.py ep13-reglages

Tenu au code : cinq langues (i18n/locales.ts, avec leurs titres « Réglages »
réels), thèmes clair/sombre/système, chartes (fr.ts › colorThemes), poids des
versions (features/bible/import.ts › VERSIONS, en Mio comme formaterOctets),
synchronisation au retour du réseau (page d'accueil, AGENTS.md).
"""
import pathlib
import sys

from commun import Episode, telephone

ep = Episode(pathlib.Path(sys.argv[1]))
a, S = ep.a, ep.S

LANGUES = [("fr", "Français", "Réglages"), ("en", "English", "Settings"), ("es", "Español", "Ajustes"), ("it", "Italiano", "Impostazioni"), ("ar", "العربية", "الإعدادات")]
langues = "".join(f'<div class="lg" id="lg-{c}"><span class="rad"></span>{n}</div>' for c, n, _ in LANGUES)
CHARTES = [("Marine", "#1e3a5f"), ("Rubis", "#b91c1c"), ("Turquoise", "#0d9488"), ("Indigo", "#4f46e5"), ("Forêt", "#166534"), ("Ocre", "#b45309")]
chartes = "".join(f'<span class="ch" id="ch{i}" style="background:{c}" title="{n}"></span>' for i, (n, c) in enumerate(CHARTES))
VERSIONS = [("Louis Segond 1910", "6,5 Mio", True, "Par défaut"), ("Bible Darby 1885", "6,8 Mio", False, ""), ("King James 1611", "6,4 Mio", False, ""), ("Smith & Van Dyck 1865", "9,6 Mio", False, "")]
versions = "".join(
    f'<div class="vr" id="vr{i}"><div><b>{n}</b><p>{p}{" · " + d if d else ""}</p></div><span class="bascule{" on" if on else ""}" id="bv{i}"><i></i></span></div>'
    for i, (n, p, on, d) in enumerate(VERSIONS)
)

ecrans = f'''
<div class="panneau" id="p-reg" style="opacity:1">
 <div id="defile">
  <div class="app-h" id="titre-reg">Réglages</div>
  <div class="sect" id="s-langue"><div class="lab">Langue</div><div class="lgs">{langues}</div></div>
  <div class="sect" id="s-theme"><div class="lab">Thème</div>
    <div class="themes"><span class="th" id="th-clair">Clair</span><span class="th" id="th-sombre">Sombre</span><span class="th sel" id="th-sys">Système</span></div>
    <div class="lab" style="margin-top:16px">Charte graphique</div><div class="chartes">{chartes}</div>
    <div class="lab" style="margin-top:16px">Taille du texte biblique</div>
    <div class="taille"><span class="a1">A</span><div class="curseur-t"><i id="pouce"></i></div><span class="a2">A</span></div>
    <div class="apercu-t" id="apercu">Car Dieu a tant aimé le monde qu’il a donné son Fils unique.</div>
  </div>
  <div class="sect" id="s-vers"><div class="lab">Versions bibliques</div>
    <p class="aide">Une version activée est téléchargée sur cet appareil pour la lecture hors ligne. La désactiver libère cette place.</p>
    {versions}
    <div class="memoire"><div class="lab" style="margin:0">Mémoire occupée</div><div class="m-piste"><i id="m-barre"></i></div><p id="m-txt">6,5 Mio occupés sur cet appareil.</p></div>
  </div>
 </div>
</div>
'''

corps = f'''
{ep.scene("accroche", """
  <h1 class="titre-scene" style="top:240px">À ton<br/><span class="degrade">image</span></h1>
  <svg id="roue" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="#e9b949" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
""")}
{ep.etape("langue", 1, "Ta langue")}
{ep.etape("apparence", 2, "Ton apparence")}
{ep.etape("versions", 3, "Tes versions")}
{ep.etape("horsligne", 4, "Hors ligne")}
{telephone(ep, "langue", ecrans)}
<div id="sync" class="clip" data-start="{ep.debut("horsligne")}" data-duration="{S["horsligne"]["duree"]}" data-track-index="3">
  <div class="etat" id="etat-off"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="0.8" fill="#fbbf24"/><path d="M3 3l18 18"/></svg>Sans réseau : tu lis, tu notes</div>
  <div class="appareils"><div class="ap tel-mini"><b>Psaumes 121</b><span id="badge-a">en attente</span></div><svg id="fleche" width="160" height="60" viewBox="0 0 160 60"><path d="M10 30 H140 M120 12 L142 30 L120 48" fill="none" stroke="#2ecc71" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="ap ordi"><b>Psaumes 121</b><span id="badge-b">synchronisé</span></div></div>
  <div class="etat" id="etat-on"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round"><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="0.8" fill="#2ecc71"/><path d="M2 9a15 15 0 0 1 20 0"/></svg>Le réseau revient : tout se synchronise</div>
</div>
{ep.appel('Emporte la Parole <span class="degrade">partout</span>', 'Cinq langues, quinze versions, hors ligne.')}
'''

css = """
@font-face { font-family: 'Noto Naskh Arabic'; src: url(assets/fonts/noto-naskh-arabic-arabic-500-normal.woff2); font-weight: 500; }
#roue { position: absolute; left: 390px; top: 720px; opacity: 0; }
#defile { position: absolute; top: 34px; left: 34px; right: 34px; }
#titre-reg { font-family: Inter, 'Noto Naskh Arabic', sans-serif; }
.sect { background: #fff; border: 2px solid var(--app-bord); border-radius: 22px; padding: 18px 20px; margin-top: 16px; }
.lgs { display: flex; flex-direction: column; gap: 8px; }
.lg { display: flex; align-items: center; gap: 14px; font-size: 26px; font-weight: 600; padding: 10px 12px; border-radius: 14px; font-family: Inter, 'Noto Naskh Arabic', sans-serif; }
.rad { width: 26px; height: 26px; border-radius: 50%; border: 3px solid #cbd5e1; }
.lg.sel { background: #e8eef5; } .lg.sel .rad { border: 8px solid var(--bleu); }
.themes { display: flex; gap: 10px; } .th { flex: 1; text-align: center; font-size: 23px; font-weight: 600; padding: 14px 0; border-radius: 14px; background: #f1f5f9; color: #475569; }
.th.sel { background: var(--bleu); color: #fff; }
.chartes { display: flex; gap: 14px; } .ch { width: 60px; height: 60px; border-radius: 50%; border: 4px solid #fff; box-shadow: 0 0 0 2px #e2e8f0; }
.taille { display: flex; align-items: center; gap: 16px; } .a1 { font-size: 20px; } .a2 { font-size: 36px; }
.curseur-t { flex: 1; height: 8px; border-radius: 4px; background: #e2e8f0; position: relative; } .curseur-t i { position: absolute; top: -12px; left: 40%; width: 32px; height: 32px; border-radius: 50%; background: var(--bleu); }
.apercu-t { font-family: Lora, serif; font-size: 26px; line-height: 1.45; color: #78350f; background: #fffbeb; border-radius: 14px; padding: 14px; margin-top: 14px; }
.aide { font-size: 20px; color: var(--app-gris); line-height: 1.4; margin-bottom: 10px; }
.vr { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid #f1f5f9; }
.vr b { font-size: 23px; } .vr p { font-size: 19px; color: var(--app-gris); margin-top: 2px; }
.bascule { width: 76px; height: 44px; border-radius: 22px; background: #cbd5e1; position: relative; flex-shrink: 0; }
.bascule i { position: absolute; top: 5px; left: 5px; width: 34px; height: 34px; border-radius: 50%; background: #fff; }
.bascule.on { background: #2ecc71; } .bascule.on i { left: 37px; }
.memoire { margin-top: 12px; background: #f8fafc; border-radius: 14px; padding: 14px; }
.m-piste { height: 14px; border-radius: 7px; background: #e2e8f0; overflow: hidden; margin: 10px 0 8px; } .m-piste i { display: block; height: 100%; width: 6%; background: var(--bleu); }
.memoire p { font-size: 19px; color: var(--app-gris); }
#sync { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 60px; }
.etat { display: flex; align-items: center; gap: 20px; font-size: 44px; font-weight: 600; color: #fff; opacity: 0; }
.appareils { display: flex; align-items: center; gap: 30px; }
.ap { background: #fff; color: var(--app-texte); display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px; opacity: 0; box-shadow: 0 30px 60px -20px rgba(0,0,0,.6); }
.ap b { font-size: 30px; } .ap span { font-size: 22px; font-weight: 700; padding: 6px 14px; border-radius: 999px; background: #fef3c7; color: #92400e; }
.tel-mini { width: 260px; height: 420px; border-radius: 44px; border: 10px solid #26334a; }
.ordi { width: 420px; height: 280px; border-radius: 22px; border: 10px solid #26334a; }
#fleche { opacity: 0; }
"""

LA, AP, VE, HO = S["langue"], S["apparence"], S["versions"], S["horsligne"]
js = ep.js_commun(["langue", "apparence", "versions", "horsligne"]) + f"""
// 0. accroche
tl.fromTo("#sc-accroche h1", {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, 0.15);
tl.to("#roue", {{ opacity: 1, duration: 0.5 }}, 0.9);
tl.to("#roue", {{ rotation: 240, duration: 5.4, ease: "power1.inOut" }}, 0.9);

// 1. langue : le titre change avec la langue choisie
tl.fromTo("#tel", {{ opacity: 0, y: 120 }}, {{ opacity: 1, y: 0, duration: 0.7, ease: E }}, {LA["debut"]});
tl.set("#lg-fr", {{ className: "lg sel" }}, {LA["debut"]});
const LANGUES = {[[c, t] for c, _, t in LANGUES]};
LANGUES.forEach(([c, titre], k) => {{
  if (k === 0) return;
  const t = {a("langue", 1.4)} + (k - 1) * 0.85;
  tl.set("#lg-" + LANGUES[k - 1][0], {{ className: "lg" }}, t);
  tl.set("#lg-" + c, {{ className: "lg sel" }}, t);
  tl.set("#titre-reg", {{ textContent: titre, textAlign: c === "ar" ? "right" : "left" }}, t);
  tl.fromTo("#titre-reg", {{ opacity: 0.2 }}, {{ opacity: 1, duration: 0.25 }}, t);
}});
const tRetour = {a("langue", 1.4)} + 4 * 0.85 + 1.2;
tl.set("#lg-ar", {{ className: "lg" }}, tRetour);
tl.set("#lg-fr", {{ className: "lg sel" }}, tRetour);
tl.set("#titre-reg", {{ textContent: "Réglages", textAlign: "left" }}, tRetour);

// 2. apparence
tl.to("#defile", {{ y: -330, duration: 0.6, ease: "power2.inOut" }}, {AP["debut"]});
const choixTheme = (id, t) => ["#th-clair", "#th-sombre", "#th-sys"].forEach((x) => tl.set(x, {{ className: "th" + (x === id ? " sel" : "") }}, t));
choixTheme("#th-clair", {a("apparence", 0.3)});
choixTheme("#th-sombre", {a("apparence", 0.9)});
tl.to("#ecran", {{ backgroundColor: "#0f172a", duration: 0.3 }}, {a("apparence", 0.9)});
tl.to(".sect", {{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0", duration: 0.3 }}, {a("apparence", 0.9)});
tl.to("#p-reg", {{ backgroundColor: "#0f172a", color: "#e2e8f0", duration: 0.3 }}, {a("apparence", 0.9)});
choixTheme("#th-sys", {a("apparence", 1.9)});
tl.to("#ecran", {{ backgroundColor: "#f8f9fb", duration: 0.3 }}, {a("apparence", 1.9)});
tl.to(".sect", {{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#1e293b", duration: 0.3 }}, {a("apparence", 1.9)});
tl.to("#p-reg", {{ backgroundColor: "#f8f9fb", color: "#1e293b", duration: 0.3 }}, {a("apparence", 1.9)});
["#ch1", "#ch2", "#ch3", "#ch0"].forEach((id, k) => {{
  const c = ["#b91c1c", "#0d9488", "#4f46e5", "#1e3a5f"][k];
  tl.to(id, {{ boxShadow: "0 0 0 5px " + c, duration: 0.15 }}, {a("apparence", 2.8)} + k * 0.5);
  tl.to("#barre", {{ backgroundColor: c, duration: 0.25 }}, {a("apparence", 2.8)} + k * 0.5);
  if (k < 3) tl.to(id, {{ boxShadow: "0 0 0 2px #e2e8f0", duration: 0.15 }}, {a("apparence", 2.8)} + k * 0.5 + 0.45);
}});
tl.to("#pouce", {{ x: 120, duration: 0.6 }}, {a("apparence", 5.2)});
tl.set("#apercu", {{ fontSize: 34 }}, {a("apparence", 5.5)});
tl.fromTo("#apercu", {{ opacity: 0.4 }}, {{ opacity: 1, duration: 0.3 }}, {a("apparence", 5.5)});

// 3. versions
tl.to("#defile", {{ y: -860, duration: 0.7, ease: "power2.inOut" }}, {VE["debut"]});
const active = (i, t, mo, txt) => {{
  tl.to("#bv" + i, {{ backgroundColor: "#2ecc71", duration: 0.2 }}, t);
  tl.to("#bv" + i + " i", {{ x: 32, duration: 0.2 }}, t);
  tl.to("#m-barre", {{ width: mo, duration: 0.8, ease: E }}, t + 0.2);
  tl.set("#m-txt", {{ textContent: txt }}, t + 1.0);
}};
active(1, {a("versions", 1.2)}, "12%", "13,3 Mio occupés sur cet appareil.");
active(3, {a("versions", 2.6)}, "21%", "22,9 Mio occupés sur cet appareil.");
tl.fromTo(".memoire", {{ boxShadow: "0 0 0 0 rgba(233,185,73,0)" }}, {{ boxShadow: "0 0 0 5px rgba(233,185,73,.5)", duration: 0.35, yoyo: true, repeat: 1 }}, {a("versions", 6.0)});

// 4. hors ligne et synchronisation
tl.to("#tel", {{ opacity: 0, y: 60, duration: 0.4 }}, {HO["debut"]});
tl.fromTo("#etat-off", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.4 }}, {HO["debut"] + 0.4});
tl.fromTo(".tel-mini", {{ opacity: 0, scale: 0.9 }}, {{ opacity: 1, scale: 1, duration: 0.5, ease: E }}, {a("horsligne", 0.8)});
tl.fromTo(".ordi", {{ opacity: 0, scale: 0.9 }}, {{ opacity: 0.35, scale: 1, duration: 0.5, ease: E }}, {a("horsligne", 1.2)});
tl.set("#badge-b", {{ textContent: "…" }}, {HO["debut"]});
tl.fromTo("#etat-on", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.4 }}, {a("horsligne", 4.4)});
tl.to("#etat-off", {{ opacity: 0.35, duration: 0.3 }}, {a("horsligne", 4.4)});
tl.to("#fleche", {{ opacity: 1, duration: 0.3 }}, {a("horsligne", 4.6)});
tl.fromTo("#fleche", {{ x: -30 }}, {{ x: 10, duration: 0.6, yoyo: true, repeat: 2, ease: "sine.inOut" }}, {a("horsligne", 4.6)});
tl.set("#badge-a", {{ textContent: "envoyé", backgroundColor: "#dcfce7", color: "#166534" }}, {a("horsligne", 5.2)});
tl.to(".ordi", {{ opacity: 1, duration: 0.3 }}, {a("horsligne", 5.6)});
tl.set("#badge-b", {{ textContent: "synchronisé", backgroundColor: "#dcfce7", color: "#166534" }}, {a("horsligne", 5.6)});
"""

ep.ecrire(corps, css, js)
