/**
 * Le numéro affiché devant un verset.
 *
 * Sorti des écrans le 29 septembre 2026, en préalable au dictionnaire et aux
 * codes Strong : le texte biblique s'affichait à **six endroits
 * indépendants**, chacun avec sa propre façon de numéroter, et rien ne
 * garantissait qu'on les trouverait tous. Un composant unique les rassemble
 * (`components/TexteBiblique.tsx`) ; cette règle-ci est ce qu'il fallait en
 * extraire d'abord, parce qu'elle **diffère d'un écran à l'autre** et qu'un
 * refactoring ne doit rien changer à ce qui s'affiche.
 *
 * Les trois formes existantes sont reproduites telles quelles, y compris
 * `depuis-le-debut`, qui surprend : dans le Détail d'une lecture, seul le tout
 * premier verset porte son numéro seul, tous les autres portent
 * « chapitre:verset » — même à l'intérieur du chapitre. C'est le comportement
 * livré, il est donc gardé et documenté plutôt que corrigé en passant ; le
 * corriger est une décision, pas un effet de bord.
 */

export type Numerotation =
  /** Le numéro du verset seul : « 16 ». L'aperçu, la recherche, les thèmes. */
  | 'verset'
  /**
   * « chapitre:verset » dès que le verset n'est pas celui d'où l'on part.
   * Le Détail d'une lecture, qui peut enjamber plusieurs chapitres.
   */
  | 'depuis-le-debut'
  /** Rien devant le texte : le Verset du jour, la Mémorisation. */
  | 'aucune'

export interface VersetNumerote {
  chapter: number
  verse: number
}

/**
 * @param verset  Le verset à numéroter.
 * @param premier Le premier verset de la plage — ce dont `depuis-le-debut`
 *                se sert pour décider. Ignoré par les deux autres formes.
 * @returns La chaîne à afficher, ou `null` quand rien ne s'affiche.
 */
export function numeroDuVerset(
  verset: VersetNumerote,
  premier: VersetNumerote | undefined,
  forme: Numerotation,
): string | null {
  if (forme === 'aucune') return null
  if (forme === 'verset') return String(verset.verse)
  // `depuis-le-debut` : sans point de départ, on ne peut que rendre le verset.
  if (!premier) return String(verset.verse)
  const estLePremier = verset.chapter === premier.chapter && verset.verse === premier.verse
  return estLePremier ? String(verset.verse) : `${verset.chapter}:${verset.verse}`
}
