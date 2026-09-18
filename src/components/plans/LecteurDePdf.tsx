'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Crop, Minus, Moon, Plus, Sun } from 'lucide-react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { useI18n, useBookName } from '@/contexts/I18nContext'
import { cleDeReference, etendueDe, referencesSituees, texteDeLigne, type Fragment } from '@/lib/documents/reperage'
import { chargerPdfjs, type ElementTexte } from '@/lib/import/pdf'
import type { ReferenceExtraite } from '@/lib/import/references'
import { ecrireReference } from '@/lib/lectures/reference'
import { octetsDuDocument } from '@/lib/plans/document-store'
import AjoutDeReference, { type EtatAjout } from './AjoutDeReference'
import {
  boiteDEncre, boiteUtile, defilementApresZoom, ecart, milieu, zoomBorne, zoomDoubleToucher, zoomPince,
  ZOOM_MAX, ZOOM_MIN, ZOOM_PAS, type Boite,
} from '@/lib/plans/lecteur-pdf'
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
 * Puis, sur son iPhone : « bien, mais on peut mieux faire, en fonction du
 * document lui-même ». Trois choses, le même jour :
 * - **les marges rognées** : la boîte réelle de l'encre de chaque page,
 *   trouvée dans un rendu à basse résolution et gardée pour le document, pour
 *   ajuster le *contenu* à la largeur de l'écran — un quart à un tiers de
 *   texte en plus sur un livre ordinaire ; débrayable (le bouton Marges) ;
 * - **pincer pour zoomer, double-toucher** : le geste du téléphone, une
 *   transformation CSS pendant le geste et un redessin net à la fin, le point
 *   pincé gardé sous les doigts ; le zoom mémorisé par document ;
 * - **la page sombre** en mode sombre : une inversion douce, débrayable.
 *
 * Le fichier vient du cache local ou du seau (`octetsDuDocument`), une fois ;
 * le document `pdf.js` vit le temps de la fenêtre et se détruit avec elle.
 * Ce que ce lecteur ne fait pas : la police des réglages (un canevas n'a pas
 * de police), la sélection de texte, la recherche. Le prix de la fidélité.
 *
 * Les **références bibliques** de la page sont surlignées par-dessus le
 * canevas : la couche texte de pdf.js dit où chaque fragment est écrit,
 * `referencesSituees` ce qu'il contient, `etendueDe` l'étendue de la référence
 * entre les fragments d'une ligne ; les toucher ouvre `AjoutDeReference` à la
 * place du pied. Demandé par le propriétaire le 17 septembre au soir. **Une
 * référence ne s'ajoute qu'une fois par séance** (le 18) : le lecteur tient
 * les clés déjà ajoutées tant qu'il est ouvert — les zones, recalculées à
 * chaque zoom avec des objets neufs, retrouvent leur état par la clé —, la
 * zone passe au vert, et le panneau s'ouvre sur « Ajoutée ».
 */

interface Props {
  open: boolean
  titre: string
  sousTitre?: string
  chemin: string
  pageDebut: number
  pageFin: number
  onPrecedent?: () => void
  onSuivant?: () => void
  lu?: boolean
  onMarquerLu?: () => void
  /** La version du plan et son nom : ce qu'une référence ajoutée aux lectures emporte. */
  versionId: string
  sessionTitle: string
  onClose: () => void
}

/** Une référence trouvée sur la page, et sa zone en pixels CSS du canevas rogné. */
interface Surlignage {
  reference: ReferenceExtraite
  left: number
  top: number
  width: number
  height: number
}

/** La couche texte de chaque page, gardée pour la session : pdf.js ne la relit pas à chaque zoom. */
const contenus = new Map<string, { items: ElementTexte[]; familles: Map<string, string> }>()

/**
 * La largeur d'un texte dans une famille de police, mesurée par un canevas hors
 * écran : c'est ce qui place une référence **à l'intérieur** d'un fragment que
 * pdf.js rend d'un bloc. La famille est celle que pdf.js déduit du fragment
 * (serif, sans-serif, monospace) — pas la police exacte du PDF, mais ses
 * proportions en sont proches ; le compte de caractères, lui, dérivait d'un
 * cran après « On lit dans ».
 */
