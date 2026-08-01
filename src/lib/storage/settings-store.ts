import type { AppSettings } from './types';
import { getDB } from './db';
import { fetchSettings, upsertSettings } from '@/lib/supabase/store';

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

function stripDirty(s: AppSettings): AppSettings {
  const { _dirty, ...clean } = s;
  return clean as AppSettings;
}

let syncedThisSession = false;

/**
 * Réglages : cache local + cloud.
 * - Premier accès de la session (en ligne) : si une modification locale est en
 *   attente (_dirty) elle est poussée, sinon les réglages distants font foi.
 * - Chaque modification est poussée immédiatement (write-through).
 */
export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  let local = await db.get('settings', 'app');

  if (!syncedThisSession && isOnline() && local) {
    try {
      if (local._dirty) {
        // Modification locale en attente : pousser d'abord
        const clean = stripDirty(local);
        const ok = await upsertSettings(clean);
        if (ok) {
          await db.put('settings', clean);
          local = clean;
        }
        syncedThisSession = true;
      } else {
        // Sinon le cloud fait foi
        const row = await fetchSettings();
        syncedThisSession = true;
        if (row?.data && typeof row.data === 'object' && Object.keys(row.data).length > 0) {
          const merged: AppSettings = { ...local, ...row.data, id: 'app', _dirty: undefined } as AppSettings;
          const clean = stripDirty(merged);
          await db.put('settings', clean);
          local = clean;
        }
      }
    } catch { /* cache local en secours */ }
  }

  return local;
}

export async function updateSettings(data: Partial<AppSettings>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('settings', 'readwrite');
  const store = tx.objectStore('settings');
  const existing = await store.get('app');
  if (!existing) return;
  const merged = stripDirty({ ...existing, ...data } as AppSettings);
  await store.put(merged);
  await tx.done;

  let pushed = false;
  if (isOnline()) {
    try { pushed = await upsertSettings(merged); } catch { pushed = false; }
  }
  if (!pushed) {
    await db.put('settings', { ...merged, _dirty: true });
  }
}
