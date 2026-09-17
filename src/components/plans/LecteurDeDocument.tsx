'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n, useBookName } from '@/contexts/I18nContext'
import { ecrireReference } from '@/lib/lectures/reference'
import { assainir } from '@/lib/documents/assainir'
import { referencesSituees } from '@/lib/documents/reperage'
import { unitesEnCache } from '@/lib/documents/structure'
import type { Unite } from '@/lib/documents/unites'
import type { ReferenceExtraite } from '@/lib/import/references'
import { octetsDuDocument } from '@/lib/plans/document-store'
import AjoutDeReference from './AjoutDeReference'
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
 *
 * Les **références bibliques** du texte sont surlignées (`surlignerReferences`
 * : les nœuds texte du Shadow DOM, chaque occurrence dans un `<mark>`) ; les
 * toucher ouvre `AjoutDeReference` à la place du pied — demandé par le
 * propriétaire le 17 septembre au soir.
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
  /** La version du plan et son nom : ce qu'une référence ajoutée aux lectures emporte. */
  versionId: string
  sessionTitle: string
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
  mark.ref { background: rgba(250, 204, 21, .35); color: inherit; border-bottom: 1px dotted currentColor; border-radius: 2px; padding: 0 .1em; cursor: pointer; }
  mark.ref:hover, mark.ref:focus { background: rgba(250, 204, 21, .6); outline: none; }
`

/**
 * Surligne chaque référence biblique des nœuds texte d'une racine, dans un
 * `<mark>` qui se touche. Une référence coupée par une balise (« Actes
 * <em>8</em>.30 ») n'est pas vue : c'est rare, et un faux surlignage serait
 * pire qu'un manque. Rend les références dans l'ordre de leurs marques.
 */
function surlignerReferences(racine: ShadowRoot, libelle: (r: ReferenceExtraite) => string): ReferenceExtraite[] {
  const refs: ReferenceExtraite[] = []
  const marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT)
  const noeuds: Text[] = []
  let n: Node | null
  while ((n = marcheur.nextNode())) {
    if ((n.parentElement)?.closest('style, mark.ref')) continue
    noeuds.push(n as Text)
  }
  for (const noeud of noeuds) {
    const texte = noeud.nodeValue ?? ''
    const situees = referencesSituees(texte)
    if (situees.length === 0) continue
    const fragment = document.createDocumentFragment()
    let pos = 0
    for (const s of situees) {
      if (s.debut > pos) fragment.appendChild(document.createTextNode(texte.slice(pos, s.debut)))
      const mark = document.createElement('mark')
      mark.className = 'ref'
      mark.textContent = texte.slice(s.debut, s.fin)
      mark.dataset.i = String(refs.length)
      mark.setAttribute('role', 'button')
      mark.tabIndex = 0
      mark.title = libelle(s.reference)
      refs.push(s.reference)
      fragment.appendChild(mark)
      pos = s.fin
    }
    if (pos < texte.length) fragment.appendChild(document.createTextNode(texte.slice(pos)))
    noeud.replaceWith(fragment)
  }
  return refs
}

/** Une unité dans son Shadow DOM, remplie et remplacée quand le HTML change ; ses références surlignées. */
function UniteRendue({ html, onReference, libelle }: { html: string; onReference: (r: ReferenceExtraite) => void; libelle: (r: ReferenceExtraite) => string }) {
  const hote = useRef<HTMLDivElement>(null)
  const surReference = useRef(onReference)
  surReference.current = onReference
  useEffect(() => {
    const el = hote.current
    if (!el) return
    const racine = el.shadowRoot ?? el.attachShadow({ mode: 'open' })
    racine.innerHTML = `<style>${STYLE_DE_BASE}</style>${assainir(html)}`
    const refs = surlignerReferences(racine, libelle)
    const clic = (e: Event) => {
      const mark = (e.target as Element | null)?.closest?.('mark.ref') as HTMLElement | null
      if (!mark) return
      const r = refs[Number(mark.dataset.i)]
      if (r) surReference.current(r)
    }
    const clavier = (e: Event) => { const k = (e as KeyboardEvent).key; if (k === 'Enter' || k === ' ') clic(e) }
    racine.addEventListener('click', clic)
    racine.addEventListener('keydown', clavier)
    return () => {
      racine.removeEventListener('click', clic)
      racine.removeEventListener('keydown', clavier)
    }
  }, [html, libelle])
  return <div ref={hote} className="texte-biblique leading-7 text-[--text]" />
}

export default function LecteurDeDocument({ open, titre, sousTitre, chemin, debut, fin, onPrecedent, onSuivant, lu, onMarquerLu, versionId, sessionTitle, onClose }: Props) {
  const { t } = useI18n()
  const getBookName = useBookName()
  const [unites, setUnites] = useState<Unite[] | null>(null)
  const [erreur, setErreur] = useState(false)
  const [referenceChoisie, setReferenceChoisie] = useState<ReferenceExtraite | null>(null)
  const colonneRef = useRef<HTMLDivElement>(null)
  const libelle = useCallback((r: ReferenceExtraite) => ecrireReference(getBookName(r.book), r.book, r), [getBookName])

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
    setReferenceChoisie(null)
  }, [debut, fin])

  const duJour = unites ? unites.slice(Math.max(0, debut - 1), Math.min(unites.length, fin)) : []

  const pied = referenceChoisie
    ? <AjoutDeReference reference={referenceChoisie} versionId={versionId} sessionTitle={sessionTitle} onClose={() => setReferenceChoisie(null)} />
    : <PiedDeLecture onPrecedent={onPrecedent} onSuivant={onSuivant} lu={lu} onMarquerLu={onMarquerLu} />

  return (
    <FenetreDeLecture open={open} titre={titre} sousTitre={sousTitre} pleinEcran pied={pied} onClose={onClose}>
      <div ref={colonneRef} className="px-5 sm:px-8 py-6">
        {erreur && <p className="text-sm text-red-700 text-center py-8" role="alert">{t.planDetail.documentError}</p>}
        {!erreur && !unites && <p className="text-sm text-[--text-secondary] text-center py-8" role="status">{t.planDetail.documentLoading}</p>}
        {unites && (
          <div className="max-w-prose mx-auto space-y-10">
            {duJour.map((u, i) => <UniteRendue key={`${debut + i}`} html={u.html} onReference={setReferenceChoisie} libelle={libelle} />)}
          </div>
        )}
      </div>
    </FenetreDeLecture>
  )
}
