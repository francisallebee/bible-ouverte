import type { ReadingEntry } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-id';
import {
  fetchReadings,
  insertReading as supabaseInsert,
  updateReading as supabaseUpdate,
  deleteReading as supabaseDelete,
} from '@/lib/supabase/store';
import type { ReadingRow } from '@/lib/supabase/store';

function rowToEntry(row: ReadingRow): ReadingEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    book: row.book,
    chapterStart: row.chapterStart,
    chapterEnd: row.chapterEnd,
    verseStart: row.verseStart,
    verseEnd: row.verseEnd,
    passageText: row.passageText,
    translationId: row.translationId,
    tags: safeParseArray(row.tags),
    notes: row.notes,
    links: safeParseArray(row.links),
    photos: safeParseArray(row.photos),
    audio: row.audio ? (typeof row.audio === 'string' ? row.audio : '') : '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function entryToRow(entry: ReadingEntry): Omit<ReadingRow, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    user_id: entry.userId,
    date: entry.date,
    book: entry.book,
    chapterStart: entry.chapterStart,
    chapterEnd: entry.chapterEnd,
    verseStart: entry.verseStart,
    verseEnd: entry.verseEnd,
    passageText: entry.passageText,
    translationId: entry.translationId,
    tags: JSON.stringify(entry.tags ?? []),
    notes: entry.notes ?? '',
    links: JSON.stringify(entry.links ?? []),
    photos: JSON.stringify(entry.photos ?? []),
    audio: entry.audio ?? '',
  };
}

function safeParseArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

async function cacheAll(userId: string): Promise<void> {
  const rows = await fetchReadings();
  const db = await getDB();
  const tx = db.transaction('readings', 'readwrite');
  for (const r of rows) {
    await tx.objectStore('readings').put(rowToEntry(r));
  }
  await tx.done;
}

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

export async function getAllReadings(): Promise<ReadingEntry[]> {
  const userId = await getCurrentUserId();
  const db = await getDB();
  const all = await db.getAll('readings');
  const local = all.filter(r => !r.userId || r.userId === userId);
  if (local.length === 0 && isOnline()) {
    await cacheAll(userId);
    const all2 = await db.getAll('readings');
    return all2.filter(r => !r.userId || r.userId === userId).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  }
  if (isOnline()) {
    cacheAll(userId).catch(() => {});
  }
  return local.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

export async function getReadingById(id: number): Promise<ReadingEntry | undefined> {
  const db = await getDB();
  return db.get('readings', id);
}

export async function getReadingsByDateRange(start: string, end: string): Promise<ReadingEntry[]> {
  const userId = await getCurrentUserId();
  const db = await getDB();
  const tx = db.transaction('readings');
  const index = tx.objectStore('readings').index('by-date');
  const readings = await index.getAll(IDBKeyRange.bound(start, end));
  return readings.filter(r => !r.userId || r.userId === userId);
}

export async function getReadingsByTag(tagId: string): Promise<ReadingEntry[]> {
  const userId = await getCurrentUserId();
  const db = await getDB();
  const all = await db.getAll('readings');
  return all.filter(r => r.tags?.includes(tagId) && (!r.userId || r.userId === userId));
}

export async function getReadingsByBook(book: string): Promise<ReadingEntry[]> {
  const userId = await getCurrentUserId();
  const db = await getDB();
  const tx = db.transaction('readings');
  const index = tx.objectStore('readings').index('by-book');
  const readings = await index.getAll(book);
  return readings.filter(r => !r.userId || r.userId === userId);
}

export async function addReading(
  reading: Omit<ReadingEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
): Promise<number> {
  const userId = await getCurrentUserId();
  const now = new Date().toISOString();
  const entry: ReadingEntry = {
    ...reading,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDB();
  const localId = await db.add('readings', entry);

  if (isOnline()) {
    const row = entryToRow({ ...entry, id: localId });
    const created = await supabaseInsert(row);
    if (created) {
      entry.id = created.id;
      await db.put('readings', entry);
      return created.id;
    }
  }
  return localId;
}

export async function updateReading(id: number, data: Partial<ReadingEntry>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('readings', id);
  if (!existing) return;
  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
  await db.put('readings', updated);

  if (isOnline()) {
    supabaseUpdate(id, {
      date: updated.date,
      book: updated.book,
      chapterStart: updated.chapterStart,
      chapterEnd: updated.chapterEnd,
      verseStart: updated.verseStart,
      verseEnd: updated.verseEnd,
      passageText: updated.passageText,
      translationId: updated.translationId,
      tags: JSON.stringify(updated.tags ?? []),
      notes: updated.notes ?? '',
      updatedAt: new Date().toISOString(),
    }).catch(() => {});
  }
}

export async function deleteReading(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('readings', id);
  if (isOnline()) {
    supabaseDelete(id).catch(() => {});
  }
}

export async function getLatestReading(): Promise<ReadingEntry | undefined> {
  const userId = await getCurrentUserId();
  const db = await getDB();
  const tx = db.transaction('readings');
  const index = tx.objectStore('readings').index('by-date');
  const cursor = await index.openCursor(null, 'prev');
  if (cursor && (!cursor.value.userId || cursor.value.userId === userId)) return cursor.value;
  return undefined;
}
