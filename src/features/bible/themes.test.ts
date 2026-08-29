import { describe, it, expect } from 'vitest'
import { THEMES, themeParSlug, livresCites, chapitresDe } from './themes'
import { BOOKS } from './books'
import { fr } from '@/lib/i18n/ui/fr'

/**
 * Ce que ces tests protègent.
 *
 * Une référence fausse dans un thème ne casse ni la compilation ni le lint :
 * elle rend simplement un résultat vide à l'écran, et rien ne le signale. La
 * règle 13 a déjà fait payer exactement cela sur les versions bibliques, où
 * une table oubliée donnait une version qui s'affichait, se laissait cocher et
 * échouait au téléchargement sans autre explication.
 */
describe('table des thèmes', () => {
  it('a des identifiants uniques', () => {
    const slugs = THEMES.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('ne cite que des livres qui existent', () => {
    const connus = new Set(BOOKS.map((b) => b.abbreviation))
    for (const abbreviation of livresCites()) {
      expect(connus.has(abbreviation), abbreviation).toBe(true)
    }
  })

  it('ne cite aucun chapitre au-delà de ce que le livre contient', () => {
    for (const theme of THEMES) {
      for (const passage of theme.passages) {
        const max = chapitresDe(passage.book)
        expect(max, `${passage.book} inconnu`).toBeGreaterThan(0)
        expect(
          passage.chapter,
          `${theme.slug} : ${passage.book} ${passage.chapter} dépasse ${max}`,
        ).toBeLessThanOrEqual(max)
      }
    }
  })

  it('ne rend jamais un intervalle de versets à l’envers', () => {
    for (const theme of THEMES) {
      for (const passage of theme.passages) {
        expect(passage.verseStart, theme.slug).toBeGreaterThanOrEqual(1)
        expect(passage.verseEnd, theme.slug).toBeGreaterThanOrEqual(passage.verseStart)
      }
    }
  })

  it('donne à chaque thème de quoi remplir un écran', () => {
    for (const theme of THEMES) {
      expect(theme.passages.length, theme.slug).toBeGreaterThanOrEqual(4)
    }
  })

  it('se retrouve par identifiant', () => {
    expect(themeParSlug('amour')?.slug).toBe('amour')
    expect(themeParSlug('inconnu')).toBeUndefined()
  })

  /**
   * Le garde-fou qui compte le plus.
   *
   * `tsc` vérifie que les cinq dictionnaires ont les mêmes clés, mais rien ne
   * garantit qu'un thème ajouté ici reçoive son libellé — la table des thèmes
   * et celle des libellés sont indépendantes. C'est précisément le piège des
   * trois tables des versions bibliques, et il se compare dans les deux sens.
   */
  it('a un libellé français pour chaque thème, et pas de libellé orphelin', () => {
    const slugs = THEMES.map((t) => t.slug).sort()
    const libelles = Object.keys(fr.themes.labels).sort()
    expect(libelles).toEqual(slugs)
  })
})
