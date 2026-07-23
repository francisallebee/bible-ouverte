import type { RoadmapItem } from './types';
import { getDB } from './db';

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
