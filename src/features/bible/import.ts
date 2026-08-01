import { bulkAddPassages, countPassages } from '@/lib/storage/passage-store';
import type { BiblePassage } from '@/lib/storage/types';

interface SourceVerse {
  verse: number;
  text: string;
}

interface SourceChapter {
  chapter: number;
  verses: SourceVerse[];
}

interface SourceBook {
  abbreviation: string;
  name: string;
  chapters: SourceChapter[];
}

interface SourceBible {
  id: string;
  name: string;
  language: string;
  copyrightStatus: string;
  source: string;
  books: SourceBook[];
}

/**
 * Les six traductions pèsent 40 Mo. Elles étaient chargées par `import()`, ce
 * qui les faisait traverser webpack : autant de chunks JavaScript à produire à
 * chaque build et à parser au chargement. Servies depuis public/, ce sont de
 * simples fichiers statiques que le navigateur récupère et met en cache.
 */
const VERSIONS: { id: string; file: string }[] = [
  { id: 'ls1910', file: 'ls1910.json' },
  { id: 'darby', file: 'darby.json' },
  { id: 'martin1744', file: 'martin.json' },
  { id: 'ostervald', file: 'ostervald.json' },
  { id: 'cramp23', file: 'cramp23.json' },
  { id: 'sacc', file: 'sacc.json' },
  { id: 'perret', file: 'perret.json' },
];

async function loadData(versionId: string): Promise<SourceBible> {
  const version = VERSIONS.find((v) => v.id === versionId);
  if (!version) throw new Error(`Version inconnue: ${versionId}`);

  const res = await fetch(`/bibles/${version.file}`);
  if (!res.ok) {
    throw new Error(`Téléchargement de ${version.file} impossible (${res.status})`);
  }
  return (await res.json()) as SourceBible;
}

export async function importBibleVersion(versionId: string): Promise<number> {
  const existingCount = await countPassages(versionId);
  if (existingCount > 0) return existingCount;

  const data = await loadData(versionId);
  const passages: BiblePassage[] = [];

  for (const book of data.books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        passages.push({
          versionId,
          book: book.abbreviation,
          chapter: chapter.chapter,
          verse: verse.verse,
          text: verse.text,
        });
      }
    }
  }

  await bulkAddPassages(passages);
  return passages.length;
}

export async function importAllBibleData(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  for (const version of VERSIONS) {
    results[version.id] = await importBibleVersion(version.id);
  }
  return results;
}
