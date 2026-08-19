import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Aucun dictionnaire ne doit contenir de texte mal encodé.
 *
 * Le 19 août 2026, « Charte personnalisée » est parti en production sous la
 * forme « Charte personnalisÃ©e », et les quatre chaînes arabes de la même
 * section étaient illisibles — de l'UTF-8 relu comme du Latin-1, introduit par
 * un outil d'édition. Ni `tsc`, ni `eslint`, ni les 301 tests d'alors ne
 * pouvaient le voir : le fichier restait du TypeScript valide, et la chaîne
 * une chaîne. Seul un œil sur l'écran l'a trouvé, et seulement en français —
 * l'arabe, que personne ne relit, était bien plus abîmé.
 *
 * Le repère est sûr : un texte ainsi dégradé est fait de caractères de la plage
 * U+0080–U+00FF qui, relus comme de l'UTF-8, redonnent un texte valide et
 * différent. Un texte correct — accents français, arabe, apostrophes
 * typographiques — ne satisfait jamais les deux conditions à la fois.
 */
const DOSSIER = join(process.cwd(), 'src/lib/i18n/ui')

/** Les suites de caractères Latin-1 qui cachent en réalité de l'UTF-8. */
function segmentsDegrades(contenu: string): string[] {
  const suites = contenu.match(/[-ÿ]+/g) ?? []
  return suites.filter((suite) => {
    const octets = Uint8Array.from(Array.from(suite, (c: string) => c.charCodeAt(0)))
    try {
      const relu = new TextDecoder('utf-8', { fatal: true }).decode(octets)
      return relu !== suite
    } catch {
      // Indécodable en UTF-8 : ce sont donc de vrais caractères accentués.
      return false
    }
  })
}

describe('encodage des dictionnaires', () => {
  const fichiers = readdirSync(DOSSIER).filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
  )

  it('trouve bien les cinq dictionnaires et leur registre', () => {
    expect(fichiers.length).toBeGreaterThanOrEqual(6)
  })

  for (const fichier of fichiers) {
    it(`${fichier} ne contient aucun texte mal encodé`, () => {
      const degrades = segmentsDegrades(readFileSync(join(DOSSIER, fichier), 'utf-8'))
      expect(
        degrades,
        `segments à réparer : ${degrades.slice(0, 3).join(' | ')}`,
      ).toEqual([])
    })
  }

  it('reconnaît un cas connu, pour que le test ne passe pas à vide', () => {
    // « personnalisée » relu en Latin-1. Sans cette vérification, une détection
    // cassée rendrait un tableau vide et le test passerait sur tout.
    expect(segmentsDegrades('personnalisÃ©e')).toEqual(['Ã©'])
  })

  it('ne signale pas un texte correct, quelle que soit son écriture', () => {
    expect(segmentsDegrades('Charte personnalisée')).toEqual([])
    expect(segmentsDegrades('اللون الأساسي')).toEqual([])
    expect(segmentsDegrades('Couleur d’accent')).toEqual([])
  })
})
