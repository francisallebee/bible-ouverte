import type { ThemeUtilisateur } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-id';
import {
  fetchUserThemes,
  upsertUserTheme as supabaseUpsert,
  deleteUserTheme as supabaseDelete,
} from '@/lib/supabase/store';

/**
 * Les thèmes que le lecteur écrit lui-même, à côté des quinze du code.
 *
 * Même architecture que les contextes, dont ils sont le jumeau : Supabase fait
 * foi, IndexedDB est un cache, et une création hors ligne part au prochain
 * passage en ligne. C'est pourquoi l'identifiant vient du client et non de la
 * base.
 */

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

function toRemote(t: ThemeUtilisateur) {
  return {
    id: t.id,
    name: t.name,
    emoji: t.emoji ?? '',
    passages: t.passages,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

async function syncUserThemes(): Promise<void> {
  const db = await getDB();
  // 1. Pousse ce qui n'a jamais atteint le cloud.
  const locaux = await db.getAll('user_themes');
  for (const t of locaux.filter((t) => !t.synced)) {
    const ok = await supabaseUpsert(toRemote(t));
    if (ok) await db.put('user_themes', { ...t, synced: true });
  }
  // 2. Relit le distant et purge ce qui a été supprimé sur un autre appareil.
  //    `null` = lecture impossible : on ne purge rien sur un échec réseau,
  //    c'est la règle 3 du dépôt.
  const rows = await fetchUserThemes();
  if (rows === null) return;
  const distants = new Set(rows.map((r) => r.id));
  for (const t of await db.getAll('user_themes')) {
    if (t.synced && !distants.has(t.id)) await db.delete('user_themes', t.id);
  }
  for (const r of rows) {
    await db.put('user_themes', {
      id: r.id,
      name: r.name,
      emoji: r.emoji || undefined,
      passages: Array.isArray(r.passages) ? r.passages : [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      synced: true,
    });
  }
}

export async function getUserThemes(): Promise<ThemeUtilisateur[]> {
  const userId = await getCurrentUserId();
  if (isOnline() && userId !== 'local') {
    try { await syncUserThemes(); } catch { /* cache local en secours */ }
  }
  const db = await getDB();
  const tous = await db.getAll('user_themes');
  return tous.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveUserTheme(theme: ThemeUtilisateur): Promise<void> {
  const db = await getDB();
  const maintenant = new Date().toISOString();
  const ligne: ThemeUtilisateur = {
    ...theme,
    createdAt: theme.createdAt ?? maintenant,
    updatedAt: maintenant,
    synced: false,
  };
  await db.put('user_themes', ligne);
  if (isOnline()) {
    const ok = await supabaseUpsert(toRemote(ligne)).catch(() => false);
    if (ok) await db.put('user_themes', { ...ligne, synced: true });
  }
}

/**
 * La suppression distante est **attendue**, jamais lancée en arrière-plan.
 *
 * Vu le 28 septembre 2026 : sans l'`await`, l'écran resynchronise dans la
 * foulée, relit le serveur avant que le `delete` n'y soit parvenu, et
 * **réécrit le thème supprimé dans le cache local** — la base finit à zéro et
 * l'écran garde un fantôme jusqu'à la synchronisation suivante. C'est la
 * course que `replacePlanDays` avait déjà rencontrée le 17 septembre, dans
 * l'autre sens.
 *
 * L'ordre compte aussi : le distant d'abord, le local ensuite. Un échec
 * réseau laisse alors la ligne des deux côtés — ce qui se rattrape — plutôt
 * que supprimée ici et vivante là-bas, ce qui la ferait revenir.
 */
export async function deleteUserTheme(id: string): Promise<void> {
  const db = await getDB();
  const existant = await db.get('user_themes', id);
  if (existant?.synced && isOnline()) {
    const ok = await supabaseDelete(id).catch(() => false);
    if (!ok) return;
  }
  await db.delete('user_themes', id);
}
