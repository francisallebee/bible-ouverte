import { describe, it, expect } from 'vitest'
import { joursDepuisTexte, joursDepuisPages, joursDepuisSections, sectionsParTitre, documentDayRows, nomDePlanPour } from './from-document'

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
    expect(joursDepuisTexte('Bonjour\n\nÀ bientôt')).toEqual({ jours: [], rejets: [], lignesIgnorees: 2, sectionsJointes: 0 })
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

/** Un cahier d'étude de six pages : couverture, licence, puis la prose qui cite. */
const PAGES = [
  'Pour une foi réfléchie\nCahier d’étude',
  'Licence accordée pour un usage personnel.\nNe pas copier.',
  '# 1. La Bible, une parole\nOn lit dans Actes 8.30-31 que Philippe… et encore Actes 8.30-31 plus loin.',
  'La suite de la prose, qui cite 2 Timothée 3.16.',
  '# 2. Un canon\nAucune référence sur cette page-ci.',
  'Mais ici Jean 3.16 et Psaume 119.105.',
]

describe('joursDepuisPages — une page à références est un jour', () => {
  it('une page par jour : les pages sans référence rejoignent la suivante, le premier jour porte la couverture', () => {
    const { jours, sectionsJointes } = joursDepuisPages(PAGES)
    expect(jours.map((j) => [j.pageDebut, j.pageFin])).toEqual([[1, 3], [4, 4], [5, 6]])
    expect(sectionsJointes).toBe(3)
    // La référence citée deux fois sur la page ne fait qu'un passage.
    expect(jours[0].passages).toEqual([{ book: 'ACT', chapterStart: 8, chapterEnd: 8, verseStart: 30, verseEnd: 31 }])
    expect(jours[2].passages.map((p) => p.book)).toEqual(['JHN', 'PSA'])
  })
  it('l’aperçu porte la première ligne de la page, sans sa marque de titre', () => {
    expect(joursDepuisPages(PAGES).jours[0].source).toBe('1. La Bible, une parole')
  })
  it('deux pages par jour : le pas groupe, puis la règle s’applique aux groupes', () => {
    const { jours } = joursDepuisPages(PAGES, 2)
    expect(jours.map((j) => [j.pageDebut, j.pageFin])).toEqual([[1, 4], [5, 6]])
  })
  it('les dernières pages sans référence rejoignent le dernier jour', () => {
    const { jours } = joursDepuisPages([...PAGES, 'Table des matières', 'Achevé d’imprimer'])
    expect(jours[jours.length - 1]).toMatchObject({ pageDebut: 5, pageFin: 8 })
  })
  it('un PDF sans aucune référence ne fait aucun jour', () => {
    expect(joursDepuisPages(['Rien', 'Toujours rien']).jours).toEqual([])
  })
  it('le texte n’est pas retenu : le lecteur dessine les pages', () => {
    expect(joursDepuisPages(PAGES).jours.every((j) => j.texte === undefined)).toBe(true)
  })
  it('documentDayRows écrit les bornes de pages', () => {
    const rows = documentDayRows(joursDepuisPages(PAGES).jours, '2026-10-01')
    expect(rows[0]).toMatchObject({ day: 1, date: '2026-10-01', pageDebut: 1, pageFin: 3, book: 'ACT' })
    expect(rows[0]).not.toHaveProperty('texte')
  })
})

describe('sectionsParTitre et le découpage par titre', () => {
  const TEXTE = PAGES.join('\n')
  it('chaque titre ouvre une section ; ce qui précède le premier en est une', () => {
    const sections = sectionsParTitre(TEXTE)
    expect(sections).toHaveLength(3)
    expect(sections[0].texte).toContain('Licence')
    expect(sections[1].texte.startsWith('# 1. La Bible')).toBe(true)
  })
  it('par titre : la couverture rejoint le premier chapitre, chaque chapitre est un jour', () => {
    const { jours, sectionsJointes } = joursDepuisTexte(TEXTE, 'titre')
    expect(jours).toHaveLength(2)
    expect(jours[0].source).toBe('1. La Bible, une parole')
    expect(jours[0].passages.map((p) => p.book)).toEqual(['ACT', '2TI'])
    expect(sectionsJointes).toBe(1)
  })
  it('par titre, en intégral, le jour porte le texte de ses sections, préambule compris', () => {
    const { jours } = joursDepuisTexte(TEXTE, 'titre', 'integral')
    expect(jours[0].texte).toContain('Cahier d’étude')
    expect(jours[0].texte).toContain('# 1. La Bible, une parole')
    expect(jours[1].texte).not.toContain('Philippe')
  })
  it('joursDepuisSections sans page ne met pas de bornes', () => {
    const { jours } = joursDepuisSections([{ texte: 'Jean 3.16' }])
    expect(jours[0]).not.toHaveProperty('pageDebut')
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
