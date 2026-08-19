'use client'

import { useEffect, useState } from 'react'
import { X, Search, Check } from 'lucide-react'
import { getPassagesForRange, searchPassages } from '@/lib/storage'
import type { BiblePassage } from '@/lib/storage'
import { getBook } from '@/features/bible'
import { useT, useBookName } from '@/contexts/I18nContext'
import { textDirection } from '@/lib/i18n/locales'
import BookPicker from '@/components/BookPicker'
import PassagePicker, { describeRange, type PassageRange } from '@/components/PassagePicker'

export interface PickedPassage {
  book: string
  chapterStart: number
  chapterEnd: number
  verseStart: number
  verseEnd: number
}

interface Props {
  open: boolean
  /** La version dans laquelle chercher — celle du formulaire appelant. */
  versionId: string
  versionLanguage: string
  onPick: (passage: PickedPassage) => void
  onClose: () => void
}

const VIDE: PassageRange = { chapterStart: 1, chapterEnd: 1, verseStart: 1, verseEnd: 1 }

/**
 * Chercher un passage sans quitter le formulaire.
 *
 * Saisir une lecture supposait de connaître sa référence : pour retrouver un
 * verset dont on ne se rappelle que les mots, il fallait aller sur Recherche
 * biblique, donc perdre ce qu'on avait déjà tapé. Cette fenêtre porte les deux
 * modes de cet écran — par référence et par mots — et rend le passage choisi
 * au formulaire, qui reste intact derrière.
 *
 * Elle ne recopie pas la logique de Recherche biblique : les deux écrans
 * appellent `getPassagesForRange` et `searchPassages`, et réemploient
 * `BookPicker` et `PassagePicker`. Ce qui diffère, c'est ce qu'on fait du
 * résultat — l'un l'enregistre, l'autre le rend à son appelant.
 */
