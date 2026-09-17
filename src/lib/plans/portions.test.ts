import { describe, it, expect } from 'vitest'
import {
  repartir, parPas, parReperes, reperesUtiles, deplacerFin, deplacerDebut, deplacerDerniereFin,
  fusionner, scinder, ajouter, retirer, titreDe, horsPlan, portionsValides, commencerA, finirA,
} from './portions'

const P = (debut: number, fin: number) => ({ debut, fin })

describe('les découpages rapides', () => {
  it('répartir : des parts égales, les restes sur les premières', () => {
    expect(repartir(1, 10, 3)).toEqual([P(1, 4), P(5, 7), P(8, 10)])
    expect(repartir(3, 12, 5)).toEqual([P(3, 4), P(5, 6), P(7, 8), P(9, 10), P(11, 12)])
  })
  it('répartir : jamais plus de jours que d’unités, jamais moins d’un', () => {
    expect(repartir(1, 3, 10)).toEqual([P(1, 1), P(2, 2), P(3, 3)])
    expect(repartir(1, 3, 0)).toEqual([P(1, 3)])
    expect(repartir(5, 4, 2)).toEqual([])
  })
  it('par pas : N par jour, le reste au dernier', () => {
    expect(parPas(1, 7, 3)).toEqual([P(1, 3), P(4, 6), P(7, 7)])
    expect(parPas(1, 4, 1)).toHaveLength(4)
  })
  it('par repères : un chapitre par jour, la couverture au premier, deux repères sur une page n’en font qu’un', () => {
    const reperes = [{ page: 3, titre: 'I' }, { page: 3, titre: 'I.1' }, { page: 8, titre: 'II' }, { page: 40, titre: 'hors' }]
    expect(parReperes(1, 12, reperes)).toEqual([P(1, 2), P(3, 7), P(8, 12)])
    expect(parReperes(1, 12, [])).toEqual([P(1, 12)])
  })
  it('les repères utiles : le premier rang s’il en a deux, sinon le second', () => {
    const r1 = { page: 1, titre: 'Livre', niveau: 1 as const }
    const enfants = [{ page: 2, titre: 'a', niveau: 2 as const }, { page: 5, titre: 'b', niveau: 2 as const }]
    expect(reperesUtiles([r1, ...enfants])).toEqual(enfants)
    expect(reperesUtiles([r1, { page: 9, titre: 'Livre 2', niveau: 1 }, ...enfants])).toHaveLength(2)
  })
})

describe('les gestes de l’éditeur', () => {
  const base = [P(1, 4), P(5, 7), P(8, 10)]
  it('déplacer une fin déplace le début du voisin, et ne vide personne', () => {
    expect(deplacerFin(base, 0, 6)).toEqual([P(1, 6), P(7, 7), P(8, 10)])
    expect(deplacerFin(base, 0, 7)).toEqual([P(1, 6), P(7, 7), P(8, 10)])
    expect(deplacerFin(base, 0, 0)).toEqual([P(1, 1), P(2, 7), P(8, 10)])
    expect(deplacerFin(base, 2, 20)).toEqual(base)
  })
  it('déplacer un début déplace la fin du voisin ; sur le premier, c’est le début du plan', () => {
    expect(deplacerDebut(base, 1, 3)).toEqual([P(1, 2), P(3, 7), P(8, 10)])
    expect(deplacerDebut(base, 1, 1)).toEqual([P(1, 1), P(2, 7), P(8, 10)])
    expect(deplacerDebut(base, 0, 3)).toEqual([P(3, 4), P(5, 7), P(8, 10)])
    expect(deplacerDebut(base, 0, 9)).toEqual([P(4, 4), P(5, 7), P(8, 10)])
  })
  it('la dernière fin se déplace jusqu’au total', () => {
    expect(deplacerDerniereFin(base, 12, 12)).toEqual([P(1, 4), P(5, 7), P(8, 12)])
    expect(deplacerDerniereFin(base, 99, 12)).toEqual([P(1, 4), P(5, 7), P(8, 12)])
    expect(deplacerDerniereFin(base, 2, 12)).toEqual([P(1, 4), P(5, 7), P(8, 8)])
  })
  it('commencer à / finir à : les jours entièrement dehors disparaissent, le premier ou le dernier est rogné', () => {
    expect(commencerA(base, 3, 10)).toEqual([P(3, 4), P(5, 7), P(8, 10)])
    expect(commencerA(base, 6, 10)).toEqual([P(6, 7), P(8, 10)])
    expect(commencerA(base, 10, 10)).toEqual([P(10, 10)])
    expect(commencerA(base, 1, 10)).toEqual(base)
    expect(finirA(base, 6, 10)).toEqual([P(1, 4), P(5, 6)])
    expect(finirA(base, 2, 10)).toEqual([P(1, 2)])
    expect(finirA(base, 99, 10)).toEqual([P(1, 4), P(5, 7), P(8, 10)])
    expect(portionsValides(commencerA(base, 6, 10)) && portionsValides(finirA(base, 6, 10))).toBe(true)
  })
  it('fusionner, scinder, ajouter, retirer', () => {
    expect(fusionner(base, 0)).toEqual([P(1, 7), P(8, 10)])
    expect(fusionner(base, 2)).toEqual(base)
    expect(scinder(base, 0)).toEqual([P(1, 2), P(3, 4), P(5, 7), P(8, 10)])
    expect(scinder([P(1, 1)], 0)).toEqual([P(1, 1)])
    expect(ajouter(base, 12)).toEqual([...base, P(11, 12)])
    expect(ajouter(base, 10)).toEqual([P(1, 4), P(5, 7), P(8, 9), P(10, 10)])
    expect(retirer(base, 1)).toEqual([P(1, 7), P(8, 10)])
    expect(retirer(base, 0)).toEqual([P(1, 7), P(8, 10)])
    expect(retirer([P(1, 3)], 0)).toEqual([P(1, 3)])
  })
  it('tout geste garde une suite contiguë et sans portion vide', () => {
    let p = repartir(1, 30, 7)
    for (const geste of [
      (x: typeof p) => deplacerFin(x, 2, 9), (x: typeof p) => scinder(x, 4), (x: typeof p) => fusionner(x, 0),
      (x: typeof p) => deplacerDebut(x, 0, 4), (x: typeof p) => retirer(x, 3), (x: typeof p) => ajouter(x, 30),
    ]) {
      p = geste(p)
      expect(portionsValides(p)).toBe(true)
    }
  })
})

describe('le nom et les marges', () => {
  it('le titre : le premier repère de la portion, sinon la première ligne de sa première page', () => {
    const reperes = [{ page: 5, titre: 'Chapitre 2' }]
    const lignes = ['Couverture', '', 'Introduction', 'suite', 'CHAPITRE 2']
    expect(titreDe(P(3, 6), reperes, lignes)).toBe('Chapitre 2')
    expect(titreDe(P(3, 4), reperes, lignes)).toBe('Introduction')
    expect(titreDe(P(2, 2), reperes, lignes)).toBe('')
  })
  it('hors plan : ce qui reste avant et après', () => {
    expect(horsPlan([P(3, 8)], 10)).toEqual({ avant: 2, apres: 2 })
    expect(horsPlan([], 10)).toEqual({ avant: 0, apres: 10 })
  })
})
