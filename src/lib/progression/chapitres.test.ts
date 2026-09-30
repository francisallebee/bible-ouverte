import { describe, it, expect } from 'vitest'
import { compterChapitres, statutsParChapitre, versetsDuChapitre } from './chapitres'
import type { EtendueLue } from './chapitres'

/** Une lecture, avec des bornes par défaut pour ne pas les répéter. */
function lecture(p: Partial<EtendueLue> & { book: string; chapterStart: number }): EtendueLue {
  return {
    chapterEnd: p.chapterStart,
    verseStart: 1,
    verseEnd: 1,
    ...p,
  }
}

describe('versetsDuChapitre', () => {
  it('rend la longueur mesurée', () => {
    // Les trois chiffres du ticket 25, vus à l'écran le 31 août 2026.
    expect(versetsDuChapitre('PRO', 18)).toBe(24)
    expect(versetsDuChapitre('JHN', 3)).toBe(36)
    expect(versetsDuChapitre('PSA', 23)).toBe(6)
  })

  it('rend le plus grand chapitre de la Bible', () => {
    expect(versetsDuChapitre('PSA', 119)).toBe(176)
  })

  it('rend null pour un livre ou un chapitre inconnu', () => {
    expect(versetsDuChapitre('ZZZ', 1)).toBeNull()
    expect(versetsDuChapitre('JHN', 99)).toBeNull()
  })
})

describe('compterChapitres', () => {
  it('compte un chapitre partiel comme entamé et non comme entier', () => {
    // Le cas du signalement : trois versets sur trente-six.
    const r = compterChapitres([lecture({ book: 'JHN', chapterStart: 3, verseStart: 16, verseEnd: 18 })])
    expect(r).toEqual({ entames: 1, entiers: 0 })
  })

  it('compte un chapitre entier quand tous les versets sont lus', () => {
    const r = compterChapitres([lecture({ book: 'JHN', chapterStart: 3, verseStart: 1, verseEnd: 36 })])
    expect(r).toEqual({ entames: 1, entiers: 1 })
  })

  it('ne compte pas deux fois un chapitre lu deux fois', () => {
    const r = compterChapitres([
      lecture({ book: 'PSA', chapterStart: 23, verseStart: 1, verseEnd: 6 }),
      lecture({ book: 'PSA', chapterStart: 23, verseStart: 1, verseEnd: 6 }),
    ])
    expect(r).toEqual({ entames: 1, entiers: 1 })
  })

  it('réunit deux lectures partielles qui se complètent', () => {
    // 1-3 puis 4-6 couvrent le Psaume 23 en entier, sans chevauchement.
    // C'est le `+ 1` de la fusion : sans lui, ces deux lectures laisseraient
    // le chapitre éternellement incomplet.
    const r = compterChapitres([
      lecture({ book: 'PSA', chapterStart: 23, verseStart: 1, verseEnd: 3 }),
      lecture({ book: 'PSA', chapterStart: 23, verseStart: 4, verseEnd: 6 }),
    ])
    expect(r).toEqual({ entames: 1, entiers: 1 })
  })

  it('laisse incomplet un chapitre dont il manque un verset au milieu', () => {
    const r = compterChapitres([
      lecture({ book: 'PSA', chapterStart: 23, verseStart: 1, verseEnd: 2 }),
      lecture({ book: 'PSA', chapterStart: 23, verseStart: 4, verseEnd: 6 }),
    ])
    expect(r).toEqual({ entames: 1, entiers: 0 })
  })

  it('traverse plusieurs chapitres : les intermédiaires sont entiers', () => {
    // Genèse 1:5 → 3:8. Le chapitre 1 est amputé de son début, le 3 de sa
    // fin, mais le 2 est traversé de bout en bout.
    const r = compterChapitres([
      { book: 'GEN', chapterStart: 1, chapterEnd: 3, verseStart: 5, verseEnd: 8 },
    ])
    expect(r).toEqual({ entames: 3, entiers: 1 })
  })

  it('compte entier un chapitre traversé en entier depuis le verset 1', () => {
    const r = compterChapitres([
      { book: 'GEN', chapterStart: 1, chapterEnd: 2, verseStart: 1, verseEnd: 25 },
    ])
    // Genèse 1 fait 31 versets, Genèse 2 en fait 25 : les deux sont entiers.
    expect(r).toEqual({ entames: 2, entiers: 2 })
  })

  it('tient les lectures hors bornes pour complètes', () => {
    // `PSA 1:1-200`, héritée du repli du ticket 25 : le Psaume 1 fait
    // 6 versets. Son auteur a bien lu tout le chapitre.
    const r = compterChapitres([lecture({ book: 'PSA', chapterStart: 1, verseStart: 1, verseEnd: 200 })])
    expect(r).toEqual({ entames: 1, entiers: 1 })
  })

  it('compte un livre inconnu comme entamé, jamais comme entier', () => {
    const r = compterChapitres([lecture({ book: 'ZZZ', chapterStart: 1, verseStart: 1, verseEnd: 999 })])
    expect(r).toEqual({ entames: 1, entiers: 0 })
  })

  it('ne compte rien sans lecture', () => {
    expect(compterChapitres([])).toEqual({ entames: 0, entiers: 0 })
  })

  it('garde les entamés identiques à l’ancien comptage', () => {
    // Le garde-fou de la décision : le niveau et les badges reposent sur les
    // entamés, et ce nombre ne doit pas bouger. C'est exactement ce que
    // faisait l'ancien `Set<`book:chapitre`>` de l'écran.
    const lectures: EtendueLue[] = [
      { book: 'JHN', chapterStart: 3, chapterEnd: 3, verseStart: 16, verseEnd: 18 },
      { book: 'GEN', chapterStart: 1, chapterEnd: 3, verseStart: 1, verseEnd: 5 },
      { book: 'PSA', chapterStart: 23, chapterEnd: 23, verseStart: 1, verseEnd: 6 },
    ]
    const ancien = new Set<string>()
    for (const r of lectures) {
      for (let ch = r.chapterStart; ch <= r.chapterEnd; ch++) ancien.add(`${r.book}:${ch}`)
    }
    expect(compterChapitres(lectures).entames).toBe(ancien.size)
  })
})

