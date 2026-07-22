import type { BiblePassage } from './types';
import { getDB } from './db';

export async function getPassage(
  versionId: string,
  book: string,
  chapter: number,
  verse: number,
): Promise<BiblePassage | undefined> {
  const db = await getDB();
  const tx = db.transaction('bible_passages');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  return index.get([versionId, book, chapter, verse]);
}

export async function getPassages(
  versionId: string,
  book: string,
  chapter: number,
): Promise<BiblePassage[]> {
  const db = await getDB();
  const tx = db.transaction('bible_passages');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  const range = IDBKeyRange.bound(
    [versionId, book, chapter, 0],
    [versionId, book, chapter, Infinity],
  );
  return index.getAll(range);
}

export async function getPassagesByRange(
  versionId: string,
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
): Promise<BiblePassage[]> {
  const db = await getDB();
  const tx = db.transaction('bible_passages');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  const range = IDBKeyRange.bound(
    [versionId, book, chapter, verseStart],
    [versionId, book, chapter, verseEnd],
  );
  return index.getAll(range);
}

export async function bulkAddPassages(passages: BiblePassage[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('bible_passages', 'readwrite');
  const store = tx.objectStore('bible_passages');
  for (const passage of passages) {
    await store.add(passage);
  }
  await tx.done;
}

export async function countPassages(versionId: string): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('bible_passages');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  const range = IDBKeyRange.bound(
    [versionId, '', 0, 0],
    [versionId, '\uffff', Infinity, Infinity],
  );
  return index.count(range);
}

export async function searchPassages(
  versionId: string,
  query: string,
  limit = 100,
): Promise<BiblePassage[]> {
  const db = await getDB();
  const tx = db.transaction('bible_passages');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  const range = IDBKeyRange.bound(
    [versionId, '', 0, 0],
    [versionId, '\uffff', Infinity, Infinity],
  );
  const all = await index.getAll(range);
  const lower = query.toLowerCase();
  const results: BiblePassage[] = [];
  for (const p of all) {
    if (p.text.toLowerCase().includes(lower)) {
      results.push(p);
      if (results.length >= limit) break;
    }
  }
  return results;
}
