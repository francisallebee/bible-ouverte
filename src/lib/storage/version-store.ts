import type { BibleVersion } from './types';
import { getDB } from './db';

export async function getAllVersions(): Promise<BibleVersion[]> {
  const db = await getDB();
  return db.getAll('bible_versions');
}

export async function getVersionById(id: string): Promise<BibleVersion | undefined> {
  const db = await getDB();
  return db.get('bible_versions', id);
}

export async function addVersion(version: BibleVersion): Promise<void> {
  const db = await getDB();
  await db.add('bible_versions', version);
}

export async function updateVersion(id: string, data: Partial<BibleVersion>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('bible_versions', 'readwrite');
  const store = tx.objectStore('bible_versions');
  const existing = await store.get(id);
  if (!existing) {
    throw new Error(`Version with id ${id} not found`);
  }
  await store.put({ ...existing, ...data });
  await tx.done;
}

export async function getDefaultVersion(): Promise<BibleVersion | undefined> {
  const db = await getDB();
  const settings = await db.get('settings', 'app');
  if (!settings?.defaultVersionId) return undefined;
  return db.get('bible_versions', settings.defaultVersionId);
}
