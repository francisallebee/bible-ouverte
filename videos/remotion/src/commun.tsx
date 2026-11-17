import React from "react";
import { loadFont } from "@remotion/fonts";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ------------------------------------------------------------------ */
/* Charte : celle de la page d'accueil de Bible Ouverte                */
/* ------------------------------------------------------------------ */
export const C = {
  nuit: "#0a1626",
  nuit2: "#0d1c31",
  bleu: "#1e3a5f",
  or: "#e9b949",
  orClair: "#f0d089",
  violet: "#9d8dff",
  violetFonce: "#7b68ee",
  vert: "#2ecc71",
  blanc: "#ffffff",
  texte2: "rgba(255,255,255,0.68)",
  texte3: "rgba(255,255,255,0.42)",
  carte: "rgba(255,255,255,0.06)",
  bord: "rgba(255,255,255,0.14)",
};

export const SERIF = "Lora, serif";
export const SANS = "Inter, sans-serif";
export const HEBREU = "'Noto Serif Hebrew', serif";
export const GREC = "'Noto Serif Greek', serif";

const f = (fichier: string) => staticFile(`fonts/${fichier}`);
loadFont({ family: "Lora", url: f("lora-latin-600-normal.woff2"), weight: "600" });
loadFont({ family: "Lora", url: f("lora-latin-400-italic.woff2"), weight: "400", style: "italic" });
loadFont({ family: "Inter", url: f("inter-latin-400-normal.woff2"), weight: "400" });
loadFont({ family: "Inter", url: f("inter-latin-600-normal.woff2"), weight: "600" });
loadFont({ family: "Inter", url: f("inter-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: "Noto Serif Hebrew", url: f("noto-serif-hebrew-hebrew-500-normal.woff2"), weight: "500" });
loadFont({ family: "Noto Serif Greek", url: f("noto-serif-greek-500-normal.woff2"), weight: "500" });

export const FPS = 30;
/** Décalage de la voix dans sa scène, pour laisser la transition se faire. */
export const DEBUT_VOIX = 10;
/** Silence laissé après la voix avant la scène suivante. */
export const QUEUE = 22;
export const TRANSITION = 12;

/* ------------------------------------------------------------------ */
/* Animations                                                          */
/* ------------------------------------------------------------------ */

/** Progression 0 → 1 d'une entrée, à partir de `a` secondes. */
export const useEntree = (a: number, raideur = 120) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - a * fps, fps, config: { damping: 18, stiffness: raideur, mass: 0.8 } });
};

/** Style d'apparition : fondu + montée. */
export const apparait = (p: number, dy = 40): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * dy}px)`,
});

export const lineaire = (frame: number, de: number, a: number, sortie: [number, number] = [0, 1]) =>
  interpolate(frame, [de, a], sortie, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });

/* ------------------------------------------------------------------ */
/* Fond : nuit, aurores lentes, grille discrète                        */
/* ------------------------------------------------------------------ */
export const Fond: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const tache = (couleur: string, x: number, y: number, taille: number, opacite: number, phase: number) => (
    <div
      style={{
        position: "absolute",
        left: x + Math.sin(t * 0.35 + phase) * 60,
        top: y + Math.cos(t * 0.28 + phase) * 80,
        width: taille,
        height: taille,
        borderRadius: "50%",
        background: couleur,
        opacity: opacite,
        filter: "blur(140px)",
      }}
    />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: C.nuit, overflow: "hidden" }}>
      {tache(C.bleu, -320, -260, 1100, 0.75, 0)}
      {tache(C.violetFonce, 520, 300, 900, 0.28, 2)}
      {tache(C.or, 60, 1350, 900, 0.13, 4)}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "90px 90px",
          maskImage: "radial-gradient(ellipse at 50% 35%, black 20%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Sous-titres : une phrase à la fois, calée au prorata des caractères */
/* ------------------------------------------------------------------ */
const decouper = (texte: string): string[] =>
  texte
    .split(/(?<=[.?!…:])\s+/)
    .map((s) => s.trim())
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .filter(Boolean);

export const SousTitres: React.FC<{ texte: string; duree: number }> = ({ texte, duree }) => {
  const frame = useCurrentFrame() - DEBUT_VOIX;
  const phrases = decouper(texte);
  const total = phrases.reduce((s, p) => s + p.length, 0);
  let cumul = 0;
  const bornes = phrases.map((p) => {
    const debut = (cumul / total) * duree * FPS;
    cumul += p.length;
    return { p, debut, fin: (cumul / total) * duree * FPS };
  });
  const courante = bornes.find((b) => frame >= b.debut && frame < b.fin) ?? (frame < 0 ? null : bornes[bornes.length - 1]);
  if (!courante) return null;
  const entree = lineaire(frame, courante.debut, courante.debut + 6);
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        bottom: 150,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 44,
          lineHeight: 1.3,
          color: C.blanc,
          textAlign: "center",
          background: "rgba(5,12,24,0.62)",
          border: `1px solid ${C.bord}`,
          borderRadius: 28,
          padding: "22px 34px",
          opacity: entree,
          transform: `translateY(${(1 - entree) * 12}px)`,
        }}
      >
        {courante.p}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Scène : contenu + voix + sous-titres                                */
/* ------------------------------------------------------------------ */
export type SceneProps = { video: string; id: string; texte: string; duree: number };

export const Scene: React.FC<SceneProps & { children: React.ReactNode }> = ({ video, id, texte, duree, children }) => (
  <AbsoluteFill>
    {children}
    <Sequence from={DEBUT_VOIX} layout="none">
      <Audio src={staticFile(`voix/${video}/${id}.wav`)} delayRenderTimeoutInMilliseconds={60000} />
    </Sequence>
    <SousTitres texte={texte} duree={duree} />
  </AbsoluteFill>
);

/* Titre de scène, en haut de la zone sûre */
export const Titre: React.FC<{ children: React.ReactNode; a?: number; taille?: number; haut?: number }> = ({
  children,
  a = 0.1,
  taille = 92,
  haut = 190,
}) => {
  const p = useEntree(a);
  return (
    <div
      style={{
        position: "absolute",
        top: haut,
        left: 80,
        right: 80,
        textAlign: "center",
        fontFamily: SERIF,
        fontWeight: 600,
        fontSize: taille,
        lineHeight: 1.08,
        color: C.blanc,
        letterSpacing: -1,
        ...apparait(p),
      }}
    >
      {children}
    </div>
  );
};

/** Texte en dégradé or → violet, comme le titre de la page d'accueil. */
export const Degrade: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      background: `linear-gradient(90deg, ${C.or}, ${C.orClair} 45%, ${C.violet})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    }}
  >
    {children}
  </span>
);

/** Durée d'une scène en images, voix + marges. */
export const dureeScene = (secondes: number) => Math.ceil(secondes * FPS) + DEBUT_VOIX + QUEUE + TRANSITION;
