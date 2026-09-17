import { describe, it, expect } from 'vitest'
import { referencesSituees, etendueDe, texteDeLigne } from './reperage'

describe('referencesSituees', () => {
  it('situe chaque référence à sa place — toutes les occurrences, là où l’analyseur dédoublonne', () => {
    const texte = 'Voir Actes 8.30-31, puis Jean 3.16, et encore Actes 8.30-31.'
    const s = referencesSituees(texte)
    expect(s.map((r) => [r.reference.book, r.debut, r.fin])).toEqual([
      ['ACT', 5, 18], ['JHN', 25, 34], ['ACT', 46, 59],
    ])
    expect(texte.slice(s[1].debut, s[1].fin)).toBe('Jean 3.16')
    expect(texte.slice(s[2].debut, s[2].fin)).toBe('Actes 8.30-31')
  })
  it('un texte sans référence ne situe rien', () => {
    expect(referencesSituees('Bonjour à tous.')).toEqual([])
  })
})

describe('etendueDe', () => {
  const fragments = [
    { str: 'Voir ', x: 10, largeur: 20 },
    { str: 'Actes 8.30', x: 30, largeur: 50 },
    { str: '.', x: 80, largeur: 2 },
  ]
  it('l’étendue d’une plage qui tient dans un fragment est interpolée', () => {
    // « Actes 8.30 » : caractères 5 à 15, tout le second fragment.
    expect(etendueDe(fragments, 5, 15)).toEqual({ x0: 30, x1: 80 })
    // « Actes » : caractères 5 à 10, la moitié du fragment de 50 de large.
    expect(etendueDe(fragments, 5, 10)).toEqual({ x0: 30, x1: 55 })
  })
  it('une plage qui enjambe deux fragments va du premier au second', () => {
    expect(etendueDe(fragments, 2, 7)).toEqual({ x0: 18, x1: 40 })
  })
  it('avec une mesure de police, l’intérieur d’un fragment suit les largeurs réelles', () => {
    // Une « mesure » où chaque caractère vaut 1 sauf « A », qui vaut 3 : « Actes » pèse 7 sur 12.
    const poids = (s: string) => Array.from(s).reduce((n, c) => n + (c === 'A' ? 3 : 1), 0)
    expect(etendueDe(fragments, 5, 10, poids)).toEqual({ x0: 30, x1: 30 + 50 * 7 / 12 })
  })
  it('hors de la ligne ou vide : null', () => {
    expect(etendueDe(fragments, 5, 5)).toBeNull()
    expect(etendueDe(fragments, 0, 99)).toBeNull()
  })
  it('texteDeLigne recolle les fragments tels quels', () => {
    expect(texteDeLigne(fragments)).toBe('Voir Actes 8.30.')
  })
})
