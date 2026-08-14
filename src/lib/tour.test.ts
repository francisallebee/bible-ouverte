import { describe, expect, it } from 'vitest'
import {
  TOUR_STEPS, clampIndex, hrefToVisit, isLastStep, shouldStartTour, visibleSteps,
} from './tour'

/**
 * Les écrans qui existent réellement dans `src/app`. Une étape qui viserait
 * ailleurs enverrait l'utilisateur sur un 404 au beau milieu de sa découverte
 * de l'application — le pire moment pour lui montrer une page morte.
 */
const ECRANS_EXISTANTS = [
  '/admin', '/contexts', '/history', '/new-reading', '/plans', '/profil',
  '/progress', '/roadmap', '/search', '/settings', '/soutenir', '/stats',
  '/support',
]

describe('le contenu du parcours', () => {
  it('donne un identifiant unique à chaque étape', () => {
    const ids = TOUR_STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ne vise que des écrans qui existent', () => {
    for (const step of TOUR_STEPS) {
      if (step.href === null) continue
      expect(ECRANS_EXISTANTS.includes(step.href), `${step.id} vise ${step.href}`).toBe(true)
    }
  })

  it('donne un titre et un texte à chaque étape', () => {
    for (const step of TOUR_STEPS) {
      expect(step.title.trim().length, step.id).toBeGreaterThan(0)
      expect(step.body.trim().length, step.id).toBeGreaterThan(20)
    }
  })

  it('ne laisse jamais une liste de points vide', () => {
    for (const step of TOUR_STEPS) {
      if (step.points === undefined) continue
      expect(step.points.length, step.id).toBeGreaterThan(0)
      for (const point of step.points) expect(point.trim().length).toBeGreaterThan(0)
    }
  })

  it('ouvre et referme le parcours sur une étape sans écran', () => {
    expect(TOUR_STEPS[0].href).toBeNull()
    expect(TOUR_STEPS[TOUR_STEPS.length - 1].href).toBeNull()
  })

  it('couvre chaque entrée de la barre latérale', () => {
    // Le parcours promet d'expliquer toutes les fonctions : si un écran est
    // ajouté à la navigation sans étape correspondante, ce test le dit.
    const vises = TOUR_STEPS.map((s) => s.href).filter(Boolean)
    for (const ecran of ECRANS_EXISTANTS) {
      expect(vises.includes(ecran), `aucune étape ne présente ${ecran}`).toBe(true)
    }
  })
})

describe('visibleSteps', () => {
  it("cache l'administration aux comptes ordinaires", () => {
    const ids = visibleSteps(false).map((s) => s.id)
    expect(ids).not.toContain('administration')
  })

  it("la montre à un administrateur", () => {
    const ids = visibleSteps(true).map((s) => s.id)
    expect(ids).toContain('administration')
  })

  it("ne retire qu'elle", () => {
    expect(visibleSteps(true).length - visibleSteps(false).length).toBe(1)
  })
})

describe('shouldStartTour', () => {
  it('attend que les réglages soient chargés', () => {
    // Sans cette garde, le parcours se relancerait à chaque ouverture pendant
    // le temps que met le cache local à répondre.
    expect(shouldStartTour(undefined)).toBe(false)
    expect(shouldStartTour(null)).toBe(false)
  })

  it("se déclenche pour un compte qui ne l'a jamais vu", () => {
    expect(shouldStartTour({})).toBe(true)
  })

  it("ne se déclenche plus une fois terminé", () => {
    expect(shouldStartTour({ tourCompletedAt: '2026-08-14T09:00:00.000Z' })).toBe(false)
  })
})

describe('clampIndex', () => {
  const steps = visibleSteps(false)

  it('ramène dans les bornes', () => {
    expect(clampIndex(steps, -4)).toBe(0)
    expect(clampIndex(steps, 9999)).toBe(steps.length - 1)
  })

  it('encaisse une valeur qui n\'est pas un entier', () => {
    expect(clampIndex(steps, NaN)).toBe(0)
    expect(clampIndex(steps, Infinity)).toBe(steps.length - 1)
    expect(clampIndex(steps, 2.7)).toBe(2)
  })

  it('rend 0 sur une liste vide plutôt que -1', () => {
    expect(clampIndex([], 3)).toBe(0)
  })
})

describe('isLastStep', () => {
  const steps = visibleSteps(false)

  it('reconnaît la dernière étape', () => {
    expect(isLastStep(steps, steps.length - 1)).toBe(true)
    expect(isLastStep(steps, 0)).toBe(false)
  })

  it("la reconnaît aussi quand l'indice déborde", () => {
    expect(isLastStep(steps, 500)).toBe(true)
  })
})

describe('hrefToVisit', () => {
  const steps = visibleSteps(false)
  const indiceDe = (id: string) => steps.findIndex((s) => s.id === id)

  it("ne navigue pas pour une étape sans écran", () => {
    expect(hrefToVisit(steps, indiceDe('bienvenue'), '/new-reading')).toBeNull()
    expect(hrefToVisit(steps, indiceDe('hors-ligne'), '/settings')).toBeNull()
  })

  it("navigue vers l'écran de l'étape", () => {
    expect(hrefToVisit(steps, indiceDe('plans'), '/new-reading')).toBe('/plans')
  })

  it("ne renavigue pas vers l'écran déjà affiché", () => {
    // « Les réglages » puis « Les rappels » visent la même page : la seconde
    // navigation la rechargerait pour rien, sous les yeux de l'utilisateur.
    expect(hrefToVisit(steps, indiceDe('notifications'), '/settings')).toBeNull()
    expect(hrefToVisit(steps, indiceDe('reglages'), '/settings')).toBeNull()
  })
})
