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
 * Émis après chaque écriture, pour ce qui vit hors des écrans de réglage —
 * la déconnexion automatique, dont le délai est armé par `AppShell`. Sans cet
 * avertissement, un changement de délai n'entrerait en vigueur qu'au prochain
 * chargement complet de l'application.
 */
export const SETTINGS_CHANGED = 'bo:settings-changed';

/** Une date absente ou illisible est réputée infiniment ancienne. */
function auPlusTard(valeur?: string): number {
  const t = valeur ? Date.parse(valeur) : NaN;
  return Number.isNaN(t) ? -Infinity : t;
}

/**
 * La modification locale en attente doit-elle l'emporter sur le distant ?
 *
 * Trois cas, et le troisième est celui qui a coûté cher :
 * - rien en face : le local est tout ce qu'on a, il part ;
 * - le local n'est pas daté (ligne écrite avant l'ajout de `updatedAt`) : le
 *   doute profite au distant, car une valeur parvenue au serveur a au moins
 *   été vue sur un appareil en ligne ;
 * - les deux sont datés : le plus récent gagne, et c'est tout.
 */
function localFaitFoi(
  local: AppSettings,
  remote: Partial<AppSettings> | undefined,
  dateColonne?: string,
): boolean {
  if (!remote) return true;
  if (!local.updatedAt) return false;
  return auPlusTard(local.updatedAt) > auPlusTard(remote.updatedAt ?? dateColonne);
}

/**
 * Réglages : cache local + cloud.
 * - Premier accès de la session (en ligne) : le distant est lu, puis arbitré
 *   contre une éventuelle modification locale en attente (_dirty). Le plus
 *   récent des deux fait foi.
 * - Chaque modification est poussée immédiatement (write-through).
 *
 * La lecture du distant est inconditionnelle, et c'est le point. Elle ne
 * l'était pas : une ligne `_dirty` partait vers le cloud sans que personne
 * n'ait regardé ce qui s'y trouvait, si bien qu'un appareil resté en arrière
 * ramenait sa vieille valeur à chaque session. Couvert par
 * `settings-store.test.ts`.
 */
export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  let local = await db.get('settings', 'app');

  if (!syncedThisSession && isOnline() && local) {
    try {
      const row = await fetchSettings();
      syncedThisSession = true;

      const remote =
        row?.data && typeof row.data === 'object' && Object.keys(row.data).length > 0
          ? (row.data as Partial<AppSettings>)
          : undefined;

      if (local._dirty && localFaitFoi(local, remote, row?.updatedAt)) {
        const clean = stripDirty(local);
        if (await upsertSettings(clean)) {
          await db.put('settings', clean);
          local = clean;
        }
      } else if (remote) {
        const merged = stripDirty({ ...local, ...remote, id: 'app' } as AppSettings);
        await db.put('settings', merged);
        local = merged;
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
  // L'horodatage part avec le reste : c'est lui qui permettra à la session
  // suivante d'arbitrer, ici comme sur les autres appareils.
  const merged = stripDirty({
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  } as AppSettings);
  await store.put(merged);
  await tx.done;

  let pushed = false;
  if (isOnline()) {
    try { pushed = await upsertSettings(merged); } catch { pushed = false; }
  }
  if (!pushed) {
    await db.put('settings', { ...merged, _dirty: true });
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SETTINGS_CHANGED));
  }
}
