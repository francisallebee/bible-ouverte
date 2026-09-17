import { describe, it, expect } from 'vitest'
import { extraireReferences, type ReferenceExtraite } from './references'

/** Une référence sans son fragment source, pour comparer d'un coup. */
function bornes(r: ReferenceExtraite) {
  const { source: _source, ...reste } = r
  return reste
}
const ref = (book: string, cs: number, vs: number, ce = cs, ve = vs) =>
  ({ book, chapterStart: cs, chapterEnd: ce, verseStart: vs, verseEnd: ve })

describe('extraireReferences — les formes usuelles', () => {
  it.each([
    ['Jean 3:16', ref('JHN', 3, 16)],
    ['Jean 3.16', ref('JHN', 3, 16)],
    ['Jn 3,16', ref('JHN', 3, 16)],
    ['Jean 3:16-18', ref('JHN', 3, 16, 3, 18)],
    ['Jean 3:16-4:2', ref('JHN', 3, 16, 4, 2)],
    ['Jean 3 verset 16', ref('JHN', 3, 16)],
    ['Jean 3, verset 16', ref('JHN', 3, 16)],
    ['Jean 3 v. 16', ref('JHN', 3, 16)],
    ['John 3 verse 16', ref('JHN', 3, 16)],
    ['Psaume 23:1', ref('PSA', 23, 1)],
    ['Ps 23:1', ref('PSA', 23, 1)],
    ['Ésaïe 53:5', ref('ISA', 53, 5)],
    ['Esaie 53:5', ref('ISA', 53, 5)],
    ['Isaiah 53:5', ref('ISA', 53, 5)],
  ])('%s', (texte, attendu) => {
    const { references, rejets } = extraireReferences(texte)
    expect(references.map(bornes)).toEqual([attendu])
    expect(rejets).toEqual([])
  })

  it('un chapitre sans versets est un chapitre entier', () => {
    // Genèse 3 compte 24 versets dans Louis Segond.
    expect(extraireReferences('Genèse 3').references.map(bornes)).toEqual([ref('GEN', 3, 1, 3, 24)])
  })

  it('un intervalle de chapitres va au bout du dernier', () => {
    // Genèse 20 compte 18 versets.
    expect(extraireReferences('Genèse 17-20').references.map(bornes)).toEqual([ref('GEN', 17, 1, 20, 18)])
  })

  it('« Jean 3. » en fin de phrase est un chapitre, pas un séparateur orphelin', () => {
    expect(extraireReferences('Lire Jean 3. Puis prier.').references.map(bornes)).toEqual([ref('JHN', 3, 1, 3, 36)])
  })
})

describe('extraireReferences — les listes', () => {
  it('« Jean 3:16, 18 » rend deux versets du même chapitre', () => {
    expect(extraireReferences('Jean 3:16, 18').references.map(bornes)).toEqual([ref('JHN', 3, 16), ref('JHN', 3, 18)])
  })

  it('« Jean 3:16, 4:2 » : un nombre suivi de deux-points ouvre un chapitre', () => {
    expect(extraireReferences('Jean 3:16, 4:2').references.map(bornes)).toEqual([ref('JHN', 3, 16), ref('JHN', 4, 2)])
  })

  it('« Jean 3:16 ; 4:2-5 » : le point-virgule enchaîne les chapitres', () => {
    expect(extraireReferences('Jean 3:16 ; 4:2-5').references.map(bornes)).toEqual([ref('JHN', 3, 16), ref('JHN', 4, 2, 4, 5)])
  })

  it('plusieurs livres dans un même texte, dans l’ordre du texte', () => {
    const texte = 'Culte du matin : Romains 8:28-30, puis Ps 23 et enfin 1 Jean 4:8.'
    expect(extraireReferences(texte).references.map(bornes)).toEqual([
      ref('ROM', 8, 28, 8, 30), ref('PSA', 23, 1, 23, 6), ref('1JN', 4, 8),
    ])
  })

  it('un ordinal après un point-virgule ouvre un livre, pas un chapitre', () => {
    // Trouvé sur des notes de culte réelles, le 17 septembre 2026 : « Romains 1 »
    // et « 1 Jean 4:8 » perdu.
    expect(extraireReferences('Romains 8:28-30 ; 1 Jean 4:8').references.map(bornes)).toEqual([
      ref('ROM', 8, 28, 8, 30), ref('1JN', 4, 8),
    ])
  })

  it('un ordinal après une virgule ouvre un livre, pas un verset', () => {
    expect(extraireReferences('Jean 3:16, 1 Pierre 2:9').references.map(bornes)).toEqual([
      ref('JHN', 3, 16), ref('1PE', 2, 9),
    ])
    expect(extraireReferences('Jude 3, 2 Pierre 1:3').references.map(bornes)).toEqual([
      ref('JUD', 1, 3), ref('2PE', 1, 3),
    ])
  })

  it('la même référence écrite deux fois n’est rendue qu’une fois', () => {
    expect(extraireReferences('Jean 3:16 et encore Jn 3,16').references).toHaveLength(1)
  })

  it('garde le fragment source tel qu’écrit', () => {
    const [r] = extraireReferences('Voir ÉSAÏE 53:5-6 ce soir').references
    expect(r.source).toBe('ÉSAÏE 53:5-6')
  })
})

