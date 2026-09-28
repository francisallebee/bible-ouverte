import type { PassageThematique } from './themes'

/**
 * Ce qu'un thème écrit par le lecteur doit respecter, et comment il se range
 * à côté de ceux du code.
 *
 * Pur : l'écran valide en appelant ces fonctions, il ne réinvente pas la
 * règle. Le piège 5 du dépôt — un calcul doublé finit par diverger — a été
 * rencontré quatre fois ; la règle vit ici et nulle part ailleurs.
 */

/** Un thème du code, ou un thème du lecteur : ce que le sélecteur propose. */
export interface EntreeDeTheme {
  /** `systeme` : libellé traduit par `slug`. `utilisateur` : nom tel qu'écrit. */
  origine: 'systeme' | 'utilisateur'
  /** `slug` pour un thème du code, `id` pour un thème du lecteur. */
  valeur: string
  libelle: string
  emoji?: string
}

export const NOM_MAX = 60
export const PASSAGES_MAX = 60

export type RaisonInvalide =
  /** Un thème sans nom ne se retrouve pas dans une liste. */
  | 'nom-vide'
  | 'nom-trop-long'
  /** Un thème sans passage n'a rien à montrer. */
  | 'sans-passage'
  | 'trop-de-passages'

/**
 * Valide un thème avant de l'enregistrer. Rend les raisons — au pluriel :
 * un écran qui ne montre que la première fait corriger en trois allers-retours
 * ce qui pouvait l'être en un.
 */
export function validerTheme(nom: string, passages: readonly PassageThematique[]): RaisonInvalide[] {
  const raisons: RaisonInvalide[] = []
  const propre = nom.trim()
  if (propre.length === 0) raisons.push('nom-vide')
  if (propre.length > NOM_MAX) raisons.push('nom-trop-long')
  if (passages.length === 0) raisons.push('sans-passage')
  if (passages.length > PASSAGES_MAX) raisons.push('trop-de-passages')
  return raisons
}

/** La clé d'un passage, par sa valeur : deux fois le même n'entre qu'une fois. */
export function clePassage(p: PassageThematique): string {
  return `${p.book}:${p.chapter}:${p.verseStart}-${p.verseEnd}`
}

/**
 * Ajoute un passage à un thème, sans doublon et **dans l'ordre canonique** —
 * celui de la Bible, donné par `ordreDuLivre`. Un thème se lit du début à la
 * fin ; l'ordre d'ajout, lui, ne dit rien à personne.
 */
export function ajouterPassage(
  passages: readonly PassageThematique[],
  nouveau: PassageThematique,
  ordreDuLivre: (book: string) => number,
): PassageThematique[] {
  const cle = clePassage(nouveau)
  if (passages.some((p) => clePassage(p) === cle)) return [...passages]
  return [...passages, nouveau].sort((a, b) =>
    ordreDuLivre(a.book) - ordreDuLivre(b.book) ||
    a.chapter - b.chapter ||
    a.verseStart - b.verseStart)
}

export function retirerPassage(
  passages: readonly PassageThematique[],
  cible: PassageThematique,
): PassageThematique[] {
  const cle = clePassage(cible)
  return passages.filter((p) => clePassage(p) !== cle)
}
