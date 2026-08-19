import type { PlanDay } from './types';

/** Un passage d'un jour de plan : un livre, une plage de chapitres et de versets. */
export interface PlanPassage {
  book: string;
  chapterStart: number;
  chapterEnd: number;
  verseStart: number;
  verseEnd: number;
  /**
   * La lecture enregistrée pour ce passage, une fois le jour coché.
   *
   * L'application enregistre **une lecture par passage** — c'est la règle du
   * reste du produit, et les statistiques comme la progression y comptent. La
   * colonne `readingId` de `plan_days` n'en retient qu'une ; sans cet
   * identifiant par passage, décocher un jour à trois passages en laisserait
   * deux orphelines dans l'historique.
   */
  readingId?: number;
}

/**
 * Les passages d'un jour, quelle que soit la façon dont il est enregistré.
 *
 * `plan_days` a longtemps décrit un seul passage, dans ses propres colonnes.
 * La colonne `passages` est venue après, et **les lignes anciennes n'ont pas
 * été réécrites** : une reprise de données sur les plans en production aurait
 * été un risque pris pour rien, puisque le repli se fait à la lecture.
 *
 * Un jour sans `passages` — ou avec un tableau vide, qu'une écriture maladroite
 * pourrait produire — rend donc le passage décrit par ses colonnes. C'est aussi
 * ce que lit un appareil resté sur l'ancienne version, qui affiche alors le
 * premier passage du jour au lieu de tous : tronqué, jamais faux.
 */
export function dayPassages(day: Pick<PlanDay,
  'book' | 'chapterStart' | 'chapterEnd' | 'verseStart' | 'verseEnd' | 'passages'
>): PlanPassage[] {
  if (day.passages && day.passages.length > 0) return day.passages;
  return [{
    book: day.book,
    chapterStart: day.chapterStart,
    chapterEnd: day.chapterEnd,
    verseStart: day.verseStart,
    verseEnd: day.verseEnd,
  }];
}

/**
 * Les colonnes à écrire pour un jour donné.
 *
 * Le premier passage y est recopié : ces colonnes sont `not null`, et c'est ce
 * qui permet à la migration de rester purement additive. `passages` n'est
 * renseignée que lorsqu'il y a réellement plusieurs passages — un jour simple
 * s'enregistre donc exactement comme avant, et l'on ne gonfle pas la base de
 * tableaux à un élément.
 */
export function toDayColumns(passages: PlanPassage[]): PlanPassage & { passages?: PlanPassage[] } {
  const [premier] = passages;
  if (!premier) throw new Error('Un jour de plan compte au moins un passage');
  return {
    ...premier,
    ...(passages.length > 1 ? { passages } : {}),
  };
}

/**
 * Toutes les lectures rattachées à un jour, sans doublon.
 *
 * `readingId` de la ligne est repris en plus des identifiants par passage :
 * les jours cochés avant cette évolution n'ont que lui.
 */
export function readingIdsOf(day: Pick<PlanDay,
  'book' | 'chapterStart' | 'chapterEnd' | 'verseStart' | 'verseEnd' | 'passages' | 'readingId'
>): number[] {
  const ids = dayPassages(day).map((p) => p.readingId).filter((id): id is number => typeof id === 'number');
  if (typeof day.readingId === 'number') ids.push(day.readingId);
  return Array.from(new Set(ids));
}

/** Nombre de chapitres d'un jour, tous passages confondus. */
export function dayChapterCount(passages: PlanPassage[]): number {
  return passages.reduce((n, p) => n + Math.max(1, p.chapterEnd - p.chapterStart + 1), 0);
}
