import { extraireReferences, type ReferenceExtraite } from '@/lib/import/references'

/**
 * Le repérage des références bibliques **dans le document qu'on lit**.
 *
 * Demandé par le propriétaire le 17 septembre 2026 au soir : « lorsqu'il y a
 * une référence biblique détectée, qu'elle soit mise en évidence, avec la
 * possibilité de l'ajouter à mes lectures ». L'analyseur de l'import
 * (`extraireReferences`) sait *ce qu'il* trouve ; ce module dit *où* — la
 * position de chaque référence dans le texte, et sur une ligne de PDF,
 * l'étendue qu'elle occupe entre les fragments que pdf.js rend.
 *
 * Pur : l'écran pose les surlignages, ici on ne fait que calculer.
 */

export interface ReferenceSituee {
  reference: ReferenceExtraite
  /** Position dans le texte, en caractères, fin exclue. */
  debut: number
  fin: number
}

/**
 * Les références d'un texte, avec leur position — **toutes leurs
 * occurrences**. L'analyseur dédoublonne (« Actes 8.30-31 » cité deux fois
 * n'est rendu qu'une fois : juste pour un plan) ; pour surligner, chaque
 * occurrence compte, et chaque fragment est recherché sur tout le texte.
 * Triées par position, **sans chevauchement** : « Colossiens 3 » est un
 * préfixe de « Colossiens 3.13 », et la plus longue occurrence gagne à sa
 * position — sans quoi le chapitre entier se posait sur le verset, au hasard
 * de l'ordre de l'analyseur (trouvé par la revue du 18 septembre 2026).
 */
export function referencesSituees(texte: string): ReferenceSituee[] {
  const { references } = extraireReferences(texte)
  const candidates: ReferenceSituee[] = []
  for (const reference of references) {
    if (!reference.source) continue
    let i = texte.indexOf(reference.source)
    while (i !== -1) {
      candidates.push({ reference, debut: i, fin: i + reference.source.length })
      i = texte.indexOf(reference.source, i + reference.source.length)
    }
  }
  candidates.sort((a, b) => a.debut - b.debut || b.fin - a.fin)
  const situees: ReferenceSituee[] = []
  let libre = 0
  for (const c of candidates) {
    if (c.debut < libre) continue
    situees.push(c)
    libre = c.fin
  }
  return situees
}

/**
 * La clé d'une référence, par sa **valeur** : deux occurrences de « Actes
 * 8.30-31 » sont deux objets, une seule référence. C'est sur cette clé qu'un
 * lecteur se souvient de ce qu'il a déjà ajouté pendant la séance — une
 * dépendance d'effet sur l'objet lui-même repartait de zéro à chaque
 * occurrence, à chaque zoom d'un PDF, à chaque réouverture du panneau.
 */
export function cleDeReference(r: ReferenceExtraite): string {
  return `${r.book}:${r.chapterStart}:${r.verseStart}-${r.chapterEnd}:${r.verseEnd}`
}

/** Un fragment de texte tel que pdf.js le rend, avec sa place sur la ligne. */
export interface Fragment {
  str: string
  /** Abscisse du début, dans l'unité de la page. */
  x: number
  /** Largeur, même unité. */
  largeur: number
}

/**
 * L'étendue horizontale des caractères `[debut, fin)` d'une ligne faite de
 * fragments mis bout à bout. L'intérieur d'un fragment est interpolé selon
 * `poids` — la largeur d'un texte dans sa police, quand l'écran sait la
 * mesurer ; à défaut son nombre de caractères, qui dérive d'un cran vers la
 * droite après des lettres étroites. `null` si la plage sort de la ligne.
 */
export function etendueDe(
  fragments: readonly Fragment[],
  debut: number,
  fin: number,
  poids: (texte: string) => number = (texte) => texte.length,
): { x0: number; x1: number } | null {
  if (fin <= debut) return null
  const position = (indice: number): number | null => {
    let offset = 0
    for (const f of fragments) {
      const n = f.str.length
      if (indice <= offset + n) {
        const total = poids(f.str)
        const part = total <= 0 ? 0 : poids(f.str.slice(0, indice - offset)) / total
        return f.x + f.largeur * part
      }
      offset += n
    }
    return null
  }
  const x0 = position(debut)
  const x1 = position(fin)
  if (x0 === null || x1 === null) return null
  return { x0: Math.min(x0, x1), x1: Math.max(x0, x1) }
}

/** Le texte d'une ligne : ses fragments mis bout à bout, tels quels. */
export function texteDeLigne(fragments: readonly Fragment[]): string {
  return fragments.map((f) => f.str).join('')
}
