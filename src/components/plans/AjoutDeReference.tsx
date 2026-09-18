'use client'

import { useEffect, useRef, useState } from 'react'
import { BookmarkPlus, Check, Loader2, X } from 'lucide-react'
import { useI18n, useBookName } from '@/contexts/I18nContext'
import { addReading, getPassagesForRange } from '@/lib/storage'
import { ecrireReference } from '@/lib/lectures/reference'
import { cleDeReference } from '@/lib/documents/reperage'
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
 *
 * **Une référence ne s'ajoute qu'une fois par séance de lecture** — décision
 * du propriétaire, le 18 septembre 2026, après neuf lectures dont deux
 * paires de doublons dans son EPUB. Le panneau ne se souvient de rien : il
 * naît à chaque toucher et meurt à la croix. C'est le lecteur qui tient
 * l'état de chaque référence de la séance (`etat`, par `cleDeReference`) —
 * **y compris « en cours d'enregistrement »** : la revue a montré qu'un état
 * local pendant l'`await` (une demi-seconde à deux sur téléphone) laissait
 * une croix ou une autre marque réarmer le bouton avant que la lecture ne
 * soit écrite. Le panneau s'ouvre donc directement sur la roue ou sur
 * « Ajoutée », quel que soit l'objet, l'occurrence ou le zoom qui l'a fait
 * rouvrir ; seule l'erreur reste chez lui, transitoire.
 */

/** Ce que le lecteur sait d'une référence pendant la séance. */
export type EtatAjout = 'enregistrement' | 'ajoutee'

interface Props {
  reference: ReferenceExtraite
  versionId: string
  /** Le nom du document lu, qui devient celui de la séance. */
  sessionTitle: string
  /** L'état de cette référence dans la séance ; `null` : rien encore. */
  etat: EtatAjout | null
  /** Le lecteur note l'état — `null` quand l'enregistrement a échoué. */
  onEtat: (reference: ReferenceExtraite, etat: EtatAjout | null) => void
  onClose: () => void
}

export default function AjoutDeReference({ reference, versionId, sessionTitle, etat, onEtat, onClose }: Props) {
  const { t } = useI18n()
  const getBookName = useBookName()
  const [erreur, setErreur] = useState(false)
  const cle = cleDeReference(reference)
  // La clé affichée à l'instant : un échec tardif d'une autre référence ne s'affiche pas ici.
  const cleCourante = useRef(cle)
  cleCourante.current = cle

  // Une autre référence choisie — par sa valeur, pas son objet : l'erreur ne la suit pas.
  useEffect(() => { setErreur(false) }, [cle])

  const libelle = ecrireReference(getBookName(reference.book), reference.book, reference)

  async function ajouter() {
    if (etat) return
    onEtat(reference, 'enregistrement')
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
      onEtat(reference, 'ajoutee')
    } catch (e) {
      console.warn('AjoutDeReference:', e)
      onEtat(reference, null)
      if (cleCourante.current === cle) setErreur(true)
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
        {erreur && <span className="text-sm text-red-700">{t.planDetail.referenceError}</span>}
        <button type="button" onClick={onClose} aria-label={t.common.close}
          className="p-1 text-[--text-secondary] hover:text-[--text]">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
