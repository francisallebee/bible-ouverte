/**
 * Noms des contextes système, par langue.
 *
 * Ces onze contextes sont écrits **en base, par utilisateur**, avec leur nom
 * français, par `seedIfNeeded`. On ne touche pas à l'amorçage : ses garde-fous
 * sont couverts par `seed.test.ts`, et réécrire les lignes existantes serait une
 * reprise de données pour un simple libellé.
 *
 * La traduction se fait donc à l'affichage, sur le `slug`, qui est stable et
 * vaut aussi l'`id` de la ligne. Un contexte créé par l'utilisateur
 * (`isSystemDefault: false`) garde évidemment le nom qu'il a tapé : ce n'est
 * pas à nous de traduire « ZOOM » ou « Recherches versets ».
 */

import type { Locale } from './locales'

const CONTEXTS_FR = {
  bible: 'Bible',
  'plan-lecture': 'Plan de lecture',
  meditation: 'Méditation',
  eglise: 'Église',
  predication: 'Prédication',
  livre: 'Livre',
  'livre-audio': 'Livre audio',
  revue: 'Revue',
  podcast: 'Podcast',
  radio: 'Radio',
  youtube: 'YouTube',
  autre: 'Autre',
}

export type ContextSlug = keyof typeof CONTEXTS_FR

type ContextNames = Record<ContextSlug, string>

const CONTEXTS_EN: ContextNames = {
  bible: 'Bible',
  'plan-lecture': 'Reading plan',
  meditation: 'Meditation',
  eglise: 'Church',
  predication: 'Sermon',
  livre: 'Book',
  'livre-audio': 'Audiobook',
  revue: 'Magazine',
  podcast: 'Podcast',
  radio: 'Radio',
  youtube: 'YouTube',
  autre: 'Other',
}

const CONTEXTS_ES: ContextNames = {
  bible: 'Biblia',
  'plan-lecture': 'Plan de lectura',
  meditation: 'Meditación',
  eglise: 'Iglesia',
  predication: 'Predicación',
  livre: 'Libro',
  'livre-audio': 'Audiolibro',
  revue: 'Revista',
  podcast: 'Pódcast',
  radio: 'Radio',
  youtube: 'YouTube',
  autre: 'Otro',
}

const CONTEXTS_IT: ContextNames = {
  bible: 'Bibbia',
  'plan-lecture': 'Piano di lettura',
  meditation: 'Meditazione',
  eglise: 'Chiesa',
  predication: 'Predicazione',
  livre: 'Libro',
  'livre-audio': 'Audiolibro',
  revue: 'Rivista',
  podcast: 'Podcast',
  radio: 'Radio',
  youtube: 'YouTube',
  autre: 'Altro',
}

/** Les noms suivent le registre déjà employé par `ui/ar.ts`. */
const CONTEXTS_AR: ContextNames = {
  bible: 'الكتاب المقدس',
  'plan-lecture': 'خطة قراءة',
  meditation: 'تأمل',
  eglise: 'كنيسة',
  predication: 'عظة',
  livre: 'كتاب',
  'livre-audio': 'كتاب مسموع',
  revue: 'مجلة',
  podcast: 'بودكاست',
  radio: 'إذاعة',
  youtube: 'يوتيوب',
  autre: 'أخرى',
}

/**
 * Le registre est **complet**, et non partiel : une langue déclarée dans
 * `LOCALES` sans table ici ne compile pas.
 *
 * Il était `Partial` jusqu'au 19 août 2026, et c'est ce qui a laissé passer
 * l'espagnol, l'italien et l'arabe : les onze contextes système y retombaient
 * en français, sur trois écrans, sans que rien ne le signale. Le garde-fou qui
 * tient les 520 clés des dictionnaires est le même — il n'était simplement pas
 * armé ici.
 */
const BY_LOCALE: Record<Locale, ContextNames> = {
  fr: CONTEXTS_FR,
  en: CONTEXTS_EN,
  es: CONTEXTS_ES,
  it: CONTEXTS_IT,
  ar: CONTEXTS_AR,
}

/**
 * Le nom à afficher pour un contexte.
 *
 * `stored` est ce que porte la ligne. Il l'emporte dès que le contexte n'est
 * pas un contexte système : c'est le texte de l'utilisateur.
 */
export function contextName(
  locale: Locale,
  slug: string,
  stored: string,
  isSystemDefault = false,
): string {
  if (!isSystemDefault) return stored
  const table = BY_LOCALE[locale] ?? CONTEXTS_FR
  return table[slug as ContextSlug] ?? stored
}
