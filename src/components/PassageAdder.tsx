'use client'

import { useState } from 'react'
import { Plus, SlidersHorizontal, Loader2 } from 'lucide-react'
import { getBook } from '@/features/bible'
import { useT, useBookName } from '@/contexts/I18nContext'
import PassagePicker, { describeRange } from '@/components/PassagePicker'
import BookPicker from '@/components/BookPicker'

export interface PassageDraft {
  book: string
  chapterStart: number
  chapterEnd: number
  verseStart: number
  verseEnd: number
}

/**
 * Choix d'un passage à ajouter — à un plan libre, ou à l'apprentissage.
 *
 * Reprend le geste de Nouvelle lecture — choisir le livre ouvre la fenêtre de
 * sélection — pour que construire une liste, enregistrer une lecture et mettre
 * un passage en mémorisation se fassent de la même façon. Né pour les plans
 * libres sous le nom de `PlanEntryAdder` ; renommé le 15 septembre 2026 quand
 * Mémorisation en a eu besoin, parce qu'un nom qui dit « plan » aurait menti.
 * Les libellés par défaut restent ceux des plans ; un autre écran passe les
 * siens.
 */
export default function PassageAdder({
  versionId,
  onAdd,
  title,
  submitLabel,
}: {
  versionId: string
  onAdd: (entry: PassageDraft) => Promise<void>
  /** Titre du cadre ; par défaut « Ajouter un passage ». */
  title?: string
  /** Libellé du bouton ; par défaut « Ajouter à la liste ». */
  submitLabel?: string
}) {
  const t = useT()
  const getBookName = useBookName()
  const [book, setBook] = useState('')
  const [chapterStart, setChapterStart] = useState(1)
  const [chapterEnd, setChapterEnd] = useState(1)
  const [verseStart, setVerseStart] = useState(1)
  const [verseEnd, setVerseEnd] = useState(1)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const maxChapters = getBook(book)?.chapters ?? 150

  function selectBook(abbreviation: string) {
    setBook(abbreviation)
    setChapterStart(1)
    setChapterEnd(1)
    setVerseStart(1)
    setVerseEnd(1)
    if (abbreviation) setPickerOpen(true)
  }

  async function handleAdd() {
    if (!book || saving) return
    setSaving(true)
    try {
      await onAdd({ book, chapterStart, chapterEnd, verseStart, verseEnd })
      // Le livre est conservé : on ajoute rarement un seul passage d'un livre,
      // et le remettre à zéro obligerait à le rechercher dans la liste des 66.
      setChapterStart(1)
      setChapterEnd(1)
      setVerseStart(1)
      setVerseEnd(1)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow]">
      <p className="text-sm font-medium mb-3 text-[--text]">{title ?? t.components.addPassage}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BookPicker value={book} onSelect={selectBook} ariaLabel={t.components.book} />

        <button type="button" onClick={() => setPickerOpen(true)} disabled={!book}
          className="w-full flex items-center justify-between gap-3 border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] hover:border-[--primary] disabled:opacity-50 disabled:hover:border-[--border] disabled:cursor-not-allowed transition-colors">
          <span className="truncate">
            {book
              ? describeRange(getBookName(book), book, { chapterStart, chapterEnd, verseStart, verseEnd })
              : t.components.selectBookFirst}
          </span>
          <SlidersHorizontal className="w-4 h-4 text-[--text-secondary] shrink-0" />
        </button>
      </div>

      <button type="button" onClick={handleAdd} disabled={!book || saving}
        className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 bg-[--primary] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[--primary-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {submitLabel ?? t.components.addToList}
      </button>

      <PassagePicker
        open={pickerOpen && !!book}
        book={book}
        bookName={getBookName(book)}
        versionId={versionId}
        maxChapters={maxChapters}
        chapterStart={chapterStart}
        chapterEnd={chapterEnd}
        verseStart={verseStart}
        verseEnd={verseEnd}
        onClose={() => setPickerOpen(false)}
        onValidate={(r) => {
          setChapterStart(r.chapterStart)
          setChapterEnd(r.chapterEnd)
          setVerseStart(r.verseStart)
          setVerseEnd(r.verseEnd)
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
