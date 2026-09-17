import { describe, it, expect } from 'vitest'
import { joursDepuisTexte, documentDayRows, nomDePlanPour } from './from-document'

const PLAN = `Plan de lecture — automne
Semaine 1
Jour 1 : Genèse 1-3, Psaume 1
Jour 2 : Genèse 4-7 ; Psaume 2
Une consigne sans référence
Jour 3 : Matthieu 1
`

describe('joursDepuisTexte — une ligne est un jour', () => {
  it('fait un jour de chaque ligne qui porte une référence, et passe les autres', () => {
    const { jours, rejets, lignesIgnorees } = joursDepuisTexte(PLAN)
    expect(jours.map((j) => j.day)).toEqual([1, 2, 3])
    expect(jours[0].passages).toEqual([
      { book: 'GEN', chapterStart: 1, chapterEnd: 3, verseStart: 1, verseEnd: 24 },
      { book: 'PSA', chapterStart: 1, chapterEnd: 1, verseStart: 1, verseEnd: 6 },
    ])
    expect(jours[1].passages).toHaveLength(2)
    expect(jours[2].passages).toEqual([{ book: 'MAT', chapterStart: 1, chapterEnd: 1, verseStart: 1, verseEnd: 25 }])
    expect(jours[0].source).toBe('Jour 1 : Genèse 1-3, Psaume 1')
    expect(lignesIgnorees).toBe(3)
    expect(rejets).toEqual([])
  })

  it('un passage par jour, quand on le demande', () => {
    const { jours } = joursDepuisTexte(PLAN, 'passage')
    expect(jours).toHaveLength(5)
    expect(jours.map((j) => j.source)).toEqual(['Genèse 1-3', 'Psaume 1', 'Genèse 4-7', 'Psaume 2', 'Matthieu 1'])
    expect(jours.every((j, i) => j.day === i + 1 && j.passages.length === 1)).toBe(true)
  })

  it('remonte les rejets de l’analyseur, avec leur fragment', () => {
    const { jours, rejets } = joursDepuisTexte('Jour 1 : Samuel 3 et Jean 3:40\nJour 2 : Jean 3:16')
    expect(jours).toHaveLength(1)
    expect(rejets.map((r) => r.raison)).toEqual(['ordinal-manquant', 'verset-inexistant'])
  })

  it('un texte sans référence ne fait aucun jour', () => {
    expect(joursDepuisTexte('Bonjour\n\nÀ bientôt')).toEqual({ jours: [], rejets: [], lignesIgnorees: 2 })
  })
})

describe('joursDepuisTexte — le document en entier', () => {
  const DOC = `Méditations d'automne
Jour 1 : Genèse 1
Au commencement, Dieu crée. Relis lentement.
Note ce qui te frappe.
Jour 2 : Genèse 2, Psaume 8
Le repos du septième jour.
`
  it('chaque jour porte sa page : sa ligne et celles qui suivent jusqu’au jour suivant', () => {
    const { jours } = joursDepuisTexte(DOC, 'ligne', 'integral')
    expect(jours).toHaveLength(2)
    expect(jours[0].texte).toBe("Méditations d'automne\nJour 1 : Genèse 1\nAu commencement, Dieu crée. Relis lentement.\nNote ce qui te frappe.")
    expect(jours[1].texte).toBe('Jour 2 : Genèse 2, Psaume 8\nLe repos du septième jour.')
  })
  it('le titre qui précède le premier jour lui revient ; en références seules, aucun texte', () => {
    expect(joursDepuisTexte(DOC).jours.every((j) => j.texte === undefined)).toBe(true)
  })
  it('en découpage par passage, la page va au premier jour de la ligne', () => {
    const { jours } = joursDepuisTexte(DOC, 'passage', 'integral')
    expect(jours).toHaveLength(3)
    expect(jours[1].texte).toBe('Jour 2 : Genèse 2, Psaume 8\nLe repos du septième jour.')
    expect(jours[2].texte).toBeUndefined()
  })
  it('les lignes sans référence comptent toujours comme passées, même gardées dans la page', () => {
    expect(joursDepuisTexte(DOC, 'ligne', 'integral').lignesIgnorees).toBe(4)
  })
  it('documentDayRows écrit le texte quand il y en a, et rien sinon', () => {
    const rows = documentDayRows(joursDepuisTexte(DOC, 'ligne', 'integral').jours, null)
    expect(rows[0].texte).toContain('Au commencement')
    expect(documentDayRows(joursDepuisTexte(DOC).jours, null)[0]).not.toHaveProperty('texte')
  })
})

describe('documentDayRows', () => {
  const { jours } = joursDepuisTexte(PLAN)
  it('daté : une date par jour à partir du début, premier passage dans les colonnes', () => {
    const rows = documentDayRows(jours, '2026-10-01')
    expect(rows.map((r) => r.date)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03'])
    expect(rows[0]).toMatchObject({ day: 1, isRead: false, book: 'GEN', chapterStart: 1, chapterEnd: 3 })
    expect(rows[0].passages).toHaveLength(2)
    // Un jour à un seul passage n'a pas de tableau : la règle de `toDayColumns`.
    expect(rows[2].passages).toBeUndefined()
  })
  it('libre : la date reste vide jusqu’au cochage', () => {
    expect(documentDayRows(jours, null).every((r) => r.date === '')).toBe(true)
  })
})

describe('nomDePlanPour', () => {
  it('retire l’extension et aère le nom', () => {
    expect(nomDePlanPour('plan_lecture-2026.docx')).toBe('plan lecture 2026')
    expect(nomDePlanPour('Culte.pdf')).toBe('Culte')
    expect(nomDePlanPour('sans-extension')).toBe('sans extension')
  })
})
