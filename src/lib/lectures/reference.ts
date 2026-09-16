import { dernierVerset } from "@/features/bible/versets";

/**
 * L'écriture d'une référence biblique, en un seul endroit.
 *
 * « Jean 3:16 », « Jean 3:16-18 », **« Jean 3:16-4:2 »** quand l'intervalle
 * enjambe un chapitre — l'écriture usuelle, celle des concordances : le verset
 * de fin est rattaché à son chapitre. Et **« Genèse 17-20 »**, ou « Genèse 17 »,
 * quand l'intervalle couvre des chapitres entiers : du premier verset au
 * dernier, ou au-delà — les anciens replis à 200 (« Psaumes 65:1-20 » pour un
 * psaume de 13 versets) sont des chapitres entiers, pas des intervalles.
 *
 * Le dernier verset vient de la versification de Louis Segond, un repli et non
 * une autorité : une version qui compte moins de versets qu'elle dans un
 * chapitre verra sa lecture entière écrite en versets. C'est un défaut
 * d'écriture, pas de comptage, et il est rare — trois versions concordent
 * exactement, les autres divergent sur quelques chapitres.
 *
 * Jusqu'au 16 septembre 2026, trois fonctions écrivaient la même chose chacune
 * de son côté, et composaient les chapitres et les versets séparément :
 * « Jean 3-4:1-5 ». Le premier groupe de versets à cheval sur deux chapitres,
 * Psaumes 23:6-24:2, l'a rendu « Psaumes 23-24:6-2 » ; c'est en le voyant que
 * la convention a changé, et que les trois n'en font plus qu'une.
 */

export interface IntervalleDeVersets {
  chapterStart: number;
  chapterEnd: number;
  verseStart: number;
  verseEnd: number;
}

/** Du premier verset au dernier du chapitre de fin, ou au-delà. */
export function chapitresEntiers(book: string, r: IntervalleDeVersets): boolean {
  return r.verseStart === 1 && r.verseEnd >= dernierVerset(book, r.chapterEnd);
}

export function ecrireReference(nomDuLivre: string, book: string, r: IntervalleDeVersets): string {
  if (chapitresEntiers(book, r)) {
    return r.chapterEnd !== r.chapterStart
      ? `${nomDuLivre} ${r.chapterStart}-${r.chapterEnd}`
      : `${nomDuLivre} ${r.chapterStart}`;
  }
  if (r.chapterEnd !== r.chapterStart) {
    return `${nomDuLivre} ${r.chapterStart}:${r.verseStart}-${r.chapterEnd}:${r.verseEnd}`;
  }
  if (r.verseEnd !== r.verseStart) {
    return `${nomDuLivre} ${r.chapterStart}:${r.verseStart}-${r.verseEnd}`;
  }
  return `${nomDuLivre} ${r.chapterStart}:${r.verseStart}`;
}