const mesureur = (() => {
  let ctx: CanvasRenderingContext2D | null = null
  return (famille: string) => {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d')
    return (texte: string) => {
      if (!ctx) return texte.length
      ctx.font = `100px ${famille || 'sans-serif'}`
      return ctx.measureText(texte).width
    }
  }
})()

/**
 * Les références d'une page et leurs zones. Les fragments d'une même ordonnée
 * font une ligne (la règle de `lignesDepuisElements`) ; le texte de la ligne
 * est analysé, et chaque référence trouvée se place entre les fragments qui
 * la portent, puis passe dans les coordonnées du canevas rogné par le viewport
 * CSS — celui qui a le même décalage que le rendu, sans la densité d'écran.
 */
function surlignagesDe(elements: readonly ElementTexte[], familles: Map<string, string>, viewport: { convertToViewportPoint(x: number, y: number): number[] }, echelle: number): Surlignage[] {
  type Item = ElementTexte & { width?: number; fontName?: string }
  const lignes: { items: Item[]; y: number; hauteur: number }[] = []
  let courante: { items: Item[]; y: number; hauteur: number } | null = null
  let finDeLigne = false
  for (const e of elements as Item[]) {
    if (typeof e.str !== 'string' || !e.transform) continue
    const y = e.transform[5]
    const hauteur = Math.abs(e.height ?? e.transform[3] ?? 0)
    if (courante === null || finDeLigne || Math.abs(y - courante.y) > Math.max(hauteur, courante.hauteur, 1) * 0.5) {
      courante = { items: [], y, hauteur }
      lignes.push(courante)
    }
    courante.items.push(e)
    courante.hauteur = Math.max(courante.hauteur, hauteur)
    finDeLigne = e.hasEOL === true
  }
  const sortie: Surlignage[] = []
  for (const ligne of lignes) {
    const fragments: Fragment[] = ligne.items.map((it) => ({ str: it.str, x: it.transform![4], largeur: it.width ?? 0 }))
    const texte = texteDeLigne(fragments)
    const poids = mesureur(familles.get(ligne.items[0]?.fontName ?? '') ?? 'sans-serif')
    for (const s of referencesSituees(texte)) {
      const etendue = etendueDe(fragments, s.debut, s.fin, poids)
      if (!etendue) continue
      const [x0, yBas] = viewport.convertToViewportPoint(etendue.x0, ligne.y)
      const [x1] = viewport.convertToViewportPoint(etendue.x1, ligne.y)
      const h = ligne.hauteur * echelle
      sortie.push({ reference: s.reference, left: x0, top: yBas - h, width: x1 - x0, height: h * 1.25 })
    }
  }
  return sortie
}

/** Le rendu à basse résolution qui sert à trouver l'encre : assez large pour ne pas rater une ligne, assez petit pour être instantané. */
const LARGEUR_SONDE = 220

/** Les boîtes d'encre, par document et page, gardées pour la session : la sonde ne se refait pas à chaque zoom. */
const boites = new Map<string, Boite | null>()

const CLE_ZOOM = (chemin: string) => `bo:pdf:zoom:${chemin}`
const CLE_MARGES = 'bo:pdf:marges'
const CLE_SOMBRE = 'bo:pdf:sombre'

function lireReglage<T>(cle: string, defaut: T, lire: (v: string) => T): T {
  try {
    const v = localStorage.getItem(cle)
    return v === null ? defaut : lire(v)
  } catch {
    return defaut
  }
}

function ecrireReglage(cle: string, valeur: string) {
  try { localStorage.setItem(cle, valeur) } catch { /* mode privé, quota : on lit sans mémoire */ }
}

/**
 * La boîte d'encre d'une page, en unités de la page (l'échelle 1 de pdf.js),
 * ou `null` quand la page se garde entière — blanche, ou presque.
 */
