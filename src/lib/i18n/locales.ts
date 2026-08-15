/**
 * Les langues de l'application.
 *
 * Le texte biblique, lui, reste français : `public/bibles/` ne porte que sept
 * versions francophones. Traduire l'interface ne traduit pas les versets, et
 * rien sur la feuille de route ne prévoit d'en ajouter d'autres langues.
 */

export type Locale = 'fr' | 'en' | 'es' | 'it' | 'ar'

export interface LocaleInfo {
  code: Locale
  /** Le nom de la langue dans cette langue — c'est ainsi qu'on choisit la sienne. */
  name: string
  flag: string
  /** Sens d'écriture. L'arabe est le seul à droite-à-gauche. */
  dir: 'ltr' | 'rtl'
  /** Étiquette BCP 47 pour `Intl`, qui ne connaît pas nos codes courts. */
  tag: string
}

export const LOCALES: LocaleInfo[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr', tag: 'fr-FR' },
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr', tag: 'en-GB' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr', tag: 'es-ES' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr', tag: 'it-IT' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl', tag: 'ar' },
]

/** La langue servie quand rien n'est choisi ni reconnu. Celle de l'origine. */
export const DEFAULT_LOCALE: Locale = 'fr'

export function localeInfo(code: Locale): LocaleInfo {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0]
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.some((l) => l.code === value)
}

/**
 * La langue à servir, par ordre de préséance :
 *
 * 1. le choix explicite de l'utilisateur, qui vit dans ses réglages ;
 * 2. à défaut, la langue du navigateur — `fr-CA` et `fr` valent `fr` ;
 * 3. à défaut, le français.
 *
 * L'ordre compte : un choix explicite ne doit jamais être écrasé par le
 * navigateur, sinon changer de langue ne tiendrait pas d'un appareil à l'autre.
 */
export function resolveLocale(
  chosen: string | undefined,
  browser: readonly string[] = [],
): Locale {
  if (isLocale(chosen)) return chosen
  for (const candidate of browser) {
    const base = candidate.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}
