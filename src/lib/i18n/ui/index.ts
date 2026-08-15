/**
 * Le registre des dictionnaires.
 *
 * Ajouter une langue tient en deux gestes : un fichier à côté de `fr.ts`, et
 * une ligne ici. Le sélecteur des réglages se sert de ce registre — une langue
 * déclarée dans `LOCALES` mais sans dictionnaire n'y apparaît donc pas, et on
 * ne peut pas choisir une langue à moitié traduite.
 */

import { LOCALES, type Locale, type LocaleInfo } from '../locales'
import { fr, type Dictionary } from './fr'
import { en } from './en'
import { es } from './es'
import { it } from './it'

export type { Dictionary }

export const DICTIONARIES: Partial<Record<Locale, Dictionary>> = { fr, en, es, it }

export function dictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? fr
}

/** Les langues réellement proposables, dans l'ordre de `LOCALES`. */
export const AVAILABLE_LOCALES: LocaleInfo[] =
  LOCALES.filter((l) => DICTIONARIES[l.code] !== undefined)
