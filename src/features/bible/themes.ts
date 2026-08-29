import { BOOKS } from './books'

/**
 * Les thèmes de la recherche biblique.
 *
 * **Ce sont des références, pas du texte.** Un thème ne porte que son
 * identifiant et une liste de passages en abréviations USFM ; le libellé vit
 * dans les dictionnaires, sous `themes.labels`, indexé par ce même `slug`.
 * C'est la règle d'`AGENTS.md` — ce qui est logique reste dans le code, ce qui
 * est libellé se traduit — et c'est ce qui permet à la recherche thématique de
 * fonctionner dans les cinq langues sans dupliquer une seule référence.
 *
 * Conséquence pratique : le texte affiché vient de la version que le lecteur a
 * choisie, comme partout ailleurs. Un thème cherché depuis une application en
 * français peut donc rendre la Van Dyck, en arabe et de droite à gauche.
 *
 * **Les passages sont volontairement courts** — un à quelques versets. Un thème
 * qui renverrait des chapitres entiers ne se lirait pas d'écran : il servirait
 * de plan de lecture, ce que l'application propose déjà ailleurs.
 */

export interface PassageThematique {
  /** Abréviation USFM, telle que `readings.book` la stocke. */
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
}

/**
 * Les identifiants, en union littérale.
 *
 * `as const` ici, et non sur la table : c'est ce qui fait de `ThemeSlug` une
 * union de quinze chaînes plutôt qu'un `string`, et donc ce qui permet à `tsc`
 * de refuser un thème dont le libellé manquerait dans les dictionnaires. Le
 * test compare déjà les deux listes ; le typage le fait à la compilation, ce
 * qui est plus tôt.
 *
 * On se garde bien d'une assertion `as Record<string, string>` sur les
 * libellés : elle rendrait l'indexation possible en désarmant précisément le
 * contrôle qu'on cherche — le piège du 19 et du 21 août 2026.
 */
export const THEME_SLUGS = [
  'amour', 'foi', 'esperance', 'paix', 'consolation', 'pardon', 'priere',
  'courage', 'sagesse', 'joie', 'reconnaissance', 'humilite', 'patience',
  'creation', 'salut',
] as const

export type ThemeSlug = (typeof THEME_SLUGS)[number]

export interface ThemeBiblique {
  /** Stable : il sert de clé de traduction et n'a pas à bouger. */
  slug: ThemeSlug
  passages: PassageThematique[]
}

/** Raccourci de lecture : `p('JHN', 3, 16)` ou `p('JHN', 3, 16, 17)`. */
function p(book: string, chapter: number, verseStart: number, verseEnd = verseStart): PassageThematique {
  return { book, chapter, verseStart, verseEnd }
}

/**
 * Les quinze thèmes livrés.
 *
 * Choisis pour couvrir ce qu'on cherche quand on ouvre une Bible sans savoir
 * où aller : une consolation, un pardon, un motif d'espérer. L'ordre est celui
 * de l'affichage, et il place en tête les plus demandés plutôt que l'alphabet
 * — qui varie de toute façon d'une langue à l'autre.
 */
