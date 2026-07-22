import type { AppSettings } from './types';
import { getDB } from './db';

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  return db.get('settings', 'app');
}

export async function updateSettings(data: Partial<AppSettings>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('settings', 'readwrite');
  const store = tx.objectStore('settings');
  const existing = await store.get('app');
  if (!existing) {
    throw new Error('Settings not found');
  }
  await store.put({ ...existing, ...data });
  await tx.done;
}
