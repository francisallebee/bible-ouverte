import { describe, it, expect } from 'vitest'
import { joursDeLecture, portionsDesJours, redecouper, nomDePlanPour } from './lecture-document'
import { dayPassages } from '@/lib/storage/plan-passages'
import type { PlanDay } from '@/lib/storage/types'

const reperes = [{ page: 3, titre: 'Chapitre 1' }, { page: 7, titre: 'Chapitre 2' }]
const lignes = ['Couverture', 'Licence', 'CHAPITRE 1', 'suite', 'suite', 'suite', 'CHAPITRE 2', 'fin']
const portions = [{ debut: 1, fin: 6 }, { debut: 7, fin: 8 }]

describe('joursDeLecture', () => {
  it('une portion par jour, aucun passage, le titre du repère, les dates à la suite', () => {
    const jours = joursDeLecture(portions, reperes, lignes, '2026-10-01')
    expect(jours).toHaveLength(2)
    expect(jours[0]).toMatchObject({ day: 1, date: '2026-10-01', pageDebut: 1, pageFin: 6, titre: 'Chapitre 1', isRead: false, book: '' })
    expect(jours[1]).toMatchObject({ day: 2, date: '2026-10-02', pageDebut: 7, pageFin: 8, titre: 'Chapitre 2' })
    // Le livre vide est la sentinelle : `dayPassages` ne fabrique rien.
    expect(dayPassages(jours[0] as PlanDay)).toEqual([])
  })
  it('libre : la date reste vide ; sans repère ni première ligne, pas de titre', () => {
    const jours = joursDeLecture([{ debut: 2, fin: 2 }], [], ['', ''], null)
    expect(jours[0].date).toBe('')
    expect(jours[0]).not.toHaveProperty('titre')
  })
})

describe('nomDePlanPour', () => {
  it('retire l’extension et aère le nom', () => {
    expect(nomDePlanPour('pour_une-foi.reflechie.epub')).toBe('pour une foi.reflechie')
    expect(nomDePlanPour('Cahier.PDF')).toBe('Cahier')
  })
})

describe('portionsDesJours et redecouper', () => {
  const anciens = joursDeLecture(portions, reperes, lignes, '2026-10-01')
    .map((j, i) => ({ ...j, id: i + 1, planId: 9, userId: 'u', isRead: i === 0, date: i === 0 ? '2026-10-03' : j.date })) as PlanDay[]

  it('retrouve les portions d’un plan existant, dans l’ordre des jours', () => {
    expect(portionsDesJours([...anciens].reverse())).toEqual(portions)
  })
  it('garde le cochage — et sa date — d’une portion restée identique, décoche celles qui ont changé', () => {
    const nouveaux = redecouper(anciens, [{ debut: 1, fin: 6 }, { debut: 7, fin: 7 }, { debut: 8, fin: 8 }], reperes, lignes, '2026-11-01')
    expect(nouveaux).toHaveLength(3)
    expect(nouveaux[0]).toMatchObject({ isRead: true, date: '2026-10-03' })
    expect(nouveaux[1]).toMatchObject({ isRead: false, date: '2026-11-02' })
    expect(nouveaux[2]).toMatchObject({ isRead: false, date: '2026-11-03' })
  })
  it('une portion identique déplacée à un autre jour reste cochée', () => {
    const nouveaux = redecouper(anciens, [{ debut: 7, fin: 8 }, { debut: 1, fin: 6 }].reverse(), reperes, lignes, null)
    expect(nouveaux.find((j) => j.pageDebut === 1)?.isRead).toBe(true)
  })
})
