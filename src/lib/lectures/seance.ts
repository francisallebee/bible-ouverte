import type { ReadingEntry, ReadingLink } from "@/lib/storage";

/**
 * Composer les lectures d'une même séance.
 *
 * L'empilement de plusieurs passages sous une même date avait été retiré le
 * 28 août 2026 : le bouton « Ajouter un autre passage » vivait au milieu du
 * formulaire, et les champs restaient remplis après coup. Le propriétaire du
 * dépôt l'a redemandé le 31 août — la fonction lui manquait, l'ergonomie non.
 *
 * **Ce qui change, c'est le partage des champs.** L'ancienne version annonçait
 * que « la date, le contexte, les notes et les médias sont communs à tous les
 * passages » : une note et ses photos étaient donc recopiées à l'identique sur
 * chaque lecture écrite. Onze passages faisaient onze copies de la même image
 * en base64, dans une base où les photos sont déjà une dette connue — et
 * l'historique groupé affichait onze fois la même réflexion.
 *
 * Désormais **seuls la date, le contexte et la version sont communs**. Les
 * notes, les liens, les photos et l'audio suivent le passage auquel ils se
 * rapportent, et repartent avec lui quand on l'ajoute à la séance.
 *
 * **Une lecture par passage reste la règle en base**, et elle n'est pas
 * négociable : les statistiques, la progression et les plans raisonnent tous
 * par lecture. C'est `lib/lectures/saisies.ts` qui les rassemble à
 * l'affichage, en les reconnaissant à leur proximité dans le temps — d'où
 * l'importance d'écrire les lignes d'une même séance à la suite, sans attendre
 * entre elles.
 */

/** Un passage de la séance, avec ce qui n'appartient qu'à lui. */
export interface PassageDeSeance {
  book: string;
  chapterStart: number;
  chapterEnd: number;
  verseStart: number;
  verseEnd: number;
  notes: string;
  links: ReadingLink[];
  photos: string[];
  audio?: string;
}

/** Ce qui vaut pour toute la séance, et ne se ressaisit donc pas. */
export interface CadreDeSeance {
  date: string;
  contextId: string;
  versionId: string;
}

/** Ce qu'`addReading` attend : une ligne sans son identité ni ses dates. */
export type LectureAEcrire = Omit<
  ReadingEntry,
  "id" | "createdAt" | "updatedAt" | "userId"
>;

/**
 * Les lectures à écrire, dans l'ordre où elles ont été saisies.
 *
 * `enCours` est le passage encore dans le formulaire, celui qu'on n'a pas
 * pris la peine d'ajouter. **Il compte**, et c'est ce qui garde le cas simple
 * simple : enregistrer une lecture unique ne doit pas obliger à cliquer
 * « Ajouter ce passage » d'abord. Il est `null` quand aucun livre n'est
 * choisi.
 *
 * Une séance sans aucun passage rend un tableau vide, et non une ligne creuse :
 * des notes seules ne font pas une lecture, la boîte de sortie l'avait déjà
 * établi le 28 août.
 */
export function lecturesDeLaSeance(
  cadre: CadreDeSeance,
  ajoutes: readonly PassageDeSeance[],
  enCours: PassageDeSeance | null,
): LectureAEcrire[] {
  if (!cadre.versionId) return [];
  const tous = enCours ? [...ajoutes, enCours] : [...ajoutes];
  return tous.map((p) => ({
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
    notes: p.notes,
    // `undefined` plutôt qu'un tableau vide : c'est ce que la table attend
    // d'une colonne facultative, et ce que `handleSave` posait déjà.
    links: p.links.length > 0 ? p.links : undefined,
    photos: p.photos.length > 0 ? p.photos : undefined,
    audio: p.audio || undefined,
  }));
}
