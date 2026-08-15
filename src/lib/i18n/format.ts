/**
 * Dates et nombres, dans la langue de l'utilisateur.
 *
 * Remplace les `toLocaleDateString('fr-FR')` écrits en dur un peu partout : une
 * interface traduite qui date ses lectures en français reste une interface
 * française. `Intl` fait le travail, à condition de lui passer l'étiquette
 * BCP 47 de la langue — d'où `tag` dans `LOCALES`.
 *
 * Les dates de l'application sont des `YYYY-MM-DD` nus, sans fuseau. Les lire
 * par `new Date('2026-08-15')` les place à minuit UTC, ce qui recule d'un jour
 * à l'ouest de Greenwich : `parseJour` les construit donc en heure locale.
 */

import { localeInfo, type Locale } from './locales'

/** `YYYY-MM-DD` → `Date` à midi local, à l'abri des décalages de fuseau. */
export function parseJour(iso: string): Date {
  const [a, m, j] = iso.split('-').map(Number)
  if (!a || !m || !j) return new Date(iso)
  return new Date(a, m - 1, j, 12)
}

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseJour(value) : new Date(value)
}

export function formatDate(
  locale: Locale,
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return toDate(value).toLocaleDateString(localeInfo(locale).tag, options)
}

export function formatDateTime(
  locale: Locale,
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return toDate(value).toLocaleString(localeInfo(locale).tag, options)
}

export function formatNumber(locale: Locale, value: number): string {
  return value.toLocaleString(localeInfo(locale).tag)
}

/** Les noms de mois de la langue, pour les axes de graphiques. */
export function monthNames(locale: Locale, style: 'short' | 'long' = 'short'): string[] {
  const fmt = new Intl.DateTimeFormat(localeInfo(locale).tag, { month: style })
  return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2026, m, 1)))
}

/** Les jours de la semaine, du lundi au dimanche. */
export function weekdayNames(locale: Locale, style: 'short' | 'long' = 'short'): string[] {
  const fmt = new Intl.DateTimeFormat(localeInfo(locale).tag, { weekday: style })
  // 5 janvier 2026 est un lundi.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2026, 0, 5 + i)))
}
