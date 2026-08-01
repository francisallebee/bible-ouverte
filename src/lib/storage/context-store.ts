import type { ReadingContext } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-id';
import {
  fetchContexts,
  upsertContext as supabaseUpsert,
  deleteContext as supabaseDelete,
} from '@/lib/supabase/store';

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

function toRemote(c: ReadingContext) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color,
    icon: c.icon,
    emoji: c.emoji ?? '',
    parentId: c.parentId ?? '',
    isSystemDefault: c.isSystemDefault,
  };
}

async function syncContexts(): Promise<void> {
  const db = await getDB();
  // 1. Pousse les contextes locaux jamais synchronisés
  const all = await db.getAll('contexts');
  for (const c of all.filter(c => !c.synced)) {
    const ok = await supabaseUpsert(toRemote(c));
    if (ok) await db.put('contexts', { ...c, synced: true });
  }
  // 2. Récupère les contextes distants, purge ceux supprimés ailleurs
  const rows = await fetchContexts();
  if (rows === null) return;
  const remoteIds = new Set(rows.map(r => r.id));
  const all2 = await db.getAll('contexts');
  for (const c of all2) {
    if (c.synced && !remoteIds.has(c.id)) {
      await db.delete('contexts', c.id);
    }
  }
  for (const r of rows) {
    await db.put('contexts', {
      id: r.id,
      name: r.name,
      slug: r.slug,
      color: r.color,
      icon: r.icon,
      emoji: r.emoji,
      parentId: r.parentId || undefined,
      isSystemDefault: r.isSystemDefault,
      synced: true,
    } as ReadingContext);
  }
}

export async function getAllContexts(): Promise<ReadingContext[]> {
  const userId = await getCurrentUserId();
  if (isOnline() && userId !== 'local') {
    try { await syncContexts(); } catch { /* cache local en secours */ }
  }
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
  if (isOnline()) {
    const ok = await supabaseUpsert(toRemote(context)).catch(() => false);
    if (ok) await db.put('contexts', { ...context, synced: true });
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
    const ok = await supabaseUpsert(toRemote(updated)).catch(() => false);
    if (ok) await db.put('contexts', { ...updated, synced: true });
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
  if (readingCount === 0 && isOnline() && existing.synced) {
    supabaseDelete(id).catch(() => {});
  }
}
