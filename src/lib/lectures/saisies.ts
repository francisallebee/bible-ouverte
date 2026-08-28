import type { ReadingEntry } from "@/lib/storage";

/**
 * Regrouper les lectures qui viennent d'un même enregistrement.
 *
 * « Mes lectures » affichait une entrée par ligne de la table, ce qui ne
 * correspond pas à ce que le lecteur a fait : jusqu'au 28 août 2026, la page
 * Nouvelle lecture permettait d'empiler plusieurs passages sous une même date,
 * et `handleSave` en écrivait **une lecture par passage** — à dessein, les
 * statistiques, la progression et les plans raisonnant tous par lecture.
 *
 * Une séance du 20 août 2026 a ainsi produit **39 lignes en 2,8 secondes**,
 * toutes de mêmes notes et même contexte, qui occupaient 39 entrées sous la
 * même date. Ce qui fut un geste doit se lire comme un geste.
 *
 * **Le regroupement est un fait d'affichage, et rien d'autre.** Aucune ligne
 * n'est fusionnée en base, aucun comptage n'est touché : la progression, les
 * statistiques et les plans continuent de voir les lectures une par une. Seule
 * la liste les rassemble.
 */

/**
 * L'écart en deçà duquel deux lectures viennent du même enregistrement.
 *
 * **Mesuré, pas choisi.** Sur les 314 lectures réelles au 28 août 2026, les
 * écarts entre créations consécutives d'un même jour se répartissent en deux
 * populations que sépare un creux franc : 125 écarts sous 5 secondes — dont
 * 119 sous la seconde, la cadence d'une boucle d'écriture — puis plus rien
 * avant 5 secondes, et 63 écarts au-delà de 30 secondes, qui sont des saisies
 * humaines distinctes.
 *
 * Le seuil ne peut donc pas être « la même seconde » : la séance de 39
 * passages s'étale sur 2,8 secondes et se serait retrouvée coupée en trois.
 * C'est le **chaînage** qui compte, de proche en proche, et non un découpage
 * du temps en tranches.
 */
export const SEUIL_MEME_SAISIE_MS = 5000;

/** Une saisie : les lectures enregistrées d'un même geste, dans leur ordre. */
export interface Saisie {
  /** Stable d'un rendu à l'autre : l'identifiant de la première lecture. */
  cle: string;
  entrees: ReadingEntry[];
}

/**
 * Une date lisible, ou `null`.
 *
 * `createdAt` vient du cache local autant que de Supabase, et les lignes les
 * plus anciennes du dépôt n'en portaient pas. Une date absente ou illisible ne
 * vaut pas une date : elle empêche de rattacher la ligne à quoi que ce soit.
 */
function instant(entree: ReadingEntry): number | null {
  if (!entree.createdAt) return null;
  const valeur = Date.parse(entree.createdAt);
  return Number.isNaN(valeur) ? null : valeur;
}

/**
 * Les lectures regroupées par enregistrement.
 *
 * Deux lectures appartiennent au même groupe si elles portent la **même date
 * de lecture** et que leurs créations se suivent à moins de `seuilMs`. La date
 * de lecture est exigée en plus de l'écart : rien n'interdit d'enregistrer
 * coup sur coup deux lectures datées de deux jours différents, et les réunir
 * ferait mentir la ligne sur laquelle elles s'affichent.
 *
 * **Une lecture non datable forme son propre groupe.** Ne pas savoir quand une
 * ligne a été écrite n'est pas une raison de la coller à sa voisine : le
 * regroupement ne doit jamais rapprocher deux lectures sur une supposition.
 *
 * Les groupes sortent du plus récent au plus ancien — l'ordre des dates de
 * l'écran —, et chaque groupe garde ses passages dans l'ordre où ils ont été
 * saisis.
 */
export function grouperParSaisie(
  entrees: ReadingEntry[],
  seuilMs: number = SEUIL_MEME_SAISIE_MS,
): Saisie[] {
  if (entrees.length === 0) return [];

  // Le chaînage suppose l'ordre chronologique ; l'ordre d'arrivée ne le
  // garantit pas. Les lectures non datables sont renvoyées en fin de tri, où
  // elles ne coupent aucun groupe en deux.
  const ordonnees = [...entrees].sort((a, b) => {
    const ia = instant(a);
    const ib = instant(b);
    if (ia === null && ib === null) return 0;
    if (ia === null) return 1;
    if (ib === null) return -1;
    return ia - ib;
  });

  const groupes: ReadingEntry[][] = [];
  let courant: ReadingEntry[] = [];
  let precedent: number | null = null;
  let dateCourante = "";

  for (const entree of ordonnees) {
    const quand = instant(entree);
    const suite =
      courant.length > 0
      && quand !== null
      && precedent !== null
      && entree.date === dateCourante
      && quand - precedent < seuilMs;

    if (!suite) {
      if (courant.length > 0) groupes.push(courant);
      courant = [];
      dateCourante = entree.date;
    }
    courant.push(entree);
    precedent = quand;
  }
  if (courant.length > 0) groupes.push(courant);

  // Le plus récent en tête, comme les dates de l'écran. Le repli sur la clé
  // départage les groupes non datables, qui sans cela changeraient d'ordre
  // d'un rendu à l'autre.
  return groupes
    .map((lot) => ({ cle: cleDe(lot), entrees: lot }))
    .sort((a, b) => {
      const ia = instant(a.entrees[0]);
      const ib = instant(b.entrees[0]);
      if (ia === null && ib === null) return a.cle.localeCompare(b.cle);
      if (ia === null) return 1;
      if (ib === null) return -1;
      return ib - ia;
    });
}

/**
 * La clé d'un groupe.
 *
 * L'identifiant de la première lecture, et non son rang : un rang changerait
 * au moindre filtre, et le repli d'un groupe s'appliquerait alors à un autre.
 */
function cleDe(lot: ReadingEntry[]): string {
  const premier = lot[0];
  return premier.id !== undefined ? `s:${premier.id}` : `s:${premier.date}:${premier.createdAt ?? ""}`;
}

/**
 * Les références d'un groupe, dédoublonnées et dans l'ordre.
 *
 * Sert le résumé d'une entrée repliée. Le dédoublonnage compte : une même
 * référence enregistrée deux fois dans le même geste — 9 cas dans les données
 * réelles — n'a pas à s'écrire deux fois sur la même ligne.
 */
export function referencesDe(
  lot: ReadingEntry[],
  nomDuLivre: (code: string) => string,
): string[] {
  const vues = new Set<string>();
  const references: string[] = [];
  for (const entree of lot) {
    const reference = referenceDe(entree, nomDuLivre);
    if (vues.has(reference)) continue;
    vues.add(reference);
    references.push(reference);
  }
  return references;
}

/** « Jean 3:16 », « Jean 3-4:1-5 » — la référence telle qu'elle s'affiche. */
export function referenceDe(
  entree: Pick<ReadingEntry, "book" | "chapterStart" | "chapterEnd" | "verseStart" | "verseEnd">,
  nomDuLivre: (code: string) => string,
): string {
  const chapitres = entree.chapterEnd !== entree.chapterStart
    ? `${entree.chapterStart}-${entree.chapterEnd}`
    : `${entree.chapterStart}`;
  const versets = entree.verseEnd !== entree.verseStart
    ? `${entree.verseStart}-${entree.verseEnd}`
    : `${entree.verseStart}`;
  return `${nomDuLivre(entree.book)} ${chapitres}:${versets}`;
}
