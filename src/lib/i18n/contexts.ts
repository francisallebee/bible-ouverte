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

const BY_LOCALE: Partial<Record<Locale, ContextNames>> = {
  fr: CONTEXTS_FR,
  en: CONTEXTS_EN,
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
