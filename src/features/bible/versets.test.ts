import { describe, it, expect } from 'vitest'
import { dernierVerset, versetsAProposer } from './versets'
import { VERSETS_PAR_CHAPITRE, VERSETS_MAXIMUM } from './versification'
import { BOOKS } from './books'

/**
 * Ce que ces tests protègent.
 *
 * Le sélecteur de passage proposait `200` versets pour tout chapitre dont le
 * texte n'était pas dans le cache. Ni `tsc`, ni le lint, ni les tests n'y
 * voyaient quoi que ce soit : la valeur est un nombre parfaitement valide,
 * elle n'existe simplement dans aucune Bible. Il a fallu un utilisateur — le
 * ticket 25, ouvert le 30 août 2026 — pour la rencontrer sur Proverbes 18.
 *
 * Ce que les tests peuvent tenir, eux, c'est la cohérence entre la table
 * produite et le reste du dépôt : les mêmes 66 livres que `books.ts`, le même
 * nombre de chapitres, et aucun compte qui sorte du réel.
 */
describe('table de versification', () => {
  it('porte les mêmes livres que la table des chapitres', () => {
    const livres = Object.keys(VERSETS_PAR_CHAPITRE).sort()
    expect(livres).toEqual(BOOKS.map((b) => b.abbreviation).sort())
  })

  it('donne à chaque livre exactement son nombre de chapitres', () => {
    // Les deux tables sont indépendantes — l'une écrite à la main, l'autre
    // produite depuis le texte —, et rien ne les relierait sans ce test. C'est
    // la leçon de la règle 13, où deux tables indépendantes avaient divergé.
    for (const livre of BOOKS) {
      expect(VERSETS_PAR_CHAPITRE[livre.abbreviation]?.length, livre.abbreviation)
        .toBe(livre.chapters)
    }
  })

  it('ne porte aucun chapitre vide', () => {
    for (const [abbreviation, comptes] of Object.entries(VERSETS_PAR_CHAPITRE)) {
      comptes.forEach((n, i) => {
        expect(n, `${abbreviation} ${i + 1}`).toBeGreaterThan(0)
      })
    }
  })

  it('ne dépasse jamais le plus grand chapitre réel', () => {
    // 176, le Psaume 119. Le repli de 200 promettait vingt-quatre versets
    // au-delà de ce que la Bible contient, où que l'on regarde.
    for (const [abbreviation, comptes] of Object.entries(VERSETS_PAR_CHAPITRE)) {
      comptes.forEach((n, i) => {
        expect(n, `${abbreviation} ${i + 1}`).toBeLessThanOrEqual(VERSETS_MAXIMUM)
      })
    }
    expect(VERSETS_MAXIMUM).toBe(176)
    expect(VERSETS_PAR_CHAPITRE['PSA']?.[118]).toBe(176)
  })
})

describe('dernierVerset', () => {
  it('rend 24 pour Proverbes 18, et non 200', () => {
    // Le ticket lui-même : « Nouvelle lecture », Proverbes 18, Louis Segond
    // 1910, « Tout le chapitre ».
    expect(dernierVerset('PRO', 18)).toBe(24)
  })

  it('laisse le cache décider quand il a répondu', () => {
    // Une version dont la versification diverge de la référence : c'est elle
    // que l'utilisateur a sous les yeux, pas Louis Segond.
    expect(dernierVerset('PRO', 18, 21)).toBe(21)
  })

  it('reprend la table quand le cache a été interrogé sans rien trouver', () => {
    // `0` n'est pas un compte, c'est une absence — le texte n'est pas
    // téléchargé. Proposer zéro verset fermerait la saisie.
    expect(dernierVerset('PRO', 18, 0)).toBe(24)
  })

  it('rend le plus grand chapitre réel pour un livre inconnu', () => {
    expect(dernierVerset('XYZ', 1)).toBe(176)
    expect(dernierVerset('GEN', 51)).toBe(176)
    expect(dernierVerset('GEN', 0)).toBe(176)
  })

  it('ne rend jamais 200, pour aucun chapitre de la Bible', () => {
    for (const livre of BOOKS) {
      for (let chapitre = 1; chapitre <= livre.chapters; chapitre++) {
        expect(dernierVerset(livre.abbreviation, chapitre), `${livre.abbreviation} ${chapitre}`)
          .toBeLessThanOrEqual(VERSETS_MAXIMUM)
      }
    }
  })
})

describe('versetsAProposer', () => {
  it('propose le compte réel quand rien n\'a été saisi', () => {
    expect(versetsAProposer('PRO', 18)).toBe(24)
  })

  it('élargit jusqu\'à une valeur déjà enregistrée', () => {
    // La base porte des `verseEnd` à 200, hérités de l'ancien repli. Les
    // borner à 24 les rendrait inatteignables dans leur propre écran de
    // modification, donc incorrigibles.
    expect(versetsAProposer('PRO', 18, 24, 200)).toBe(200)
  })

  it('ne réduit jamais la proposition en dessous du compte réel', () => {
    expect(versetsAProposer('PSA', 119, 176, 3)).toBe(176)
  })

  it('propose au moins un verset', () => {
    expect(versetsAProposer('PRO', 18, 0, 0)).toBeGreaterThanOrEqual(1)
  })
})
