import type { MemorisedVerse } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-id';
import {
  fetchMemorised, insertMemorised, updateMemorisedRemote, deleteMemorisedRemote,
  type MemorisedRow,
} from '@/lib/supabase/store';

/**
 * Les versets en cours d'apprentissage.
 *
 * Supabase fait foi, IndexedDB met en cache — même discipline que le reste.
 * À la différence des parties de jeu, **l'état est réellement synchronisé** :
 * réviser sur le téléphone doit avancer l'échéance vue sur l'ordinateur, sans
 * quoi le même verset se présenterait deux fois.
 */

function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

function ligneVersVerset(r: MemorisedRow): MemorisedVerse {
  return {
    id: r.id,
    userId: r.user_id,
    book: r.book,
    chapter: r.chapter,
    verse: r.verse,
    versionId: r.versionId,
    niveau: r.niveau,
    prochain: r.prochain,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    synced: true,
  };
}

/** Tous les versets suivis, le plus proche à revoir en premier. */
export async function getMemorised(): Promise<MemorisedVerse[]> {
  const userId = await getCurrentUserId();

  if (isOnline() && userId !== 'local') {
    const distants = await fetchMemorised();
    if (distants) {
      const db = await getDB();
      const tx = db.transaction('memorised_verses', 'readwrite');
      // Le distant fait foi : on remplace, sauf ce qui n'a jamais été poussé.
      const locaux = await tx.store.getAll();
      for (const l of locaux) {
        if (l.synced) await tx.store.delete(l.id as number);
      }
      for (const d of distants) await tx.store.put(ligneVersVerset(d));
      await tx.done;
    }
  }

  const db = await getDB();
  const tous = await db.getAll('memorised_verses');
  return tous.sort((a, b) => a.prochain.localeCompare(b.prochain));
}

/**
 * Met un verset en apprentissage.
 *
 * Rend le verset déjà suivi s'il l'était : la contrainte d'unicité de la base
 * l'interdit en double, et l'écran doit alors reprendre le suivi existant
 * plutôt que d'annoncer une erreur.
 */
export async function addMemorised(
  verset: { book: string; chapter: number; verse: number; versionId: string; prochain: string },
): Promise<MemorisedVerse | null> {
  const userId = await getCurrentUserId();
  const deja = (await getMemorised()).find(
    (v) => v.book === verset.book && v.chapter === verset.chapter
      && v.verse === verset.verse && v.versionId === verset.versionId,
  );
  if (deja) return deja;

  const maintenant = new Date().toISOString();
  const complet: MemorisedVerse = {
    ...verset, userId, niveau: 0, createdAt: maintenant, updatedAt: maintenant, synced: false,
  };

  if (isOnline() && userId !== 'local') {
    const distant = await insertMemorised(complet);
    if (distant) {
      const db = await getDB();
      const enregistre = ligneVersVerset(distant);
      await db.put('memorised_verses', enregistre);
      return enregistre;
    }
  }

  const db = await getDB();
  const id = await db.add('memorised_verses', complet);
  return { ...complet, id: id as number };
}

/** Enregistre l'issue d'une séance : nouveau niveau, nouvelle échéance. */
export async function updateMemorised(
  verset: MemorisedVerse, niveau: number, prochain: string,
): Promise<MemorisedVerse> {
  const suivant: MemorisedVerse = {
    ...verset, niveau, prochain, updatedAt: new Date().toISOString(),
  };

  if (isOnline() && verset.synced && verset.id) {
    await updateMemorisedRemote(verset.id, { niveau, prochain, updatedAt: suivant.updatedAt });
  }
  const db = await getDB();
  await db.put('memorised_verses', suivant);
  return suivant;
}

export async function removeMemorised(verset: MemorisedVerse): Promise<void> {
  if (isOnline() && verset.synced && verset.id) await deleteMemorisedRemote(verset.id);
  if (verset.id) {
    const db = await getDB();
    await db.delete('memorised_verses', verset.id);
  }
}
