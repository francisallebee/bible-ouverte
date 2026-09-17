import { describe, it, expect } from 'vitest'
import { langueOcr, dimensionsReduites, COTE_MAXIMAL } from './ocr'
import { LOCALES } from '@/lib/i18n/locales'

describe('langueOcr', () => {
  it('donne un dictionnaire Tesseract à chacune des langues de l’interface', () => {
    // La table est lue depuis `LOCALES`, non recopiée : une langue ajoutée
    // demain se mesure ici — et le `Record<Locale, string>` refuse déjà de
    // compiler sans elle.
    for (const { code } of LOCALES) expect(langueOcr(code)).toMatch(/^[a-z]{3}$/)
  })
  it('fra pour le français, ara pour l’arabe', () => {
    expect(langueOcr('fr')).toBe('fra')
    expect(langueOcr('ar')).toBe('ara')
  })
})

describe('dimensionsReduites', () => {
  it('ramène une photo d’iPhone sous le côté maximal, proportions gardées', () => {
    expect(dimensionsReduites(4032, 3024)).toEqual({ largeur: 2000, hauteur: 1500 })
    expect(dimensionsReduites(3024, 4032)).toEqual({ largeur: 1500, hauteur: 2000 })
  })
  it('n’agrandit jamais une petite image', () => {
    expect(dimensionsReduites(800, 600)).toEqual({ largeur: 800, hauteur: 600 })
    expect(dimensionsReduites(COTE_MAXIMAL, 10)).toEqual({ largeur: COTE_MAXIMAL, hauteur: 10 })
  })
  it('ne rend jamais zéro', () => {
    expect(dimensionsReduites(100000, 1)).toEqual({ largeur: 2000, hauteur: 1 })
  })
})
