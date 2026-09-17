'use client'

import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useI18n } from '@/contexts/I18nContext'
import { chargerPdfjs } from '@/lib/import/pdf'
import { octetsDuDocument } from '@/lib/plans/document-store'
import FenetreDeLecture, { PiedDeLecture } from './FenetreDeLecture'

/**
 * Les pages du jour, dessinées depuis le PDF lui-même.
 *
 * Le propriétaire a lu le 17 septembre 2026 un plan « document en entier »
 * tiré d'un PDF et l'a trouvé illisible : le texte qu'on en extrait est une
 * reconstruction, et aucun rendu ne la sauve. Sa demande — « un lecteur de
 * PDF qui respecte le document original » — se tient ici : `pdf.js`, qui
 * extrayait déjà le texte, **dessine** les pages dans des canevas, avec leur
 * mise en page, leurs colonnes, leurs images, leur police. Rien n'est déduit.
 *
 * Le fichier vient du cache local ou du seau (`octetsDuDocument`), une fois ;
 * le document `pdf.js` vit le temps de la fenêtre et se détruit avec elle.
 * Chaque page se dessine à la largeur de la fenêtre fois le zoom, à la
 * densité de l'écran — net sur un téléphone, lourd seulement si l'on zoome.
 *
 * Ce que ce lecteur ne fait pas : la police des réglages (un canevas n'a pas
 * de police), la sélection de texte, la recherche. C'est le prix de la
 * fidélité, dit au propriétaire.
 */

interface Props {
  open: boolean
  titre: string
  sousTitre?: string
  chemin: string
  pageDebut: number
  pageFin: number
  /** Le jour d'avant et celui d'après, pour lire à la suite sans fermer la fenêtre. */
  onPrecedent?: () => void
  onSuivant?: () => void
  lu?: boolean
  onMarquerLu?: () => void
  onClose: () => void
}

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_PAS = 0.25

/** Une page, dessinée quand elle a son document, sa largeur et son zoom ; redessinée si l'un change. */
function PageDuPdf({ doc, numero, largeur, zoom }: { doc: PDFDocumentProxy; numero: number; largeur: number; zoom: number }) {
  const { t } = useI18n()
  const canevasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canevas = canevasRef.current
    if (!canevas || largeur <= 0) return
    let annule = false
    let tache: { cancel: () => void } | null = null
    void (async () => {
      const page = await doc.getPage(numero)
      if (annule) return
      const base = page.getViewport({ scale: 1 })
      const echelle = (largeur * zoom) / base.width
      const densite = window.devicePixelRatio || 1
      const viewport = page.getViewport({ scale: echelle * densite })
      canevas.width = Math.round(viewport.width)
      canevas.height = Math.round(viewport.height)
      canevas.style.width = `${Math.round(viewport.width / densite)}px`
      canevas.style.height = `${Math.round(viewport.height / densite)}px`
      const ctx = canevas.getContext('2d')
      if (!ctx) return
      const rendu = page.render({ canvasContext: ctx, viewport, canvas: canevas })
      tache = rendu
      try {
        await rendu.promise
      } catch {
        // Annulé par un zoom ou une fermeture : le prochain rendu prend la suite.
      }
    })()
    return () => {
      annule = true
      tache?.cancel()
    }
  }, [doc, numero, largeur, zoom])

  return (
    <figure className="m-0">
      <canvas ref={canevasRef} className="block bg-white shadow-md mx-auto" aria-label={t.planDetail.page(numero)} />
      <figcaption className="text-center text-xs text-[--text-secondary] mt-1">{t.planDetail.page(numero)}</figcaption>
    </figure>
  )
}

export default function LecteurDePdf({ open, titre, sousTitre, chemin, pageDebut, pageFin, onPrecedent, onSuivant, lu, onMarquerLu, onClose }: Props) {
  const { t } = useI18n()
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [erreur, setErreur] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [largeur, setLargeur] = useState(0)
  const colonneRef = useRef<HTMLDivElement>(null)

  // Le document : ouvert avec la fenêtre, détruit avec elle.
  useEffect(() => {
    if (!open) return
    let tache: { destroy: () => Promise<void> } | null = null
    let annule = false
    setDoc(null)
    setErreur(false)
    void (async () => {
      try {
        const [pdfjs, octets] = await Promise.all([chargerPdfjs(), octetsDuDocument(chemin)])
        if (annule) return
        const chargement = pdfjs.getDocument({ data: new Uint8Array(octets) })
        tache = chargement
        const ouvert = await chargement.promise
        if (annule) { await chargement.destroy(); return }
        setDoc(ouvert)
      } catch (e) {
        console.warn('LecteurDePdf:', e)
        if (!annule) setErreur(true)
      }
    })()
    return () => {
      annule = true
      tache?.destroy().catch(() => {})
      setDoc(null)
    }
  }, [open, chemin])

  // La largeur disponible, mesurée et suivie : le zoom 1 est « la page tient dans la fenêtre ».
  useEffect(() => {
    if (!open) return
    const colonne = colonneRef.current
    if (!colonne) return
    const mesurer = () => {
      const style = getComputedStyle(colonne)
      setLargeur(colonne.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight))
    }
    mesurer()
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(colonne)
    return () => observateur.disconnect()
  }, [open, doc])

  const pages: number[] = []
  if (doc) {
    for (let n = Math.max(1, pageDebut); n <= Math.min(doc.numPages, pageFin); n++) pages.push(n)
  }

  // Un autre jour dans la même fenêtre : on repart du haut.
  useEffect(() => {
    colonneRef.current?.closest('[role="dialog"]')?.scrollTo({ top: 0 })
  }, [pageDebut, pageFin])

  const pied = <PiedDeLecture onPrecedent={onPrecedent} onSuivant={onSuivant} lu={lu} onMarquerLu={onMarquerLu} />

  const outils = (
    <div className="flex items-center gap-1 text-sm text-[--text-secondary]" role="group" aria-label={t.planDetail.zoom}>
      <button type="button" onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_PAS))} disabled={zoom <= ZOOM_MIN}
        aria-label={t.planDetail.zoomOut} className="p-1 rounded hover:text-[--text] disabled:opacity-40">
        <Minus className="w-4 h-4" />
      </button>
      <span className="tabular-nums w-11 text-center">{Math.round(zoom * 100)} %</span>
      <button type="button" onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_PAS))} disabled={zoom >= ZOOM_MAX}
        aria-label={t.planDetail.zoomIn} className="p-1 rounded hover:text-[--text] disabled:opacity-40">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <FenetreDeLecture open={open} titre={titre} sousTitre={sousTitre} outils={doc ? outils : undefined} large pleinEcran pied={pied} onClose={onClose}>
      <div ref={colonneRef} className="px-3 sm:px-6 py-4 overflow-x-auto">
        {erreur && <p className="text-sm text-red-700 text-center py-8" role="alert">{t.planDetail.documentError}</p>}
        {!erreur && !doc && <p className="text-sm text-[--text-secondary] text-center py-8" role="status">{t.planDetail.documentLoading}</p>}
        {doc && (
          <div className="space-y-4">
            {pages.map((n) => <PageDuPdf key={n} doc={doc} numero={n} largeur={largeur} zoom={zoom} />)}
          </div>
        )}
      </div>
    </FenetreDeLecture>
  )
}
