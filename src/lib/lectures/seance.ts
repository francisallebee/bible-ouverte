import type { ReadingEntry, ReadingLink } from "@/lib/storage";

/**
 * Composer les lectures d'une même séance.
 *
 * L'empilement de plusieurs passages sous une même date avait été retiré le
 * 28 août 2026, puis redemandé le 31 : la fonction manquait, son ergonomie non.
 * Le geste est désormais celui-ci — **valider un passage l'envoie au panneau**,
 * et l'on enchaîne le suivant. Aucun bouton « Ajouter ce passage » : il faisait
 * doublon avec la validation, ce que le commit du 28 août disait déjà.
 *
 * **Ce que le panneau contient, ce sont des références, et rien d'autre.** Le
 * passage part au panneau au moment où on le valide, c'est-à-dire *avant* que
 * les notes et les médias soient saisis — ils sont plus bas dans la colonne.
 * Ils ne peuvent donc pas lui appartenir : ils valent pour **toute la séance**,
 * et sont recopiés sur chacune des lignes écrites.
 *
 * C'est un choix, et il a un prix connu : trois passages annotés d'une même
 * photo font trois copies de la même image en base64, dans une base où les
 * photos sont déjà une dette. Le prix a été pesé contre l'alternative — rendre
 * l'annotation dépendante de l'ordre des gestes — et c'est la prévisibilité qui
 * l'a emporté.
 *
 * **Une lecture par passage reste la règle en base**, et elle n'est pas
 * négociable : les statistiques, la progression et les plans raisonnent tous
 * par lecture. C'est `lib/lectures/saisies.ts` qui les rassemble à
 * l'affichage, en les reconnaissant à leur proximité dans le temps — d'où
 * l'importance d'écrire les lignes d'une même séance à la suite, sans attendre
 * entre elles.
 */

/** Une référence mise au panneau. Rien de plus : voir l'en-tête du module. */
export interface PassageDeSeance {
  book: string;
  chapterStart: number;
  chapterEnd: number;
  verseStart: number;
  verseEnd: number;
}

/** Ce qui vaut pour toute la séance, et se recopie donc sur chaque ligne. */
export interface CadreDeSeance {
  date: string;
  contextId: string;
  versionId: string;
  /**
   * Le titre donné au moment d'enregistrer. Chaîne vide = séance non nommée,
   * ce qui est un cas normal et non un oubli : le bandeau de nommage propose
   * « Enregistrer sans nommer ».
   */
  sessionTitle: string;
  notes: string;
  links: ReadingLink[];
  photos: string[];
  audio?: string;
}

/** Ce qu'`addReading` attend : une ligne sans son identité ni ses dates. */
export type LectureAEcrire = Omit<
  ReadingEntry,
  "id" | "createdAt" | "updatedAt" | "userId"
>;

/**
 * Les lectures à écrire, dans l'ordre où les passages ont été validés.
 *
 * Un panneau vide rend un tableau vide, et non une ligne creuse : des notes
 * seules ne font pas une lecture, la boîte de sortie l'avait déjà établi le
 * 28 août. Sans version non plus — une lecture sans traduction n'a pas de
 * texte.
 */
export function lecturesDeLaSeance(
  cadre: CadreDeSeance,
  passages: readonly PassageDeSeance[],
): LectureAEcrire[] {
  if (!cadre.versionId) return [];
  return passages.map((p) => ({
    date: cadre.date,
    book: p.book,
    chapterStart: p.chapterStart,
    chapterEnd: p.chapterEnd,
    verseStart: p.verseStart,
    verseEnd: p.verseEnd,
    passageText: "",
    translationId: cadre.versionId,
    tags: [],
    contextId: cadre.contextId,
    // Répété sur chaque ligne : c'est ce qui permet de retrouver la séance sans
    // table jointe, et de la nommer après coup depuis n'importe laquelle.
    sessionTitle: cadre.sessionTitle.trim(),
    notes: cadre.notes,
    // `undefined` plutôt qu'un tableau vide : c'est ce que la table attend
    // d'une colonne facultative, et ce que `handleSave` posait déjà.
    links: cadre.links.length > 0 ? cadre.links : undefined,
    photos: cadre.photos.length > 0 ? cadre.photos : undefined,
    audio: cadre.audio || undefined,
  }));
}
