import { describe, it, expect } from 'vitest'
import {
  normaliserObjectif, OBJECTIF_PAR_DEFAUT, debutDePeriode, apportDe,
  progressionDe, calculerSeries, prochainPalier, paliersAtteints, aujourdhui,
  filtrerParPortee, PORTEE_PAR_DEFAUT, MOTS_PAR_MINUTE,
  normaliserCible, CIBLE_MIN, CIBLE_MAX,
} from './objectifs'
import { MOTS_PAR_LIVRE, MOTS_DEFAUT } from './mots'
import type { ReadingEntry } from '@/lib/storage/types'

const lecture = (date: string, cs: number, ce = cs, vs = 1, ve = 1): ReadingEntry => ({
  date, book: 'GEN', chapterStart: cs, chapterEnd: ce, verseStart: vs, verseEnd: ve,
  passageText: '', translationId: 'ls1910', tags: [], contextId: '', notes: '',
  userId: 'u', createdAt: date, updatedAt: date,
})

describe('reprise des anciens réglages', () => {
  it('convertit la forme « chapitres par jour »', () => {
    expect(normaliserObjectif({ type: 'chapters-per-day', target: 3 }))
      .toEqual({ unite: 'chapters', periode: 'day', cible: 3, portee: PORTEE_PAR_DEFAUT })
  })

  it('convertit la forme « versets par jour »', () => {
    expect(normaliserObjectif({ type: 'verses-per-day', target: 120 }))
      .toEqual({ unite: 'verses', periode: 'day', cible: 120, portee: PORTEE_PAR_DEFAUT })
  })

  it('rend le défaut plutôt que rien quand aucun objectif n’est réglé', () => {
    // L'appelant n'a pas à distinguer « absent » de « par défaut ».
    expect(normaliserObjectif(undefined)).toEqual(OBJECTIF_PAR_DEFAUT)
    expect(normaliserObjectif(null)).toEqual(OBJECTIF_PAR_DEFAUT)
  })

  it('laisse intact un objectif déjà à la forme actuelle', () => {
    const o = { unite: 'verses' as const, periode: 'week' as const, cible: 50 }
    // La portée manquante est complétée : l'appelant n'a pas plus à distinguer
    // « sans portée » de « toutes » qu'il n'avait à distinguer « sans objectif »
    // de « objectif par défaut ». Ce n'est donc plus le même objet.
    expect(normaliserObjectif(o)).toEqual({ ...o, portee: PORTEE_PAR_DEFAUT })
  })

  it('conserve une portée déjà réglée plutôt que de la remplacer', () => {
    const o = {
      unite: 'chapters' as const, periode: 'month' as const, cible: 12,
      portee: { type: 'livre' as const, livre: 'JHN' },
    }
    expect(normaliserObjectif(o).portee).toEqual({ type: 'livre', livre: 'JHN' })
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

describe('minutes estimées', () => {
  it('estime d’après le poids du livre, et non d’une moyenne unique', () => {
    // Genèse et Psaumes ne pèsent pas pareil : c'est toute la raison de la
    // table par livre. Un chapitre de chacun ne peut pas rendre le même temps.
    const gen = apportDe({ ...lecture('2026-08-19', 1, 2) }, 'minutes')
    const psa = apportDe({ ...lecture('2026-08-19', 1, 2), book: 'PSA' }, 'minutes')
    expect(gen).toBeCloseTo((2 * MOTS_PAR_LIVRE.GEN.chapitre) / MOTS_PAR_MINUTE)
    expect(psa).toBeCloseTo((2 * MOTS_PAR_LIVRE.PSA.chapitre) / MOTS_PAR_MINUTE)
    expect(gen).toBeGreaterThan(psa)
  })

  it('compte au verset quand la lecture tient dans un chapitre', () => {
    const dix = apportDe({ ...lecture('2026-08-19', 1, 1, 1, 10) }, 'minutes')
    expect(dix).toBeCloseTo((10 * MOTS_PAR_LIVRE.GEN.verset) / MOTS_PAR_MINUTE)
  })

  it('retombe sur la moyenne générale pour un livre hors table', () => {
    const inconnu = apportDe({ ...lecture('2026-08-19', 1, 1, 1, 4), book: 'XYZ' }, 'minutes')
    expect(inconnu).toBeCloseTo((4 * MOTS_DEFAUT.verset) / MOTS_PAR_MINUTE)
  })

  it('ne fait jamais peser un passage plus qu’un chapitre entier', () => {
    // `PassagePicker` propose 200 versets quand le texte n'est pas téléchargé,
    // et la base en porte la trace : Psaumes 1:1-200 existe pour de vrai.
    const psaume = apportDe(
      { ...lecture('2026-08-19', 1, 1, 1, 200), book: 'PSA' }, 'minutes',
    )
    expect(psaume).toBeCloseTo(MOTS_PAR_LIVRE.PSA.chapitre / MOTS_PAR_MINUTE)
    expect(psaume).toBeLessThan(3)
  })

  it('n’arrondit pas chaque lecture, mais la somme', () => {
    // Trois versets lus séparément pèsent moins d'une minute à eux trois.
    // Arrondir lecture par lecture en aurait fait trois.
    const trois = [
      { ...lecture('2026-08-19', 1, 1, 1, 1) },
      { ...lecture('2026-08-19', 2, 2, 1, 1) },
      { ...lecture('2026-08-19', 3, 3, 1, 1) },
    ]
    const p = progressionDe(trois, { unite: 'minutes', periode: 'day', cible: 10 }, '2026-08-19')
    const attendu = Math.round((3 * MOTS_PAR_LIVRE.GEN.verset) / MOTS_PAR_MINUTE)
    expect(p.fait).toBe(attendu)
    expect(p.fait).toBeLessThan(3)
  })

  it('rend toujours un entier, comme pour les autres unités', () => {
    const p = progressionDe([lecture('2026-08-19', 1, 3)],
      { unite: 'minutes', periode: 'day', cible: 30 }, '2026-08-19')
    expect(Number.isInteger(p.fait)).toBe(true)
  })

  it('laisse les chapitres et les versets intacts malgré l’arrondi', () => {
    const l = [lecture('2026-08-19', 1, 5)]
    expect(progressionDe(l, { unite: 'chapters', periode: 'day', cible: 1 }, '2026-08-19').fait).toBe(5)
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

describe('portée d’un objectif', () => {
  const dansJean = (id: number): ReadingEntry => ({
    ...lecture('2026-08-19', 3), id, book: 'JHN',
  })
  const dansGenese = (id: number): ReadingEntry => ({ ...lecture('2026-08-19', 1), id })

  it('ne filtre rien quand la portée vaut « toutes »', () => {
    const l = [dansJean(1), dansGenese(2)]
    expect(filtrerParPortee(l, PORTEE_PAR_DEFAUT)).toHaveLength(2)
  })

  it('ne filtre rien quand la portée est absente — les objectifs d’avant', () => {
    const l = [dansJean(1), dansGenese(2)]
    expect(filtrerParPortee(l, undefined)).toHaveLength(2)
  })

  it('retient le seul livre visé, par son abréviation USFM', () => {
    const retenues = filtrerParPortee(
      [dansJean(1), dansGenese(2), dansJean(3)], { type: 'livre', livre: 'JHN' },
    )
    expect(retenues.map((l) => l.id)).toEqual([1, 3])
  })

  it('retient les lectures du plan, par leurs identifiants', () => {
    const retenues = filtrerParPortee(
      [dansJean(1), dansGenese(2), dansJean(3)],
      { type: 'plan', planId: 7 }, new Set([2, 3]),
    )
    expect(retenues.map((l) => l.id)).toEqual([2, 3])
  })

  it('ne compte rien plutôt que tout quand le plan n’est pas résolu', () => {
    // Rendre la liste entière afficherait le total de toutes les lectures
    // sous le nom d’un plan, sans que rien ne le signale.
    expect(filtrerParPortee([dansJean(1)], { type: 'plan', planId: 7 })).toEqual([])
  })

  it('ignore une lecture sans identifiant local', () => {
    const sansId = { ...lecture('2026-08-19', 1) }
    expect(filtrerParPortee([sansId], { type: 'plan', planId: 7 }, new Set([1]))).toEqual([])
  })

  it('se combine à la progression sans que celle-ci connaisse la portée', () => {
    const l = [dansJean(1), dansGenese(2)]
    const p = progressionDe(
      filtrerParPortee(l, { type: 'livre', livre: 'JHN' }),
      { unite: 'chapters', periode: 'day', cible: 1 }, '2026-08-19',
    )
    expect(p.fait).toBe(1)
    expect(p.atteint).toBe(true)
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

describe('saisie d’une cible', () => {
  it('accepte un nombre au-delà de dix-neuf', () => {
    // C'est le défaut signalé : on ne pouvait qu'ajouter un chiffre derrière
    // le 1, faute de pouvoir vider le champ.
    expect(normaliserCible('20', 1)).toBe(20)
    expect(normaliserCible('365', 1)).toBe(365)
  })

  it('rend la valeur précédente sur un champ vidé', () => {
    // Effacer n'est pas demander un objectif d'un chapitre.
    expect(normaliserCible('', 30)).toBe(30)
    expect(normaliserCible('   ', 30)).toBe(30)
  })

  it('rend la valeur précédente sur une saisie illisible', () => {
    expect(normaliserCible('abc', 12)).toBe(12)
    expect(normaliserCible('-', 12)).toBe(12)
  })

  it('ramène au minimum plutôt que d’accepter zéro ou négatif', () => {
    expect(normaliserCible('0', 5)).toBe(CIBLE_MIN)
    expect(normaliserCible('-4', 5)).toBe(CIBLE_MIN)
  })

  it('borne l’absurde sans le refuser', () => {
    expect(normaliserCible('99999999', 5)).toBe(CIBLE_MAX)
  })

  it('arrondit une décimale plutôt que de la garder', () => {
    // Un objectif de 2,7 chapitres ne veut rien dire, et `progressionDe`
    // compterait des entiers en face.
    expect(normaliserCible('2.7', 1)).toBe(3)
  })
})
