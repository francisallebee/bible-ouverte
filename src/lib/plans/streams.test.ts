import { describe, it, expect } from 'vitest'
import { flattenStream, compressChapters, sliceIntoDays, generateStreamDays } from './streams'
import { getBook } from '@/features/bible'

describe('mise à plat d’un flux', () => {
  it('déroule les chapitres livre après livre, dans l’ordre donné', () => {
    const suite = flattenStream(['JUD', 'PHM'])
    expect(suite).toEqual([
      { book: 'JUD', chapter: 1 },
      { book: 'PHM', chapter: 1 },
    ])
  })

  it('donne à chaque livre son compte réel de chapitres', () => {
    expect(flattenStream(['MAT'])).toHaveLength(getBook('MAT')!.chapters)
  })

  it('ignore un livre inconnu plutôt que de rendre une suite trouée', () => {
    expect(flattenStream(['PASUNLIVRE', 'JUD'])).toEqual([{ book: 'JUD', chapter: 1 }])
  })
})

describe('recomposition en plages', () => {
  it('réunit des chapitres consécutifs d’un même livre', () => {
    const p = compressChapters([
      { book: 'GEN', chapter: 1 }, { book: 'GEN', chapter: 2 }, { book: 'GEN', chapter: 3 },
    ])
    expect(p).toHaveLength(1)
    expect(p[0]).toMatchObject({ book: 'GEN', chapterStart: 1, chapterEnd: 3 })
  })

  it('coupe au changement de livre', () => {
    const p = compressChapters([
      { book: 'GEN', chapter: 50 }, { book: 'EXO', chapter: 1 },
    ])
    expect(p.map((x) => x.book)).toEqual(['GEN', 'EXO'])
  })

  it('ne réunit pas des chapitres non contigus', () => {
    const p = compressChapters([{ book: 'PSA', chapter: 1 }, { book: 'PSA', chapter: 5 }])
    expect(p).toHaveLength(2)
  })

  it('rend un tableau vide pour une journée sans chapitre', () => {
    expect(compressChapters([])).toEqual([])
  })
})

describe('découpe en jours', () => {
  it('rend exactement le nombre de jours demandé', () => {
    expect(sliceIntoDays([1, 2, 3, 4, 5], 3)).toHaveLength(3)
  })

  it('n’oublie ni ne duplique aucun élément', () => {
    const suite = Array.from({ length: 97 }, (_, i) => i)
    const parts = sliceIntoDays(suite, 13)
    expect(parts.flat()).toEqual(suite)
  })

  it('répartit sans laisser le reliquat au dernier jour', () => {
    // Le piège du pas arrondi cumulé : la dernière part doublait de taille.
    const parts = sliceIntoDays(Array.from({ length: 100 }, (_, i) => i), 7)
    const tailles = parts.map((p) => p.length)
    expect(Math.max(...tailles) - Math.min(...tailles)).toBeLessThanOrEqual(1)
  })

  it('laisse des jours vides si le flux est plus court que la durée', () => {
    const parts = sliceIntoDays([1, 2], 5)
    expect(parts.filter((p) => p.length === 0)).toHaveLength(3)
  })
})

describe('plan à plusieurs flux', () => {
  // Des flux assez longs pour nourrir chaque jour : 90 chapitres, 89 et 150
  // sur 30 jours. Un flux plus court que la durée laisse des jours vides,
  // ce que le dernier cas de cette série vérifie explicitement.
  const streams = [['GEN', 'EXO'], ['MAT', 'MRK', 'LUK', 'JHN'], ['PSA']]

  it('rend un jour par jour demandé', () => {
    expect(generateStreamDays(streams, 30)).toHaveLength(30)
  })

  it('donne à chaque jour un passage par flux', () => {
    const jours = generateStreamDays(streams, 30)
    for (const jour of jours) expect(jour.length).toBeGreaterThanOrEqual(3)
  })

  it('conserve l’ordre des flux dans la journée', () => {
    const [premierJour] = generateStreamDays(streams, 30)
    expect(premierJour[0].book).toBe('GEN')
    expect(premierJour.some((p) => p.book === 'MAT')).toBe(true)
    expect(premierJour[premierJour.length - 1].book).toBe('PSA')
  })

  it('couvre l’intégralité de chaque flux, sans rien perdre', () => {
    const jours = generateStreamDays([['MAT']], 10)
    const chapitres = jours.flat().flatMap((p) =>
      Array.from({ length: p.chapterEnd - p.chapterStart + 1 }, (_, i) => p.chapterStart + i))
    expect(chapitres).toEqual(Array.from({ length: 28 }, (_, i) => i + 1))
  })

  it('laisse un jour sans passage plutôt que d’inventer, si le flux est épuisé', () => {
    const jours = generateStreamDays([['JUD']], 3)
    expect(jours.filter((j) => j.length === 0)).toHaveLength(2)
  })
})
