import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * La table manuelle des lemmes grecs, croisée avec le lexique qu'elle vise.
 *
 * Elle n'était gardée par rien jusqu'au 30 septembre 2026, et ses deux pièges
 * sont muets. Le premier : un numéro qui ne désigne aucune entrée. Le mot
 * garderait alors son `s`, le clic ouvrirait le panneau, et le lecteur lirait
 * « aucune définition » sans que rien n'explique pourquoi — pire qu'un mot sans
 * numéro, qui au moins se dit tel. Le second : un lemme rangé dans deux
 * sections à la fois, `faites` et `ecartes` par exemple, où la décision
 * apparente contredit celle qui s'applique.
 *
 * Le chiffre qui suit n'est pas décoratif. Il a été mesuré trois fois le
 * 29 septembre 2026 et chaque mesure a démenti une méthode : distance d'édition
 * 20 % de faux, substitution de lettre 4 %, concordance 13 %. Les
 * correspondances retenues ne viennent donc d'aucune heuristique — chacune est
 * une variante orthographique, une flexion que Strong porte lui-même, ou un nom
 * propre du même personnage, vue contre l'entrée du lexique.
 */

const racine = join(__dirname, '..', '..', '..')
const manuel = JSON.parse(
  readFileSync(join(racine, 'scripts', 'strong-grec-manuel.json'), 'utf8'),
) as {
  faites: Record<string, string>
  a_faire: Record<string, unknown>
  ambigus: Record<string, unknown>
  ecartes: Record<string, { raison?: string }>
}

const lexique = JSON.parse(
  readFileSync(join(racine, 'public', 'strong', 'grec.json'), 'utf8'),
) as { entries: { number: string }[] }

describe('la table manuelle des lemmes grecs', () => {
  it('ne vise que des numéros que le lexique porte vraiment', () => {
    const connus = new Set(lexique.entries.map((e) => e.number))
    const fantomes = Object.entries(manuel.faites)
      .filter(([, numero]) => !connus.has(numero))
      .map(([lemme, numero]) => `${lemme} → ${numero}`)

    expect(fantomes, 'numéros visés absents du lexique').toEqual([])
  })

  it('écrit ses numéros sous la forme attendue', () => {
    const malformes = Object.entries(manuel.faites)
      .filter(([, numero]) => !/^G\d+$/.test(numero))
      .map(([lemme, numero]) => `${lemme} → ${numero}`)

    expect(malformes, 'numéros mal formés').toEqual([])
  })

  it('ne range aucun lemme dans deux sections à la fois', () => {
    const sections = ['faites', 'a_faire', 'ambigus', 'ecartes'] as const
    // Un objet et non une `Map` : la cible de `tsconfig.json` est antérieure à
    // ES2015, et `[...maMap]` ne compile pas sans `downlevelIteration`.
    const vu: Record<string, string[]> = {}
    for (const section of sections)
      for (const lemme of Object.keys(manuel[section]))
        vu[lemme] = [...(vu[lemme] ?? []), section]

    const doubles = Object.entries(vu)
      .filter(([, ou]) => ou.length > 1)
      .map(([lemme, ou]) => `${lemme} : ${ou.join(' + ')}`)

    expect(doubles, 'lemmes rangés deux fois').toEqual([])
  })

  /**
   * Un écart sans motif n'est pas une décision, c'est un abandon.
   *
   * La différence compte : un lemme écarté ne sera plus repris, et la seule
   * chose qui distingue « examiné, pas de correspondance honnête » de « laissé
   * de côté » est la phrase qui l'accompagne.
   */
  it('donne un motif à chaque lemme écarté', () => {
    const muets = Object.entries(manuel.ecartes)
      .filter(([, e]) => !e.raison?.trim())
      .map(([lemme]) => lemme)

    expect(muets, 'lemmes écartés sans motif').toEqual([])
  })
})