export const THEMES: ThemeBiblique[] = [
  {
    slug: 'amour',
    passages: [
      p('JHN', 3, 16), p('1CO', 13, 4, 7), p('ROM', 8, 38, 39),
      p('1JN', 4, 7, 8), p('JHN', 15, 12, 13), p('1JN', 4, 18),
    ],
  },
  {
    slug: 'foi',
    passages: [
      p('HEB', 11, 1), p('ROM', 10, 17), p('MRK', 11, 22, 24),
      p('JAS', 1, 5, 6), p('2CO', 5, 7), p('EPH', 2, 8, 9),
    ],
  },
  {
    slug: 'esperance',
    passages: [
      p('JER', 29, 11), p('ROM', 15, 13), p('ISA', 40, 31),
      p('LAM', 3, 22, 23), p('ROM', 5, 3, 5), p('PSA', 42, 6),
    ],
  },
  {
    slug: 'paix',
    passages: [
      p('JHN', 14, 27), p('PHP', 4, 6, 7), p('ISA', 26, 3),
      p('PSA', 4, 9), p('COL', 3, 15), p('MAT', 5, 9),
    ],
  },
  {
    slug: 'consolation',
    passages: [
      p('PSA', 23, 1, 4), p('MAT', 11, 28, 30), p('2CO', 1, 3, 4),
      p('PSA', 34, 19), p('ISA', 41, 10), p('REV', 21, 4),
    ],
  },
  {
    slug: 'pardon',
    passages: [
      p('1JN', 1, 9), p('PSA', 103, 12), p('MAT', 6, 14, 15),
      p('EPH', 4, 32), p('COL', 3, 13), p('LUK', 23, 34),
    ],
  },
  {
    slug: 'priere',
    passages: [
      p('MAT', 6, 9, 13), p('PHP', 4, 6), p('1TH', 5, 16, 18),
      p('JAS', 5, 16), p('LUK', 11, 9, 10), p('PSA', 145, 18),
    ],
  },
  {
    slug: 'courage',
    passages: [
      p('JOS', 1, 9), p('DEU', 31, 6), p('PSA', 27, 1),
      p('ISA', 41, 13), p('2TI', 1, 7), p('1CO', 16, 13),
    ],
  },
  {
    slug: 'sagesse',
    passages: [
      p('PRO', 3, 5, 6), p('JAS', 1, 5), p('PRO', 9, 10),
      p('ECC', 3, 1), p('PSA', 119, 105), p('PRO', 16, 9),
    ],
  },
  {
    slug: 'joie',
    passages: [
      p('PSA', 118, 24), p('NEH', 8, 10), p('PHP', 4, 4),
      p('GAL', 5, 22, 23), p('PSA', 16, 11), p('JHN', 15, 11),
    ],
  },
  {
    slug: 'reconnaissance',
    passages: [
      p('1TH', 5, 18), p('PSA', 100, 4, 5), p('COL', 3, 17),
      p('PSA', 107, 1), p('EPH', 5, 20), p('PSA', 136, 1),
    ],
  },
  {
    slug: 'humilite',
    passages: [
      p('PHP', 2, 3, 4), p('JAS', 4, 10), p('PRO', 11, 2),
      p('MIC', 6, 8), p('1PE', 5, 5, 6), p('MAT', 23, 12),
    ],
  },
  {
    slug: 'patience',
    passages: [
      p('JAS', 1, 2, 4), p('ROM', 12, 12), p('PSA', 37, 7),
      p('GAL', 6, 9), p('ECC', 7, 8), p('2PE', 3, 9),
    ],
  },
  {
    slug: 'creation',
    passages: [
      p('GEN', 1, 1), p('PSA', 19, 2), p('PSA', 139, 13, 14),
      p('JOB', 12, 7, 9), p('COL', 1, 16), p('ISA', 40, 26),
    ],
  },
  {
    slug: 'salut',
    passages: [
      p('ROM', 10, 9, 10), p('EPH', 2, 8, 9), p('ACT', 4, 12),
      p('JHN', 14, 6), p('ROM', 6, 23), p('TIT', 3, 5),
    ],
  },
]

/** Un thème par son identifiant, ou `undefined`. */
export function themeParSlug(slug: string): ThemeBiblique | undefined {
  return THEMES.find((theme) => theme.slug === slug)
}

/** Ce `slug` est-il un thème connu ? Affine le type au passage. */
export function estThemeConnu(slug: string): slug is ThemeSlug {
  return (THEME_SLUGS as readonly string[]).includes(slug)
}

/**
 * Les abréviations de livres citées par les thèmes.
 *
 * Sert au test qui vérifie qu'aucune n'est inventée : une abréviation fausse
 * ne casse rien à la compilation et rend simplement un passage vide à l'écran
 * — exactement le genre de défaut que la règle 13 a déjà fait payer sur les
 * versions bibliques.
 */
export function livresCites(): string[] {
  const vus = new Set<string>()
  for (const theme of THEMES) {
    for (const passage of theme.passages) vus.add(passage.book)
  }
  // `Array.from` et non `[...vus]` : itérer un `Set` réclame
  // `--downlevelIteration`, que `tsconfig.json` n'active pas. Vitest laisse
  // passer — esbuild ne fait pas ce contrôle —, `tsc` non. Déjà rencontré le
  // 21 août 2026, voir `spec/REPRISE.md`.
  return Array.from(vus)
}

/** Le nombre de chapitres d'un livre, ou `0` s'il est inconnu. */
export function chapitresDe(abbreviation: string): number {
  return BOOKS.find((b) => b.abbreviation === abbreviation)?.chapters ?? 0
}
