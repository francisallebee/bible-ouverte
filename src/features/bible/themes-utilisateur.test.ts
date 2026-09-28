import { describe, it, expect } from 'vitest'
import { BOOKS } from './books'
import {
  validerTheme, clePassage, ajouterPassage, retirerPassage, NOM_MAX, PASSAGES_MAX,
} from './themes-utilisateur'

const ordre = (book: string) => BOOKS.findIndex((b) => b.abbreviation === book)
const p = (book: string, chapter: number, verseStart: number, verseEnd = verseStart) =>
  ({ book, chapter, verseStart, verseEnd })

describe('validerTheme', () => {
  it('un thème nommé, avec au moins un passage, est valide', () => {
    expect(validerTheme('Le pardon', [p('COL', 3, 13)])).toEqual([])
  })
  it('un nom vide ou fait d’espaces est refusé', () => {
    expect(validerTheme('', [p('COL', 3, 13)])).toEqual(['nom-vide'])
    expect(validerTheme('   ', [p('COL', 3, 13)])).toEqual(['nom-vide'])
  })
  it('un thème sans passage est refusé : il n’aurait rien à montrer', () => {
    expect(validerTheme('Vide', [])).toEqual(['sans-passage'])
  })
  it('les raisons se cumulent — corriger en un aller-retour, pas en trois', () => {
    expect(validerTheme('', [])).toEqual(['nom-vide', 'sans-passage'])
  })
  it('les deux plafonds sont gardés', () => {
    expect(validerTheme('x'.repeat(NOM_MAX), [p('COL', 3, 13)])).toEqual([])
    expect(validerTheme('x'.repeat(NOM_MAX + 1), [p('COL', 3, 13)])).toEqual(['nom-trop-long'])
    const trop = Array.from({ length: PASSAGES_MAX + 1 }, (_, i) => p('PSA', i + 1, 1))
    expect(validerTheme('Trop', trop)).toEqual(['trop-de-passages'])
  })
})

describe('ajouterPassage', () => {
  it('range les passages dans l’ordre de la Bible, pas dans celui des clics', () => {
    let t = ajouterPassage([], p('REV', 21, 4), ordre)
    t = ajouterPassage(t, p('GEN', 1, 1), ordre)
    t = ajouterPassage(t, p('JHN', 3, 16), ordre)
    expect(t.map((x) => x.book)).toEqual(['GEN', 'JHN', 'REV'])
  })
  it('classe aussi par chapitre puis par verset dans un même livre', () => {
    let t = ajouterPassage([], p('PSA', 23, 1), ordre)
    t = ajouterPassage(t, p('PSA', 1, 1), ordre)
    t = ajouterPassage(t, p('PSA', 23, 4), ordre)
    expect(t.map((x) => `${x.chapter}:${x.verseStart}`)).toEqual(['1:1', '23:1', '23:4'])
  })
  it('le même passage deux fois n’entre qu’une fois', () => {
    const t = ajouterPassage([p('COL', 3, 13)], p('COL', 3, 13), ordre)
    expect(t).toHaveLength(1)
  })
  it('deux étendues différentes du même chapitre sont deux passages', () => {
    const t = ajouterPassage([p('COL', 3, 13)], p('COL', 3, 12, 13), ordre)
    expect(t).toHaveLength(2)
    expect(clePassage(t[0])).not.toBe(clePassage(t[1]))
  })
})

describe('retirerPassage', () => {
  it('retire par la valeur, et laisse le reste intact', () => {
    const t = [p('GEN', 1, 1), p('JHN', 3, 16)]
    expect(retirerPassage(t, p('GEN', 1, 1)).map((x) => x.book)).toEqual(['JHN'])
  })
  it('retirer ce qui n’y est pas ne change rien', () => {
    const t = [p('GEN', 1, 1)]
    expect(retirerPassage(t, p('REV', 22, 21))).toHaveLength(1)
  })
})
