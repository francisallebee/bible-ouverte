/**
 * L'écriture d'une référence biblique, en un seul endroit.
 *
 * « Jean 3:16 », « Jean 3:16-18 », et **« Jean 3:16-4:2 »** quand l'intervalle
 * enjambe un chapitre — l'écriture usuelle, celle des concordances et des
 * notes de bas de page : le verset de fin est rattaché à son chapitre.
 *
 * Jusqu'au 16 septembre 2026, deux fonctions écrivaient la même chose chacune
 * de son côté — `describeRange` pour les sélecteurs, `referenceDe` pour
 * l'historique —, et composaient les chapitres et les versets séparément :
 * « Jean 3-4:1-5 ». Cela vaut sur un même chapitre et ne dit plus, dès qu'on
 * en change, à quel chapitre appartient quel verset. Le premier groupe de
 * versets à cheval sur deux chapitres, Psaumes 23:6-24:2, l'a rendu
 * « Psaumes 23-24:6-2 » ; c'est en le voyant que la convention a changé, et
 * que les deux fonctions n'en font plus qu'une.
 */

export interface IntervalleDeVersets {
  chapterStart: number;
  chapterEnd: number;
  verseStart: number;
  verseEnd: number;
}

export function ecrireReference(nomDuLivre: string, r: IntervalleDeVersets): string {
  if (r.chapterEnd !== r.chapterStart) {
    return `${nomDuLivre} ${r.chapterStart}:${r.verseStart}-${r.chapterEnd}:${r.verseEnd}`;
  }
  if (r.verseEnd !== r.verseStart) {
    return `${nomDuLivre} ${r.chapterStart}:${r.verseStart}-${r.verseEnd}`;
  }
  return `${nomDuLivre} ${r.chapterStart}:${r.verseStart}`;
}
