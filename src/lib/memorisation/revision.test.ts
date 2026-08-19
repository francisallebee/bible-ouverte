import { describe, it, expect } from 'vitest'
import {
  INTERVALLES, NIVEAU_MAX, SEUIL_REUSSITE,
  prochainEtat, estDu, partMasquee, masquerMots, reussiteDe,
} from './revision'

const JOUR = '2026-08-19'
const alea = (suite: number[]) => { let i = 0; return () => suite[i++ % suite.length] }

describe('progression des rappels', () => {
  it('éloigne le rappel à chaque réussite', () => {
    let etat = { niveau: 0, prochain: JOUR }
    const dates: string[] = []
    for (let i = 0; i < 5; i++) {
      etat = prochainEtat(etat, 1, JOUR)
      dates.push(etat.prochain)
    }
    expect(dates).toEqual(['2026-08-20', '2026-08-22', '2026-08-26', '2026-09-09', '2026-10-18'])
  })

  it('ne dépasse jamais le dernier palier', () => {
    let etat = { niveau: NIVEAU_MAX, prochain: JOUR }
    etat = prochainEtat(etat, 1, JOUR)
    expect(etat.niveau).toBe(NIVEAU_MAX)
    // Deux mois, et cela n'augmente plus : un verset encore juste après
    // soixante jours est acquis.
    expect(etat.prochain).toBe('2026-10-18')
  })

  it('recule d’un seul niveau en cas d’échec, jamais jusqu’à zéro', () => {
    // Repartir de rien après une hésitation ferait perdre des semaines.
    const etat = prochainEtat({ niveau: 3, prochain: JOUR }, 0.2, JOUR)
    expect(etat.niveau).toBe(2)
  })

  it('ne descend pas sous le premier niveau', () => {
    expect(prochainEtat({ niveau: 0, prochain: JOUR }, 0, JOUR).niveau).toBe(0)
  })

  it('revoit un échec dès le lendemain, quel que soit le niveau', () => {
    for (const niveau of [0, 2, NIVEAU_MAX]) {
      expect(prochainEtat({ niveau, prochain: JOUR }, 0.3, JOUR).prochain).toBe('2026-08-20')
    }
  })

  it('place le seuil de réussite là où il est annoncé', () => {
    expect(prochainEtat({ niveau: 1, prochain: JOUR }, SEUIL_REUSSITE, JOUR).niveau).toBe(2)
    expect(prochainEtat({ niveau: 1, prochain: JOUR }, SEUIL_REUSSITE - 0.01, JOUR).niveau).toBe(0)
  })

  it('franchit un changement de mois sans dériver', () => {
    // Niveau 2 réussi : sept jours, donc le 1er février.
    expect(prochainEtat({ niveau: 2, prochain: '2026-01-25' }, 1, '2026-01-25').prochain)
      .toBe('2026-02-01')
  })
})

describe('échéance', () => {
  it('est due le jour dit, et les jours suivants', () => {
    expect(estDu({ niveau: 0, prochain: '2026-08-19' }, JOUR)).toBe(true)
    expect(estDu({ niveau: 0, prochain: '2026-08-10' }, JOUR)).toBe(true)
  })

  it('n’est pas due avant', () => {
    expect(estDu({ niveau: 0, prochain: '2026-08-20' }, JOUR)).toBe(false)
  })
})

describe('masquage', () => {
  const TEXTE = 'un deux trois quatre cinq six sept huit neuf dix onze douze'

  it('ne masque rien au premier niveau', () => {
    expect(partMasquee(0)).toBe(0)
    expect(masquerMots(TEXTE, 0, alea([0.5])).every((m) => !m.masque)).toBe(true)
  })

  it('masque tout au dernier niveau', () => {
    expect(partMasquee(NIVEAU_MAX)).toBe(1)
    expect(masquerMots(TEXTE, 1, alea([0.5])).every((m) => m.masque)).toBe(true)
  })

  it('masque la part demandée, à un mot près', () => {
    const masques = masquerMots(TEXTE, 0.5, alea([0.5])).filter((m) => m.masque).length
    expect(Math.abs(masques - 6)).toBeLessThanOrEqual(1)
  })

  it('répartit les trous au lieu de les grouper', () => {
    // Un tirage libre cacherait volontiers cinq mots d'affilée puis rien.
    const mots = masquerMots(TEXTE, 0.5, alea([0.5]))
    let suite = 0
    let pire = 0
    for (const m of mots) {
      suite = m.masque ? suite + 1 : 0
      pire = Math.max(pire, suite)
    }
    expect(pire).toBeLessThanOrEqual(2)
  })

  it('rend les mots dans l’ordre du verset', () => {
    expect(masquerMots(TEXTE, 0.5, alea([0.5])).map((m) => m.mot).join(' ')).toBe(TEXTE)
  })

  it('borne le niveau plutôt que de sortir du tableau', () => {
    expect(partMasquee(-3)).toBe(partMasquee(0))
    expect(partMasquee(99)).toBe(partMasquee(NIVEAU_MAX))
  })
})

describe('réussite d’une séance', () => {
  it('vaut le plein quand rien n’est masqué', () => {
    // On ne peut pas échouer à lire.
    expect(reussiteDe(0, 0)).toBe(1)
  })

  it('retire les indices demandés', () => {
    expect(reussiteDe(10, 2)).toBe(0.8)
  })

  it('ne descend jamais sous zéro', () => {
    expect(reussiteDe(4, 9)).toBe(0)
  })

  it('vaut zéro si tout a demandé un indice', () => {
    expect(reussiteDe(6, 6)).toBe(0)
  })
})

describe('intervalles', () => {
  it('s’allongent strictement', () => {
    for (let i = 1; i < INTERVALLES.length; i++) {
      expect(INTERVALLES[i]).toBeGreaterThan(INTERVALLES[i - 1])
    }
  })
})
