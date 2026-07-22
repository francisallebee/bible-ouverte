import { BOOKS } from './books';
import type { BibleBook } from './books';

export interface BibleCategory {
  id: string;
  name: string;
  books: string[];
}

export const BIBLE_CATEGORIES: BibleCategory[] = [
  {
    id: "pentateuch",
    name: "Pentateuque",
    books: ["GEN", "EXO", "LEV", "NUM", "DEU"],
  },
  {
    id: "historical",
    name: "Livres historiques",
    books: ["JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST"],
  },
  {
    id: "poetic",
    name: "Livres poétiques",
    books: ["JOB", "PSA", "PRO", "ECC", "SNG"],
  },
  {
    id: "major-prophets",
    name: "Prophètes majeurs",
    books: ["ISA", "JER", "LAM", "EZK", "DAN"],
  },
  {
    id: "minor-prophets",
    name: "Prophètes mineurs",
    books: ["HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"],
  },
  {
    id: "gospels",
    name: "Évangiles",
    books: ["MAT", "MRK", "LUK", "JHN"],
  },
  {
    id: "acts",
    name: "Histoire apostolique",
    books: ["ACT"],
  },
  {
    id: "pauline-epistles",
    name: "Épîtres pauliniennes",
    books: ["ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM"],
  },
  {
    id: "general-epistles",
    name: "Épîtres générales",
    books: ["HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD"],
  },
  {
    id: "revelation",
    name: "Apocalypse",
    books: ["REV"],
  },
];

export const OLD_TESTAMENT = BOOKS.slice(0, 39).map((b) => b.abbreviation);
export const NEW_TESTAMENT = BOOKS.slice(39).map((b) => b.abbreviation);

export function getBookCategory(book: string): BibleCategory | undefined {
  return BIBLE_CATEGORIES.find((cat) => cat.books.includes(book));
}

export function isOldTestament(book: string): boolean {
  return OLD_TESTAMENT.includes(book);
}

export function isNewTestament(book: string): boolean {
  return NEW_TESTAMENT.includes(book);
}

export function getCategoryChapters(books: string[]): number {
  return books.reduce((sum, b) => {
    const book = BOOKS.find((x) => x.abbreviation === b);
    return sum + (book?.chapters ?? 0);
  }, 0);
}
