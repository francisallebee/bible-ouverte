import { BOOKS_FR, bookNames, type BookCode } from '@/lib/i18n/books'
import { LOCALES } from '@/lib/i18n/locales'
import { VERSETS_PAR_CHAPITRE } from '@/features/bible/versification'
import { dernierVerset } from '@/features/bible/versets'

/**
 * Extraire des références bibliques d'un texte libre, sans modèle.
 *
 * C'est le premier étage de l'import de lectures (`spec/IMPORT-IA.md`) : quel
 * que soit le chemin par lequel le texte arrive — presse-papier, fichier, OCR
 * d'une photo, transcription —, il passe ici avant l'écran de validation. Le
 * module est **déterministe** : il reconnaît ce qu'il sait lire et rend le
 * reste en rejets nommés, jamais en silence.
 *
 * Ce qu'il lit : « Jean 3:16 », « Jean 3.16 », « Jn 3,16 », « Jean 3:16-18 »,
 * « Jean 3:16-4:2 », « Jean 3:16, 18 », « Jean 3:16 ; 4:2 », « Jean 3 »,
 * « Jean 3-4 », « Jean 3 verset 16 », « John 3 verse 16 », « 1 Jean 4:8 »,
 * « 1re Jean », « I Jean », « Jude 3 » (les livres à un chapitre lisent le
 * nombre comme un verset). Les noms viennent de `i18n/books.ts` dans toutes
 * les langues qui en portent — **fr et en ce jour**, le `Partial` de
 * `BY_LOCALE` faisant retomber les autres sur le français — plus les
 * abréviations usuelles ci-dessous.
 *
 * Deux règles posées le 17 septembre 2026, plutôt que devinées :
 * - un livre à plusieurs tomes sans ordinal (« Samuel 3 ») est **rejeté** ;
 * - un chapitre ou un verset hors de la versification est **rejeté**, non
 *   rogné. La table est celle de Louis Segond, un repli assumé : une version
 *   qui compte davantage verra sa référence refusée ici et saisie à la main.
 *
 * Un chapitre sans versets est un chapitre **entier** — `dernierVerset`, la
 * règle du sélecteur depuis le 16 septembre.
 */

export interface ReferenceExtraite {
  book: BookCode
  chapterStart: number
  chapterEnd: number
  verseStart: number
  verseEnd: number
  /** Le fragment du texte d'où la référence vient, tel qu'écrit. */
  source: string
}

export type RaisonRejet =
  /** « Samuel 3 » : un livre à tomes, et rien ne dit lequel. */
  | 'ordinal-manquant'
  /** « 3 Samuel » : un tome que la Bible n'a pas. */
  | 'tome-inexistant'
  | 'chapitre-inexistant'
  | 'verset-inexistant'

export interface RejetExtraction {
  source: string
  raison: RaisonRejet
}

export interface Extraction {
  references: ReferenceExtraite[]
  rejets: RejetExtraction[]
}

/**
 * Les abréviations usuelles, par livre, **sans l'ordinal** pour les livres à
 * plusieurs tomes (« S » vaut pour 1 Samuel et 2 Samuel, l'ordinal étant lu
 * à part). Françaises et anglaises mêlées : une abréviation n'appartient pas
 * à une langue, « Ps » se lit des deux côtés. Les formes sont écrites sans
 * accent ni majuscule, la comparaison se faisant sur le texte normalisé.
 */
