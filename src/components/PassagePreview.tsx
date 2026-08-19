'use client'

import { useEffect } from 'react'
import { X, Check, SlidersHorizontal } from 'lucide-react'
import { useT } from '@/contexts/I18nContext'
import type { BiblePassage } from '@/lib/storage'

interface Props {
  open: boolean
  /** La référence lisible, déjà composée — « Jean 3:16-18 ». */
  title: string
  versionName: string
  /** Le sens d'écriture de la **version**, jamais celui de l'interface. */
  dir: 'ltr' | 'rtl'
  passages: BiblePassage[]
  loading: boolean
  /** Revenir au choix des chapitres et des versets. */
  onEdit: () => void
  onValidate: () => void
  onClose: () => void
}

/**
 * Le texte choisi, dans une fenêtre plutôt qu'en colonne permanente.
 *
 * L'aperçu occupait la moitié droite de l'écran Nouvelle lecture en
 * permanence, y compris quand il n'y avait rien à montrer, et sur mobile il
 * repoussait le formulaire vers le bas. Il se lit désormais quand on le
 * demande, dans la coque de `PassagePicker` et de `BookPicker` — c'est le même
 * geste que pour choisir le livre, le chapitre et le verset.
 *
 * **On y valide le texte après l'avoir lu**, ce que la colonne ne permettait
 * pas : elle affichait sans jamais rien demander. « Modifier » renvoie au
 * choix des versets, et c'est le seul chemin de retour qui ait du sens — on
 * ouvre cette fenêtre pour vérifier, donc pour corriger le cas échéant.
 */
export default function PassagePreview({
  open, title, versionName, dir, passages, loading, onEdit, onValidate, onClose,
}: Props) {
  const t = useT()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div role="dialog" aria-modal="true" aria-label={t.newReading.preview}
        className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[--surface] rounded-t-2xl sm:rounded-2xl border border-[--border] shadow-xl">
        <div className="sticky top-0 bg-[--surface] border-b border-[--border] px-5 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-[--text] truncate">{title}</p>
            <p className="text-sm text-[--text-secondary] truncate">{versionName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t.common.close}
            className="shrink-0 text-[--text-secondary] hover:text-[--text] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <div className="animate-spin w-5 h-5 border-2 border-[--primary] border-t-transparent rounded-full" />
            </div>
          ) : passages.length === 0 ? (
            <p className="text-[--text-secondary] text-sm text-center py-10">
              {t.newReading.previewUnavailable}
            </p>
          ) : (
            <div className="texte-biblique space-y-1 text-sm leading-relaxed text-[--text]" dir={dir}>
              {passages.map((p) => (
                <p key={`${p.chapter}-${p.verse}`} className="leading-relaxed">
                  <sup className="text-xs text-[--text-secondary] me-0.5">{p.verse}</sup>
                  {p.text}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-[--surface] border-t border-[--border] px-5 py-4 flex gap-3">
          <button type="button" onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 border border-[--border] rounded-lg px-4 py-2.5 text-sm text-[--text] hover:border-[--primary] transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            {t.common.edit}
          </button>
          <button type="button" onClick={onValidate} disabled={passages.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-[--primary] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[--primary-hover] disabled:opacity-50 transition-colors">
            <Check className="w-4 h-4" />
            {t.passagePicker.validate}
          </button>
        </div>
      </div>
    </div>
  )
}
