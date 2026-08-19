import { describe, it, expect } from 'vitest'
import { templatePlanDays, templateRealDays, templateDayRows } from './from-template'
import { findTemplate } from './catalog'

const SAGESSE = findTemplate('sagesse')!
const NT = findTemplate('nouveau-testament')!
const TROIS_FLUX = findTemplate('at-evangiles-psaumes')!

describe('jours d’un plan bâti sur un modèle', () => {
  it('numérote à partir de 1 et date à partir du départ', () => {
    const jours = templatePlanDays(SAGESSE, '2026-01-01')
    expect(jours[0]).toMatchObject({ day: 1, date: '2026-01-01' })
    expect(jours[1].date).toBe('2026-01-02')
    expect(jours[30].date).toBe('2026-01-31')
  })

  it('franchit un changement de mois sans dériver', () => {
    const jours = templatePlanDays(SAGESSE, '2026-01-25')
    expect(jours[6].date).toBe('2026-01-31')
    expect(jours[7].date).toBe('2026-02-01')
  })

  it('donne un jour par chapitre des Proverbes', () => {
    expect(templatePlanDays(SAGESSE, '2026-01-01')).toHaveLength(31)
  })

  it('n’écarte rien quand aucun jour n’est vide', () => {
    expect(templateRealDays(NT, 90)).toBe(90)
  })

  it('écarte les journées vides et renumérote sans trou', () => {
    // Une durée absurde pour le contenu : les jours sans rien à lire ne
    // doivent pas devenir des lignes qu'on ne peut ni lire ni cocher.
    const jours = templatePlanDays(findTemplate('confiance')!, '2026-01-01')
    expect(jours.map((j) => j.day)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    for (const j of jours) expect(j.passages.length).toBeGreaterThan(0)
  })
})

describe('colonnes écrites', () => {
  it('recopie le premier passage et n’ajoute `passages` que s’il y en a plusieurs', () => {
    const [jour] = templateDayRows(templatePlanDays(SAGESSE, '2026-01-01'))
    expect(jour.book).toBe('PRO')
    expect(jour.chapterStart).toBe(1)
    expect(jour.passages).toBeUndefined()
  })

  it('écrit `passages` pour un modèle à plusieurs flux', () => {
    const jours = templateDayRows(templatePlanDays(TROIS_FLUX, '2026-01-01', 365))
    const multiple = jours.find((j) => j.passages && j.passages.length > 1)
    expect(multiple).toBeDefined()
    // La colonne porte bien le premier passage du jour.
    expect(multiple!.book).toBe(multiple!.passages![0].book)
  })

  it('pose isRead à faux sur chaque jour', () => {
    for (const j of templateDayRows(templatePlanDays(SAGESSE, '2026-01-01'))) {
      expect(j.isRead).toBe(false)
    }
  })
})