/**
 * Le découpage par livre, né le 30 septembre 2026.
 *
 * L'écran Progression portait **quatre** comptages locaux par `Set<livre:ch>`
 * qui ignoraient les versets — testaments, catégories, liste des livres — à
 * côté d'un compteur qui, lui, distinguait les deux depuis le 9 septembre.
 * Deux définitions du mot « lu » sur un même écran, et personne pour le voir :
 * les barres se remplissaient à trois versets sur trente-six.
 */
describe('le comptage restreint à un sous-ensemble de livres', () => {
  const lectures: EtendueLue[] = [
    // Jean 3 entier (36 versets), Jean 4 effleuré.
    { book: 'JHN', chapterStart: 3, chapterEnd: 3, verseStart: 1, verseEnd: 36 },
    { book: 'JHN', chapterStart: 4, chapterEnd: 4, verseStart: 16, verseEnd: 18 },
    // Genèse 1 entier (31 versets).
    { book: 'GEN', chapterStart: 1, chapterEnd: 1, verseStart: 1, verseEnd: 31 },
  ]

  it('ne retient que les livres demandés', () => {
    expect(compterChapitres(lectures, ['JHN'])).toEqual({ entames: 2, entiers: 1 })
    expect(compterChapitres(lectures, ['GEN'])).toEqual({ entames: 1, entiers: 1 })
  })

  it('rend le même total que sans filtre quand tous les livres y sont', () => {
    // Le garde-fou contre un filtre qui perdrait des chapitres en chemin.
    expect(compterChapitres(lectures, ['JHN', 'GEN'])).toEqual(compterChapitres(lectures))
  })

  it('ne compte rien pour un livre jamais lu', () => {
    expect(compterChapitres(lectures, ['REV'])).toEqual({ entames: 0, entiers: 0 })
  })

  it('accorde ses statuts détaillés avec le total, chapitre par chapitre', () => {
    // La seule chose qui garantit qu'une barre par livre et le compteur du
    // haut racontent la même histoire : ils sortent du même calcul.
    const statuts = statutsParChapitre(lectures)
    const global = compterChapitres(lectures)
    expect(statuts.length).toBe(global.entames)
    expect(statuts.filter((c) => c.entier).length).toBe(global.entiers)

    const jean4 = statuts.find((c) => c.livre === 'JHN' && c.chapitre === 4)
    expect(jean4, 'Jean 4 doit être présent, il a été entamé').toBeDefined()
    expect(jean4!.entier, 'trois versets sur trente-six ne font pas un chapitre lu').toBe(false)
  })

  /**
   * `entames` **comprend** `entiers` — les additionner dépasserait le total.
   *
   * C'est l'erreur qu'une barre à deux couleurs invite à faire, et le
   * commentaire de `BarreLecture` s'appuie sur cette garantie pour ne mesurer
   * son second segment que sur la différence.
   */
  it('compte les entiers parmi les entamés, et non à côté', () => {
    const global = compterChapitres(lectures)
    expect(global.entiers).toBeLessThanOrEqual(global.entames)
    expect(global.entames).toBe(3)
    expect(global.entiers).toBe(2)
  })
})
