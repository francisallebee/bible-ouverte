'use client'

import type { ReactNode } from 'react'
import { textDirection } from '@/lib/i18n/locales'
import { numeroDuVerset, type Numerotation } from '@/features/bible/numerotation'
import type { BiblePassage } from '@/lib/storage'

/**
 * **Le** point de passage de tout texte biblique affiché.
 *
 * Écrit le 29 septembre 2026, en préalable au dictionnaire et aux codes
 * Strong. Le texte s'affichait jusque-là à six endroits indépendants —
 * l'aperçu, la recherche, le Verset du jour, la Mémorisation, le Détail d'une
 * lecture, le lecteur de document — chacun avec sa balise, sa numérotation et
 * son `dir`. Rendre un mot cliquable y supposait de retrouver les six à la
 * main, et rien n'aurait signalé un oubli : c'est l'inventaire de chemins que
 * `spec/DROITS.md` décrit pour la mention de copyright, et il se règle de la
 * même façon — **un seul endroit, que le typage impose**.
 *
 * Deux entrées, parce qu'il y a deux cas réels et pas un de plus :
 * des **versets** numérotés, ou un **texte** déjà assemblé (le Verset du jour,
 * un extrait). L'appelant garde son habillage par `className` ; ce composant
 * ne décide que de ce qui relève du texte biblique lui-même.
 *
 * **Le sens d'écriture suit la langue du texte, jamais celle de
 * l'interface** : un lecteur francophone peut consulter la Van Dyck, et le
 * bloc doit alors passer de droite à gauche. C'est la règle d'`AGENTS.md`, et
 * la rassembler ici est précisément ce qui l'empêche d'être oubliée au
 * septième endroit.
 *
 * Ce composant est le futur logement du clic sur un mot : quand le
 * dictionnaire arrivera, il n'y aura qu'ici à le brancher.
 */

interface ProprietesCommunes {
  /**
   * La langue du **texte** (`version.language`), d'où vient le sens
   * d'écriture. Absente, on retombe sur le français — le défaut de
   * `textDirection`.
   */
  langue?: string
  /** L'habillage de l'appelant : taille, couleur, espacements. */
  className?: string
}

interface AvecVersets extends ProprietesCommunes {
  versets: readonly BiblePassage[]
  texte?: never
  /** Par défaut : le numéro du verset seul. */
  numerotation?: Numerotation
  /**
   * `blocs` : un paragraphe par verset — le Détail d'une lecture, l'aperçu.
   * `fil` : les versets s'enchaînent dans la même coulée, séparés d'une
   * espace — la recherche et les thèmes, où l'on lit un passage d'un trait.
   * Les deux existaient déjà à l'écran ; le composant les reprend telles
   * quelles plutôt que d'en imposer une.
   */
  disposition?: 'blocs' | 'fil'
  /** L'habillage du numéro, qui diffère d'un écran à l'autre. */
  classeNumero?: string
  /** L'habillage de chaque ligne de verset. */
  classeVerset?: string
}

interface AvecTexte extends ProprietesCommunes {
  /**
   * Un texte déjà assemblé. `ReactNode` et non `string` : la recherche par
   * mot rend le verset **avec son surlignage**, et le lui interdire l'aurait
   * laissée hors du point de passage — c'est-à-dire hors d'atteinte du
   * dictionnaire.
   */
  texte: ReactNode
  /** La balise qui porte le texte ; `span` par défaut. */
  balise?: 'span' | 'p' | 'div'
  versets?: never
  numerotation?: never
  disposition?: never
  classeNumero?: never
  classeVerset?: never
}

export type ProprietesTexteBiblique = AvecVersets | AvecTexte

export default function TexteBiblique(props: ProprietesTexteBiblique) {
  const { langue, className } = props
  const dir = textDirection(langue ?? 'fr')

  // On discrimine sur `versets` et non sur `texte` : `ReactNode` comprend
  // `undefined`, si bien que `texte !== undefined` ne réduit pas l'union.
  if (props.versets === undefined) {
    const Balise = props.balise ?? 'span'
    return (
      <Balise className={`texte-biblique ${className ?? ''}`} dir={dir}>
        {props.texte}
      </Balise>
    )
  }

  const { versets, numerotation = 'verset', disposition = 'blocs', classeNumero, classeVerset } = props
  const premier = versets[0]
  const Ligne = disposition === 'fil' ? 'span' : 'p'

  return (
    <div className={`texte-biblique ${className ?? ''}`} dir={dir}>
      {versets.map((v) => {
        const numero = numeroDuVerset(v, premier, numerotation)
        return (
          <Ligne key={`${v.chapter}-${v.verse}`} className={classeVerset}>
            {numero !== null && (
              <sup className={classeNumero ?? 'text-xs text-[--text-secondary] me-0.5'}>
                {numero}
              </sup>
            )}
            {v.text}
            {/* L'espace qui sépare deux versets au fil du texte : sans elle,
                « …lumière.2Dieu vit… ». Inutile en blocs, où le paragraphe
                fait la séparation. */}
            {disposition === 'fil' && ' '}
          </Ligne>
        )
      })}
    </div>
  )
}
