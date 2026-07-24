import type { ReadingContext } from './types';
import { getDB } from './db';
import {
  upsertContext as supabaseUpsertContext,
  deleteContext as supabaseDeleteContext,
} from '@/lib/supabase/write-through';

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
  supabaseUpsertContext(context).catch(() => {});
}

export async function updateContext(id: string, data: Partial<ReadingContext>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('contexts', 'readwrite');
  const store = tx.objectStore('contexts');
  const existing = await store.get(id);
  if (!existing) {
    throw new Error(`Context with id ${id} not found`);
  }
  const updated = { ...existing, ...data };
  await store.put(updated);
  await tx.done;
  supabaseUpsertContext(updated).catch(() => {});
}

export async function deleteContext(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['contexts', 'readings'], 'readwrite');
  const ctxStore = tx.objectStore('contexts');
  const existing = await ctxStore.get(id);
  if (!existing) return;
  const all = await tx.objectStore('readings').getAll();
  const readingCount = all.filter(r => r.tags?.includes(id)).length;
  if (readingCount === 0) {
    await ctxStore.delete(id);
  }
  await tx.done;
  supabaseDeleteContext(id).catch(() => {});
}
