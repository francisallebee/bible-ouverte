'use client'

import { useEffect, type ReactNode } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

/**
 * La fenêtre flottante dans laquelle un jour de plan se lit — la coque de
 * `PassagePreview`, sans son contenu : un fond assombri, un cadre qui monte du
 * bas sur téléphone et se centre ailleurs, un en-tête collant avec le titre et
 * la croix, Échap pour fermer.
 *
 * Deux lecteurs la partagent : `LecteurDeJour` (le texte d'un document sans
 * pages) et `LecteurDePdf` (les pages d'un PDF gardé). La sortir ici plutôt
 * que la copier : le piège 5 du dépôt.
 */

interface Props {
  open: boolean
  titre: string
  sousTitre?: string
  /** Des commandes à droite du titre — le zoom du lecteur de pages. */
  outils?: ReactNode
  /** Plus large que la colonne de lecture : une page de PDF a besoin de place. */
  large?: boolean
  /** Toute la hauteur sur téléphone — pour lire un document, pas un passage. */
  pleinEcran?: boolean
  /** Une barre sous le contenu — précédent / suivant, marquer lu. */
  pied?: ReactNode
  onClose: () => void
  children: ReactNode
}


/**
 * Le pied d'un lecteur de document : jour précédent, marquer lu (ou « lu »),
 * jour suivant. Le même pour les pages d'un PDF et les unités d'un EPUB.
 */
export function PiedDeLecture({ onPrecedent, onSuivant, lu, onMarquerLu }: {
  onPrecedent?: () => void
  onSuivant?: () => void
  lu?: boolean
  onMarquerLu?: () => void
}) {
  const { t } = useI18n()
  if (!onPrecedent && !onSuivant && !onMarquerLu && !lu) return null
  return (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={onPrecedent} disabled={!onPrecedent}
        className="inline-flex items-center gap-1 text-sm text-[--text-secondary] hover:text-[--text] disabled:opacity-30">
        <ChevronLeft className="w-4 h-4" /> {t.planDetail.previousDay}
      </button>
      {onMarquerLu ? (
        <button type="button" onClick={onMarquerLu}
          className="inline-flex items-center gap-1.5 bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover]">
          <CheckCircle2 className="w-4 h-4" /> {t.planDetail.markAsRead}
        </button>
      ) : lu ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-green-700"><CheckCircle2 className="w-4 h-4" /> {t.planDetail.alreadyRead}</span>
      ) : <span />}
      <button type="button" onClick={onSuivant} disabled={!onSuivant}
        className="inline-flex items-center gap-1 text-sm text-[--text-secondary] hover:text-[--text] disabled:opacity-30">
        {t.planDetail.nextDay} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function FenetreDeLecture({ open, titre, sousTitre, outils, large, pleinEcran, pied, onClose, children }: Props) {
  const { t } = useI18n()

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

      <div role="dialog" aria-modal="true" aria-label={titre}
        className={`relative w-full ${large ? 'sm:max-w-4xl' : 'sm:max-w-2xl'} ${pleinEcran ? 'h-[100dvh] sm:h-auto rounded-none' : 'rounded-t-2xl'} sm:max-h-[90vh] max-h-[100dvh] overflow-y-auto bg-[--surface] sm:rounded-2xl border border-[--border] shadow-xl flex flex-col`}>
        <div className="sticky top-0 z-10 bg-[--surface] border-b border-[--border] px-5 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-[--text] truncate">{titre}</p>
            {sousTitre && <p className="text-sm text-[--text-secondary] truncate">{sousTitre}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {outils}
            <button type="button" onClick={onClose} aria-label={t.common.close}
              className="text-[--text-secondary] hover:text-[--text] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1">{children}</div>
        {pied && (
          <div className="sticky bottom-0 bg-[--surface] border-t border-[--border] px-4 py-3">
            {pied}
          </div>
        )}
      </div>
    </div>
  )
}
