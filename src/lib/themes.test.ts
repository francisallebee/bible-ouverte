import { describe, it, expect } from 'vitest'
import { COLOR_THEMES, derivedColors, DEFAULT_CUSTOM } from './themes'

describe('chartes livrées', () => {
  it('en compte dix, toutes distinctes', () => {
    expect(COLOR_THEMES).toHaveLength(10)
    expect(new Set(COLOR_THEMES.map((c) => c.id)).size).toBe(10)
    expect(new Set(COLOR_THEMES.map((c) => c.colors.primary)).size).toBe(10)
  })

  it('donne à chacune ses cinq variables, en hexadécimal', () => {
    for (const charte of COLOR_THEMES) {
      const valeurs = Object.values(charte.colors)
      expect(valeurs).toHaveLength(5)
      for (const v of valeurs) expect(v).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('charte personnalisée', () => {
  it('rend les deux couleurs choisies telles quelles', () => {
    const c = derivedColors({ primary: '#123456', accent: '#abcdef' })
    expect(c.primary).toBe('#123456')
    expect(c.accent).toBe('#abcdef')
  })

  it('éclaircit le survol, et bien davantage les fonds', () => {
    const c = derivedColors({ primary: '#000000', accent: '#000000' })
    // Vers le blanc : 18 % pour le survol, 92 % et 93 % pour les fonds.
    expect(c['primary-hover']).toBe('#2e2e2e')
    expect(c['primary-light']).toBe('#ebebeb')
    expect(c['accent-light']).toBe('#ededed')
  })

  it('ne déborde jamais du blanc', () => {
    const c = derivedColors({ primary: '#ffffff', accent: '#ffffff' })
    for (const v of Object.values(c)) expect(v).toBe('#ffffff')
  })

  it('retombe sur la charte par défaut si la valeur est illisible', () => {
    const c = derivedColors({ primary: 'pas une couleur', accent: '' })
    expect(c.primary).toBe(DEFAULT_CUSTOM.primary)
    expect(c.accent).toBe(DEFAULT_CUSTOM.accent)
  })

  it('accepte une valeur sans dièse', () => {
    expect(derivedColors({ primary: '123456', accent: 'abcdef' }).primary).toBe('#123456')
  })
})
