import type { BiblePassage } from './types';
import { getDB } from './db';

/**
 * Écarte les versets écrits plusieurs fois dans le cache.
 *
 * `bible_passages` a une clé primaire auto-incrémentée : la clé naturelle
 * (version, livre, chapitre, verset) n'est qu'un index, et **rien n'y impose
 * l'unicité**. Un même verset peut donc exister en plusieurs exemplaires, et
 * `index.getAll()` les rend tous — d'où des versets affichés en double dans
 * l'aperçu, la recherche et le détail d'une lecture.
 *
 * L'import est désormais atomique et `removeDuplicatePassages` nettoie les
 * caches déjà touchés, mais la lecture se protège elle-même : elle sert des
 * appareils qui n'ont pas encore été réparés, et le coût est celui d'un
 * parcours déjà fait.
 */
function dedupePassages(rows: BiblePassage[]): BiblePassage[] {
  const vus = new Set<string>();
  const uniques: BiblePassage[] = [];
  for (const p of rows) {
    const cle = `${p.book}|${p.chapter}|${p.verse}`;
    if (vus.has(cle)) continue;
    vus.add(cle);
    uniques.push(p);
  }
  return uniques;
}

export async function getPassage(
  versionId: string,
  book: string,
  chapter: number,
  verse: number,
): Promise<BiblePassage | undefined> {
  const db = await getDB();
  const tx = db.transaction('bible_passages');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  return index.get([versionId, book, chapter, verse]);
}

export async function getPassages(
  versionId: string,
  book: string,
  chapter: number,
): Promise<BiblePassage[]> {
  const db = await getDB();
  const tx = db.transaction('bible_passages');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  const range = IDBKeyRange.bound(
    [versionId, book, chapter, 0],
    [versionId, book, chapter, Infinity],
  );
  return dedupePassages(await index.getAll(range));
}

export async function getPassagesByRange(
  versionId: string,
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
): Promise<BiblePassage[]> {
  const db = await getDB();
  const tx = db.transaction('bible_passages');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  const range = IDBKeyRange.bound(
    [versionId, book, chapter, verseStart],
    [versionId, book, chapter, verseEnd],
  );
  return dedupePassages(await index.getAll(range));
}

/**
 * Écrit les versets d'une version, à condition qu'elle soit absente.
 *
 * Le comptage et l'écriture tiennent dans **une seule transaction**, et c'est
 * tout l'intérêt : `importBibleVersion` comptait d'abord, écrivait ensuite, et
 * deux onglets ouverts au premier chargement voyaient tous deux un cache vide
 * avant que l'un ait écrit. La version partait alors deux fois, et chaque
 * verset s'affichait en double partout.
 *
 * IndexedDB sérialise les transactions d'écriture sur un même magasin, entre
 * onglets compris : le second à se présenter compte donc les lignes du premier
 * et renonce. Un verrou en mémoire n'aurait rien pu contre deux onglets, qui
 * sont deux contextes JavaScript distincts.
 *
 * Renvoie le nombre de versets réellement écrits — zéro si la version était
 * déjà là.
 */
/**
 * Les versets d'un intervalle, chapitres multiples compris.
 *
 * Le premier chapitre commence au verset demandé, le dernier s'y arrête, et
 * ceux du milieu sont pris en entier — `999` plutôt qu'un comptage, la borne
 * haute d'`IDBKeyRange` n'ayant pas besoin d'être exacte.
 *
 * Cette boucle vivait dans l'écran Nouvelle lecture ; Recherche biblique en a
 * besoin depuis qu'elle emploie le même sélecteur.
 */
export async function getPassagesForRange(
  versionId: string,
  book: string,
  range: { chapterStart: number; chapterEnd: number; verseStart: number; verseEnd: number },
): Promise<BiblePassage[]> {
  const resultats: BiblePassage[] = [];
  for (let ch = range.chapterStart; ch <= range.chapterEnd; ch++) {
    const vs = ch === range.chapterStart ? range.verseStart : 1;
    const ve = ch === range.chapterEnd ? range.verseEnd : 999;
    resultats.push(...(await getPassagesByRange(versionId, book, ch, vs, ve)));
  }
  return resultats;
}

export async function bulkAddPassages(
  versionId: string,
  passages: BiblePassage[],
): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('bible_passages', 'readwrite');
  const store = tx.objectStore('bible_passages');
  const index = store.index('by-version-book-chapter-verse');

  const dejaLa = await index.count(IDBKeyRange.bound(
    [versionId, '', 0, 0],
    [versionId, '\uffff', Infinity, Infinity],
  ));
  if (dejaLa > 0) {
    await tx.done;
    return 0;
  }

  for (const passage of passages) {
    await store.add(passage);
  }
  await tx.done;
  return passages.length;
}

