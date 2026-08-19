import { describe, it, expect } from 'vitest'
import { computeStats } from './game-store'
import type { GameSession } from './types'

const partie = (score: number, total: number, jour: string): GameSession => ({
  userId: 'u', kind: 'quiz', score, total,
  createdAt: `${jour}T10:00:00.000Z`,
})

describe('statistiques d’un jeu', () => {
  it('ne rend que des zéros sans aucune partie', () => {
    expect(computeStats([])).toEqual({ parties: 0, reussite: 0, meilleur: 0, jours: 0 })
  })

  it('calcule la réussite sur les totaux, pas sur une moyenne de pourcentages', () => {
    // Dix parties de 1/1 et une de 0/20 : la moyenne des pourcentages dirait
    // 91 %, ce qui flatte. Le rapport des totaux dit 33 %, ce qui est vrai.
    const parties = [
      ...Array.from({ length: 10 }, () => partie(1, 1, '2026-08-19')),
      partie(0, 20, '2026-08-19'),
    ]
    expect(computeStats(parties).reussite).toBe(33)
  })

  it('retient le meilleur score en pourcentage', () => {
    expect(computeStats([partie(5, 10, '2026-08-01'), partie(9, 10, '2026-08-02')]).meilleur).toBe(90)
  })

  it('compte les jours distincts, pas les parties', () => {
    // Trois parties le même jour ne font pas trois jours d'habitude.
    const parties = [
      partie(1, 1, '2026-08-19'), partie(1, 1, '2026-08-19'),
      partie(1, 1, '2026-08-20'),
    ]
    const s = computeStats(parties)
    expect(s.parties).toBe(3)
    expect(s.jours).toBe(2)
  })

  it('ne divise jamais par zéro sur une partie sans question', () => {
    // Un quizz dont la matière ne suffisait pas peut rendre 0 question.
    expect(computeStats([partie(0, 0, '2026-08-19')])).toMatchObject({ reussite: 0, meilleur: 0 })
  })

  it('ignore les parties vides dans le meilleur score', () => {
    expect(computeStats([partie(0, 0, '2026-08-19'), partie(4, 5, '2026-08-19')]).meilleur).toBe(80)
  })
})
