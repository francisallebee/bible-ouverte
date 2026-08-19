import { describe, it, expect } from 'vitest'
import { FONTS, DEFAULT_FONT_ID, fontStack } from './fonts'

describe('catalogue de polices', () => {
  it('propose cinq choix, aux identifiants distincts', () => {
    expect(FONTS).toHaveLength(5)
    expect(new Set(FONTS.map((f) => f.id)).size).toBe(5)
  })

  it('garde « Système » comme défaut, et sans téléchargement', () => {
    const defaut = FONTS.find((f) => f.id === DEFAULT_FONT_ID)
    expect(defaut).toBeDefined()
    expect(defaut!.downloaded).toBe(false)
  })

  it('termine chaque pile par une police générique', () => {
    for (const f of FONTS) expect(f.stack).toMatch(/(sans-serif|serif)$/)
  })

  it('laisse toujours un repli système, pour les écritures que ces polices ne couvrent pas', () => {
    // L'arabe n'est couvert par aucune : sans repli, la Van Dyck tomberait
    // sur un rendu de secours imprévisible.
    for (const f of FONTS.filter((x) => x.downloaded)) {
      expect(f.stack.split(',').length).toBeGreaterThan(1)
    }
  })

  it('retombe sur le système pour un identifiant inconnu ou absent', () => {
    expect(fontStack('nexistepas')).toBe(fontStack('systeme'))
    expect(fontStack(undefined)).toBe(fontStack('systeme'))
  })
})
