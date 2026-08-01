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

/**
 * Répare le cache local des versions où Nahum a été importé sous « NAH ».
 *
 * Le script de téléchargement produisait l'abréviation OSIS `NAH` alors que
 * l'application interroge `NAM` : Nahum était donc invisible dans Darby, Martin
 * et Ostervald. Les fichiers source sont corrigés, mais un appareil déjà
 * utilisé garde ses versets en cache et `importBibleVersion` ne rejoue rien dès
 * qu'une version compte au moins un verset. Cette reprise renomme les clés en
 * place, ce qui évite de réimporter 31 000 versets par version.
 *
 * Sans effet une fois passée : elle ne trouve plus aucun `NAH`.
 */
export async function repairNahumAbbreviation(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('bible_passages', 'readwrite');
  const store = tx.objectStore('bible_passages');
  const index = store.index('by-version-book-chapter-verse');

  const range = IDBKeyRange.bound(
    ['', 'NAH', 0, 0],
    ['￿', 'NAH', Infinity, Infinity],
  );

  let repaired = 0;
  for (const passage of await index.getAll(range)) {
    if (passage.book !== 'NAH') continue;
    await store.put({ ...passage, book: 'NAM' });
    repaired++;
  }
  await tx.done;
  return repaired;
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
