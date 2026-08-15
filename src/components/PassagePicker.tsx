'use client'

import { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'
import { getPassages } from '@/lib/storage'
import { useT } from '@/contexts/I18nContext'

export interface PassageRange {
  chapterStart: number
  chapterEnd: number
  verseStart: number
  verseEnd: number
}

interface Props {
  open: boolean
  /** Abréviation du livre, pour interroger le cache des versets. */
  book: string
  bookName: string
  versionId: string
  maxChapters: number
  chapterStart: number
  chapterEnd: number
  verseStart: number
  verseEnd: number
  onValidate: (range: PassageRange) => void
  onClose: () => void
}

/**
 * Nombre de versets proposé tant que le compte réel du chapitre est inconnu —
 * version pas encore importée, ou livre absent du cache. C'est la valeur que
 * l'ancienne liste déroulante affichait pour tous les chapitres sans exception.
 */
const FALLBACK_VERSES = 200

/** Décrit un intervalle sous la forme « Genèse 1-3:5 ». */
export function describeRange(bookName: string, r: PassageRange): string {
  const chapters = r.chapterEnd !== r.chapterStart
    ? `${r.chapterStart}-${r.chapterEnd}`
    : `${r.chapterStart}`
  const verses = r.verseEnd !== r.verseStart
    ? `${r.verseStart}-${r.verseEnd}`
    : `${r.verseStart}`
  return `${bookName} ${chapters}:${verses}`
}

function NumberGrid({
  count, isSelected, isBetween, onPick, label,
}: {
  count: number
  isSelected: (n: number) => boolean
  isBetween: (n: number) => boolean
  onPick: (n: number) => void
  label: string
}) {
  // Chaque grille défile pour elle-même : sans plafond, les 150 chapitres des
  // Psaumes repousseraient les versets hors de la fenêtre.
  return (
    <div role="group" aria-label={label}
      className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-40 sm:max-h-52 overflow-y-auto p-0.5">
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
        const selected = isSelected(n)
        const between = !selected && isBetween(n)
        return (
          <button key={n} type="button" onClick={() => onPick(n)} aria-pressed={selected}
            className={`h-9 rounded-lg text-sm transition-colors ${
              selected
                ? 'bg-[--primary] text-white font-medium'
                : between
                  ? 'bg-[--primary-light] text-[--primary]'
                  : 'border border-[--border] text-[--text] hover:border-[--primary] hover:text-[--primary]'
            }`}>
            {n}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Sélection des chapitres et des versets dans une fenêtre, plutôt que par
 * quatre listes déroulantes occupant en permanence la moitié du formulaire.
 *
 * Un premier appui pose le début de l'intervalle, le suivant sa fin. Le nombre
 * de versets proposé est celui du chapitre, lu dans le cache : les listes
 * déroulantes en offraient 200 quel que soit le chapitre, et l'on pouvait donc
 * demander Jude 1:180.
 */
export default function PassagePicker({
  open, book, bookName, versionId, maxChapters,
  chapterStart, chapterEnd, verseStart, verseEnd,
  onValidate, onClose,
}: Props) {
  const t = useT()
  const [draft, setDraft] = useState<PassageRange>({ chapterStart, chapterEnd, verseStart, verseEnd })
  // Un intervalle se ferme au second appui : ces drapeaux disent si le
  // prochain appui pose une fin ou recommence un intervalle.
  const [chapterOpen, setChapterOpen] = useState(false)
  const [verseOpen, setVerseOpen] = useState(false)
  const [counts, setCounts] = useState<Record<number, number>>({})

  // Reprend la sélection courante à chaque ouverture, pour qu'annuler la laisse
  // intacte.
  useEffect(() => {
    if (!open) return
    setDraft({ chapterStart, chapterEnd, verseStart, verseEnd })
    setChapterOpen(false)
    setVerseOpen(false)
  }, [open, chapterStart, chapterEnd, verseStart, verseEnd])

  // Le compte des versets vaut pour un livre et une version donnés.
  useEffect(() => { setCounts({}) }, [book, versionId])

  useEffect(() => {
    if (!open || !book || !versionId) return
    const wanted = draft.chapterStart === draft.chapterEnd
      ? [draft.chapterStart]
      : [draft.chapterStart, draft.chapterEnd]
    const missing = wanted.filter((c) => counts[c] === undefined)
    if (missing.length === 0) return

    let cancelled = false
    ;(async () => {
      const found: Record<number, number> = {}
      for (const c of missing) {
        try {
          const rows = await getPassages(versionId, book, c)
          // Le dernier verset, pas le nombre de lignes : un trou dans le cache
          // ferait sinon disparaître la fin du chapitre.
          found[c] = rows.reduce((max, r) => Math.max(max, r.verse), 0)
        } catch {
          found[c] = 0
        }
      }
      if (!cancelled) setCounts((prev) => ({ ...prev, ...found }))
    })()
    return () => { cancelled = true }
  }, [open, book, versionId, draft.chapterStart, draft.chapterEnd, counts])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const versesIn = (chapter: number) => counts[chapter] || FALLBACK_VERSES
  const sameChapter = draft.chapterStart === draft.chapterEnd

  function pickChapter(n: number) {
    setDraft((d) => {
      // Un intervalle ouvert se ferme sur un chapitre postérieur ; sinon on
      // repart de zéro sur celui qui vient d'être touché.
      if (chapterOpen && n > d.chapterStart) {
        setChapterOpen(false)
        return { ...d, chapterEnd: n }
      }
      setChapterOpen(true)
      setVerseOpen(false)
      return { chapterStart: n, chapterEnd: n, verseStart: 1, verseEnd: 1 }
    })
  }

  function pickVerse(n: number) {
    setDraft((d) => {
      if (verseOpen && n > d.verseStart) {
        setVerseOpen(false)
        return { ...d, verseEnd: n }
      }
      setVerseOpen(true)
      return { ...d, verseStart: n, verseEnd: n }
    })
  }

  function wholeChapters() {
    setDraft((d) => ({ ...d, verseStart: 1, verseEnd: versesIn(d.chapterEnd) }))
    setVerseOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div role="dialog" aria-modal="true" aria-label={t.passagePicker.dialogLabel(bookName)}
        className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[--surface] rounded-t-2xl sm:rounded-2xl border border-[--border] shadow-xl">
        <div className="sticky top-0 bg-[--surface] border-b border-[--border] px-5 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-[--text] truncate">{bookName}</p>
            <p className="text-sm text-[--text-secondary]">{describeRange(bookName, draft)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t.common.close}
            className="shrink-0 text-[--text-secondary] hover:text-[--text] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div>
            <p className="text-sm font-medium mb-2 text-[--text]">{t.passagePicker.chapter}</p>
            <NumberGrid label={t.passagePicker.chapters} count={maxChapters}
              isSelected={(n) => n === draft.chapterStart || n === draft.chapterEnd}
              isBetween={(n) => n > draft.chapterStart && n < draft.chapterEnd}
              onPick={pickChapter} />
            <p className="text-xs text-[--text-secondary] mt-2">
              {t.passagePicker.rangeHint}
            </p>
          </div>

          {sameChapter ? (
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-[--text]">{t.passagePicker.verse}</p>
                <button type="button" onClick={wholeChapters}
                  className="text-xs text-[--primary] hover:underline">
                  {t.passagePicker.wholeChapter}
                </button>
              </div>
              <NumberGrid label={t.passagePicker.verses} count={versesIn(draft.chapterStart)}
                isSelected={(n) => n === draft.verseStart || n === draft.verseEnd}
                isBetween={(n) => n > draft.verseStart && n < draft.verseEnd}
                onPick={pickVerse} />
            </div>
          ) : (
            // Sur plusieurs chapitres, les deux versets n'appartiennent pas au
            // même chapitre : un intervalle unique n'aurait pas de sens.
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[--text]">{t.passagePicker.verses}</p>
                <button type="button" onClick={wholeChapters}
                  className="text-xs text-[--primary] hover:underline">
                  {t.passagePicker.allVerses}
                </button>
              </div>
              <div>
                <p className="text-xs text-[--text-secondary] mb-1.5">
                  {t.passagePicker.firstVerseOf(draft.chapterStart)}
                </p>
                <NumberGrid label={t.passagePicker.firstVerseLabel(draft.chapterStart)}
                  count={versesIn(draft.chapterStart)}
                  isSelected={(n) => n === draft.verseStart}
                  isBetween={() => false}
                  onPick={(n) => setDraft((d) => ({ ...d, verseStart: n }))} />
              </div>
              <div>
                <p className="text-xs text-[--text-secondary] mb-1.5">
                  {t.passagePicker.lastVerseOf(draft.chapterEnd)}
                </p>
                <NumberGrid label={t.passagePicker.lastVerseLabel(draft.chapterEnd)}
                  count={versesIn(draft.chapterEnd)}
                  isSelected={(n) => n === draft.verseEnd}
                  isBetween={() => false}
                  onPick={(n) => setDraft((d) => ({ ...d, verseEnd: n }))} />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-[--surface] border-t border-[--border] px-5 py-4 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 border border-[--border] rounded-lg px-4 py-2.5 text-sm text-[--text] hover:bg-gray-50 transition-colors">
            {t.common.cancel}
          </button>
          <button type="button" onClick={() => onValidate(draft)}
            className="flex-1 flex items-center justify-center gap-2 bg-[--primary] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[--primary-hover] transition-colors">
            <Check className="w-4 h-4" />
            {t.passagePicker.validate}
          </button>
        </div>
      </div>
    </div>
  )
}