const ABREVIATIONS: Partial<Record<BookCode, readonly string[]>> = {
  GEN: ['gn', 'gen', 'ge'], EXO: ['ex', 'exo', 'exod'], LEV: ['lv', 'lev'], NUM: ['nb', 'num', 'nomb'],
  DEU: ['dt', 'deut', 'deu'], JOS: ['jos', 'josh'], JDG: ['jg', 'jug', 'judg', 'jdg'], RUT: ['rt', 'ru', 'rut'],
  '1SA': ['s', 'sa', 'sam', 'sm'], '2SA': ['s', 'sa', 'sam', 'sm'],
  '1KI': ['r', 'roi', 'kgs', 'ki', 'kings'], '2KI': ['r', 'roi', 'kgs', 'ki', 'kings'],
  '1CH': ['ch', 'chr', 'chron', 'chroniques'], '2CH': ['ch', 'chr', 'chron', 'chroniques'],
  EZR: ['esd', 'ezr', 'ezra'], NEH: ['ne', 'neh'], EST: ['est', 'esth'], JOB: ['jb'],
  PSA: ['ps', 'psaume', 'psaumes', 'psalm', 'psalms', 'pss'], PRO: ['pr', 'prov', 'pro'],
  ECC: ['ec', 'eccl', 'ecc', 'qo', 'qohelet'], SNG: ['ct', 'cant', 'cantique', 'song', 'sg', 'so'],
  ISA: ['es', 'is', 'isa', 'esa', 'esaie'], JER: ['jr', 'jer'], LAM: ['lm', 'lam'], EZK: ['ez', 'ezek', 'ezk', 'ezech'],
  DAN: ['dn', 'dan'], HOS: ['os', 'hos'], JOL: ['jl', 'joel', 'jol'], AMO: ['am', 'amos'],
  OBA: ['ab', 'abd', 'obad', 'oba'], JON: ['jon', 'jonah'], MIC: ['mi', 'mic', 'mich'], NAM: ['na', 'nah', 'nam'],
  HAB: ['ha', 'hab'], ZEP: ['so', 'soph', 'zeph', 'zep'], HAG: ['ag', 'hag'], ZEC: ['za', 'zach', 'zech', 'zec'],
  MAL: ['ml', 'mal'], MAT: ['mt', 'matt', 'mat'], MRK: ['mc', 'mk', 'mr', 'mark', 'mrk'], LUK: ['lc', 'lk', 'luk', 'luke'],
  JHN: ['jn', 'jh', 'jhn', 'joh'], ACT: ['ac', 'act', 'acts'], ROM: ['rm', 'ro', 'rom'],
  '1CO': ['co', 'cor'], '2CO': ['co', 'cor'], GAL: ['ga', 'gal'], EPH: ['ep', 'eph'],
  PHP: ['ph', 'phil', 'php', 'philip'], COL: ['col'], '1TH': ['th', 'thes', 'thess'], '2TH': ['th', 'thes', 'thess'],
  '1TI': ['tm', 'ti', 'tim'], '2TI': ['tm', 'ti', 'tim'], TIT: ['tt', 'tit'], PHM: ['phm', 'phlm', 'philem'],
  HEB: ['he', 'heb'], JAS: ['jc', 'ja', 'jas'], '1PE': ['p', 'pi', 'pe', 'pet', 'pierre', 'peter'],
  '2PE': ['p', 'pi', 'pe', 'pet', 'pierre', 'peter'],
  '1JN': ['jn', 'jh', 'jhn', 'joh'], '2JN': ['jn', 'jh', 'jhn', 'joh'], '3JN': ['jn', 'jh', 'jhn', 'joh'],
  JUD: ['jud'], REV: ['ap', 'apoc', 'rev', 'apocalypse', 'revelation'],
}

/** Un livre à plusieurs tomes : l'ordinal lu décide du code. */
type Famille = Partial<Record<1 | 2 | 3, BookCode>>

/**
 * Le texte tel qu'il se compare : minuscules, sans diacritiques, **à longueur
 * constante** — chaque caractère est remplacé par un seul, sinon les
 * positions relevées ne désigneraient plus les bons fragments du texte
 * d'origine. Un « œ » reste donc « œ », ce qui ne gêne aucun nom de livre.
 */
function normaliser(texte: string): string {
  let sortie = ''
  for (const c of Array.from(texte)) {
    const base = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    sortie += (base.length === 1 ? base : c).toLowerCase()
  }
  return sortie
}

