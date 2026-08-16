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
 * Le sens d'écriture d'un **texte biblique**, d'après le code langue de sa
 * version — et non d'après la langue de l'interface.
 *
 * Les deux ne coïncident pas : depuis le 16 août 2026, `public/bibles/` porte
 * la Smith & Van Dyck arabe, qu'un lecteur peut consulter dans une interface
 * française. Le bloc de versets a donc son propre `dir`, indépendant de celui
 * posé sur `<html>`.
 *
 * Une langue inconnue de `LOCALES` — le jour où une version allemande
 * arriverait — est réputée de gauche à droite, ce qui est vrai de toutes les
 * langues que ce projet est susceptible d'ajouter sauf l'hébreu.
 */
export function textDirection(language: string): 'ltr' | 'rtl' {
  return isLocale(language) ? localeInfo(language).dir : 'ltr'
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
