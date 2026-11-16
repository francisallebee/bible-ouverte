import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, Degrade, Fond, SANS, SERIF } from "./commun";

/** Image d'article de blog (1200×630, format Open Graph). */
export const Couverture: React.FC<{ surtitre: string; titre: string; accent: string }> = ({ surtitre, titre, accent }) => (
  <AbsoluteFill>
    <Fond />
    <AbsoluteFill style={{ padding: "70px 80px", display: "flex", flexDirection: "row", alignItems: "center", gap: 70 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: C.violet }}>{surtitre}</div>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 74, lineHeight: 1.08, color: C.blanc, marginTop: 22, letterSpacing: -1 }}>
          {titre} <Degrade>{accent}</Degrade>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 28, color: C.texte2, marginTop: 30 }}>bible-ouverte.vercel.app · Gratuit · sans publicité</div>
      </div>
      <div style={{ width: 260, height: 260, borderRadius: 64, overflow: "hidden", boxShadow: "0 0 120px 20px rgba(233,185,73,0.3)", flexShrink: 0 }}>
        <Img src={staticFile("img/icon-512.png")} style={{ width: "100%", height: "100%" }} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
