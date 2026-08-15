/**
 * Noms des 66 livres, par langue.
 *
 * La clé est l'abréviation USFM (`GEN`, `2CH`, `PSA`), qui est aussi ce que
 * `readings.book` stocke en base — vérifié sur la production. Traduire un nom
 * de livre ne touche donc **aucune donnée enregistrée** : c'est de l'affichage
 * de bout en bout, et un historique reste lisible quelle que soit la langue
 * choisie ensuite.
 *
 * Le français fait référence : le type des autres langues en découle, si bien
 * qu'un livre oublié est une erreur de compilation et non un trou à l'écran.
 */

import type { Locale } from './locales'

export const BOOKS_FR = {
  GEN: 'Genèse', EXO: 'Exode', LEV: 'Lévitique', NUM: 'Nombres',
  DEU: 'Deutéronome', JOS: 'Josué', JDG: 'Juges', RUT: 'Ruth',
  '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Rois', '2KI': '2 Rois',
  '1CH': '1 Chroniques', '2CH': '2 Chroniques', EZR: 'Esdras', NEH: 'Néhémie',
  EST: 'Esther', JOB: 'Job', PSA: 'Psaumes', PRO: 'Proverbes',
  ECC: 'Ecclésiaste', SNG: 'Cantique des Cantiques', ISA: 'Ésaïe', JER: 'Jérémie',
  LAM: 'Lamentations', EZK: 'Ézéchiel', DAN: 'Daniel', HOS: 'Osée',
  JOL: 'Joël', AMO: 'Amos', OBA: 'Abdias', JON: 'Jonas',
  MIC: 'Michée', NAM: 'Nahum', HAB: 'Habacuc', ZEP: 'Sophonie',
  HAG: 'Aggée', ZEC: 'Zacharie', MAL: 'Malachie', MAT: 'Matthieu',
  MRK: 'Marc', LUK: 'Luc', JHN: 'Jean', ACT: 'Actes',
  ROM: 'Romains', '1CO': '1 Corinthiens', '2CO': '2 Corinthiens', GAL: 'Galates',
  EPH: 'Éphésiens', PHP: 'Philippiens', COL: 'Colossiens', '1TH': '1 Thessaloniciens',
  '2TH': '2 Thessaloniciens', '1TI': '1 Timothée', '2TI': '2 Timothée', TIT: 'Tite',
  PHM: 'Philémon', HEB: 'Hébreux', JAS: 'Jacques', '1PE': '1 Pierre',
  '2PE': '2 Pierre', '1JN': '1 Jean', '2JN': '2 Jean', '3JN': '3 Jean',
  JUD: 'Jude', REV: 'Apocalypse',
}

/** L'abréviation USFM d'un livre. Le français fixe la liste. */
export type BookCode = keyof typeof BOOKS_FR

export type BookNames = Record<BookCode, string>

const BOOKS_EN: BookNames = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers',
  DEU: 'Deuteronomy', JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth',
  '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings',
  '1CH': '1 Chronicles', '2CH': '2 Chronicles', EZR: 'Ezra', NEH: 'Nehemiah',
  EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs',
  ECC: 'Ecclesiastes', SNG: 'Song of Songs', ISA: 'Isaiah', JER: 'Jeremiah',
  LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea',
  JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah',
  MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah',
  HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi', MAT: 'Matthew',
  MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts',
  ROM: 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians', GAL: 'Galatians',
  EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians', '1TH': '1 Thessalonians',
  '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy', TIT: 'Titus',
  PHM: 'Philemon', HEB: 'Hebrews', JAS: 'James', '1PE': '1 Peter',
  '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John', '3JN': '3 John',
  JUD: 'Jude', REV: 'Revelation',
}

/**
 * Une langue absente d'ici retombe sur le français plutôt que d'afficher un
 * code brut : « Genèse » se devine, « GEN » non.
 */
const BY_LOCALE: Partial<Record<Locale, BookNames>> = {
  fr: BOOKS_FR,
  en: BOOKS_EN,
}

export function bookNames(locale: Locale): BookNames {
  return BY_LOCALE[locale] ?? BOOKS_FR
}

export function bookName(locale: Locale, abbreviation: string): string {
  return bookNames(locale)[abbreviation as BookCode] ?? abbreviation
}
