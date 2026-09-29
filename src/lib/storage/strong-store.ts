import type { EntreeStrong, LexiqueStrong } from './types';
import { getDB } from './db';
import { LEXIQUES_STRONG } from './seed';

/**
 * Le cache local des lexiques Strong : le registre d'un côté, les entrées de
 * l'autre.
 *
 * Ce fichier est à `strong_lexicons` / `strong_entries` ce que `version-store`
 * et `passage-store` sont à `bible_versions` / `bible_passages`. La
 * ressemblance est voulue : la case des Réglages doit commander le cache de la
 * même façon dans les deux cas, et un lecteur qui connaît l'un lit l'autre sans
 * effort.
 *
 * **Rien ne part vers Supabase.** Comme `bible_versions`, ces deux magasins
 * sont purement locaux : ce qu'on coche ici est une préférence d'appareil, pas
 * une donnée de compte. Aucune migration SQL n'accompagne donc cette
 * fonctionnalité — c'est l'exception à la règle d'`AGENTS.md`, et elle tient
 * précisément parce que rien n'est synchronisé.
 */

/**
 * Les deux lexiques, dans l'ordre du registre et non dans celui des clés.
 *
 * `getAll` rend l'ordre de la clé primaire, soit `strong-grec` avant
 * `strong-hebreu` par l'alphabet. À l'écran, cela mettait le Nouveau Testament
 * avant l'Ancien. `LEXIQUES_STRONG` porte l'ordre voulu ; les lexiques
 * inconnus du registre — il ne devrait pas y en avoir — passent à la fin
 * plutôt que de disparaître.
 */
export async function getAllLexiques(): Promise<LexiqueStrong[]> {
  const db = await getDB();
  const tous = await db.getAll('strong_lexicons');
  const rang = new Map(LEXIQUES_STRONG.map((l, i) => [l.id, i]));
  return tous.sort(
    (a, b) => (rang.get(a.id) ?? Infinity) - (rang.get(b.id) ?? Infinity),
  );
}

export async function getEnabledLexiques(): Promise<LexiqueStrong[]> {
  const db = await getDB();
  const tous = await db.getAll('strong_lexicons');
  return tous.filter((l) => l.isEnabled);
}

export async function updateLexique(
  id: string,
  data: Partial<LexiqueStrong>,
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('strong_lexicons', 'readwrite');
  const store = tx.objectStore('strong_lexicons');
  const existant = await store.get(id);
  if (!existant) {
    throw new Error(`Lexique Strong introuvable : ${id}`);
  }
  await store.put({ ...existant, ...data });
  await tx.done;
}

/**
 * Écrit les entrées d'un lexique, et renonce si elles sont déjà là.
 *
 * Le recomptage dans la transaction reprend l'idiome de `bulkAddPassages` : il
 * ne protège pas d'un travail inutile — l'appelant a déjà compté — mais d'un
 * doublon, quand deux écrans montés en même temps demandent le même import.
 * C'est le défaut que `seedIfNeeded` a connu, et la barre latérale appelle
 * bien ces fonctions en parallèle de chaque écran.
 */
export async function bulkAddEntrees(
  lexiqueId: string,
  entrees: EntreeStrong[],
): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('strong_entries', 'readwrite');
  const store = tx.objectStore('strong_entries');

  const dejaLa = await store.index('by-lexique').count(lexiqueId);
  if (dejaLa > 0) {
    await tx.done;
    return 0;
  }

  for (const entree of entrees) {
    await store.put(entree);
  }
  await tx.done;
  return entrees.length;
}

export async function deleteEntreesForLexique(lexiqueId: string): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('strong_entries', 'readwrite');
  const index = tx.objectStore('strong_entries').index('by-lexique');

  let supprimees = 0;
  let curseur = await index.openCursor(IDBKeyRange.only(lexiqueId));
  while (curseur) {
    await curseur.delete();
    supprimees++;
    curseur = await curseur.continue();
  }
  await tx.done;
  return supprimees;
}

export async function countEntrees(lexiqueId: string): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('strong_entries');
  return tx.objectStore('strong_entries').index('by-lexique').count(lexiqueId);
}

/**
 * Une entrée par son numéro — la lecture que fera le clic sur un mot.
 *
 * Par clé primaire, donc sans index à parcourir : le numéro porte déjà son
 * préfixe (`H`/`G`), et les deux lexiques ne peuvent pas se marcher dessus.
 *
 * Rend `undefined` plutôt que de lever quand le numéro est inconnu, et ce cas
 * n'est pas théorique : le lexique dont il dépend peut simplement ne pas être
 * activé sur cet appareil. C'est à l'écran de proposer de l'activer, pas à
 * cette fonction de s'en émouvoir.
 */
export async function getEntreeStrong(numero: string): Promise<EntreeStrong | undefined> {
  const db = await getDB();
  return db.get('strong_entries', numero);
}
