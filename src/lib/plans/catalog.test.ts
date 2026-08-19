import { describe, it, expect } from 'vitest'
import { PLAN_TEMPLATES, templateDays, templateDaysPassages, findTemplate } from './catalog'
import { getBook } from '@/features/bible'

describe('catalogue', () => {
  it('propose huit modèles aux identifiants distincts', () => {
    expect(PLAN_TEMPLATES).toHaveLength(8)
    expect(new Set(PLAN_TEMPLATES.map((t) => t.id)).size).toBe(8)
  })

  it('ne référence que des livres qui existent', () => {
    for (const modele of PLAN_TEMPLATES) {
      const livres = modele.kind === 'streams'
        ? modele.streams.flat()
        : modele.passages.map((p) => p.book)
      for (const livre of livres) {
        expect(getBook(livre), `${modele.id} : ${livre}`).toBeDefined()
      }
    }
  })

  it('ne référence aucun chapitre au-delà de ce que compte le livre', () => {
    // Une référence thématique fausse passerait inaperçue à l'écran : le jour
    // s'afficherait, et le texte serait simplement introuvable.
    for (const modele of PLAN_TEMPLATES) {
      if (modele.kind !== 'thematic') continue
      for (const p of modele.passages) {
        expect(p.chapterEnd, `${modele.id} : ${p.book} ${p.chapterEnd}`)
          .toBeLessThanOrEqual(getBook(p.book)!.chapters)
        expect(p.chapterStart).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('donne à chaque modèle à flux au moins une durée', () => {
    for (const modele of PLAN_TEMPLATES) {
      if (modele.kind === 'streams') expect(modele.durations.length).toBeGreaterThan(0)
    }
  })
})

describe('durée d’un modèle', () => {
  it('vaut la longueur de la liste pour un thématique', () => {
    const sagesse = findTemplate('sagesse')!
    expect(templateDays(sagesse)).toBe(31)
    // Une durée proposée ne l'étire pas : la liste fait foi.
    expect(templateDays(sagesse, 90)).toBe(31)
  })

  it('retient la durée demandée si le modèle la propose', () => {
    const nt = findTemplate('nouveau-testament')!
    expect(templateDays(nt, 180)).toBe(180)
  })

  it('retombe sur la première durée si celle demandée n’est pas proposée', () => {
    const nt = findTemplate('nouveau-testament')!
    expect(templateDays(nt, 7)).toBe(90)
    expect(templateDays(nt)).toBe(90)
  })
})

describe('génération des jours', () => {
  it('rend un jour par passage pour un thématique', () => {
    const jours = templateDaysPassages(findTemplate('confiance')!)
    expect(jours).toHaveLength(8)
    for (const jour of jours) expect(jour).toHaveLength(1)
  })

  it('rend plusieurs passages par jour pour un modèle à trois flux', () => {
    const jours = templateDaysPassages(findTemplate('at-evangiles-psaumes')!, 365)
    expect(jours).toHaveLength(365)
    // C'est précisément ce que la maille d'un seul livre par jour interdisait.
    expect(jours.some((j) => j.length >= 3)).toBe(true)
  })

  it('couvre chaque flux en entier sur la durée', () => {
    const jours = templateDaysPassages(findTemplate('evangiles-psaumes')!, 60)
    const chapitresDe = (book: string) => jours.flat()
      .filter((p) => p.book === book)
      .reduce((n, p) => n + (p.chapterEnd - p.chapterStart + 1), 0)
    expect(chapitresDe('MAT')).toBe(getBook('MAT')!.chapters)
    expect(chapitresDe('PSA')).toBe(150)
  })
})
