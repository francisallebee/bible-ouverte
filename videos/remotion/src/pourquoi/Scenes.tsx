import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { apparait, C, Degrade, GREC, HEBREU, lineaire, SANS, SERIF, Titre, useEntree } from "../commun";

/* Pictogramme coche dans une pastille */
const Coche: React.FC<{ p: number; taille?: number; couleur?: string }> = ({ p, taille = 64, couleur = C.or }) => (
  <svg width={taille} height={taille} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
    <circle cx="32" cy="32" r="30" fill={couleur} opacity={0.18 + 0.82 * p} />
    <path
      d="M19 33 L28 42 L46 23"
      fill="none"
      stroke={C.nuit}
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={42}
      strokeDashoffset={42 * (1 - p)}
    />
  </svg>
);

const Carte: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: C.carte,
      border: `1px solid ${C.bord}`,
      borderRadius: 36,
      boxShadow: "0 40px 80px -30px rgba(0,0,0,0.6)",
      ...style,
    }}
  >
    {children}
  </div>
);

/* 1. Accroche ---------------------------------------------------------------- */
export const Accroche: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveil = lineaire(frame, 3.4 * fps, 4.2 * fps);
  const telephone = useEntree(0.05);
  const z = (i: number) => {
    const t = (frame / fps - i * 0.6) % 2.4;
    const o = interpolate(t, [0, 0.4, 1.8, 2.4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <span
        key={i}
        style={{
          position: "absolute",
          left: 300 + i * 46,
          top: 300 - t * 70 - i * 30,
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 54 + i * 14,
          color: C.violet,
          opacity: o * (1 - reveil),
        }}
      >
        z
      </span>
    );
  };
  return (
    <>
      <Titre haut={170}>
        Installée…
        <br />
        <span style={{ opacity: 0.5 + 0.5 * (1 - reveil) }}>et endormie ?</span>
      </Titre>
      <div
        style={{
          position: "absolute",
          left: (1080 - 470) / 2,
          top: 470,
          width: 470,
          height: 860,
          borderRadius: 72,
          border: `10px solid rgba(255,255,255,0.18)`,
          background: "rgba(255,255,255,0.03)",
          ...apparait(telephone, 80),
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 22,
            left: "50%",
            width: 120,
            height: 14,
            marginLeft: -60,
            borderRadius: 10,
            background: "rgba(255,255,255,0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 115,
            top: 300,
            width: 220,
            height: 220,
            borderRadius: 54,
            overflow: "hidden",
            filter: `grayscale(${1 - reveil}) brightness(${0.55 + 0.45 * reveil})`,
            transform: `scale(${1 + 0.18 * reveil})`,
            boxShadow: `0 0 ${120 * reveil}px ${30 * reveil}px rgba(233,185,73,${0.45 * reveil})`,
          }}
        >
          <Img src={staticFile("img/icon-512.png")} style={{ width: "100%", height: "100%" }} />
        </div>
        {[0, 1, 2].map(z)}
      </div>
    </>
  );
};

/* 2. Promesse ---------------------------------------------------------------- */
export const Promesse: React.FC = () => {
  const lignes = [
    { t: "Ce que tu as lu", a: 3.0 },
    { t: "Quand tu l’as lu", a: 4.6 },
    { t: "Ce que la lecture t’a laissé", a: 5.6 },
  ];
  return (
    <>
      <Titre haut={230}>
        Pas une Bible
        <br />
        <Degrade>de plus.</Degrade>
      </Titre>
      <div style={{ position: "absolute", top: 640, left: 110, right: 110, display: "flex", flexDirection: "column", gap: 44 }}>
        <SousTitreScene a={1.6}>Ton carnet de route dans la Parole :</SousTitreScene>
        {lignes.map((l) => (
          <Ligne key={l.t} a={l.a}>
            {l.t}
          </Ligne>
        ))}
      </div>
    </>
  );
};

const SousTitreScene: React.FC<{ a: number; children: React.ReactNode }> = ({ a, children }) => {
  const p = useEntree(a);
  return (
    <div style={{ fontFamily: SANS, fontSize: 46, color: C.texte2, lineHeight: 1.3, ...apparait(p, 20) }}>{children}</div>
  );
};

