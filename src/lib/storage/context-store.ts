import type { ReadingContext } from './types';
import { getDB } from './db';

export async function getAllContexts(): Promise<ReadingContext[]> {
  const db = await getDB();
  return db.getAll('contexts');
}

export async function getContextById(id: string): Promise<ReadingContext | undefined> {
  const db = await getDB();
  return db.get('contexts', id);
}

export async function addContext(context: ReadingContext): Promise<void> {
  const db = await getDB();
  await db.add('contexts', context);
}

export async function updateContext(id: string, data: Partial<ReadingContext>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('contexts', 'readwrite');
  const store = tx.objectStore('contexts');
  const existing = await store.get(id);
  if (!existing) {
    throw new Error(`Context with id ${id} not found`);
  }
  await store.put({ ...existing, ...data });
  await tx.done;
}

export async function deleteContext(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['contexts', 'readings'], 'readwrite');
  const ctxStore = tx.objectStore('contexts');
  const existing = await ctxStore.get(id);
  if (!existing) return;
  const readingCount = await tx
    .objectStore('readings')
    .index('by-context')
    .count(id);
  if (readingCount === 0) {
    await ctxStore.delete(id);
  }
  await tx.done;
}
