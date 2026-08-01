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
    audio: typeof row.audio === 'string' ? row.audio : '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    synced: true,
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

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

function isMine(r: ReadingEntry, userId: string): boolean {
  return !r.userId || r.userId === userId;
}

/**
 * Pousse vers Supabase les lectures locales jamais synchronisées
 * (créées hors ligne ou avant la mise en place de la sync).
 */
async function pushLocalReadings(userId: string): Promise<void> {
  const db = await getDB();
  const all = await db.getAll('readings');
  const unsynced = all.filter(r => isMine(r, userId) && !r.synced);
  for (const r of unsynced) {
    const created = await supabaseInsert(entryToRow({ ...r, userId }));
    if (created) {
      if (r.id !== undefined && r.id !== created.id) {
        await db.delete('readings', r.id);
      }
      await db.put('readings', rowToEntry(created));
    }
  }
}

/**
 * Récupère les lectures depuis Supabase et met le cache local à jour
 * (ajouts + suppressions effectués sur d'autres appareils).
 */
async function pullReadings(userId: string): Promise<void> {
  const rows = await fetchReadings();
  if (rows === null) return; // hors ligne / non connecté / erreur : ne pas toucher au cache
  const db = await getDB();
  const remoteIds = new Set(rows.map(r => r.id));
  const all = await db.getAll('readings');
  for (const r of all) {
    if (r.userId === userId && r.synced && r.id !== undefined && !remoteIds.has(r.id)) {
      await db.delete('readings', r.id);
    }
  }
  for (const row of rows) {
    await db.put('readings', rowToEntry(row));
  }
}

async function syncReadings(userId: string): Promise<void> {
  await pushLocalReadings(userId);
  await pullReadings(userId);
}

export async function getAllReadings(): Promise<ReadingEntry[]> {
  const userId = await getCurrentUserId();
  if (isOnline() && userId !== 'local') {
    try { await syncReadings(userId); } catch { /* cache local en secours */ }
  }
  const db = await getDB();
  const all = await db.getAll('readings');
  return all
    .filter(r => isMine(r, userId))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
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
  return readings.filter(r => isMine(r, userId));
}

export async function getReadingsByTag(tagId: string): Promise<ReadingEntry[]> {
  const userId = await getCurrentUserId();
  const db = await getDB();
  const all = await db.getAll('readings');
  return all.filter(r => r.tags?.includes(tagId) && isMine(r, userId));
}

export async function getReadingsByBook(book: string): Promise<ReadingEntry[]> {
  const userId = await getCurrentUserId();
  const db = await getDB();
  const tx = db.transaction('readings');
  const index = tx.objectStore('readings').index('by-book');
  const readings = await index.getAll(book);
  return readings.filter(r => isMine(r, userId));
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

  if (isOnline() && userId !== 'local') {
    const created = await supabaseInsert(entryToRow(entry));
    if (created) {
      await db.delete('readings', localId);
      await db.put('readings', rowToEntry(created));
      return created.id;
    }
  }
  return localId;
}

export async function updateReading(id: number, data: Partial<ReadingEntry>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('readings', id);
  if (!existing) return;
  const updated: ReadingEntry = { ...existing, ...data, updatedAt: new Date().toISOString() };
  await db.put('readings', updated);

  // Si jamais synchronisée, elle sera poussée entière au prochain sync.
  if (isOnline() && updated.synced) {
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
      links: JSON.stringify(updated.links ?? []),
      photos: JSON.stringify(updated.photos ?? []),
      audio: updated.audio ?? '',
      updatedAt: updated.updatedAt,
    }).catch(() => {});
  }
}

export async function deleteReading(id: number): Promise<void> {
  const db = await getDB();
  const existing = await db.get('readings', id);
  await db.delete('readings', id);
  if (isOnline() && existing?.synced) {
    supabaseDelete(id).catch(() => {});
  }
}

export async function getLatestReading(): Promise<ReadingEntry | undefined> {
  const userId = await getCurrentUserId();
  const db = await getDB();
  const tx = db.transaction('readings');
  const index = tx.objectStore('readings').index('by-date');
  const cursor = await index.openCursor(null, 'prev');
  if (cursor && isMine(cursor.value, userId)) return cursor.value;
  return undefined;
}
