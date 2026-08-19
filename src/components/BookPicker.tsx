'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Search, ChevronDown } from 'lucide-react'
import { useBooks, useT } from '@/contexts/I18nContext'
import { isOldTestament } from '@/features/bible'

interface Props {
  value: string
  onSelect: (abbreviation: string) => void
  disabled?: boolean
  /** Pour les écrans où le champ n'a pas de `<label>` au-dessus. */
  ariaLabel?: string
  /**
   * Libellé de l'absence de choix — « Tous les livres » pour un filtre.
   *
   * Fourni, il ajoute une entrée en tête de la fenêtre qui rend `''`, et il
   * remplace le texte du bouton quand rien n'est choisi. Absent, choisir un
   * livre reste obligatoire : c'est le cas des formulaires de saisie, où un
   * passage sans livre n'a pas de sens.
   */
  emptyLabel?: string
}

type Testament = 'old' | 'new'

/**
 * Choix d'un livre dans une fenêtre, et non plus dans une liste déroulante.
 *
 * Une liste déroulante de 66 entrées oblige à faire défiler pour atteindre
 * Matthieu, et le fait dans un contrôle natif dont on ne maîtrise ni la taille
 * ni le rendu — sur mobile il occupe l'écran entier, sans repère. La fenêtre
 * reprend exactement la coque de `PassagePicker` : c'est le même geste pour le
 * livre, les chapitres et les versets, sur les trois écrans qui en ont besoin.
 *
 * **Les deux testaments sont séparés**, ce que la liste déroulante ne pouvait
 * pas montrer. C'est la demande du ticket support du 16 août : 39 livres d'un
 * côté, 27 de l'autre, et l'on va droit au bon groupe. Le filtre par nom sert
 * le cas inverse — on sait ce qu'on cherche et l'on ne veut pas parcourir.
 *
 * Le composant porte son propre bouton d'ouverture, et c'est délibéré : c'est
 * ce qui garantit que les trois écrans affichent la même chose. Un simple
 * modal exporté aurait laissé chacun redessiner son déclencheur.
 */
export default function BookPicker({ value, onSelect, disabled, ariaLabel, emptyLabel }: Props) {
  const t = useT()
  const books = useBooks()
  const [open, setOpen] = useState(false)
  const [testament, setTestament] = useState<Testament>('old')
  const [filtre, setFiltre] = useState('')

  const selected = books.find((b) => b.abbreviation === value)

  // Ouvrir sur le testament du livre déjà choisi : rouvrir la fenêtre pour
  // corriger Jean ne doit pas ramener en Genèse.
  useEffect(() => {
    if (!open) return
    setFiltre('')
    setTestament(value && !isOldTestament(value) ? 'new' : 'old')
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Un filtre non vide cherche dans les deux testaments : quelqu'un qui tape
  // « jean » ne sait pas forcément dans lequel il est, et c'est bien la raison
  // pour laquelle il tape.
  const visibles = useMemo(() => {
    const q = filtre.trim().toLowerCase()
    if (q) return books.filter((b) => b.name.toLowerCase().includes(q))
    return books.filter((b) => (testament === 'old') === isOldTestament(b.abbreviation))
  }, [books, filtre, testament])

  const compte = (t2: Testament) =>
    books.filter((b) => (t2 === 'old') === isOldTestament(b.abbreviation)).length

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={disabled} aria-label={ariaLabel}
        className="w-full flex items-center justify-between gap-3 border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] hover:border-[--primary] disabled:opacity-50 disabled:hover:border-[--border] disabled:cursor-not-allowed transition-colors">
        <span className={selected ? 'truncate' : 'truncate text-[--text-secondary]'}>
          {selected?.name ?? emptyLabel ?? t.bookPicker.placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-[--text-secondary] shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />

          <div role="dialog" aria-modal="true" aria-label={t.bookPicker.dialogLabel}
            className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[--surface] rounded-t-2xl sm:rounded-2xl border border-[--border] shadow-xl">
            <div className="sticky top-0 bg-[--surface] border-b border-[--border] px-5 py-4 flex items-center justify-between gap-3">
              <p className="font-semibold text-[--text] truncate">{t.bookPicker.dialogLabel}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.common.close}
                className="shrink-0 text-[--text-secondary] hover:text-[--text] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-secondary] pointer-events-none" />
                <input type="search" value={filtre} onChange={(e) => setFiltre(e.target.value)}
                  placeholder={t.bookPicker.search} aria-label={t.bookPicker.search}
                  className="w-full border border-[--border] rounded-lg ps-9 pe-3 py-2 text-sm bg-[--surface] text-[--text]" />
              </div>

              {!filtre.trim() && (
                <div role="tablist" aria-label={t.bookPicker.dialogLabel} className="grid grid-cols-2 gap-2">
                  {(['old', 'new'] as Testament[]).map((t2) => (
                    <button key={t2} type="button" role="tab" aria-selected={testament === t2}
                      onClick={() => setTestament(t2)}
                      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                        testament === t2
                          ? 'bg-[--primary] text-white font-medium'
                          : 'border border-[--border] text-[--text] hover:border-[--primary] hover:text-[--primary]'
                      }`}>
                      {t2 === 'old' ? t.bookPicker.oldTestament : t.bookPicker.newTestament}
                      <span className="ms-1.5 text-xs opacity-70">({compte(t2)})</span>
                    </button>
                  ))}
                </div>
              )}

              {emptyLabel && (
                <button type="button" aria-pressed={!value}
                  onClick={() => { onSelect(''); setOpen(false) }}
                  className={`w-full rounded-lg px-3 py-2 text-sm text-start transition-colors ${
                    value
                      ? 'border border-[--border] text-[--text] hover:border-[--primary] hover:text-[--primary]'
                      : 'bg-[--primary] text-white font-medium'
                  }`}>
                  {emptyLabel}
                </button>
              )}

              {visibles.length === 0 ? (
                <p className="text-sm text-[--text-secondary] text-center py-6">{t.bookPicker.noMatch}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {visibles.map((b) => {
                    const actif = b.abbreviation === value
                    return (
                      <button key={b.abbreviation} type="button" aria-pressed={actif}
                        onClick={() => { onSelect(b.abbreviation); setOpen(false) }}
                        className={`rounded-lg px-2.5 py-2 text-sm text-start truncate transition-colors ${
                          actif
                            ? 'bg-[--primary] text-white font-medium'
                            : 'border border-[--border] text-[--text] hover:border-[--primary] hover:text-[--primary]'
                        }`}>
                        {b.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
