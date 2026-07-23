import type { RoadmapItem } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-id';

export async function getAllRoadmapItems(): Promise<RoadmapItem[]> {
  const db = await getDB();
  const all = await db.getAll('roadmap');
  return all.reverse();
}

export async function addRoadmapItem(item: Omit<RoadmapItem, 'id'>): Promise<number> {
  const db = await getDB();
  return db.add('roadmap', item);
}

export async function updateRoadmapItem(id: number, data: Partial<RoadmapItem>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('roadmap', id);
  if (existing) await db.put('roadmap', { ...existing, ...data });
}

export async function deleteRoadmapItem(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('roadmap', id);
}

export async function toggleReaction(itemId: number, emoji: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('roadmap', itemId);
  if (!item) return;
  const userId = await getCurrentUserId();
  const reactions = item.reactions ?? {};
  if (reactions[userId] === emoji) {
    delete reactions[userId];
  } else {
    reactions[userId] = emoji;
  }
  await db.put('roadmap', { ...item, reactions });
}
