import { addDays } from '@/lib/storage/plan-generator'
import type { PlanDay } from '@/lib/storage/types'
import { titreDe, type Portion, type Repere } from './portions'

/**
 * Les jours d'un document lu jour après jour : une portion par jour, **aucun
 * passage** — le livre vide est la sentinelle que `dayPassages` reconnaît, et
 * `dayToRow` l'écrit nul. Le jour porte ses pages et son titre ; l'écran du
 * plan montre le titre à la place d'une référence, et cocher n'enregistre
 * aucune lecture biblique : les références sont dans le document.
 */
export function joursDeLecture(
  portions: readonly Portion[],
  reperes: readonly Repere[],
  premieresLignes: readonly string[],
  startDate: string | null,
): Omit<PlanDay, 'id' | 'planId' | 'userId'>[] {
  return portions.map((p, i) => ({
    day: i + 1,
    date: startDate ? addDays(startDate, i) : '',
    isRead: false,
    book: '',
    chapterStart: 0,
    chapterEnd: 0,
    verseStart: 0,
    verseEnd: 0,
    pageDebut: p.debut,
    pageFin: p.fin,
    ...(titreDe(p, reperes, premieresLignes) ? { titre: titreDe(p, reperes, premieresLignes) } : {}),
  }))
}

/** Les portions d'un plan existant, pour rouvrir l'éditeur : les jours qui ont des pages, dans l'ordre. */
export function portionsDesJours(days: readonly PlanDay[]): Portion[] {
  return [...days]
    .filter((d) => d.pageDebut !== undefined)
    .sort((a, b) => a.day - b.day)
    .map((d) => ({ debut: d.pageDebut!, fin: d.pageFin ?? d.pageDebut! }))
}

/**
 * Le redécoupage d'un plan existant : les nouveaux jours, qui **gardent le
 * cochage** des anciens quand la portion est exactement la même — déplacer
 * une borne trois jours plus loin ne doit pas décocher ce qu'on a lu. Un jour
 * dont la portée a changé repart non lu.
 */
export function redecouper(
  anciens: readonly PlanDay[],
  portions: readonly Portion[],
  reperes: readonly Repere[],
  premieresLignes: readonly string[],
  startDate: string | null,
): Omit<PlanDay, 'id' | 'planId' | 'userId'>[] {
  const lus = new Map(anciens.filter((d) => d.isRead && d.pageDebut !== undefined)
    .map((d) => [`${d.pageDebut}-${d.pageFin ?? d.pageDebut}`, d.date]))
  return joursDeLecture(portions, reperes, premieresLignes, startDate).map((j) => {
    const date = lus.get(`${j.pageDebut}-${j.pageFin}`)
    return date === undefined ? j : { ...j, isRead: true, date: date || j.date }
  })
}
