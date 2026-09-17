'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/contexts/I18nContext'
import { assainir } from '@/lib/documents/assainir'
import { unitesEnCache } from '@/lib/documents/structure'
import type { Unite } from '@/lib/documents/unites'
import { octetsDuDocument } from '@/lib/plans/document-store'
import FenetreDeLecture, { PiedDeLecture } from './FenetreDeLecture'

/**
 * Les unités du jour d'un document sans pages — EPUB, Word, OpenDocument,
 * HTML —, rendues **dans leur mise en forme** : titres, gras, italique,
 * listes, tableaux, images, et pour un EPUB la mise en page de l'éditeur.
 *
 * Chaque unité est rendue dans un **Shadow DOM** : la feuille de l'éditeur ne
 * fuit pas dans l'application, et les propriétés héritées — la police de
 * lecture des réglages, la taille, la couleur du thème — traversent la
 * frontière depuis l'hôte. C'est la ligne promise au propriétaire le
 * 17 septembre 2026 : la mise en page du document, la typographie du lecteur.
 *
 * Le HTML passe par `assainir` avant d'entrer : liste blanche, pas de script.
 */

interface Props {
  open: boolean
  titre: string
  sousTitre?: string
  chemin: string
  debut: number
  fin: number
  onPrecedent?: () => void
  onSuivant?: () => void
  lu?: boolean
  onMarquerLu?: () => void
  onClose: () => void
}

/** Les règles de base du document, sous celles de l'éditeur : images bornées, tableaux lisibles, marges de titres. */
const STYLE_DE_BASE = `
  :host { display: block; }
  img, svg { max-width: 100%; height: auto; }
  table { border-collapse: collapse; max-width: 100%; margin: 1em 0; }
  td, th { border: 1px solid currentColor; padding: .25em .5em; vertical-align: top; }
  h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.4em 0 .6em; }
  h1 { font-size: 1.5em; } h2 { font-size: 1.3em; } h3 { font-size: 1.15em; }
  p { margin: .7em 0; }
  ul, ol { padding-inline-start: 1.5em; }
  blockquote { margin: 1em 0; padding-inline-start: 1em; border-inline-start: 3px solid currentColor; opacity: .9; }
  a { color: inherit; text-decoration: underline; }
  pre { white-space: pre-wrap; }
`

/** Une unité dans son Shadow DOM, remplie et remplacée quand le HTML change. */
function UniteRendue({ html }: { html: string }) {
  const hote = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = hote.current
    if (!el) return
    const racine = el.shadowRoot ?? el.attachShadow({ mode: 'open' })
    racine.innerHTML = `<style>${STYLE_DE_BASE}</style>${assainir(html)}`
  }, [html])
  return <div ref={hote} className="texte-biblique leading-7 text-[--text]" />
}

export default function LecteurDeDocument({ open, titre, sousTitre, chemin, debut, fin, onPrecedent, onSuivant, lu, onMarquerLu, onClose }: Props) {
  const { t } = useI18n()
  const [unites, setUnites] = useState<Unite[] | null>(null)
  const [erreur, setErreur] = useState(false)
  const colonneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let annule = false
    setUnites(null)
    setErreur(false)
    void (async () => {
      try {
        const toutes = await unitesEnCache(chemin, () => octetsDuDocument(chemin))
        if (!annule) setUnites(toutes)
      } catch (e) {
        console.warn('LecteurDeDocument:', e)
        if (!annule) setErreur(true)
      }
    })()
    return () => { annule = true }
  }, [open, chemin])

  useEffect(() => {
    colonneRef.current?.closest('[role="dialog"]')?.scrollTo({ top: 0 })
  }, [debut, fin])

  const duJour = unites ? unites.slice(Math.max(0, debut - 1), Math.min(unites.length, fin)) : []

  const pied = <PiedDeLecture onPrecedent={onPrecedent} onSuivant={onSuivant} lu={lu} onMarquerLu={onMarquerLu} />

  return (
    <FenetreDeLecture open={open} titre={titre} sousTitre={sousTitre} pleinEcran pied={pied} onClose={onClose}>
      <div ref={colonneRef} className="px-5 sm:px-8 py-6">
        {erreur && <p className="text-sm text-red-700 text-center py-8" role="alert">{t.planDetail.documentError}</p>}
        {!erreur && !unites && <p className="text-sm text-[--text-secondary] text-center py-8" role="status">{t.planDetail.documentLoading}</p>}
        {unites && (
          <div className="max-w-prose mx-auto space-y-10">
            {duJour.map((u, i) => <UniteRendue key={`${debut + i}`} html={u.html} />)}
          </div>
        )}
      </div>
    </FenetreDeLecture>
  )
}
