import type { ReadingContext } from './types';
import { getDB } from './db';
import {
  fetchContexts,
  upsertContext as supabaseUpsert,
  deleteContext as supabaseDelete,
} from '@/lib/supabase/store';

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

async function cacheAll(): Promise<void> {
  const rows = await fetchContexts();
  const db = await getDB();
  const tx = db.transaction('contexts', 'readwrite');
  for (const r of rows) {
    await tx.objectStore('contexts').put({
      id: r.id,
      name: r.name,
      slug: r.slug,
      color: r.color,
      icon: r.icon,
      emoji: r.emoji,
      parentId: r.parentId || undefined,
      isSystemDefault: r.isSystemDefault,
    } as ReadingContext);
  }
  await tx.done;
}

export async function getAllContexts(): Promise<ReadingContext[]> {
  const db = await getDB();
  const local = await db.getAll('contexts');
  if (isOnline()) {
    cacheAll().catch(() => {});
  }
  return local;
}

export async function getContextById(id: string): Promise<ReadingContext | undefined> {
  const db = await getDB();
  return db.get('contexts', id);
}

export async function addContext(context: ReadingContext): Promise<void> {
  const db = await getDB();
  await db.add('contexts', context);
  if (isOnline()) {
    supabaseUpsert({
      id: context.id,
      name: context.name,
      slug: context.slug,
      color: context.color,
      icon: context.icon,
      emoji: context.emoji ?? '',
      parentId: context.parentId ?? '',
      isSystemDefault: context.isSystemDefault,
    }).catch(() => {});
  }
}

export async function updateContext(id: string, data: Partial<ReadingContext>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('contexts', 'readwrite');
  const store = tx.objectStore('contexts');
  const existing = await store.get(id);
  if (!existing) return;
  const updated = { ...existing, ...data };
  await store.put(updated);
  await tx.done;
  if (isOnline()) {
    supabaseUpsert({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      color: updated.color,
      icon: updated.icon,
      emoji: updated.emoji ?? '',
      parentId: updated.parentId ?? '',
      isSystemDefault: updated.isSystemDefault,
    }).catch(() => {});
  }
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
  if (isOnline()) {
    supabaseDelete(id).catch(() => {});
  }
}
