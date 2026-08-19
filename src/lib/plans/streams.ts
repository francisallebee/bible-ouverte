import { getBook } from '@/features/bible';
import type { PlanPassage } from '@/lib/storage/plan-passages';

/**
 * Répartition d'un plan à plusieurs flux.
 *
 * Un « flux » est une suite de livres parcourue dans l'ordre — l'Ancien
 * Testament, les Évangiles, les Psaumes. Chaque jour prend un morceau de
 * **chaque** flux, ce qui donne les plans classiques : un peu d'histoire, un
 * peu d'Évangile, un psaume, tous les jours.
 *
 * C'est la maille rendue possible par la colonne `passages` : avant elle, un
 * jour ne pouvait porter qu'un livre, et ces plans étaient hors de portée.
 *
 * Le découpage se fait sur la suite **plate** des chapitres, puis se
 * recompose en plages. Un jour qui enjambe deux livres rend donc naturellement
 * deux passages, sans cas particulier — c'est le même mécanisme qui sert la
 * frontière entre les livres et la présence de plusieurs flux.
 */

interface Chapitre {
  book: string;
  chapter: number;
}

/** La suite des chapitres d'un flux, livre après livre. */
export function flattenStream(books: string[]): Chapitre[] {
  const suite: Chapitre[] = [];
  for (const book of books) {
    const info = getBook(book);
    if (!info) continue;
    for (let c = 1; c <= info.chapters; c++) suite.push({ book, chapter: c });
  }
  return suite;
}

/**
 * Recompose une suite de chapitres en plages, une par livre traversé.
 *
 * Les chapitres arrivent dans l'ordre : il suffit donc de couper au changement
 * de livre. Une reprise plus savante n'apporterait rien et supporterait mal une
 * suite non contiguë, qui ne se produit pas ici.
 */
export function compressChapters(chapitres: Chapitre[]): PlanPassage[] {
  const passages: PlanPassage[] = [];
  for (const { book, chapter } of chapitres) {
    const dernier = passages[passages.length - 1];
    if (dernier && dernier.book === book && dernier.chapterEnd === chapter - 1) {
      dernier.chapterEnd = chapter;
      continue;
    }
    passages.push({ book, chapterStart: chapter, chapterEnd: chapter, verseStart: 1, verseEnd: 1 });
  }
  return passages;
}

/**
 * Découpe une suite en `days` parts aussi égales que possible.
 *
 * Les bornes se calculent par `Math.floor(i * n / days)` plutôt que par un
 * pas arrondi cumulé : la dernière part ne récupère ainsi jamais le reliquat
 * de tous les arrondis, qui pouvait la faire doubler de taille.
 *
 * Un flux plus court que le nombre de jours laisse des parts vides ; c'est à
 * l'appelant de décider ce qu'il en fait — ici, le jour n'aura simplement pas
 * de passage pour ce flux.
 */
export function sliceIntoDays<T>(suite: T[], days: number): T[][] {
  const parts: T[][] = [];
  for (let i = 0; i < days; i++) {
    const debut = Math.floor((i * suite.length) / days);
    const fin = Math.floor(((i + 1) * suite.length) / days);
    parts.push(suite.slice(debut, fin));
  }
  return parts;
}

/**
 * Les passages de chaque jour, tous flux confondus.
 *
 * L'ordre des flux est conservé dans la journée : celui qui a placé l'Ancien
 * Testament en premier le retrouvera en premier chaque jour.
 */
export function generateStreamDays(streams: string[][], days: number): PlanPassage[][] {
  const parFlux = streams.map((books) => sliceIntoDays(flattenStream(books), days));
  return Array.from({ length: days }, (_, i) =>
    parFlux.flatMap((flux) => compressChapters(flux[i] ?? [])),
  );
}
