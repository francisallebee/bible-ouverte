'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { getSettings, updateSettings, SETTINGS_CHANGED } from '@/lib/storage/settings-store'
import { DEFAULT_LOCALE, localeInfo, resolveLocale, type Locale } from '@/lib/i18n/locales'
import { fr } from '@/lib/i18n/ui/fr'
import { dictionary, type Dictionary } from '@/lib/i18n/ui'
import { bookName } from '@/lib/i18n/books'
import { contextName } from '@/lib/i18n/contexts'
import { BOOKS } from '@/features/bible'
import { useAuth } from './AuthContext'

/*
 * Les dictionnaires sont importés en statique, et non par `import()`.
 *
 * La règle qui interdit `import()` vise les traductions bibliques de
 * `public/bibles/` — 47 Mo que webpack transformerait en chunks. Un
 * dictionnaire d'interface pèse quelques kilo-octets : le charger d'emblée
 * évite un état « langue en cours de chargement » qui ne servirait personne.
 */

type I18nValue = {
  locale: Locale
  /** Le dictionnaire de la langue courante. Accès direct : `t.nav.settings`. */
  t: Dictionary
  dir: 'ltr' | 'rtl'
  setLocale: (locale: Locale) => Promise<void>
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  t: fr,
  dir: 'ltr',
  setLocale: async () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  /**
   * On démarre sur la langue par défaut plutôt que sur celle du navigateur.
   *
   * Le premier rendu a lieu aussi côté serveur, où `navigator` n'existe pas :
   * partir d'autre chose ferait diverger le rendu serveur du rendu client, et
   * React signalerait une erreur d'hydratation. La vraie langue est posée juste
   * après, dans l'effet — c'est déjà ainsi que le thème procède.
   */
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const { user } = useAuth()

  const appliquer = useCallback(async () => {
    let choisie: string | undefined
    try {
      choisie = (await getSettings())?.language
    } catch {
      // Pas de cache local encore : la langue du navigateur fera l'affaire.
    }
    const langues = typeof navigator !== 'undefined' ? navigator.languages ?? [] : []
    setLocaleState(resolveLocale(choisie, langues))
  }, [])

  useEffect(() => { void appliquer() }, [appliquer, user?.id])

  // Un changement de réglage venu d'ailleurs — l'écran des Réglages — doit
  // traverser toute l'application sans rechargement.
  useEffect(() => {
    const onChange = () => { void appliquer() }
    window.addEventListener(SETTINGS_CHANGED, onChange)
    return () => window.removeEventListener(SETTINGS_CHANGED, onChange)
  }, [appliquer])

  /**
   * `lang` et `dir` sur `<html>`, comme `applyTheme` pose la classe `dark`.
   *
   * `dir` n'est pas décoratif : c'est lui qui retourne la mise en page pour
   * l'arabe, et qui dit au navigateur comment couper les lignes et placer la
   * ponctuation.
   */
  useEffect(() => {
    const { tag, dir } = localeInfo(locale)
    document.documentElement.lang = tag
    document.documentElement.dir = dir
  }, [locale])

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next)
    await updateSettings({ language: next })
  }, [])

  const value = useMemo<I18nValue>(() => ({
    locale,
    t: dictionary(locale),
    dir: localeInfo(locale).dir,
    setLocale,
  }), [locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)

/**
 * Le nom d'un livre dans la langue courante, par son abréviation USFM.
 *
 * Remplace `getBookName` de `features/bible`, qui ne connaît que le français.
 * Passer par un crochet plutôt que par un appel direct garantit que l'écran se
 * redessine quand la langue change — un simple `bookName(locale, …)` figé dans
 * une fonction de module ne le ferait pas.
 */
export function useBookName() {
  const { locale } = useI18n()
  return useCallback((abbreviation: string) => bookName(locale, abbreviation), [locale])
}

/** Le nom d'un contexte, traduit s'il est système, tel quel sinon. */
export function useContextName() {
  const { locale } = useI18n()
  return useCallback(
    (ctx: { slug: string; name: string; isSystemDefault?: boolean }) =>
      contextName(locale, ctx.slug, ctx.name, ctx.isSystemDefault),
    [locale],
  )
}

/** La liste des livres, nommés dans la langue courante et dans l'ordre canonique. */
export function useBooks() {
  const { locale } = useI18n()
  return useMemo(
    () => BOOKS.map((b) => ({ ...b, name: bookName(locale, b.abbreviation) })),
    [locale],
  )
}

/** Le dictionnaire courant. `const t = useT()`, puis `t.nav.settings`. */
export const useT = () => useContext(I18nContext).t

export const useLocale = () => useContext(I18nContext).locale
