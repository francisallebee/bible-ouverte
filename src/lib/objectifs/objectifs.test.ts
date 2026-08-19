import { describe, it, expect } from 'vitest'
import {
  normaliserObjectif, OBJECTIF_PAR_DEFAUT, debutDePeriode, apportDe,
  progressionDe, calculerSeries, prochainPalier, paliersAtteints, aujourdhui,
} from './objectifs'
import type { ReadingEntry } from '@/lib/storage/types'

const lecture = (date: string, cs: number, ce = cs, vs = 1, ve = 1): ReadingEntry => ({
  date, book: 'GEN', chapterStart: cs, chapterEnd: ce, verseStart: vs, verseEnd: ve,
  passageText: '', translationId: 'ls1910', tags: [], contextId: '', notes: '',
  userId: 'u', createdAt: date, updatedAt: date,
})

describe('reprise des anciens réglages', () => {
  it('convertit la forme « chapitres par jour »', () => {
    expect(normaliserObjectif({ type: 'chapters-per-day', target: 3 }))
      .toEqual({ unite: 'chapters', periode: 'day', cible: 3 })
  })

  it('convertit la forme « versets par jour »', () => {
    expect(normaliserObjectif({ type: 'verses-per-day', target: 120 }))
      .toEqual({ unite: 'verses', periode: 'day', cible: 120 })
  })

  it('rend le défaut plutôt que rien quand aucun objectif n’est réglé', () => {
    // L'appelant n'a pas à distinguer « absent » de « par défaut ».
    expect(normaliserObjectif(undefined)).toEqual(OBJECTIF_PAR_DEFAUT)
    expect(normaliserObjectif(null)).toEqual(OBJECTIF_PAR_DEFAUT)
  })

  it('laisse intact un objectif déjà à la forme actuelle', () => {
    const o = { unite: 'verses' as const, periode: 'week' as const, cible: 50 }
    expect(normaliserObjectif(o)).toBe(o)
  })
})

describe('début de période', () => {
  it('rend le jour même pour un objectif quotidien', () => {
    expect(debutDePeriode('2026-08-19', 'day')).toBe('2026-08-19')
  })

  it('remonte au lundi pour une semaine', () => {
    // Le 19 août 2026 est un mercredi.
    expect(debutDePeriode('2026-08-19', 'week')).toBe('2026-08-17')
  })

  it('laisse le lundi à sa place', () => {
    expect(debutDePeriode('2026-08-17', 'week')).toBe('2026-08-17')
  })

  it('remonte au lundi précédent depuis un dimanche', () => {
    // Une semaine commençant le dimanche ferait basculer le décompte un jour
    // trop tôt : le 23 août appartient encore à la semaine du 17.
    expect(debutDePeriode('2026-08-23', 'week')).toBe('2026-08-17')
  })

  it('franchit un changement de mois et d’année', () => {
    expect(debutDePeriode('2026-01-01', 'week')).toBe('2025-12-29')
  })

  it('rend le premier du mois et le premier de l’an', () => {
    expect(debutDePeriode('2026-08-19', 'month')).toBe('2026-08-01')
    expect(debutDePeriode('2026-08-19', 'year')).toBe('2026-01-01')
  })
})

describe('apport d’une lecture', () => {
  it('compte les chapitres, bornes comprises', () => {
    expect(apportDe(lecture('2026-08-19', 1, 3), 'chapters')).toBe(3)
    expect(apportDe(lecture('2026-08-19', 5), 'chapters')).toBe(1)
  })

  it('compte les versets sur un seul chapitre', () => {
    expect(apportDe(lecture('2026-08-19', 3, 3, 16, 18), 'verses')).toBe(3)
  })

  it('ne surestime pas les versets d’un passage à cheval sur des chapitres', () => {
    // Sans consulter le texte, on ne sait pas combien de versets il porte :
    // on retient au moins un par chapitre plutôt que d'inventer.
    expect(apportDe(lecture('2026-08-19', 1, 4, 1, 2), 'verses')).toBe(4)
  })
})

