import type { VersetOriginal } from './types';
import { getDB } from './db';

/**
 * Le cache local du texte original — hébreu et grec.
 *
 * Jumeau de `passage-store` pour les traductions, et de `strong-store` pour
 * les lexiques. Purement local, comme eux : rien ne part vers Supabase, donc
 * aucune migration SQL.
 */

/** `GEN.1.1` — la clé, et elle se reconstruit sans lire la donnée. */
export function refOriginale(book: string, chapter: number, verse: number): string {
  return `${book}.${chapter}.${verse}`;
}

/**
 * Écrit les versets d'une langue, et renonce s'ils sont déjà là.
 *
 * Le recomptage dans la transaction reprend l'idiome de `bulkAddPassages` :
 * il ne protège pas d'un travail inutile mais d'un doublon, quand deux écrans
 * montés en même temps demandent le même import.
 */
export async function bulkAddOriginaux(
  langue: string,
  versets: VersetOriginal[],
): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('originaux', 'readwrite');
  const store = tx.objectStore('originaux');

  const dejaLa = await store.index('by-langue').count(langue);
  if (dejaLa > 0) {
    await tx.done;
    return 0;
  }

  for (const verset of versets) {
    await store.put(verset);
  }
  await tx.done;
  return versets.length;
}

export async function deleteOriginauxPourLangue(langue: string): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('originaux', 'readwrite');
  const index = tx.objectStore('originaux').index('by-langue');

  let supprimes = 0;
  let curseur = await index.openCursor(IDBKeyRange.only(langue));
  while (curseur) {
    await curseur.delete();
    supprimes++;
    curseur = await curseur.continue();
  }
  await tx.done;
  return supprimes;
}

export async function countOriginaux(langue: string): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('originaux');
  return tx.objectStore('originaux').index('by-langue').count(langue);
}

/**
 * Les versets originaux d'un passage, dans l'ordre.
 *
 * Lecture par clé primaire, verset par verset : un passage en compte quelques
 * dizaines au plus, et c'est moins cher qu'un parcours d'index. Les versets
 * absents sont **omis sans bruit** — c'est le cas normal quand la langue
 * n'est pas activée, ou quand le passage est dans l'autre testament.
 */
export async function getVersetsOriginaux(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
): Promise<VersetOriginal[]> {
  const db = await getDB();
  const tx = db.transaction('originaux');
  const store = tx.objectStore('originaux');
  const trouves: VersetOriginal[] = [];
  for (let v = verseStart; v <= verseEnd; v++) {
    const verset = await store.get(refOriginale(book, chapter, v));
    if (verset) trouves.push(verset);
  }
  await tx.done;
  return trouves;
}
