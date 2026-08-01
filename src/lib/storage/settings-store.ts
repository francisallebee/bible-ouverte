import type { AppSettings } from './types';
import { getDB } from './db';
import { fetchSettings, upsertSettings } from '@/lib/supabase/store';

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

let pulledOnce = false;

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  const local = await db.get('settings', 'app');

  // Récupération distante en arrière-plan (une fois par session)
  if (!pulledOnce && isOnline()) {
    pulledOnce = true;
    fetchSettings().then(async (row) => {
      if (row?.data && typeof row.data === 'object' && Object.keys(row.data).length > 0) {
        const db2 = await getDB();
        const current = await db2.get('settings', 'app');
        await db2.put('settings', { ...(current ?? {}), ...row.data, id: 'app' });
      }
    }).catch(() => {});
  }

  return local;
}

export async function updateSettings(data: Partial<AppSettings>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('settings', 'readwrite');
  const store = tx.objectStore('settings');
  const existing = await store.get('app');
  if (!existing) return;
  const merged = { ...existing, ...data };
  await store.put(merged);
  await tx.done;

  if (isOnline()) {
    upsertSettings(merged).catch(() => {});
  }
}