describe('progression', () => {
  const semaine = [
    lecture('2026-08-17', 1, 2), lecture('2026-08-18', 3),
    lecture('2026-08-19', 4, 5), lecture('2026-08-10', 1, 9),
  ]

  it('ne compte que la période en cours', () => {
    // La lecture du 10 août appartient à la semaine précédente.
    const p = progressionDe(semaine, { unite: 'chapters', periode: 'week', cible: 10 }, '2026-08-19')
    expect(p.fait).toBe(5)
    expect(p.depuis).toBe('2026-08-17')
  })

  it('ne compte pas les lectures postérieures au jour', () => {
    const p = progressionDe([lecture('2026-08-25', 1, 9)],
      { unite: 'chapters', periode: 'month', cible: 10 }, '2026-08-19')
    expect(p.fait).toBe(0)
  })

  it('borne le pourcentage à cent', () => {
    // Une barre ne déborde pas, même si l'on a lu le triple.
    const p = progressionDe([lecture('2026-08-19', 1, 30)],
      { unite: 'chapters', periode: 'day', cible: 3 }, '2026-08-19')
    expect(p.pourcent).toBe(100)
    expect(p.atteint).toBe(true)
  })

  it('ne divise jamais par zéro sur une cible absurde', () => {
    const p = progressionDe([lecture('2026-08-19', 1)],
      { unite: 'chapters', periode: 'day', cible: 0 }, '2026-08-19')
    expect(Number.isFinite(p.pourcent)).toBe(true)
  })
})

describe('séries', () => {
  it('compte les jours consécutifs', () => {
    const l = ['2026-08-17', '2026-08-18', '2026-08-19'].map((d) => lecture(d, 1))
    expect(calculerSeries(l, '2026-08-19')).toMatchObject({ courante: 3, meilleure: 3 })
  })

  it('franchit un jour manqué, mais pas deux', () => {
    // Une série qui tombe à zéro pour un dimanche sans lecture décourage plus
    // qu'elle n'encourage.
    const avecTrou = ['2026-08-15', '2026-08-17', '2026-08-18'].map((d) => lecture(d, 1))
    expect(calculerSeries(avecTrou, '2026-08-18').courante).toBe(3)

    const deuxTrous = ['2026-08-14', '2026-08-17', '2026-08-18'].map((d) => lecture(d, 1))
    expect(calculerSeries(deuxTrous, '2026-08-18').courante).toBe(2)
  })

  it('ne compte plus de série courante si la dernière lecture est trop ancienne', () => {
    const l = ['2026-08-10', '2026-08-11'].map((d) => lecture(d, 1))
    const s = calculerSeries(l, '2026-08-19')
    expect(s.courante).toBe(0)
    expect(s.meilleure).toBe(2)
  })

  it('garde la meilleure série même après une coupure', () => {
    const l = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-06-01'].map((d) => lecture(d, 1))
    expect(calculerSeries(l, '2026-06-01').meilleure).toBe(3)
  })

  it('ne compte qu’une fois plusieurs lectures du même jour', () => {
    const l = [lecture('2026-08-19', 1), lecture('2026-08-19', 2), lecture('2026-08-19', 3)]
    expect(calculerSeries(l, '2026-08-19').courante).toBe(1)
  })

  it('rend zéro sans aucune lecture', () => {
    expect(calculerSeries([], '2026-08-19')).toMatchObject({ courante: 0, meilleure: 0 })
  })

  it('franchit un changement d’année sans casser', () => {
    const l = ['2025-12-31', '2026-01-01'].map((d) => lecture(d, 1))
    expect(calculerSeries(l, '2026-01-01').courante).toBe(2)
  })
})

describe('paliers', () => {
  it('propose le prochain, et rien au-delà du dernier', () => {
    expect(prochainPalier(0)).toBe(7)
    expect(prochainPalier(7)).toBe(30)
    expect(prochainPalier(400)).toBeNull()
  })

  it('rend ceux qui sont atteints', () => {
    expect(paliersAtteints(35)).toEqual([7, 30])
    expect(paliersAtteints(3)).toEqual([])
  })
})

describe('jour courant', () => {
  it('suit le fuseau local, et non UTC', () => {
    // C'est le défaut que portait l'ancien calcul des séries : une lecture
    // enregistrée à 23 h dans un fuseau en avance cassait la série.
    expect(aujourdhui(new Date(2026, 7, 19, 23, 30))).toBe('2026-08-19')
  })
})