function echapper(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** L'ordinal d'un livre à tomes : `1SA` → 1, `GEN` → null. */
function ordinalDe(code: BookCode): 1 | 2 | 3 | null {
  const n = Number(code[0])
  return n === 1 || n === 2 || n === 3 ? n : null
}

/**
 * La table des alias, construite une fois : un alias normalisé désigne soit un
 * code, soit une famille dont l'ordinal choisira. « jean » est les deux à la
 * fois — `JHN` sans ordinal, `1JN` avec — et c'est la seule collision voulue.
 */
interface Alias {
  seul: BookCode | null
  famille: Famille
}

function construireAlias(): Map<string, Alias> {
  const table = new Map<string, Alias>()
  const poser = (alias: string, code: BookCode) => {
    const cle = normaliser(alias).replace(/\s+/g, ' ').trim()
    if (!cle) return
    const entree = table.get(cle) ?? { seul: null, famille: {} }
    const ord = ordinalDe(code)
    if (ord) entree.famille[ord] = code
    else entree.seul = code
    table.set(cle, entree)
  }
  const codes = Object.keys(BOOKS_FR) as BookCode[]
  for (const { code: locale } of LOCALES) {
    const noms = bookNames(locale)
    for (const code of codes) {
      // Le nom d'un livre à tomes commence par son ordinal : on le retire, il
      // sera lu par l'expression régulière, sous toutes ses formes.
      poser(noms[code].replace(/^[123]\s+/, ''), code)
    }
  }
  for (const code of codes) {
    for (const abr of ABREVIATIONS[code] ?? []) poser(abr, code)
  }
  return table
}

const ALIAS = construireAlias()

/** Les alias du plus long au plus court, pour que « 1 corinthiens » batte « co ». */
const MOTIF_ALIAS = Array.from(ALIAS.keys())
  .sort((a, b) => b.length - a.length)
  .map((a) => echapper(a).replace(/ /g, '\\s+'))
  .join('|')

/**
 * Un ordinal facultatif, puis un nom ou une abréviation, puis un point
 * facultatif, suivi d'un chiffre — un nom de livre sans nombre n'est pas une
 * référence. `\b` ne vaut rien devant un chiffre romain collé, d'où la
 * frontière posée à la main : début de texte ou non-lettre.
 */
const MOTIF_LIVRE = new RegExp(
  `(?<![\\p{L}\\d])(?:(3|2|1|iii|ii|i)\\s*(?:ere|re|er|e|st|nd|rd)?\\.?\\s*)?(${MOTIF_ALIAS})\\.?(?=\\s*\\d)`,
  'giu',
)

const ORDINAUX: Record<string, 1 | 2 | 3> = { '1': 1, '2': 2, '3': 3, i: 1, ii: 2, iii: 3 }

/**
 * Un nombre qui est en fait l'ordinal du livre suivant — « ; 1 Jean 4:8 »,
 * « , 2 Pierre 1:3 ». Une liste ou un point-virgule ne doit pas le lire comme
 * un chapitre ou un verset : c'est l'essai réel du 17 septembre 2026 qui l'a
 * montré, sur des notes de culte, là où cinquante-trois tests l'ignoraient.
 */
const MOTIF_LIVRE_APRES_NOMBRE = new RegExp(
  `^\\d+\\s*(?:ere|re|er|e|st|nd|rd)?\\.?\\s*(?:${MOTIF_ALIAS})(?![\\p{L}])`,
  'iu',
)

/**
 * Ce qui sépare un chapitre de son verset, **à condition qu'un nombre suive** :
 * « 3:16 », « 3.16 », « 3,16 » collé, « 3 v. 16 », « 3, verset 16 ». Sans
 * nombre derrière, un point est la fin d'une phrase — « lire Jean 3. » est
 * un chapitre entier, pas un séparateur orphelin. La virgule ne sépare que
 * **collée** au nombre, à la française (« Jn 3,16 ») : suivie d'une espace,
 * elle énumère (« Jude 3, 5 »).
 */
const SEPARATEUR_VERSET = /^\s*(?:(?::|\.)(?=\s*\d)|,(?=\d)|,?\s+(?:vv?s?|versets?|verses?)\.?(?=\s*\d))\s*/
const TIRET = /^\s*[-–—]\s*(?=\d)/
const VIRGULE = /^\s*,\s*(?=\d)/
const POINT_VIRGULE = /^\s*;\s*(?=\d)/
const DEUX_POINTS = /^\s*[:.]\s*(?=\d)/
const NOMBRE = /^\d+/

function chapitresDe(code: BookCode): number {
  return VERSETS_PAR_CHAPITRE[code]?.length ?? 0
}

type Bornes = Omit<ReferenceExtraite, 'source' | 'book'>

/**
 * Lit tout ce qui suit un nom de livre : chapitres, versets, listes,
 * intervalles. Rend les références et la longueur consommée, pour que le
 * fragment `source` désigne exactement ce qui a été lu.
 *
 * Chaque motif de ponctuation exige un nombre derrière lui (`(?=\d)`), si bien
 * qu'une ponctuation qui n'introduit rien n'est jamais consommée : la lecture
 * s'arrête proprement au dernier nombre lu.
 */
function lireQueue(code: BookCode, queue: string): { refs: Bornes[]; rejets: RaisonRejet[]; lu: number } {
  const refs: Bornes[] = []
  const rejets: RaisonRejet[] = []
  const chapitres = chapitresDe(code)
  let pos = 0
  const prendre = (motif: RegExp): boolean => {
    const m = motif.exec(queue.slice(pos))
    if (!m) return false
    pos += m[0].length
    return true
  }
  /** Consomme un séparateur de liste, sauf si un livre suit le nombre qu'il introduit. */
  const enchainer = (separateur: RegExp): boolean => {
    const avant = pos
    if (!prendre(separateur)) return false
    if (MOTIF_LIVRE_APRES_NOMBRE.test(queue.slice(pos))) { pos = avant; return false }
    return true
  }
  const nombre = (): number => {
    const m = NOMBRE.exec(queue.slice(pos))!
    pos += m[0].length
    return Number(m[0])
  }
  const poser = (cs: number, ce: number, vs: number, ve: number) => {
    if (cs < 1 || ce < cs || ce > chapitres) { rejets.push('chapitre-inexistant'); return }
    if (vs < 1 || vs > dernierVerset(code, cs) || ve > dernierVerset(code, ce) || (cs === ce && ve < vs)) {
      rejets.push('verset-inexistant'); return
    }
    refs.push({ chapterStart: cs, chapterEnd: ce, verseStart: vs, verseEnd: ve })
  }

  /** « 16 », « 16-18 », « 16-4:2 » : un verset ou un intervalle depuis `chapitre:vs`. */
  const lireIntervalle = (chapitre: number, vs: number) => {
    let ce = chapitre, ve = vs
    if (prendre(TIRET)) {
      const n = nombre()
      if (prendre(DEUX_POINTS)) { ce = n; ve = nombre() } else ve = n
    }
    poser(chapitre, ce, vs, ve)
  }

  // Une suite de « chapitre[:versets] » séparés par « ; ».
  for (;;) {
    prendre(/^\s*(?=\d)/)
    if (!NOMBRE.test(queue.slice(pos))) break
    let chapitre = nombre()

    if (prendre(SEPARATEUR_VERSET)) {
      // « 3:16 », puis autant de « , 18 », « -18 », « -4:2 » ou « , 4:2 » que
      // le texte en porte — un nombre suivi de « : » dans la liste ouvre un
      // nouveau chapitre. Un livre à un chapitre passe aussi par ici quand il
      // est écrit « Philémon 1:4 » : « Jude 2:1 » y est rejeté comme il se doit.
      lireIntervalle(chapitre, nombre())
      while (enchainer(VIRGULE)) {
        const n = nombre()
        if (prendre(DEUX_POINTS)) { chapitre = n; lireIntervalle(chapitre, nombre()) }
        else lireIntervalle(chapitre, n)
      }
    } else if (chapitres === 1) {
      // Un livre à un chapitre : « Jude 3 », « Jude 3-5 », « Jude 3, 5 » sont
      // des versets du chapitre 1 ; « Philémon 1 » seul est le livre entier.
      if (chapitre === 1 && !TIRET.test(queue.slice(pos)) && !VIRGULE.test(queue.slice(pos))) {
        poser(1, 1, 1, dernierVerset(code, 1))
      } else {
        lireIntervalle(1, chapitre)
        while (enchainer(VIRGULE)) lireIntervalle(1, nombre())
      }
    } else {
      // « Jean 3 » ou « Jean 3-4 » : des chapitres entiers.
      const ce = prendre(TIRET) ? nombre() : chapitre
      if (ce >= chapitre && ce <= chapitres) poser(chapitre, ce, 1, dernierVerset(code, ce))
      else rejets.push('chapitre-inexistant')
    }

    if (!enchainer(POINT_VIRGULE)) break
  }
  return { refs, rejets, lu: pos }
}

/**
 * Extrait toutes les références d'un texte, dans l'ordre où elles y figurent,
 * sans doublon. Les rejets gardent le fragment tel qu'écrit pour que l'écran
 * de validation puisse le montrer.
 */
export function extraireReferences(texte: string): Extraction {
  const normalise = normaliser(texte)
  const references: ReferenceExtraite[] = []
  const rejets: RejetExtraction[] = []
  const vues = new Set<string>()
  let dernierePos = 0

  for (const m of Array.from(normalise.matchAll(MOTIF_LIVRE))) {
    const debut = m.index ?? 0
    if (debut < dernierePos) continue
    const entree = ALIAS.get(m[2].replace(/\s+/g, ' '))
    if (!entree) continue
    const ordinal = m[1] ? ORDINAUX[m[1].toLowerCase()] : undefined
    const code = ordinal ? entree.famille[ordinal] : entree.seul
    const finLivre = debut + m[0].length
    if (!code) {
      // « Samuel 3 » sans ordinal, ou « 3 Samuel » : le nombre qui suit est
      // pris dans le fragment, pour que le rejet se lise tel qu'écrit.
      const nombreApres = /^\s*\d+/.exec(normalise.slice(finLivre))?.[0].length ?? 0
      rejets.push({
        source: texte.slice(debut, finLivre + nombreApres).trim(),
        raison: ordinal ? 'tome-inexistant' : 'ordinal-manquant',
      })
      dernierePos = finLivre + nombreApres
      continue
    }
    const { refs, rejets: raisons, lu } = lireQueue(code, normalise.slice(finLivre))
    const source = texte.slice(debut, finLivre + lu).trim()
    for (const r of refs) {
      const cle = `${code}:${r.chapterStart}:${r.verseStart}:${r.chapterEnd}:${r.verseEnd}`
      if (vues.has(cle)) continue
      vues.add(cle)
      references.push({ book: code, ...r, source })
    }
    for (const raison of raisons) rejets.push({ source, raison })
    dernierePos = finLivre + lu
  }
  return { references, rejets }
}
