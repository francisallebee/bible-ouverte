import type { RoadmapItem } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-id';
import {
  fetchRoadmapItems,
  insertRoadmapItem as supabaseInsert,
  updateRoadmapItemRemote as supabaseUpdate,
  deleteRoadmapItemRemote as supabaseDelete,
} from '@/lib/supabase/store';
import type { RoadmapRow } from '@/lib/supabase/store';

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

function rowToItem(r: RoadmapRow): RoadmapItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status as RoadmapItem['status'],
    reactions: r.reactions ?? {},
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    synced: true,
  };
}

/**
 * La feuille de route est un contenu GLOBAL : le cloud fait foi.
 * Migration one-shot : si le cloud est vide et qu'il existe des items locaux
 * (créés avant la sync), ils sont poussés une seule fois (l'appareil admin).
 */
async function syncRoadmap(): Promise<void> {
  let rows = await fetchRoadmapItems();
  if (rows === null) return; // hors ligne / non connecté / erreur : garder le cache

  const db = await getDB();
  const local = await db.getAll('roadmap');

  if (rows.length === 0 && local.length > 0) {
    // Migration : pousse les items locaux (réussira seulement pour un admin, RLS)
    for (const it of local) {
      await supabaseInsert({
        title: it.title,
        description: it.description ?? '',
        status: it.status ?? 'planned',
        reactions: it.reactions ?? {},
      });
    }
    rows = await fetchRoadmapItems();
    if (rows === null) return;
  }

  // Remplace le cache local par l'état distant
  const tx = db.transaction('roadmap', 'readwrite');
  await tx.store.clear();
  for (const r of rows) {
    await tx.store.put(rowToItem(r));
  }
  await tx.done;
}

export async function getAllRoadmapItems(): Promise<RoadmapItem[]> {
  const userId = await getCurrentUserId();
  if (isOnline() && userId !== 'local') {
    try { await syncRoadmap(); } catch { /* cache local en secours */ }
  }
  const db = await getDB();
  const all = await db.getAll('roadmap');
  return all.reverse();
}

export async function addRoadmapItem(item: Omit<RoadmapItem, 'id'>): Promise<number> {
  const db = await getDB();
  if (isOnline()) {
    const created = await supabaseInsert({
      title: item.title,
      description: item.description ?? '',
      status: item.status ?? 'planned',
      reactions: item.reactions ?? {},
    });
    if (created) {
      await db.put('roadmap', rowToItem(created));
      return created.id;
    }
  }
  return db.add('roadmap', item);
}

export async function updateRoadmapItem(id: number, data: Partial<RoadmapItem>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('roadmap', id);
  if (!existing) return;
  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
  await db.put('roadmap', updated);
  if (isOnline() && existing.synced) {
    supabaseUpdate(id, {
      title: updated.title,
      description: updated.description,
      status: updated.status,
      updatedAt: updated.updatedAt,
    }).catch(() => {});
  }
}

export async function deleteRoadmapItem(id: number): Promise<void> {
  const db = await getDB();
  const existing = await db.get('roadmap', id);
  await db.delete('roadmap', id);
  if (isOnline() && existing?.synced) {
    supabaseDelete(id).catch(() => {});
  }
}

export async function toggleReaction(itemId: number, emoji: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('roadmap', itemId);
  if (!item) return;
  const userId = await getCurrentUserId();
  const reactions = { ...(item.reactions ?? {}) };
  if (reactions[userId] === emoji) {
    delete reactions[userId];
  } else {
    reactions[userId] = emoji;
  }
  await db.put('roadmap', { ...item, reactions });
  if (isOnline() && item.synced) {
    supabaseUpdate(itemId, { reactions, updatedAt: new Date().toISOString() }).catch(() => {});
  }
}
