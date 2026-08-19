import { describe, it, expect } from 'vitest'
import {
  FONTS, DEFAULT_FONT_ID, fontStack,
  UI_SCALES, DEFAULT_UI_SCALE, uiScale,
  READING_SIZES, DEFAULT_READING_SIZE, readingSize,
  READING_STYLES, DEFAULT_READING_STYLE, readingStyle,
} from './fonts'

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

describe('tailles et styles', () => {
  it('propose quatre échelles d’interface et cinq tailles de lecture', () => {
    expect(UI_SCALES).toHaveLength(4)
    expect(READING_SIZES).toHaveLength(5)
  })

  it('garde « normal » comme défaut des deux, à 100 % et 1rem', () => {
    expect(uiScale(DEFAULT_UI_SCALE)).toBe('100%')
    expect(readingSize(DEFAULT_READING_SIZE)).toBe('1rem')
  })

  it('retombe sur le défaut pour un identifiant inconnu ou absent', () => {
    expect(uiScale('nexistepas')).toBe(uiScale(DEFAULT_UI_SCALE))
    expect(readingSize(undefined)).toBe(readingSize(DEFAULT_READING_SIZE))
    expect(readingStyle('nexistepas')).toEqual(readingStyle(DEFAULT_READING_STYLE))
  })

  it('garde l’échelle d’interface dans une amplitude modeste', () => {
    // Au-delà, la barre latérale et la grille des chapitres se chevauchent.
    const valeurs = UI_SCALES.map((s) => parseFloat(s.value))
    expect(Math.min(...valeurs)).toBeGreaterThanOrEqual(90)
    expect(Math.max(...valeurs)).toBeLessThanOrEqual(120)
  })

  it('rend les quatre combinaisons de style, et arrête le gras à 600', () => {
    expect(READING_STYLES).toHaveLength(4)
    expect(readingStyle('italique')).toEqual({ style: 'italic', weight: '400' })
    expect(readingStyle('gras')).toEqual({ style: 'normal', weight: '600' })
    expect(readingStyle('gras-italique')).toEqual({ style: 'italic', weight: '600' })
    for (const s of READING_STYLES) expect(Number(s.weight)).toBeLessThanOrEqual(600)
  })
})