async function boiteDeLaPage(cle: string, page: PDFPageProxy): Promise<Boite | null> {
  if (boites.has(cle)) return boites.get(cle)!
  const base = page.getViewport({ scale: 1 })
  const s0 = LARGEUR_SONDE / base.width
  const sonde = page.getViewport({ scale: s0 })
  const canevas = document.createElement('canvas')
  canevas.width = Math.ceil(sonde.width)
  canevas.height = Math.ceil(sonde.height)
  const ctx = canevas.getContext('2d', { willReadFrequently: true })
  let boite: Boite | null = null
  if (ctx) {
    await page.render({ canvasContext: ctx, viewport: sonde, canvas: canevas }).promise
    const brute = boiteUtile(boiteDEncre(ctx.getImageData(0, 0, canevas.width, canevas.height).data, canevas.width, canevas.height), canevas.width, canevas.height)
    if (brute) boite = { x: brute.x / s0, y: brute.y / s0, w: brute.w / s0, h: brute.h / s0 }
  }
  boites.set(cle, boite)
  return boite
}

/** Une page, dessinée quand elle a son document, sa largeur et son zoom ; redessinée si l'un change. Ses références surlignées par-dessus. */
function PageDuPdf({ doc, chemin, numero, largeur, zoom, rogner, sombre, onReference, libelle, ajouts }: {
  doc: PDFDocumentProxy; chemin: string; numero: number; largeur: number; zoom: number; rogner: boolean; sombre: boolean
  onReference: (r: ReferenceExtraite) => void; libelle: (r: ReferenceExtraite) => string
  /** L'état des références de la séance, par clé. */
  ajouts: ReadonlyMap<string, EtatAjout>
}) {
  const { t } = useI18n()
  const canevasRef = useRef<HTMLCanvasElement>(null)
  const [surlignages, setSurlignages] = useState<Surlignage[]>([])
  const [taille, setTaille] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const canevas = canevasRef.current
    if (!canevas || largeur <= 0) return
    let annule = false
    let tache: { cancel: () => void } | null = null
    void (async () => {
      const page = await doc.getPage(numero)
      if (annule) return
      const base = page.getViewport({ scale: 1 })
      const boite = rogner ? await boiteDeLaPage(`${chemin}#${numero}`, page) : null
      if (annule) return
      const zone = boite ?? { x: 0, y: 0, w: base.width, h: base.height }
      const echelle = (largeur * zoom) / zone.w
      const densite = window.devicePixelRatio || 1
      const s = echelle * densite
      // Le décalage du viewport fait glisser la page pour que la zone rognée
      // commence au coin du canevas ; le canevas a la taille de la zone.
      const viewport = page.getViewport({ scale: s, offsetX: -zone.x * s, offsetY: -zone.y * s })
      canevas.width = Math.round(zone.w * s)
      canevas.height = Math.round(zone.h * s)
      canevas.style.width = `${Math.round(zone.w * echelle)}px`
      canevas.style.height = `${Math.round(zone.h * echelle)}px`
      setTaille({ w: Math.round(zone.w * echelle), h: Math.round(zone.h * echelle) })
      const ctx = canevas.getContext('2d')
      if (!ctx) return
      const rendu = page.render({ canvasContext: ctx, viewport, canvas: canevas })
      tache = rendu
      try {
        await rendu.promise
      } catch {
        // Annulé par un zoom ou une fermeture : le prochain rendu prend la suite.
        return
      }
      if (annule) return
      // Les références, une fois la page dessinée : la couche texte est lue
      // une fois par page, les zones recalculées à chaque échelle.
      const cle = `${chemin}#${numero}`
      let contenu = contenus.get(cle)
      if (!contenu) {
        const texteDeLaPage = await page.getTextContent()
        const familles = new Map<string, string>()
        for (const [nom, style] of Object.entries(texteDeLaPage.styles as Record<string, { fontFamily?: string }>)) {
          if (style.fontFamily) familles.set(nom, style.fontFamily)
        }
        contenu = { items: texteDeLaPage.items as ElementTexte[], familles }
        contenus.set(cle, contenu)
      }
      if (annule) return
      const viewportCss = page.getViewport({ scale: echelle, offsetX: -zone.x * echelle, offsetY: -zone.y * echelle })
      setSurlignages(surlignagesDe(contenu.items, contenu.familles, viewportCss, echelle))
    })()
    return () => {
      annule = true
      tache?.cancel()
    }
  }, [doc, chemin, numero, largeur, zoom, rogner])

  return (
    <figure className="m-0">
      {/* Le canevas et, par-dessus, les zones des références : le cadre a la
          taille du canevas rogné, les zones s'y placent en pixels CSS. */}
      <div className="relative mx-auto" style={taille ? { width: taille.w, height: taille.h } : undefined}>
        <canvas ref={canevasRef} aria-label={t.planDetail.page(numero)}
          className="block shadow-md bg-white"
          // L'inversion douce du mode sombre : le papier devient sombre, l'encre
          // claire ; les images passent en négatif aussi — c'est débrayable.
          style={sombre ? { filter: 'invert(0.9) hue-rotate(180deg)' } : undefined} />
        {surlignages.map((z, i) => {
          const ajoutee = ajouts.get(cleDeReference(z.reference)) === 'ajoutee'
          const titre = ajoutee ? `${libelle(z.reference)} — ${t.planDetail.referenceAdded}` : libelle(z.reference)
          return (
            <button key={i} type="button" onClick={() => onReference(z.reference)}
              aria-label={t.planDetail.reference(titre)} title={titre}
              className={`absolute rounded-sm border-b outline-none ${ajoutee
                ? 'bg-green-400/40 hover:bg-green-400/60 focus:bg-green-400/60 border-solid border-green-700/60'
                : 'bg-yellow-300/40 hover:bg-yellow-300/70 focus:bg-yellow-300/70 border-dotted border-yellow-700/60'}`}
              style={{ left: z.left, top: z.top, width: z.width, height: z.height }} />
          )
        })}
      </div>
      <figcaption className="text-center text-xs text-[--text-secondary] mt-1">{t.planDetail.page(numero)}</figcaption>
    </figure>
  )
}

