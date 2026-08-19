import { describe, it, expect } from 'vitest'
import { dayPassages, toDayColumns, dayChapterCount, readingIdsOf, type PlanPassage } from './plan-passages'

const jourAncien = {
  book: 'GEN', chapterStart: 1, chapterEnd: 3, verseStart: 1, verseEnd: 1,
}

const p = (book: string, cs: number, ce = cs): PlanPassage =>
  ({ book, chapterStart: cs, chapterEnd: ce, verseStart: 1, verseEnd: 1 })

describe('lecture des passages d’un jour', () => {
  it('reconstitue un jour ancien depuis ses colonnes', () => {
    expect(dayPassages(jourAncien)).toEqual([jourAncien])
  })

  it('rend les passages quand ils sont enregistrés', () => {
    const passages = [p('GEN', 1, 3), p('MAT', 1)]
    expect(dayPassages({ ...jourAncien, passages })).toEqual(passages)
  })

  it('retombe sur les colonnes si le tableau est vide', () => {
    // Une écriture maladroite peut poser `[]` ; il ne doit pas rendre un jour
    // sans aucun passage, qui n'a pas de sens.
    expect(dayPassages({ ...jourAncien, passages: [] })).toEqual([jourAncien])
  })
})

describe('écriture des colonnes d’un jour', () => {
  it('recopie le premier passage dans les colonnes', () => {
    const cols = toDayColumns([p('GEN', 1, 3), p('MAT', 1)])
    expect(cols.book).toBe('GEN')
    expect(cols.chapterEnd).toBe(3)
  })

  it('n’écrit pas `passages` pour un jour à passage unique', () => {
    // Sinon la base se remplirait de tableaux à un élément, et un jour simple
    // ne s'enregistrerait plus comme avant.
    expect(toDayColumns([p('GEN', 1, 3)]).passages).toBeUndefined()
  })

  it('écrit `passages` dès qu’il y en a plusieurs', () => {
    expect(toDayColumns([p('GEN', 1), p('MAT', 1)]).passages).toHaveLength(2)
  })

  it('refuse un jour sans passage', () => {
    expect(() => toDayColumns([])).toThrow()
  })

  it('fait l’aller-retour sans perte', () => {
    const passages = [p('GEN', 1, 3), p('PSA', 4), p('MAT', 1)]
    const cols = toDayColumns(passages)
    expect(dayPassages({ ...cols, passages: cols.passages })).toEqual(passages)
  })
})

describe('comptage des chapitres', () => {
  it('additionne les plages de tous les passages', () => {
    expect(dayChapterCount([p('GEN', 1, 3), p('MAT', 1)])).toBe(4)
  })

  it('compte au moins un chapitre par passage', () => {
    expect(dayChapterCount([p('JUD', 1, 1)])).toBe(1)
  })
})

describe('lectures rattachées à un jour', () => {
  it('rend celle de la colonne pour un jour ancien', () => {
    expect(readingIdsOf({ ...jourAncien, readingId: 7 })).toEqual([7])
  })

  it('rend une lecture par passage', () => {
    const passages = [
      { ...p('GEN', 1), readingId: 1 },
      { ...p('MAT', 1), readingId: 2 },
    ]
    expect(readingIdsOf({ ...jourAncien, passages, readingId: 1 })).toEqual([1, 2])
  })

  it('ne rend rien tant que le jour n’est pas coché', () => {
    expect(readingIdsOf({ ...jourAncien, passages: [p('GEN', 1), p('MAT', 1)] })).toEqual([])
  })

  it('ne compte pas deux fois un identifiant repris par la colonne', () => {
    const passages = [{ ...p('GEN', 1), readingId: 5 }]
    expect(readingIdsOf({ ...jourAncien, passages, readingId: 5 })).toEqual([5])
  })
})
