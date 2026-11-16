import React from "react";
import { Composition, Still } from "remotion";
import { FPS } from "./commun";
import { Couverture } from "./Couverture";
import { dureePourquoi, Pourquoi } from "./pourquoi/Pourquoi";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Pourquoi" component={Pourquoi} durationInFrames={dureePourquoi} fps={FPS} width={1080} height={1920} />
    <Still
      id="Couverture-Pourquoi"
      component={Couverture}
      width={1200}
      height={630}
      defaultProps={{ surtitre: "Bible Ouverte · Découvrir", titre: "Pas une Bible de plus :", accent: "ton carnet de route dans la Parole" }}
    />
  </>
);
