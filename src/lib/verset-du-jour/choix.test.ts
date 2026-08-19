import { describe, it, expect } from 'vitest'
import { condense, versetDuJour, degradeDe, jourLocal } from './choix'
import type { BiblePassage } from '@/lib/storage/types'

const v = (book: string, chapter: number, verse: number): BiblePassage =>
  ({ versionId: 'ls1910', book, chapter, verse, text: `${book} ${chapter}:${verse}` } as BiblePassage)

const VERSETS = [
  v('GEN', 1, 1), v('PSA', 23, 1), v('JHN', 3, 16), v('ROM', 8, 28), v('MAT', 5, 9),
]

describe('condensé', () => {
  it('rend toujours la même valeur pour la même entrée', () => {
    expect(condense('Jean 3:16')).toBe(condense('Jean 3:16'))
  })

  it('distingue deux références voisines', () => {
    // Sans cela, Jean 3:16 et Jean 3:17 auraient la même teinte.
    expect(condense('Jean 3:16')).not.toBe(condense('Jean 3:17'))
  })

  it('reste un entier non signé', () => {
    for (const s of ['', 'a', 'Jean 3:16', '2026-08-19']) {
      const h = condense(s)
      expect(Number.isInteger(h)).toBe(true)
      expect(h).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('verset du jour', () => {
  it('rend le même verset tout au long d’un jour donné', () => {
    const a = versetDuJour(VERSETS, '2026-08-19')
    const b = versetDuJour(VERSETS, '2026-08-19')
    expect(a).toEqual(b)
  })

  it('ne dépend pas de l’ordre d’arrivée des versets', () => {
    // L'ordre vient du cache et n'a aucune raison d'être le même d'un appareil
    // à l'autre ; deux appareils doivent pourtant afficher le même verset.
    const melange = [VERSETS[3], VERSETS[0], VERSETS[4], VERSETS[1], VERSETS[2]]
    expect(versetDuJour(melange, '2026-08-19')).toEqual(versetDuJour(VERSETS, '2026-08-19'))
  })

  it('change d’un jour à l’autre', () => {
    const jours = ['2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23']
    const choisis = jours.map((j) => versetDuJour(VERSETS, j)!.text)
    expect(new Set(choisis).size).toBeGreaterThan(1)
  })

  it('ne rend rien sans matière, plutôt que d’inventer', () => {
    expect(versetDuJour([], '2026-08-19')).toBeNull()
  })

  it('fonctionne avec un seul verset', () => {
    expect(versetDuJour([VERSETS[0]], '2026-08-19')).toEqual(VERSETS[0])
  })
})

describe('dégradé', () => {
  it('rend le même décor pour la même référence', () => {
    expect(degradeDe('Jean 3:16').css).toBe(degradeDe('Jean 3:16').css)
  })

  it('donne des décors différents à des références différentes', () => {
    expect(degradeDe('Jean 3:16').css).not.toBe(degradeDe('Psaumes 23:1').css)
  })

  it('produit un dégradé CSS à trois teintes', () => {
    const css = degradeDe('Jean 3:16').css
    expect(css.startsWith('linear-gradient(')).toBe(true)
    expect(css.match(/hsl\(/g)).toHaveLength(3)
  })

  it('garde une luminosité assez basse pour du texte clair', () => {
    // C'est ce qui permet d'écrire en blanc sans mesurer le contraste à chaque
    // rendu. Les bornes sont fixées dans la fonction, ce test les garde.
    for (const ref of ['Jean 3:16', 'Genèse 1:1', 'Apocalypse 22:21', 'Psaumes 119:105']) {
      const lums = (degradeDe(ref).css.match(/70% \d+%/g) ?? []).map((m) => Number(m.replace(/\D/g, '').slice(2)))
      expect(lums).toHaveLength(3)
      for (const l of lums) expect(l).toBeLessThanOrEqual(50)
    }
  })
})

describe('jour local', () => {
  it('formate en AAAA-MM-JJ, avec les zéros', () => {
    expect(jourLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(jourLocal(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('suit le fuseau local et non UTC', () => {
    // Un `toISOString().slice(0,10)` ferait changer le verset à minuit UTC,
    // donc en pleine soirée pour une partie des lecteurs.
    const soir = new Date(2026, 7, 19, 23, 30)
    expect(jourLocal(soir)).toBe('2026-08-19')
  })
})