export default function PassageSearch({ open, versionId, versionLanguage, onPick, onClose }: Props) {
  const t = useT()
  const getBookName = useBookName()
  const dir = textDirection(versionLanguage)

  const [mode, setMode] = useState<'reference' | 'keyword'>('reference')

  const [book, setBook] = useState('')
  const [range, setRange] = useState<PassageRange>(VIDE)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [apercu, setApercu] = useState<BiblePassage[]>([])

  const [query, setQuery] = useState('')
  const [resultats, setResultats] = useState<BiblePassage[]>([])
  const [cherche, setCherche] = useState(false)
  const [faite, setFaite] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // L'aperçu suit le choix : c'est lui qui permet de reconnaître le passage
  // avant de le rendre au formulaire.
  useEffect(() => {
    if (!open || !book || !versionId) { setApercu([]); return }
    let annule = false
    ;(async () => {
      try {
        const rows = await getPassagesForRange(versionId, book, range)
        if (!annule) setApercu(rows)
      } catch { if (!annule) setApercu([]) }
    })()
    return () => { annule = true }
  }, [open, book, versionId, range])

  async function chercherParMots() {
    if (!query.trim() || !versionId) return
    setCherche(true)
    try {
      setResultats(await searchPassages(versionId, query.trim(), 100))
    } catch { setResultats([]) }
    setCherche(false)
    setFaite(true)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div role="dialog" aria-modal="true" aria-label={t.passageSearch.title}
        className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[--surface] rounded-t-2xl sm:rounded-2xl border border-[--border] shadow-xl">
        <div className="sticky top-0 bg-[--surface] border-b border-[--border] px-5 py-4 flex items-center justify-between gap-3">
          <p className="font-semibold text-[--text] truncate">{t.passageSearch.title}</p>
          <button type="button" onClick={onClose} aria-label={t.common.close}
            className="shrink-0 text-[--text-secondary] hover:text-[--text] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div role="tablist" aria-label={t.passageSearch.title} className="grid grid-cols-2 gap-2">
            {(['reference', 'keyword'] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  mode === m
                    ? 'bg-[--primary] text-white font-medium'
                    : 'border border-[--border] text-[--text] hover:border-[--primary] hover:text-[--primary]'
                }`}>
                {m === 'reference' ? t.search.modeReference : t.search.modeKeyword}
              </button>
            ))}
          </div>

          {mode === 'reference' ? (
            <div className="space-y-3">
              <BookPicker value={book} onSelect={(b) => { setBook(b); setRange(VIDE) }} />

              <button type="button" onClick={() => setPickerOpen(true)} disabled={!book}
                className="w-full flex items-center justify-between gap-3 border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] hover:border-[--primary] disabled:opacity-50 disabled:hover:border-[--border] disabled:cursor-not-allowed transition-colors">
                <span className={book ? 'truncate' : 'truncate text-[--text-secondary]'}>
                  {book ? describeRange(getBookName(book), range) : t.newReading.selectBookFirst}
                </span>
                <Search className="w-4 h-4 text-[--text-secondary] shrink-0" />
              </button>

              {apercu.length > 0 && (
                <div className="texte-biblique border border-[--border] rounded-lg p-3 text-sm space-y-1 max-h-52 overflow-y-auto" dir={dir}>
                  {apercu.map((p) => (
                    <p key={`${p.chapter}-${p.verse}`} className="leading-relaxed text-[--text]">
                      <sup className="text-xs text-[--text-secondary] me-0.5">{p.verse}</sup>
                      {p.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') chercherParMots() }}
                  placeholder={t.search.keywordPlaceholder} aria-label={t.search.keyword}
                  className="flex-1 border border-[--border] rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]" />
                <button type="button" onClick={chercherParMots} disabled={!query.trim()}
                  className="bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 transition-colors">
                  {t.search.go}
                </button>
              </div>

              {cherche ? (
                <p className="text-sm text-[--text-secondary] py-6 text-center">{t.search.searching}</p>
              ) : faite && resultats.length === 0 ? (
                <p className="text-sm text-[--text-secondary] py-6 text-center">{t.search.noResultFor(query)}</p>
              ) : resultats.length > 0 ? (
                <>
                  <p className="text-xs text-[--text-secondary]">{t.search.resultCount(resultats.length, query)}</p>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {resultats.map((p) => (
                      <button key={`${p.book}-${p.chapter}-${p.verse}`} type="button"
                        onClick={() => onPick({
                          book: p.book,
                          chapterStart: p.chapter, chapterEnd: p.chapter,
                          verseStart: p.verse, verseEnd: p.verse,
                        })}
                        className="w-full text-start border border-[--border] rounded-lg px-3 py-2 hover:border-[--primary] transition-colors">
                        <span className="block text-xs font-medium text-[--primary]">
                          {getBookName(p.book)} {p.chapter}:{p.verse}
                        </span>
                        <span className="texte-biblique block text-sm text-[--text] line-clamp-2" dir={dir}>{p.text}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {mode === 'reference' && (
          <div className="sticky bottom-0 bg-[--surface] border-t border-[--border] px-5 py-4 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-[--border] rounded-lg px-4 py-2.5 text-sm text-[--text] hover:border-[--primary] transition-colors">
              {t.common.cancel}
            </button>
            <button type="button" disabled={!book}
              onClick={() => onPick({ book, ...range })}
              className="flex-1 flex items-center justify-center gap-2 bg-[--primary] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[--primary-hover] disabled:opacity-50 transition-colors">
              <Check className="w-4 h-4" />
              {t.passageSearch.use}
            </button>
          </div>
        )}
      </div>

      <PassagePicker
        open={pickerOpen && !!book}
        book={book}
        bookName={getBookName(book)}
        versionId={versionId}
        maxChapters={getBook(book)?.chapters ?? 150}
        chapterStart={range.chapterStart}
        chapterEnd={range.chapterEnd}
        verseStart={range.verseStart}
        verseEnd={range.verseEnd}
        onClose={() => setPickerOpen(false)}
        onValidate={(r) => { setRange(r); setPickerOpen(false) }}
      />
    </div>
  )
}