export default function LecteurDePdf({ open, titre, sousTitre, chemin, pageDebut, pageFin, onPrecedent, onSuivant, lu, onMarquerLu, versionId, sessionTitle, onClose }: Props) {
  const { t } = useI18n()
  const getBookName = useBookName()
  const libelle = useCallback((r: ReferenceExtraite) => ecrireReference(getBookName(r.book), r.book, r), [getBookName])
  const [referenceChoisie, setReferenceChoisie] = useState<ReferenceExtraite | null>(null)
  // L'état des références de cette séance — une ouverture du lecteur —, en cours ou ajoutées.
  const [ajouts, setAjouts] = useState<ReadonlyMap<string, EtatAjout>>(() => new Map())
  const noterEtat = useCallback((r: ReferenceExtraite, etat: EtatAjout | null) => setAjouts((prev) => {
    const suivant = new Map(prev)
    if (etat) suivant.set(cleDeReference(r), etat)
    else suivant.delete(cleDeReference(r))
    return suivant
  }), [])
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [erreur, setErreur] = useState(false)
  const [zoom, setZoomBrut] = useState(1)
  const [rogner, setRogner] = useState(true)
  const [modeSombre, setModeSombre] = useState(false)
  const [sombre, setSombre] = useState(true)
  const [largeur, setLargeur] = useState(0)
  const colonneRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<HTMLDivElement>(null)

  // Le zoom mémorisé par document ; les marges et la page sombre, pour tous.
  // Et une séance neuve : rien n'est encore ajouté.
  useEffect(() => {
    if (!open) return
    setAjouts(new Map())
    setZoomBrut(lireReglage(CLE_ZOOM(chemin), 1, (v) => zoomBorne(Number(v))))
    setRogner(lireReglage(CLE_MARGES, true, (v) => v !== '0'))
    setSombre(lireReglage(CLE_SOMBRE, true, (v) => v !== '0'))
    setModeSombre(document.documentElement.classList.contains('dark'))
  }, [open, chemin])

  const setZoom = useCallback((z: number) => {
    const borne = zoomBorne(z)
    setZoomBrut(borne)
    ecrireReglage(CLE_ZOOM(chemin), String(borne))
  }, [chemin])

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

  /**
   * Passe à un zoom en gardant un point de l'écran sous le doigt : le
   * défilement vertical du cadre et horizontal de la colonne se recalent au
   * rendu suivant, quand les canevas ont leur nouvelle taille.
   */
  const zoomerAutour = useCallback((nouveau: number, focal: { x: number; y: number }) => {
    const colonne = colonneRef.current
    const cadre = colonne?.closest('[role="dialog"]') as HTMLElement | null
    if (!colonne || !cadre) { setZoom(nouveau); return }
    const rapport = zoomBorne(nouveau) / zoom
    if (rapport === 1) return
    const rect = cadre.getBoundingClientRect()
    const fy = focal.y - rect.top
    const fx = focal.x - rect.left
    const scrollY = cadre.scrollTop
    const scrollX = colonne.scrollLeft
    setZoom(nouveau)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      cadre.scrollTop = defilementApresZoom(scrollY, fy, rapport)
      colonne.scrollLeft = defilementApresZoom(scrollX, fx, rapport)
    }))
  }, [zoom, setZoom])

  // Pincer pour zoomer, double-toucher : des écouteurs natifs, non passifs —
  // React pose les siens en passif et `preventDefault` n'y peut rien. Un seul
  // doigt reste au navigateur : c'est le défilement.
  useEffect(() => {
    const colonne = colonneRef.current
    if (!colonne || !doc) return
    let pincement: { ecart0: number; zoom0: number; focal: { x: number; y: number }; k: number } | null = null
    let dernierToucher: { t: number; x: number; y: number } | null = null
    const point = (touche: Touch) => ({ x: touche.clientX, y: touche.clientY })

    const debut = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const [a, b] = [point(e.touches[0]), point(e.touches[1])]
        pincement = { ecart0: ecart(a, b), zoom0: zoom, focal: milieu(a, b), k: 1 }
        dernierToucher = null
      }
    }
    const mouvement = (e: TouchEvent) => {
      if (!pincement || e.touches.length !== 2) return
      e.preventDefault()
      const [a, b] = [point(e.touches[0]), point(e.touches[1])]
      const cible = zoomPince(pincement.zoom0, pincement.ecart0, ecart(a, b))
      pincement.k = cible / pincement.zoom0
      const pages = pagesRef.current
      if (pages) {
        const rect = pages.getBoundingClientRect()
        pages.style.transformOrigin = `${pincement.focal.x - rect.left}px ${pincement.focal.y - rect.top}px`
        pages.style.transform = `scale(${pincement.k})`
      }
    }
    const fin = (e: TouchEvent) => {
      if (pincement) {
        const p = pincement
        pincement = null
        const pages = pagesRef.current
        if (pages) { pages.style.transform = ''; pages.style.transformOrigin = '' }
        if (Math.abs(p.k - 1) > 0.02) zoomerAutour(p.zoom0 * p.k, p.focal)
        return
      }
      if (e.changedTouches.length === 1 && e.touches.length === 0) {
        const t = point(e.changedTouches[0])
        const maintenant = Date.now()
        if (dernierToucher && maintenant - dernierToucher.t < 300 && ecart(dernierToucher, t) < 40) {
          e.preventDefault()
          zoomerAutour(zoomDoubleToucher(zoom), t)
          dernierToucher = null
        } else {
          dernierToucher = { t: maintenant, x: t.x, y: t.y }
        }
      }
    }
    colonne.addEventListener('touchstart', debut, { passive: false })
    colonne.addEventListener('touchmove', mouvement, { passive: false })
    colonne.addEventListener('touchend', fin, { passive: false })
    colonne.addEventListener('touchcancel', fin, { passive: false })
    return () => {
      colonne.removeEventListener('touchstart', debut)
      colonne.removeEventListener('touchmove', mouvement)
      colonne.removeEventListener('touchend', fin)
      colonne.removeEventListener('touchcancel', fin)
    }
  }, [doc, zoom, zoomerAutour])

  const pages: number[] = []
  if (doc) {
    for (let n = Math.max(1, pageDebut); n <= Math.min(doc.numPages, pageFin); n++) pages.push(n)
  }

  // Un autre jour dans la même fenêtre : on repart du haut.
  useEffect(() => {
    colonneRef.current?.closest('[role="dialog"]')?.scrollTo({ top: 0 })
    setReferenceChoisie(null)
  }, [pageDebut, pageFin])

  const basculerMarges = () => { setRogner((r) => { ecrireReglage(CLE_MARGES, r ? '0' : '1'); return !r }) }
  const basculerSombre = () => { setSombre((s) => { ecrireReglage(CLE_SOMBRE, s ? '0' : '1'); return !s }) }
  const bouton = 'p-1 rounded hover:text-[--text] disabled:opacity-40'

  const outils = (
    <div className="flex items-center gap-1 text-sm text-[--text-secondary]">
      <button type="button" onClick={basculerMarges} aria-pressed={rogner}
        aria-label={rogner ? t.planDetail.marginsCropped : t.planDetail.marginsFull} title={rogner ? t.planDetail.marginsCropped : t.planDetail.marginsFull}
        className={`${bouton} ${rogner ? 'text-[--primary]' : ''}`}>
        <Crop className="w-4 h-4" />
      </button>
      {modeSombre && (
        <button type="button" onClick={basculerSombre} aria-pressed={sombre}
          aria-label={sombre ? t.planDetail.pageDark : t.planDetail.pageLight} title={sombre ? t.planDetail.pageDark : t.planDetail.pageLight}
          className={`${bouton} ${sombre ? 'text-[--primary]' : ''}`}>
          {sombre ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      )}
      <span role="group" aria-label={t.planDetail.zoom} className="inline-flex items-center gap-1 ms-1">
        <button type="button" onClick={() => setZoom(zoom - ZOOM_PAS)} disabled={zoom <= ZOOM_MIN}
          aria-label={t.planDetail.zoomOut} className={bouton}>
          <Minus className="w-4 h-4" />
        </button>
        <span className="tabular-nums w-11 text-center">{Math.round(zoom * 100)} %</span>
        <button type="button" onClick={() => setZoom(zoom + ZOOM_PAS)} disabled={zoom >= ZOOM_MAX}
          aria-label={t.planDetail.zoomIn} className={bouton}>
          <Plus className="w-4 h-4" />
        </button>
      </span>
    </div>
  )

  const pied = referenceChoisie
    ? <AjoutDeReference reference={referenceChoisie} versionId={versionId} sessionTitle={sessionTitle}
        etat={ajouts.get(cleDeReference(referenceChoisie)) ?? null} onEtat={noterEtat} onClose={() => setReferenceChoisie(null)} />
    : <PiedDeLecture onPrecedent={onPrecedent} onSuivant={onSuivant} lu={lu} onMarquerLu={onMarquerLu} />

  return (
    <FenetreDeLecture open={open} titre={titre} sousTitre={sousTitre} outils={doc ? outils : undefined} large pleinEcran pied={pied} onClose={onClose}>
      <div ref={colonneRef} className="px-3 sm:px-6 py-4 overflow-x-auto" style={{ touchAction: 'pan-x pan-y' }}
        onDoubleClick={(e) => zoomerAutour(zoomDoubleToucher(zoom), { x: e.clientX, y: e.clientY })}>
        {erreur && <p className="text-sm text-red-700 text-center py-8" role="alert">{t.planDetail.documentError}</p>}
        {!erreur && !doc && <p className="text-sm text-[--text-secondary] text-center py-8" role="status">{t.planDetail.documentLoading}</p>}
        {doc && (
          <div ref={pagesRef} className="space-y-4 will-change-transform">
            {pages.map((n) => (
              <PageDuPdf key={n} doc={doc} chemin={chemin} numero={n} largeur={largeur} zoom={zoom} rogner={rogner} sombre={modeSombre && sombre}
                onReference={setReferenceChoisie} libelle={libelle} ajouts={ajouts} />
            ))}
          </div>
        )}
      </div>
    </FenetreDeLecture>
  )
}
