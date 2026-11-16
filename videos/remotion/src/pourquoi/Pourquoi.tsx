import React from "react";
import { AbsoluteFill } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { dureeScene, Fond, Scene, TRANSITION } from "../commun";
import donnees from "../generated/pourquoi.json";
import { Accroche, Appel, Outils, Plans, Progression, Promesse, Versions } from "./Scenes";

const VISUELS: Record<string, React.FC> = {
  accroche: Accroche,
  promesse: Promesse,
  progression: Progression,
  plans: Plans,
  versions: Versions,
  outils: Outils,
  appel: Appel,
};

const durees = donnees.durees as Record<string, number>;

export const dureePourquoi =
  donnees.scenes.reduce((s, sc) => s + dureeScene(durees[sc.id]), 0) - TRANSITION * (donnees.scenes.length - 1);

export const Pourquoi: React.FC = () => (
  <AbsoluteFill>
    <Fond />
    <TransitionSeries>
      {donnees.scenes.flatMap((sc, i) => {
        const Visuel = VISUELS[sc.id];
        const elements = [
          <TransitionSeries.Sequence key={sc.id} name={sc.id} durationInFrames={dureeScene(durees[sc.id])}>
            <Scene video={donnees.id} id={sc.id} texte={sc.texte} duree={durees[sc.id]}>
              <Visuel />
            </Scene>
          </TransitionSeries.Sequence>,
        ];
        if (i < donnees.scenes.length - 1) {
          elements.push(
            <TransitionSeries.Transition
              key={`${sc.id}-t`}
              presentation={fade()}
              timing={linearTiming({ durationInFrames: TRANSITION })}
            />,
          );
        }
        return elements;
      })}
    </TransitionSeries>
  </AbsoluteFill>
);