describe('extraireReferences — les livres à tomes', () => {
  it.each([
    ['1 Jean 4:8', '1JN'], ['1Jean 4:8', '1JN'], ['1re Jean 4:8', '1JN'], ['1ère Jean 4:8', '1JN'],
    ['I Jean 4:8', '1JN'], ['1 John 4:8', '1JN'], ['1st John 4:8', '1JN'],
    ['2 Timothée 3:16', '2TI'], ['II Tim 3:16', '2TI'], ['2e Timothée 3:16', '2TI'],
    ['3 Jean 1:4', '3JN'], ['1 S 17:45', '1SA'], ['2 R 5:14', '2KI'], ['1 Co 13:4', '1CO'],
  ])('%s → %s', (texte, code) => {
    const { references, rejets } = extraireReferences(texte)
    expect(rejets).toEqual([])
    expect(references.map((r) => r.book)).toEqual([code])
  })

  it('« Jean » sans ordinal est l’Évangile', () => {
    expect(extraireReferences('Jean 1:1').references[0].book).toBe('JHN')
  })

  it('« Samuel 3 » sans ordinal est rejeté, pas deviné', () => {
    const { references, rejets } = extraireReferences('Samuel 3')
    expect(references).toEqual([])
    expect(rejets).toEqual([{ source: 'Samuel 3', raison: 'ordinal-manquant' }])
  })

  it('« 3 Samuel 2 » est un tome qui n’existe pas', () => {
    expect(extraireReferences('3 Samuel 2').rejets).toEqual([{ source: '3 Samuel 2', raison: 'tome-inexistant' }])
  })
})

describe('extraireReferences — les livres à un chapitre', () => {
  it('« Jude 3 » est le verset 3', () => {
    expect(extraireReferences('Jude 3').references.map(bornes)).toEqual([ref('JUD', 1, 3)])
  })
  it('« Jude 3-5 » et « Jude 3, 5 » sont des versets', () => {
    expect(extraireReferences('Jude 3-5').references.map(bornes)).toEqual([ref('JUD', 1, 3, 1, 5)])
    expect(extraireReferences('Jude 3, 5').references.map(bornes)).toEqual([ref('JUD', 1, 3), ref('JUD', 1, 5)])
  })
  it('« Philémon 1 » seul est le livre entier', () => {
    expect(extraireReferences('Philémon 1').references.map(bornes)).toEqual([ref('PHM', 1, 1, 1, 25)])
  })
  it('« Philémon 1:4 » se lit comme partout', () => {
    expect(extraireReferences('Philémon 1:4').references.map(bornes)).toEqual([ref('PHM', 1, 4)])
  })
})

describe('extraireReferences — les rejets', () => {
  it('un chapitre que le livre n’a pas', () => {
    const { references, rejets } = extraireReferences('Jude 2:1 et Marc 17:1')
    expect(references).toEqual([])
    expect(rejets.map((r) => r.raison)).toEqual(['chapitre-inexistant', 'chapitre-inexistant'])
  })

  it('un verset au-delà du chapitre est rejeté, non rogné', () => {
    // Jean 3 compte 36 versets.
    const { references, rejets } = extraireReferences('Jean 3:40')
    expect(references).toEqual([])
    expect(rejets).toEqual([{ source: 'Jean 3:40', raison: 'verset-inexistant' }])
  })

  it('un rejet ne fait pas perdre les références voisines', () => {
    const { references, rejets } = extraireReferences('Jean 3:16, 40, 18')
    expect(references.map(bornes)).toEqual([ref('JHN', 3, 16), ref('JHN', 3, 18)])
    expect(rejets).toHaveLength(1)
  })
})

describe('extraireReferences — ce qui n’est pas une référence', () => {
  it.each([
    'Il y a 3 jours',
    'Rendez-vous le 17 septembre 2026 à 10 h',
    'Genèse',
    'Le 2 il est venu',
    'page 12, ligne 4',
  ])('« %s » ne rend rien', (texte) => {
    const { references, rejets } = extraireReferences(texte)
    expect(references).toEqual([])
    expect(rejets).toEqual([])
  })

  it('un nom de livre au milieu d’un mot ne compte pas', () => {
    expect(extraireReferences('Marjolaine 3:16').references).toEqual([])
  })
})
