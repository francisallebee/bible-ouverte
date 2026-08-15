'use client'

import { useState } from 'react'
import { ChevronDown, Plus, SlidersHorizontal, Loader2 } from 'lucide-react'
import { getBook } from '@/features/bible'
import { useT, useBooks, useBookName } from '@/contexts/I18nContext'
import PassagePicker, { describeRange } from '@/components/PassagePicker'

export interface PlanEntryDraft {
  book: string
  chapterStart: number
  chapterEnd: number
  verseStart: number
  verseEnd: number
}

/**
 * Ajout d'un passage à un plan libre.
 *
 * Reprend le geste de Nouvelle lecture — choisir le livre ouvre la fenêtre de
 * sélection — pour que construire une liste et enregistrer une lecture se
 * fassent de la même façon.
 */
export default function PlanEntryAdder({
  versionId,
  onAdd,
}: {
  versionId: string
  onAdd: (entry: PlanEntryDraft) => Promise<void>
}) {
  const t = useT()
  const books = useBooks()
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
      <p className="text-sm font-medium mb-3 text-[--text]">{t.components.addPassage}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <select value={book} onChange={(e) => selectBook(e.target.value)}
            aria-label={t.components.book}
            className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] appearance-none cursor-pointer">
            <option value="">{t.components.selectBook}</option>
            {books.map((b) => (
              <option key={b.abbreviation} value={b.abbreviation}>{b.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-secondary] pointer-events-none" />
        </div>

        <button type="button" onClick={() => setPickerOpen(true)} disabled={!book}
          className="w-full flex items-center justify-between gap-3 border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] hover:border-[--primary] disabled:opacity-50 disabled:hover:border-[--border] disabled:cursor-not-allowed transition-colors">
          <span className="truncate">
            {book
              ? describeRange(getBookName(book), { chapterStart, chapterEnd, verseStart, verseEnd })
              : t.components.selectBookFirst}
          </span>
          <SlidersHorizontal className="w-4 h-4 text-[--text-secondary] shrink-0" />
        </button>
      </div>

      <button type="button" onClick={handleAdd} disabled={!book || saving}
        className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 bg-[--primary] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[--primary-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {t.components.addToList}
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
