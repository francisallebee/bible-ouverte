'use client'

import { useEffect, useState } from 'react'
import { BookmarkPlus, Check, Loader2, X } from 'lucide-react'
import { useI18n, useBookName } from '@/contexts/I18nContext'
import { addReading, getPassagesForRange } from '@/lib/storage'
import { ecrireReference } from '@/lib/lectures/reference'
import type { ReferenceExtraite } from '@/lib/import/references'

/**
 * Une référence repérée dans le document qu'on lit, et le bouton qui en fait
 * une lecture.
 *
 * Demandé par le propriétaire le 17 septembre 2026 au soir. Le panneau prend
 * la place du pied de la fenêtre de lecture le temps de la décision : la
 * référence telle que l'application l'écrit, « Ajouter à mes lectures », et
 * la croix. La lecture est enregistrée **à la date du jour**, dans la version
 * du plan, sans contexte, avec pour séance le nom du document — c'est ainsi
 * qu'on la retrouvera groupée dans l'historique ; le texte du passage vient
 * du cache, comme partout (la question de `spec/DROITS.md` ne s'ouvre pas).
 */

interface Props {
  reference: ReferenceExtraite
  versionId: string
  /** Le nom du document lu, qui devient celui de la séance. */
  sessionTitle: string
  onClose: () => void
}

export default function AjoutDeReference({ reference, versionId, sessionTitle, onClose }: Props) {
  const { t } = useI18n()
  const getBookName = useBookName()
  const [etat, setEtat] = useState<'pret' | 'enregistrement' | 'ajoutee' | 'erreur'>('pret')

  // Une autre référence choisie : le panneau repart neuf.
  useEffect(() => { setEtat('pret') }, [reference])

  const libelle = ecrireReference(getBookName(reference.book), reference.book, reference)

  async function ajouter() {
    setEtat('enregistrement')
    try {
      const passages = await getPassagesForRange(versionId, reference.book, reference)
      await addReading({
        date: new Date().toISOString().slice(0, 10),
        book: reference.book,
        chapterStart: reference.chapterStart,
        chapterEnd: reference.chapterEnd,
        verseStart: reference.verseStart,
        verseEnd: reference.verseEnd,
        passageText: passages.map((p) => p.text).join(' '),
        translationId: versionId,
        tags: [],
        contextId: '',
        sessionTitle,
        notes: '',
      })
      setEtat('ajoutee')
    } catch (e) {
      console.warn('AjoutDeReference:', e)
      setEtat('erreur')
    }
  }

  return (
    <div className="flex items-center justify-between gap-3" role="status" aria-live="polite">
      <div className="min-w-0">
        <p className="text-xs text-[--text-secondary]">{t.planDetail.referenceFound}</p>
        <p className="font-semibold text-[--text] truncate">{libelle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {etat === 'ajoutee' ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-green-700"><Check className="w-4 h-4" /> {t.planDetail.referenceAdded}</span>
        ) : (
          <button type="button" onClick={ajouter} disabled={etat === 'enregistrement'}
            className="inline-flex items-center gap-1.5 bg-[--primary] text-white px-3 py-2 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-60">
            {etat === 'enregistrement' ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
            {t.planDetail.addToReadings}
          </button>
        )}
        {etat === 'erreur' && <span className="text-sm text-red-700">{t.planDetail.referenceError}</span>}
        <button type="button" onClick={onClose} aria-label={t.common.close}
          className="p-1 text-[--text-secondary] hover:text-[--text]">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
