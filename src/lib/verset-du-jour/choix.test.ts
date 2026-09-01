import { describe, it, expect } from 'vitest'
import { condense, versetDuJour, degradeDe, jourLocal, versetStable} from './choix'
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

describe('versetStable', () => {
  const matiere = [v('GEN', 1, 1), v('JHN', 3, 16), v('PSA', 23, 1), v('PRO', 18, 24)]

  it('garde le verset retenu pour le jour, quoi qu’on ait enregistré depuis', () => {
    // Le cœur du défaut : marquer le verset « lu » enregistre une lecture, la
    // matière grandit, et `condense(jour) % length` désignait alors un autre
    // verset. La mémoire l'emporte sur le tirage.
    const { verset } = versetStable(
      [...matiere, v('ROM', 8, 1), v('ACT', 2, 38)],
      '2026-08-31',
      { jour: '2026-08-31', book: 'JHN', chapter: 3, verse: 16 },
    )
    expect(verset).toMatchObject({ book: 'JHN', chapter: 3, verse: 16 })
  })

  it('ne réécrit pas la mémoire quand elle a suffi', () => {
    const { aRetenir } = versetStable(matiere, '2026-08-31',
      { jour: '2026-08-31', book: 'JHN', chapter: 3, verse: 16 })
    expect(aRetenir).toBeNull()
  })

  it('retire un nouveau verset le lendemain', () => {
    const { verset, aRetenir } = versetStable(matiere, '2026-09-01',
      { jour: '2026-08-31', book: 'JHN', chapter: 3, verse: 16 })
    expect(verset).not.toBeNull()
    expect(aRetenir).toMatchObject({ jour: '2026-09-01' })
  })

  it('retire quand le verset retenu a disparu de la matière', () => {
    // Désactiver une version vide le cache de ses versets : servir une
    // référence dont on n'a plus le texte afficherait un cadre vide.
    const { verset, aRetenir } = versetStable(matiere, '2026-08-31',
      { jour: '2026-08-31', book: 'REV', chapter: 22, verse: 21 })
    expect(verset).not.toBeNull()
    expect(verset!.book).not.toBe('REV')
    expect(aRetenir).not.toBeNull()
  })

  it('tire et demande à retenir quand rien n’est mémorisé', () => {
    const { verset, aRetenir } = versetStable(matiere, '2026-08-31', undefined)
    expect(verset).not.toBeNull()
    expect(aRetenir).toMatchObject({ jour: '2026-08-31', book: verset!.book })
  })

  it('ne retient rien sans matière', () => {
    expect(versetStable([], '2026-08-31', undefined)).toEqual({ verset: null, aRetenir: null })
  })

  it('rend le même verset que le tirage direct, mémoire vide', () => {
    // La mémoire ne change pas le choix, elle le fige : sans elle, le
    // comportement d'origine doit être intact.
    const { verset } = versetStable(matiere, '2026-08-31', undefined)
    expect(verset).toEqual(versetDuJour(matiere, '2026-08-31'))
  })
})
