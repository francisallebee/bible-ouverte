import { VERSETS_PAR_CHAPITRE, VERSETS_MAXIMUM } from './versification';

/**
 * Combien de versets porte un chapitre.
 *
 * Trois sources, dans cet ordre, et l'ordre est tout le sujet.
 *
 * 1. **Le cache**, quand il a répondu (`connus`). Il porte le texte de la
 *    version que l'utilisateur lit réellement, et la versification n'est pas
 *    universelle : Crampon diverge de Louis Segond sur 132 chapitres, Darby
 *    sur 142. Lui seul peut dire la vérité pour cette version-là.
 * 2. **La table de référence**, sinon — le texte n'est pas téléchargé, ou le
 *    cache n'a pas encore répondu. C'est un ordre de grandeur juste, du même
 *    genre que le `chapters` de `books.ts`, qui décide déjà du nombre de
 *    chapitres sans rien lire du cache.
 * 3. **Le plus grand chapitre réel**, 176 versets, pour un livre que la table
 *    ne connaît pas.
 *
 * Ce qui a disparu ici est un `FALLBACK_VERSES = 200` : une valeur qu'aucune
 * des douze versions livrées ne porte nulle part, et que le ticket 25 a
 * rencontrée sur Proverbes 18 — vingt-quatre versets annoncés comme deux
 * cents.
 *
 * `connus` vaut `0` quand le cache a été interrogé et n'a rien trouvé, ce qui
 * n'est pas un compte mais une absence : la table reprend la main.
 */
export function dernierVerset(book: string, chapter: number, connus?: number): number {
  if (connus !== undefined && connus > 0) return connus;
  const livre = VERSETS_PAR_CHAPITRE[book];
  const table = livre?.[chapter - 1];
  return table && table > 0 ? table : VERSETS_MAXIMUM;
}

/**
 * Combien de versets **proposer au choix**, ce qui n'est pas la même question.
 *
 * `dejaSaisi` est la valeur que porte la lecture ouverte. Elle élargit la
 * proposition sans jamais la réduire, et c'est une règle de non-régression :
 * la base porte des lectures enregistrées à `verseEnd = 200` du temps de
 * l'ancien repli — Psaumes 1:1-200, Genèse 20:1-200. Borner la liste au compte
 * réel les rendrait **inatteignables** dans leur propre écran de modification,
 * où le numéro enregistré ne figurerait plus. Une donnée qu'on n'affiche plus
 * est une donnée qu'on ne peut plus corriger.
 *
 * « Tout le chapitre » n'appelle donc pas cette fonction mais `dernierVerset` :
 * ce bouton doit poser le compte réel, jamais l'ancienne valeur héritée.
 */
export function versetsAProposer(
  book: string,
  chapter: number,
  connus?: number,
  dejaSaisi?: number,
): number {
  return Math.max(dernierVerset(book, chapter, connus), dejaSaisi ?? 0, 1);
}

/**
 * Un chapitre **entier**, tel qu'un sélecteur doit le poser par défaut.
 *
 * Jusqu'au 16 septembre 2026, choisir un chapitre posait `1:1` — le premier
 * verset seul — et valider sans toucher aux versets enregistrait ce verset.
 * Un lecteur qui voulait Colossiens 3-4 a ainsi enregistré « Colossiens
 * 3:1-4:1 », et 39 lectures « X n:1 » de la base ont probablement la même
 * origine. Le défaut de départ est le chapitre entier ; restreindre ensuite
 * est un geste, s'arrêter au premier verset par inadvertance n'en est pas un.
 *
 * `connus` vient du cache quand il a répondu — voir `dernierVerset`.
 */
export function chapitreEntier(
  book: string,
  chapter: number,
  connus?: number,
): { chapterStart: number; chapterEnd: number; verseStart: number; verseEnd: number } {
  return {
    chapterStart: chapter,
    chapterEnd: chapter,
    verseStart: 1,
    verseEnd: book ? dernierVerset(book, chapter, connus) : 1,
  };
}
