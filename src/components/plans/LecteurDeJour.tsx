'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

/**
 * La page d'un jour de plan, lue dans une fenêtre flottante.
 *
 * Un plan tiré d'un document « en entier » porte la page de chaque jour
 * (`plan_days.texte`). Dépliée sous la ligne du jour, elle était illisible —
 * le propriétaire l'a dit le 17 septembre 2026 : un bloc aplati, sans sa mise
 * en page. La page se lit donc ici, comme un passage biblique dans
 * `PassagePreview` : la même coque, la même police de lecture
 * (`.texte-biblique`, celle des réglages), une colonne de lecture, un
 * interligne large.
 *
 * Le texte porte la notation légère que l'extraction garde — `# Titre`,
 * `- élément`, une ligne vide entre les blocs — et ce composant est le seul à
 * la rendre : titres sur trois niveaux, paragraphes, listes. Rien d'autre ;
 * ce n'est pas du Markdown, c'est ce qu'un document de bureau ou un PDF
 * laissent voir de leur structure.
 */

interface Props {
  open: boolean
  titre: string
  sousTitre?: string
  texte: string
  onClose: () => void
}

type Bloc =
  | { type: 'titre'; niveau: 1 | 2 | 3; texte: string }
  | { type: 'liste'; elements: string[] }
  | { type: 'paragraphe'; texte: string }

/** Les blocs d'une page : un titre par ligne `#`, une liste par suite de `-`, un paragraphe par ligne. */
export function blocsDe(texte: string): Bloc[] {
  const blocs: Bloc[] = []
  for (const brute of texte.split(/\r?\n/)) {
    const ligne = brute.trim()
    if (!ligne) continue
    const titre = /^(#{1,3})\s+(.*)$/.exec(ligne)
    if (titre) { blocs.push({ type: 'titre', niveau: titre[1].length as 1 | 2 | 3, texte: titre[2] }); continue }
    const element = /^-\s+(.*)$/.exec(ligne)
    if (element) {
      const dernier = blocs[blocs.length - 1]
      if (dernier?.type === 'liste') dernier.elements.push(element[1])
      else blocs.push({ type: 'liste', elements: [element[1]] })
      continue
    }
    blocs.push({ type: 'paragraphe', texte: ligne })
  }
  return blocs
}

function rendre(blocs: Bloc[]): ReactNode[] {
  return blocs.map((b, i) => {
    if (b.type === 'titre') {
      const classe = b.niveau === 1 ? 'text-xl font-semibold mt-6' : b.niveau === 2 ? 'text-lg font-semibold mt-5' : 'font-semibold mt-4'
      return <p key={i} role="heading" aria-level={b.niveau + 1} className={`${classe} first:mt-0 text-[--text]`}>{b.texte}</p>
    }
    if (b.type === 'liste') {
      return (
        <ul key={i} className="list-disc ps-6 space-y-1">
          {b.elements.map((e, j) => <li key={j}>{e}</li>)}
        </ul>
      )
    }
    return <p key={i}>{b.texte}</p>
  })
}

export default function LecteurDeJour({ open, titre, sousTitre, texte, onClose }: Props) {
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
        className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[--surface] rounded-t-2xl sm:rounded-2xl border border-[--border] shadow-xl">
        <div className="sticky top-0 bg-[--surface] border-b border-[--border] px-5 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-[--text] truncate">{titre}</p>
            {sousTitre && <p className="text-sm text-[--text-secondary] truncate">{sousTitre}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={t.common.close}
            className="shrink-0 text-[--text-secondary] hover:text-[--text] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* La colonne de lecture : la police des réglages, un interligne large,
            une largeur de mesure — ce qui manquait au bloc replié. */}
        <div className="px-5 sm:px-8 py-6">
          <div className="texte-biblique leading-7 text-[--text] space-y-4 max-w-prose mx-auto">
            {rendre(blocsDe(texte))}
          </div>
        </div>
      </div>
    </div>
  )
}
