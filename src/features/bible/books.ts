export interface BibleBook {
  abbreviation: string;
  name: string;
  chapters: number;
}

export const BOOKS: BibleBook[] = [
  { abbreviation: "GEN", name: "Genèse", chapters: 50 },
  { abbreviation: "EXO", name: "Exode", chapters: 40 },
  { abbreviation: "LEV", name: "Lévitique", chapters: 27 },
  { abbreviation: "NUM", name: "Nombres", chapters: 36 },
  { abbreviation: "DEU", name: "Deutéronome", chapters: 34 },
  { abbreviation: "JOS", name: "Josué", chapters: 24 },
  { abbreviation: "JDG", name: "Juges", chapters: 21 },
  { abbreviation: "RUT", name: "Ruth", chapters: 4 },
  { abbreviation: "1SA", name: "1 Samuel", chapters: 31 },
  { abbreviation: "2SA", name: "2 Samuel", chapters: 24 },
  { abbreviation: "1KI", name: "1 Rois", chapters: 22 },
  { abbreviation: "2KI", name: "2 Rois", chapters: 25 },
  { abbreviation: "1CH", name: "1 Chroniques", chapters: 29 },
  { abbreviation: "2CH", name: "2 Chroniques", chapters: 36 },
  { abbreviation: "EZR", name: "Esdras", chapters: 10 },
  { abbreviation: "NEH", name: "Néhémie", chapters: 13 },
  { abbreviation: "EST", name: "Esther", chapters: 10 },
  { abbreviation: "JOB", name: "Job", chapters: 42 },
  { abbreviation: "PSA", name: "Psaumes", chapters: 150 },
  { abbreviation: "PRO", name: "Proverbes", chapters: 31 },
  { abbreviation: "ECC", name: "Ecclésiaste", chapters: 12 },
  { abbreviation: "SNG", name: "Cantique des Cantiques", chapters: 8 },
  { abbreviation: "ISA", name: "Ésaïe", chapters: 66 },
  { abbreviation: "JER", name: "Jérémie", chapters: 52 },
  { abbreviation: "LAM", name: "Lamentations", chapters: 5 },
  { abbreviation: "EZK", name: "Ézéchiel", chapters: 48 },
  { abbreviation: "DAN", name: "Daniel", chapters: 12 },
  { abbreviation: "HOS", name: "Osée", chapters: 14 },
  { abbreviation: "JOL", name: "Joël", chapters: 3 },
  { abbreviation: "AMO", name: "Amos", chapters: 9 },
  { abbreviation: "OBA", name: "Abdias", chapters: 1 },
  { abbreviation: "JON", name: "Jonas", chapters: 4 },
  { abbreviation: "MIC", name: "Michée", chapters: 7 },
  { abbreviation: "NAM", name: "Nahum", chapters: 3 },
  { abbreviation: "HAB", name: "Habacuc", chapters: 3 },
  { abbreviation: "ZEP", name: "Sophonie", chapters: 3 },
  { abbreviation: "HAG", name: "Aggée", chapters: 2 },
  { abbreviation: "ZEC", name: "Zacharie", chapters: 14 },
  { abbreviation: "MAL", name: "Malachie", chapters: 4 },
  { abbreviation: "MAT", name: "Matthieu", chapters: 28 },
  { abbreviation: "MRK", name: "Marc", chapters: 16 },
  { abbreviation: "LUK", name: "Luc", chapters: 24 },
  { abbreviation: "JHN", name: "Jean", chapters: 21 },
  { abbreviation: "ACT", name: "Actes", chapters: 28 },
  { abbreviation: "ROM", name: "Romains", chapters: 16 },
  { abbreviation: "1CO", name: "1 Corinthiens", chapters: 16 },
  { abbreviation: "2CO", name: "2 Corinthiens", chapters: 13 },
  { abbreviation: "GAL", name: "Galates", chapters: 6 },
  { abbreviation: "EPH", name: "Éphésiens", chapters: 6 },
  { abbreviation: "PHP", name: "Philippiens", chapters: 4 },
  { abbreviation: "COL", name: "Colossiens", chapters: 4 },
  { abbreviation: "1TH", name: "1 Thessaloniciens", chapters: 5 },
  { abbreviation: "2TH", name: "2 Thessaloniciens", chapters: 3 },
  { abbreviation: "1TI", name: "1 Timothée", chapters: 6 },
  { abbreviation: "2TI", name: "2 Timothée", chapters: 4 },
  { abbreviation: "TIT", name: "Tite", chapters: 3 },
  { abbreviation: "PHM", name: "Philémon", chapters: 1 },
  { abbreviation: "HEB", name: "Hébreux", chapters: 13 },
  { abbreviation: "JAS", name: "Jacques", chapters: 5 },
  { abbreviation: "1PE", name: "1 Pierre", chapters: 5 },
  { abbreviation: "2PE", name: "2 Pierre", chapters: 3 },
  { abbreviation: "1JN", name: "1 Jean", chapters: 5 },
  { abbreviation: "2JN", name: "2 Jean", chapters: 1 },
  { abbreviation: "3JN", name: "3 Jean", chapters: 1 },
  { abbreviation: "JUD", name: "Jude", chapters: 1 },
  { abbreviation: "REV", name: "Apocalypse", chapters: 22 },
];

export function getBook(abbreviation: string): BibleBook | undefined {
  return BOOKS.find((b) => b.abbreviation === abbreviation);
}

export function getBookName(abbreviation: string): string {
  return getBook(abbreviation)?.name ?? abbreviation;
}