const Ligne: React.FC<{ a: number; children: React.ReactNode }> = ({ a, children }) => {
  const p = useEntree(a);
  return (
    <Carte style={{ display: "flex", alignItems: "center", gap: 30, padding: "30px 36px", ...apparait(p, 30) }}>
      <Coche p={p} />
      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 48, color: C.blanc }}>{children}</span>
    </Carte>
  );
};

/* 3. Progression ------------------------------------------------------------- */
export const Progression: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lus = lineaire(frame, 0.8 * fps, 5.2 * fps, [0, 41]);
  const serie = Math.round(lineaire(frame, 3.6 * fps, 5.6 * fps, [0, 12]));
  const carte = useEntree(3.4);
  return (
    <>
      <Titre haut={190}>
        Ta Bible
        <br />
        <Degrade>se remplit</Degrade>
      </Titre>
      <div
        style={{
          position: "absolute",
          top: 520,
          left: (1080 - 912) / 2,
          width: 912,
          display: "grid",
          gridTemplateColumns: "repeat(11, 72px)",
          gap: 12,
        }}
      >
        {Array.from({ length: 66 }, (_, i) => {
          const rempli = Math.max(0, Math.min(1, lus - i));
          const nt = i >= 39;
          return (
            <div
              key={i}
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: `rgba(255,255,255,${nt ? 0.09 : 0.06})`,
                border: `1px solid ${C.bord}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: `${rempli * 100}%`,
                  background: nt ? C.violet : C.or,
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1010,
          left: 80,
          right: 80,
          display: "flex",
          justifyContent: "center",
          gap: 34,
          fontFamily: SANS,
          fontSize: 34,
          color: C.texte3,
        }}
      >
        <span>
          <span style={{ color: C.or }}>■</span> Ancien Testament
        </span>
        <span>
          <span style={{ color: C.violet }}>■</span> Nouveau Testament
        </span>
      </div>
      <Carte
        style={{
          position: "absolute",
          top: 1110,
          left: 190,
          right: 190,
          padding: "30px 40px",
          display: "flex",
          alignItems: "center",
          gap: 30,
          ...apparait(carte, 30),
        }}
      >
        <div style={{ fontFamily: SERIF, fontSize: 100, color: C.or, lineHeight: 1, minWidth: 110, textAlign: "center" }}>{serie}</div>
        <div style={{ fontFamily: SANS, fontSize: 40, color: C.blanc, lineHeight: 1.2 }}>
          jours de lecture
          <br />
          <span style={{ color: C.texte2 }}>d’affilée</span>
        </div>
      </Carte>
    </>
  );
};

/* 4. Plans ------------------------------------------------------------------- */
export const Plans: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const carte = useEntree(0.6);
  const choix = ["La Bible entière", "Le Nouveau Testament", "Un seul livre"];
  const choisi = frame < 2.2 * fps ? 0 : frame < 3.3 * fps ? 1 : 2;
  const jours = ["L", "M", "M", "J", "V", "S", "D"];
  const membres = [
    { i: "M", c: "#e67e22" },
    { i: "J", c: "#3498db" },
    { i: "A", c: "#2ecc71" },
    { i: "P", c: "#9b59b6" },
  ];
  const groupe = useEntree(5.0);
  return (
    <>
      <Titre haut={190}>
        Un plan,
        <br />
        <Degrade>à plusieurs</Degrade>
      </Titre>
      <div style={{ position: "absolute", top: 510, left: 110, right: 110, display: "flex", flexDirection: "column", gap: 22, ...apparait(carte) }}>
        {choix.map((c, i) => (
          <div
            key={c}
            style={{
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 42,
              padding: "24px 34px",
              borderRadius: 26,
              color: i === choisi ? C.nuit : C.blanc,
              background: i === choisi ? C.or : C.carte,
              border: `1px solid ${i === choisi ? C.or : C.bord}`,
            }}
          >
            {c}
          </div>
        ))}
      </div>
      <Carte style={{ position: "absolute", top: 960, left: 110, right: 110, padding: "34px 36px", ...apparait(groupe, 30) }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {jours.map((j, i) => {
            const p = lineaire(frame, (5.3 + i * 0.3) * fps, (5.6 + i * 0.3) * fps);
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: SANS, fontSize: 30, color: C.texte3 }}>{j}</span>
                <Coche p={i < 5 ? p : 0} taille={88} couleur={C.vert} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 30 }}>
          {membres.map((m, i) => {
            const p = lineaire(frame, (5.6 + i * 0.25) * fps, (6.0 + i * 0.25) * fps);
            return (
              <div
                key={i}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  background: m.c,
                  border: `5px solid ${C.nuit2}`,
                  marginLeft: i === 0 ? 0 : -18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 36,
                  color: C.blanc,
                  transform: `scale(${p})`,
                }}
              >
                {m.i}
              </div>
            );
          })}
          <span style={{ fontFamily: SANS, fontSize: 38, color: C.texte2, marginLeft: 26 }}>lisent avec toi</span>
        </div>
      </Carte>
    </>
  );
};

/* 5. Versions ---------------------------------------------------------------- */
const VERSIONS = [
  "Louis Segond 1910",
  "Darby 1885",
  "Crampon 1923",
  "Ostervald",
  "David Martin",
  "Lemaître de Sacy",
  "Zadoc Kahn",
  "Annotée de Neuchâtel",
  "King James 1611",
  "Reina-Valera 1909",
  "Diodati 1649",
  "Van Dyck 1865",
];

export const Versions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const defile = frame * 3.2;
  const rangee = (decalage: number, sens: number) => (
    <div style={{ display: "flex", gap: 18, transform: `translateX(${-400 + sens * ((defile + decalage) % 1400) - (sens > 0 ? 700 : 0)}px)` }}>
      {[...VERSIONS, ...VERSIONS].map((v, i) => (
        <span
          key={i}
          style={{
            whiteSpace: "nowrap",
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 34,
            color: C.blanc,
            padding: "16px 28px",
            borderRadius: 999,
            background: C.carte,
            border: `1px solid ${C.bord}`,
          }}
        >
          {v}
        </span>
      ))}
    </div>
  );
  const mots = useEntree(3.4);
  const horsLigne = useEntree(6.9);
  const grec = lineaire(frame, 4.8 * fps, 5.4 * fps);
  return (
    <>
      <Titre haut={170} taille={84}>
        <Degrade>15</Degrade> versions,
        <br />5 langues
      </Titre>
      <div style={{ position: "absolute", top: 450, left: 0, right: 0, display: "flex", flexDirection: "column", gap: 18, opacity: lineaire(frame, 0, 10) }}>
        {rangee(0, -1)}
        {rangee(500, 1)}
      </div>
      <div style={{ position: "absolute", top: 650, left: 110, right: 110, display: "flex", gap: 28, ...apparait(mots, 40) }}>
        <div style={{ flex: 1, display: "flex" }}>
          <MotOriginal police={HEBREU} mot="בְּרֵאשִׁית" sens="au commencement" ref_="Genèse 1:1" dir="rtl" />
        </div>
        <div style={{ flex: 1, display: "flex", opacity: grec, transform: `translateY(${(1 - grec) * 30}px)` }}>
          <MotOriginal police={GREC} mot="λόγος" sens="la parole" ref_="Jean 1:1" />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1150,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          ...apparait(horsLigne, 30),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "22px 40px",
            borderRadius: 999,
            background: "rgba(46,204,113,0.14)",
            border: "1px solid rgba(46,204,113,0.5)",
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 42,
            color: C.blanc,
          }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={C.vert} strokeWidth="2" strokeLinecap="round">
            <path d="M5 12.5a10 10 0 0 1 14 0" />
            <path d="M8.5 16a5 5 0 0 1 7 0" />
            <circle cx="12" cy="19.5" r="0.8" fill={C.vert} />
            <path d="M3 3l18 18" />
          </svg>
          Tout se lit hors ligne
        </div>
      </div>
    </>
  );
};

const MotOriginal: React.FC<{ police: string; mot: string; sens: string; ref_: string; dir?: "rtl" }> = ({ police, mot, sens, ref_, dir }) => (
  <Carte style={{ flex: 1, padding: "34px 26px", textAlign: "center" }}>
    <div dir={dir} style={{ fontFamily: police, fontWeight: 500, fontSize: 84, color: C.or, lineHeight: 1.25 }}>
      {mot}
    </div>
    <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: C.blanc, marginTop: 14 }}>{sens}</div>
    <div style={{ fontFamily: SANS, fontSize: 30, color: C.texte3, marginTop: 10 }}>{ref_}</div>
  </Carte>
);

/* 6. Outils ------------------------------------------------------------------ */
const Icone: React.FC<{ nom: string }> = ({ nom }) => {
  const s = { fill: "none", stroke: C.or, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="96" height="96" viewBox="0 0 24 24">
      {nom === "quiz" && (
        <>
          <circle cx="12" cy="12" r="10" {...s} />
          <path d="M9.2 9a3 3 0 0 1 5.6 1c0 2-3 2.6-3 4.2" {...s} />
          <circle cx="12" cy="17.6" r="0.6" fill={C.or} />
        </>
      )}
      {nom === "soleil" && (
        <>
          <circle cx="12" cy="12" r="4" {...s} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <path key={a} d="M12 2.5v2.5" {...s} transform={`rotate(${a} 12 12)`} />
          ))}
        </>
      )}
      {nom === "memoire" && (
        <>
          <path d="M6 3h12v18l-6-4-6 4z" {...s} />
          <path d="M9.5 9.5l2 2 3.5-3.5" {...s} />
        </>
      )}
      {nom === "stats" && (
        <>
          <path d="M4 20h16" {...s} />
          <path d="M7 16v-5M12 16V6M17 16v-8" {...s} strokeWidth={3} />
        </>
      )}
    </svg>
  );
};

export const Outils: React.FC = () => {
  const tuiles = [
    { nom: "quiz", t: "Quiz", a: 0.4 },
    { nom: "soleil", t: "Verset du jour", a: 1.0 },
    { nom: "memoire", t: "Mémorisation", a: 1.8 },
    { nom: "stats", t: "Statistiques", a: 2.6 },
  ];
  return (
    <>
      <Titre haut={190}>
        Pour tenir
        <br />
        <Degrade>dans la durée</Degrade>
      </Titre>
      <div
        style={{
          position: "absolute",
          top: 540,
          left: 110,
          right: 110,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 30,
        }}
      >
        {tuiles.map((t) => (
          <Tuile key={t.nom} {...t} />
        ))}
      </div>
    </>
  );
};

const Tuile: React.FC<{ nom: string; t: string; a: number }> = ({ nom, t, a }) => {
  const p = useEntree(a, 160);
  return (
    <Carte
      style={{
        height: 330,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        opacity: p,
        transform: `scale(${0.8 + 0.2 * p})`,
      }}
    >
      <Icone nom={nom} />
      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 42, color: C.blanc }}>{t}</span>
    </Carte>
  );
};

/* 7. Appel ------------------------------------------------------------------- */
export const Appel: React.FC = () => {
  const icone = useEntree(0.1);
  const nom = useEntree(0.5);
  const tags = useEntree(1.2);
  const url = useEntree(2.6);
  return (
    <div style={{ position: "absolute", top: 300, left: 80, right: 80, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: 260,
          height: 260,
          borderRadius: 64,
          overflow: "hidden",
          boxShadow: "0 0 140px 30px rgba(233,185,73,0.35)",
          transform: `scale(${0.6 + 0.4 * icone})`,
          opacity: icone,
        }}
      >
        <Img src={staticFile("img/icon-512.png")} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 118, color: C.blanc, marginTop: 60, letterSpacing: -2, ...apparait(nom) }}>
        Bible Ouverte
      </div>
      <div style={{ fontFamily: SANS, fontSize: 44, color: C.texte2, marginTop: 26, ...apparait(tags, 20) }}>
        Gratuit · sans publicité · hors ligne
      </div>
      <div
        style={{
          marginTop: 90,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 50,
          color: C.nuit,
          background: C.or,
          padding: "28px 50px",
          borderRadius: 999,
          ...apparait(url, 30),
        }}
      >
        bible-ouverte.vercel.app
      </div>
    </div>
  );
};
