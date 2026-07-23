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

const VERSIONS: { id: string; path: string }[] = [
  { id: 'ls1910', path: '@/data/bibles/ls1910.json' },
  { id: 'darby', path: '@/data/bibles/darby.json' },
  { id: 'martin1744', path: '@/data/bibles/martin.json' },
  { id: 'ostervald', path: '@/data/bibles/ostervald.json' },
  { id: 'cramp23', path: '@/data/bibles/cramp23.json' },
  { id: 'sacc', path: '@/data/bibles/sacc.json' },
];

async function loadData(versionId: string): Promise<SourceBible> {
  switch (versionId) {
    case 'ls1910':
      return (await import('@/data/bibles/ls1910.json')) as unknown as SourceBible;
    case 'darby':
      return (await import('@/data/bibles/darby.json')) as unknown as SourceBible;
    case 'martin1744':
      return (await import('@/data/bibles/martin.json')) as unknown as SourceBible;
    case 'ostervald':
      return (await import('@/data/bibles/ostervald.json')) as unknown as SourceBible;
    case 'cramp23':
      return (await import('@/data/bibles/cramp23.json')) as unknown as SourceBible;
    case 'sacc':
      return (await import('@/data/bibles/sacc.json')) as unknown as SourceBible;
    default:
      throw new Error(`Version inconnue: ${versionId}`);
  }
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
