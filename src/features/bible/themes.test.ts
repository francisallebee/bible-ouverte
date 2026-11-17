import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { THEMES, themeParSlug, livresCites, chapitresDe } from './themes'
import { BOOKS } from './books'
import { fr } from '@/lib/i18n/ui/fr'

/**
 * Ce que ces tests protègent.
 *
 * Une référence fausse dans un thème ne casse ni la compilation ni le lint :
 * elle rend simplement un résultat vide à l'écran, et rien ne le signale. La
 * règle 13 a déjà fait payer exactement cela sur les versions bibliques, où
 * une table oubliée donnait une version qui s'affichait, se laissait cocher et
 * échouait au téléchargement sans autre explication.
 */
describe('table des thèmes', () => {
  it('a des identifiants uniques', () => {
    const slugs = THEMES.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('ne cite que des livres qui existent', () => {
    const connus = new Set(BOOKS.map((b) => b.abbreviation))
    for (const abbreviation of livresCites()) {
      expect(connus.has(abbreviation), abbreviation).toBe(true)
    }
  })

  it('ne cite aucun chapitre au-delà de ce que le livre contient', () => {
    for (const theme of THEMES) {
      for (const passage of theme.passages) {
        const max = chapitresDe(passage.book)
        expect(max, `${passage.book} inconnu`).toBeGreaterThan(0)
        expect(
          passage.chapter,
          `${theme.slug} : ${passage.book} ${passage.chapter} dépasse ${max}`,
        ).toBeLessThanOrEqual(max)
      }
    }
  })

  it('ne rend jamais un intervalle de versets à l’envers', () => {
    for (const theme of THEMES) {
      for (const passage of theme.passages) {
        expect(passage.verseStart, theme.slug).toBeGreaterThanOrEqual(1)
        expect(passage.verseEnd, theme.slug).toBeGreaterThanOrEqual(passage.verseStart)
      }
    }
  })

  it('donne à chaque thème de quoi remplir un écran', () => {
    for (const theme of THEMES) {
      expect(theme.passages.length, theme.slug).toBeGreaterThanOrEqual(4)
    }
  })

  it('se retrouve par identifiant', () => {
    expect(themeParSlug('amour')?.slug).toBe('amour')
    expect(themeParSlug('inconnu')).toBeUndefined()
  })

  /**
   * Le garde-fou qui compte le plus.
   *
   * `tsc` vérifie que les cinq dictionnaires ont les mêmes clés, mais rien ne
   * garantit qu'un thème ajouté ici reçoive son libellé — la table des thèmes
   * et celle des libellés sont indépendantes. C'est précisément le piège des
   * trois tables des versions bibliques, et il se compare dans les deux sens.
   */
  it('a un libellé français pour chaque thème, et pas de libellé orphelin', () => {
    const slugs = THEMES.map((t) => t.slug).sort()
    const libelles = Object.keys(fr.themes.labels).sort()
    expect(libelles).toEqual(slugs)
  })
})

/**
 * Les références contre le texte, et non contre la table des livres.
 *
 * Les tests ci-dessus vérifient qu'un livre et un chapitre existent ; rien ne
 * vérifiait le verset. `PSA 4:9` est ainsi resté dans le thème « Paix »
 * jusqu'au 17 novembre 2026, alors que la Louis Segond n'a que 8 versets à ce
 * psaume : la recherche filtrait le lot vide et annonçait « 5 passages » au
 * lieu de 6, sans rien signaler.
 *
 * **L'existence ne suffit pas**, et c'est la règle 23 : `PSA 19:2`, `34:19` et
 * `42:6`, cités eux aussi selon la numérotation hébraïque, existaient bel et
 * bien en Segond — ils affichaient simplement le verset d'à côté. Un contrôle
 * d'existence les laisse passer. D'où le second test : dans tout chapitre où
 * la Segond et Darby ne comptent pas le même nombre de versets, le passage
 * doit être nommé dans `ATTENDUS` avec un fragment de son texte en Segond. La
 * liste des chapitres exposés est calculée, pas tenue à la main : un thème qui
 * citerait demain Joël 3 ou Malachie 4 y tomberait de lui-même.
 */
const racine = join(__dirname, '..', '..', '..')

interface FichierVersion {
  books: { abbreviation: string; chapters: { chapter: number; verses: { verse: number; text: string }[] }[] }[]
}

function charger(id: string): Map<string, Map<number, string>> {
  const version = JSON.parse(
    readFileSync(join(racine, 'public', 'bibles', `${id}.json`), 'utf8'),
  ) as FichierVersion
  const chapitres = new Map<string, Map<number, string>>()
  for (const livre of version.books) {
    for (const chapitre of livre.chapters) {
      chapitres.set(
        `${livre.abbreviation} ${chapitre.chapter}`,
        new Map(chapitre.verses.map((v) => [v.verse, v.text])),
      )
    }
  }
  return chapitres
}

/** Le premier verset de chaque passage exposé, tel que la Segond l'écrit. */
const ATTENDUS: Record<string, string> = {
  'PSA 4:8': 'Je me couche et je m\'endors en paix',
  'PSA 19:1': 'Les cieux racontent la gloire de Dieu',
  'PSA 34:18': 'L\'Eternel est près de ceux qui ont le coeur brisé',
  'PSA 42:5': 'Espère en Dieu',
  'MAT 23:12': 'Quiconque s\'élèvera sera abaissé',
}

describe('thèmes contre le texte de la version par défaut', () => {
  const segond = charger('ls1910')

  it('ne cite que des versets que la Louis Segond 1910 contient', () => {
    const manquants: string[] = []
    for (const theme of THEMES) {
      for (const p of theme.passages) {
        const versets = segond.get(`${p.book} ${p.chapter}`)
        for (let v = p.verseStart; v <= p.verseEnd; v++) {
          if (!versets?.has(v)) manquants.push(`${theme.slug} : ${p.book} ${p.chapter}:${v}`)
        }
      }
    }
    expect(manquants).toEqual([])
  })

  it('cite le bon verset là où la versification diverge', () => {
    const darby = charger('darby')
    const exposes = new Set<string>()
    for (const theme of THEMES) {
      for (const p of theme.passages) {
        const cle = `${p.book} ${p.chapter}`
        if (segond.get(cle)?.size !== darby.get(cle)?.size) exposes.add(`${cle}:${p.verseStart}`)
      }
    }
    // Les deux sens : un passage exposé sans fragment, ou un fragment qui ne
    // garde plus rien — la table ne doit ni manquer ni dormir.
    expect(Array.from(exposes).sort()).toEqual(Object.keys(ATTENDUS).sort())
    for (const [reference, fragment] of Object.entries(ATTENDUS)) {
      const [cle, verset] = reference.split(':')
      expect(segond.get(cle)?.get(Number(verset)), reference).toContain(fragment)
    }
  })
})