/**
 * Retire les versets écrits en double sur un appareil déjà touché.
 *
 * La détection est volontairement bon marché : le défaut duplique une version
 * **entière**, un chapitre témoin suffit donc à savoir si elle est concernée.
 * On ne parcourt les 31 000 versets que dans ce cas.
 */
export async function removeDuplicatePassages(versionId: string): Promise<number> {
  const db = await getDB();

  const temoin = await getPassages(versionId, 'GEN', 1);
  if (temoin.length === 0) return 0;
  const brut = await (await getDB())
    .transaction('bible_passages').objectStore('bible_passages')
    .index('by-version-book-chapter-verse')
    .count(IDBKeyRange.bound([versionId, 'GEN', 1, 0], [versionId, 'GEN', 1, Infinity]));
  if (brut === temoin.length) return 0;

  const tx = db.transaction('bible_passages', 'readwrite');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  const range = IDBKeyRange.bound(
    [versionId, '', 0, 0],
    [versionId, '\uffff', Infinity, Infinity],
  );

  const vus = new Set<string>();
  let retires = 0;
  let cursor = await index.openCursor(range);
  while (cursor) {
    const p = cursor.value;
    const cle = `${p.book}|${p.chapter}|${p.verse}`;
    if (vus.has(cle)) {
      await cursor.delete();
      retires++;
    } else {
      vus.add(cle);
    }
    cursor = await cursor.continue();
  }
  await tx.done;
  return retires;
}

/**
 * Efface les versets d'une version, pour rendre l'espace qu'ils occupent.
 *
 * Une version pèse environ 6 Mo en cache. Sur un téléphone à court d'espace,
 * c'est ce qui donne un sens à la case à cocher des réglages. Le texte est
 * réimportable à tout moment depuis `public/bibles/`, aucune donnée
 * personnelle n'est en jeu : les lectures enregistrées gardent leur propre
 * copie du passage dans `passageText`.
 */
export async function deletePassagesForVersion(versionId: string): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('bible_passages', 'readwrite');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  const range = IDBKeyRange.bound(
    [versionId, '', 0, 0],
    [versionId, '￿', Infinity, Infinity],
  );
  let deleted = 0;
  let cursor = await index.openCursor(range);
  while (cursor) {
    await cursor.delete();
    deleted++;
    cursor = await cursor.continue();
  }
  await tx.done;
  return deleted;
}

export async function countPassages(versionId: string): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('bible_passages');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  const range = IDBKeyRange.bound(
    [versionId, '', 0, 0],
    [versionId, '\uffff', Infinity, Infinity],
  );
  return index.count(range);
}

/**
 * Répare le cache local des versions où Nahum a été importé sous « NAH ».
 *
 * Le script de téléchargement produisait l'abréviation OSIS `NAH` alors que
 * l'application interroge `NAM` : Nahum était donc invisible dans Darby, Martin
 * et Ostervald. Les fichiers source sont corrigés, mais un appareil déjà
 * utilisé garde ses versets en cache et `importBibleVersion` ne rejoue rien dès
 * qu'une version compte au moins un verset. Cette reprise renomme les clés en
 * place, ce qui évite de réimporter 31 000 versets par version.
 *
 * Sans effet une fois passée : elle ne trouve plus aucun `NAH`.
 */
export async function repairNahumAbbreviation(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('bible_passages', 'readwrite');
  const store = tx.objectStore('bible_passages');
  const index = store.index('by-version-book-chapter-verse');

  const range = IDBKeyRange.bound(
    ['', 'NAH', 0, 0],
    ['￿', 'NAH', Infinity, Infinity],
  );

  let repaired = 0;
  for (const passage of await index.getAll(range)) {
    if (passage.book !== 'NAH') continue;
    await store.put({ ...passage, book: 'NAM' });
    repaired++;
  }
  await tx.done;
  return repaired;
}

export async function searchPassages(
  versionId: string,
  query: string,
  limit = 100,
): Promise<BiblePassage[]> {
  const db = await getDB();
  const tx = db.transaction('bible_passages');
  const index = tx.objectStore('bible_passages').index('by-version-book-chapter-verse');
  const range = IDBKeyRange.bound(
    [versionId, '', 0, 0],
    [versionId, '\uffff', Infinity, Infinity],
  );
  const all = dedupePassages(await index.getAll(range));
  const lower = query.toLowerCase();
  const results: BiblePassage[] = [];
  for (const p of all) {
    if (p.text.toLowerCase().includes(lower)) {
      results.push(p);
      if (results.length >= limit) break;
    }
  }
  return results;
}
