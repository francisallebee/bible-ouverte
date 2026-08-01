import { BOOKS } from '@/features/bible';
import type { BibleBook } from '@/features/bible';
import type { PlanDuration } from './types';

interface RawDay {
  day: number;
  date: string;
  book: string;
  chapterStart: number;
  chapterEnd: number;
}

const DURATION_DAYS: Record<string, number> = {
  "1-year": 365,
  "6-months": 182,
  "3-months": 91,
  "1-month": 30,
};

/**
 * Un jour de plan ne porte qu'un seul livre : c'est ce que stocke PlanDay et ce
 * qu'affiche l'écran du plan. Un plan couvrant N livres compte donc au minimum
 * N jours, et un livre de C chapitres ne peut pas s'étaler sur plus de C jours.
 *
 * Répartit `targetDays` jours entre les livres au prorata de leur nombre de
 * chapitres, en respectant ces deux bornes. Méthode du plus fort reste : on
 * attribue d'abord la part entière, puis les jours restants aux livres dont la
 * part décimale est la plus élevée.
 */
function allocateDaysPerBook(books: BibleBook[], targetDays: number): number[] {
  const totalChapters = books.reduce((sum, b) => sum + b.chapters, 0);

  const exact = books.map((b) => (b.chapters / totalChapters) * targetDays);
  const alloc = books.map((b, i) =>
    Math.min(b.chapters, Math.max(1, Math.floor(exact[i])))
  );

  const sum = () => alloc.reduce((s, n) => s + n, 0);

  // Distribue les jours restants, du plus fort reste au plus faible, en
  // ignorant les livres déjà saturés (autant de jours que de chapitres).
  const byRemainder = books
    .map((_, i) => i)
    .sort((a, b) => (exact[b] - Math.floor(exact[b])) - (exact[a] - Math.floor(exact[a])));

  let guard = targetDays + books.length;
  while (sum() < targetDays && guard-- > 0) {
    const i = byRemainder.find((idx) => alloc[idx] < books[idx].chapters);
    if (i === undefined) break; // tous saturés : le plan sera plus court
    alloc[i] += 1;
  }

  // Le plancher d'un jour par livre peut faire dépasser la cible quand la durée
  // demandée est courte au regard du nombre de livres. On reprend alors des
  // jours aux livres qui en ont le plus, sans jamais descendre sous 1.
  guard = books.length * 2;
  while (sum() > targetDays && guard-- > 0) {
    let best = -1;
    for (let i = 0; i < alloc.length; i++) {
      if (alloc[i] > 1 && (best === -1 || alloc[i] > alloc[best])) best = i;
    }
    if (best === -1) break; // un jour par livre : incompressible
    alloc[best] -= 1;
  }

  return alloc;
}

/** Découpe [1..chapters] en `parts` tranches contiguës aussi égales que possible. */
function splitChapters(chapters: number, parts: number): { start: number; end: number }[] {
  const base = Math.floor(chapters / parts);
  const extra = chapters % parts;
  const ranges: { start: number; end: number }[] = [];

  let cursor = 1;
  for (let i = 0; i < parts; i++) {
    const size = base + (i < extra ? 1 : 0);
    ranges.push({ start: cursor, end: cursor + size - 1 });
    cursor += size;
  }
  return ranges;
}

/**
 * Ajoute `offset` jours à une date ISO (YYYY-MM-DD) en arithmétique UTC.
 *
 * L'implémentation précédente mélangeait `new Date("YYYY-MM-DD")`, interprété en
 * UTC, et `setDate`, qui raisonne en heure locale : dans un fuseau en retard sur
 * UTC, chaque date repartait d'un jour en arrière.
 */
function addDays(startDate: string, offset: number): string {
  const [y, m, d] = startDate.slice(0, 10).split('-').map(Number);
  const base = Date.UTC(y, m - 1, d);
  return new Date(base + offset * 86400000).toISOString().slice(0, 10);
}

/**
 * Construit les jours d'un plan de lecture.
 *
 * Garantie : chaque chapitre des livres sélectionnés apparaît une fois et une
 * seule. La version précédente, quand une journée chevauchait deux livres, ne
 * retenait que le premier chapitre tout en avançant l'index d'une journée
 * entière — un plan « Bible en un an » perdait ainsi 153 des 1189 chapitres et
 * s'arrêtait au 298e jour.
 */
export function generatePlanDays(
  duration: PlanDuration,
  startDate: string,
  customDays?: number,
  customBooks?: string[],
): RawDay[] {
  const targetDays = duration === "custom"
    ? (customDays ?? 30)
    : (DURATION_DAYS[duration] ?? 30);

  const selectedBooks = customBooks && customBooks.length > 0
    ? BOOKS.filter((b) => customBooks.includes(b.abbreviation))
    : BOOKS;

  if (selectedBooks.length === 0 || targetDays < 1) return [];

  const alloc = allocateDaysPerBook(selectedBooks, targetDays);
  const days: RawDay[] = [];

  selectedBooks.forEach((book, i) => {
    for (const range of splitChapters(book.chapters, alloc[i])) {
      days.push({
        day: days.length + 1,
        date: '',
        book: book.abbreviation,
        chapterStart: range.start,
        chapterEnd: range.end,
      });
    }
  });

  // Les dates sont posées à la fin : le numéro de jour n'est connu qu'une fois
  // la répartition terminée.
  return days.map((d) => ({ ...d, date: addDays(startDate, d.day - 1) }));
}
