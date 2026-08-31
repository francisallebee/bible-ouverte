export { importBibleVersion, importEnabledBibleData, forgetImportedVersion } from './import';
export { BOOKS, getBook, getBookName } from './books';
export type { BibleBook } from './books';
// `versets` et `versification` ne passent **pas** par ce baril, et c'est
// mesuré : `I18nContext` importe `BOOKS` d'ici, si bien que tout ce qu'on y
// réexporte entre dans le chunk partagé de toutes les routes. La table des
// 1189 chapitres s'est retrouvée ainsi sur la page d'accueil prérendue — 3,8 kB
// non compressés, relevés dans le chunk servi en production le 31 août 2026,
// pour un écran qui ne choisit aucun passage. Les deux modules s'importent donc
// par leur chemin, comme `seed.ts` le fait déjà pour `@/features/bible/import`.
export {
  BIBLE_CATEGORIES, OLD_TESTAMENT, NEW_TESTAMENT,
  getBookCategory, isOldTestament, isNewTestament, getCategoryChapters,
} from './classification';
