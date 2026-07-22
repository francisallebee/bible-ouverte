import type { ReadingEntry } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-store';

export async function getAllReadings(): Promise<ReadingEntry[]> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const tx = db.transaction('readings');
  const index = tx.objectStore('readings').index('by-date');
  const readings = await index.getAll();
  return readings
    .filter((r) => !r.userId || r.userId === userId)
    .reverse();
}

export async function getReadingById(id: number): Promise<ReadingEntry | undefined> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const reading = await db.get('readings', id);
  if (reading && reading.userId && reading.userId !== userId) return undefined;
  return reading;
}

export async function getReadingsByDateRange(start: string, end: string): Promise<ReadingEntry[]> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const tx = db.transaction('readings');
  const index = tx.objectStore('readings').index('by-date');
  const readings = await index.getAll(IDBKeyRange.bound(start, end));
  return readings.filter((r) => !r.userId || r.userId === userId);
}

export async function getReadingsByContext(contextId: string): Promise<ReadingEntry[]> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const tx = db.transaction('readings');
  const index = tx.objectStore('readings').index('by-context');
  const readings = await index.getAll(contextId);
  return readings.filter((r) => !r.userId || r.userId === userId);
}

export async function getReadingsByBook(book: string): Promise<ReadingEntry[]> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const tx = db.transaction('readings');
  const index = tx.objectStore('readings').index('by-book');
  const readings = await index.getAll(book);
  return readings.filter((r) => !r.userId || r.userId === userId);
}

export async function addReading(
  reading: Omit<ReadingEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
): Promise<number> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const now = new Date().toISOString();
  const entry: ReadingEntry = {
    ...reading,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  return db.add('readings', entry);
}

export async function updateReading(id: number, data: Partial<ReadingEntry>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('readings', 'readwrite');
  const store = tx.objectStore('readings');
  const existing = await store.get(id);
  if (!existing) {
    throw new Error(`Reading with id ${id} not found`);
  }
  const updated: ReadingEntry = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await store.put(updated);
  await tx.done;
}

export async function deleteReading(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('readings', id);
}

export async function getLatestReading(): Promise<ReadingEntry | undefined> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const tx = db.transaction('readings');
  const index = tx.objectStore('readings').index('by-date');
  const cursor = await index.openCursor(null, 'prev');
  if (cursor && (!cursor.value.userId || cursor.value.userId === userId)) return cursor.value;
  return undefined;
}
