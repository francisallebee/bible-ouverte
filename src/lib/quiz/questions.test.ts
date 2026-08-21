import { describe, it, expect } from 'vitest'
import {
  questionLivre, questionChapitre, questionTrou, questionReference, construireQuiz, motNu,
  type Alea,
} from './questions'
import type { BiblePassage } from '@/lib/storage/types'

/** Un « hasard » déterministe : la suite est fixée, donc les tests aussi. */
function aleaFixe(suite: number[]): Alea {
  let i = 0
  return () => suite[i++ % suite.length]
}

const PONCTUATION = /[.,;:!?()\[\]«»"'\u2019\u2018\u201c\u201d\u2014\u2013-]/g;

const v = (book: string, chapter: number, verse: number, text: string): BiblePassage =>
  ({ versionId: 'ls1910', book, chapter, verse, text } as BiblePassage)

const VERSETS = [
  v('GEN', 1, 1, 'Au commencement Dieu créa les cieux et la terre'),
  v('JHN', 3, 16, 'Car Dieu a tellement aimé le monde qu il a donné son Fils unique'),
  v('PSA', 23, 1, 'L Éternel est mon berger je ne manquerai de rien'),
  v('ROM', 8, 28, 'Toutes choses concourent au bien de ceux qui aiment Dieu'),
  v('MAT', 5, 9, 'Heureux ceux qui procurent la paix car ils seront appelés enfants'),
]

const nomDuLivre = (a: string) =>
  ({ GEN: 'Genèse', JHN: 'Jean', PSA: 'Psaumes', ROM: 'Romains', MAT: 'Matthieu' }[a] ?? a)

const options = (versets = VERSETS, suite = [0.1, 0.5, 0.9, 0.3, 0.7]) =>
  ({ versets, nomDuLivre, alea: aleaFixe(suite) })

describe('question sur le livre', () => {
  it('propose quatre choix dont la bonne réponse', () => {
    const q = questionLivre(options())!
    expect(q.choix).toHaveLength(4)
    expect(q.choix[q.bonne]).toBe(nomDuLivre(q.source.book))
  })

  it('ne prend ses leurres que parmi les livres lus', () => {
    // Proposer Habacuc à qui n'a lu que les Évangiles rendrait la réponse
    // évidente sans rien réviser.
    const lus = VERSETS.map((x) => nomDuLivre(x.book))
    for (const c of questionLivre(options())!.choix) expect(lus).toContain(c)
  })

  it('ne propose jamais deux fois la même réponse', () => {
    const q = questionLivre(options())!
    expect(new Set(q.choix).size).toBe(q.choix.length)
  })

  it('renonce plutôt que de poser une question à deux choix', () => {
    // Un seul livre lu : pas de leurre possible.
    expect(questionLivre(options([VERSETS[0]]))).toBeNull()
  })

  it('ne rend rien sans matière', () => {
    expect(questionLivre(options([]))).toBeNull()
  })
})

describe('question sur le chapitre', () => {
  it('ne prend ses leurres que dans le même livre', () => {
    const versets = [
      v('PSA', 23, 1, 'a'), v('PSA', 51, 1, 'b'),
      v('PSA', 91, 1, 'c'), v('PSA', 121, 1, 'd'),
      v('GEN', 1, 1, 'e'),
    ]
    const q = questionChapitre(options(versets))!
    const chapitresDuLivre = versets.filter((x) => x.book === q.source.book).map((x) => String(x.chapter))
    for (const c of q.choix) expect(chapitresDuLivre).toContain(c)
  })

  it('renonce si le livre n’a qu’un chapitre lu', () => {
    expect(questionChapitre(options([v('GEN', 1, 1, 'a')]))).toBeNull()
  })
})

describe('question à trou', () => {
  it('masque un mot et le met dans les choix', () => {
    const q = questionTrou(options())!
    expect(q.enonce).toContain('……')
    expect(q.source.text).toContain(q.choix[q.bonne].replace(PONCTUATION, ''))
  })

  it('ne masque jamais un mot outil', () => {
    // Retirer « et » ou « la » ne demande aucune connaissance du texte.
    const q = questionTrou(options())!
    const masque = q.choix[q.bonne].replace(PONCTUATION, '')
    expect(masque.length).toBeGreaterThanOrEqual(5)
  })

  it('ne retire qu’un seul mot', () => {
    const q = questionTrou(options())!
    expect(q.enonce.split('……')).toHaveLength(2)
  })

  it('renonce si aucun verset ne porte de mot assez long', () => {
    expect(questionTrou(options([v('GEN', 1, 1, 'il y a un et la de')]))).toBeNull()
  })

  /**
   * Le défaut du 21 août : les propositions arrivaient telles qu'elles se
   * lisent, si bien qu'un quizz offrait « Gendres, » et « retour, » à côté de
   * « amère ». La virgule désigne le leurre sans qu'on ait lu le texte.
   */
  it('rend des propositions sans ponctuation de bordure', () => {
    const versets = [
      v('GEN', 19, 14, 'Sortez de ce lieu, Gendres, car le Seigneur va détruire.'),
      v('ECC', 7, 26, 'Et j’ai trouvé plus amère que la mort la femme trompeuse.'),
      v('PSA', 23, 3, 'Il restaure mon âme et me guide au retour, paisiblement.'),
      v('JHN', 3, 16, 'Quiconque croit en lui possède la vie éternelle, vraiment.'),
    ]
    const q = questionTrou(options(versets))!
    for (const choix of q.choix) {
      expect(choix).not.toMatch(/^[«»“”"'‘’(\[]/)
      expect(choix).not.toMatch(/[.,;:!?)\]«»“”"'‘’—–-]$/)
    }
  })
})

describe('motNu', () => {
  it('retire la ponctuation qui colle au mot', () => {
    expect(motNu('Gendres,')).toBe('Gendres')
    expect(motNu('retour,')).toBe('retour')
    expect(motNu('mort.')).toBe('mort')
    expect(motNu('(voici')).toBe('voici')
    expect(motNu('«paix»')).toBe('paix')
  })

  /**
   * Le point qui interdit un retrait global : la ponctuation **interne**
   * appartient au mot. `PONCTUATION` la retirerait et rendrait « lhomme ».
   */
  it('ne touche pas à l’intérieur du mot', () => {
    expect(motNu("l'homme")).toBe("l'homme")
    expect(motNu('quatre-vingt')).toBe('quatre-vingt')
    expect(motNu('aujourd’hui')).toBe('aujourd’hui')
  })

  it('laisse intact un mot déjà nu', () => {
    expect(motNu('amère')).toBe('amère')
  })
})

describe('question sur la référence', () => {
  it('rend une référence complète, livre chapitre et verset', () => {
    const q = questionReference(options())!
    expect(q.choix[q.bonne]).toBe(`${nomDuLivre(q.source.book)} ${q.source.chapter}:${q.source.verse}`)
  })
})

describe('questionnaire complet', () => {
  it('alterne les genres plutôt que de les tirer au sort', () => {
    // Un tirage indépendant donnerait volontiers sept questions du même genre.
    const quiz = construireQuiz({ ...options(), nombre: 4 })
    expect(new Set(quiz.map((q) => q.kind)).size).toBeGreaterThanOrEqual(3)
  })

  it('ne pose jamais deux fois le même verset sous le même angle', () => {
    const quiz = construireQuiz({ ...options(), nombre: 8 })
    const cles = quiz.map((q) => `${q.kind}:${q.source.book}:${q.source.chapter}:${q.source.verse}`)
    expect(new Set(cles).size).toBe(cles.length)
  })

  it('rend moins de questions que demandé si la matière ne suffit pas', () => {
    // Et ne boucle pas indéfiniment à en chercher d'introuvables.
    const quiz = construireQuiz({ ...options([VERSETS[0]]), nombre: 10 })
    expect(quiz.length).toBeLessThan(10)
  })

  it('ne rend rien du tout sans aucune lecture', () => {
    expect(construireQuiz({ ...options([]), nombre: 10 })).toEqual([])
  })
})
