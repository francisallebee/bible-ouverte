import type { Locale } from '@/lib/i18n/locales'
import { reconnaitreCanevas, dimensionsReduites } from './ocr'

/**
 * Le texte d'un PDF, extrait dans le navigateur par `pdf.js` — le lecteur de
 * Firefox, `pdfjs-dist`, demandé par le propriétaire le 17 septembre 2026
 * une fois le modèle remis à plus tard. Le fichier ne quitte pas l'appareil.
 *
 * Deux sortes de PDF, et ce module les traite l'une après l'autre :
 * - un PDF **né numérique** porte son texte ; `getTextContent` le rend page
 *   par page, et `lignesDepuisElements` en déduit lignes, paragraphes et
 *   titres depuis les positions et les tailles de police ;
 * - un PDF **scanné** n'a que des images ; la page est alors dessinée dans un
 *   canevas et passe par l'OCR de la photo — le même moteur, le même
 *   dictionnaire, déjà en cache si une photo a été lue.
 * La décision se prend **page par page** : un document peut mêler les deux.
 *
 * La bibliothèque est chargée par `import()` au premier PDF, dans son propre
 * chunk ; son worker vient de jsDelivr à la version exacte installée, comme le
 * moteur de Tesseract.
 */

export interface ProgressionPdf {
  page: number
  pages: number
  /** Part de l'OCR de cette page, de 0 à 1, quand elle est scannée. */
  ocr?: number
}

/** En dessous, une page est tenue pour scannée : quelques caractères d'un pied de page ne font pas un texte. */
const SEUIL_TEXTE_PAR_PAGE = 20

/** Ce que `getTextContent` rend d'un fragment : son texte, sa position (`transform[4]`, `[5]`) et sa hauteur. */
export interface ElementTexte { str: string; hasEOL?: boolean; transform?: number[]; height?: number }

interface Ligne { texte: string; y: number; hauteur: number }

function mediane(valeurs: number[]): number {
  if (valeurs.length === 0) return 0
  const tri = [...valeurs].sort((a, b) => a - b)
  return tri[Math.floor(tri.length / 2)]
}

/**
 * Le texte d'une page, avec sa structure **déduite des positions** — un PDF
 * n'en porte aucune. Les fragments qui partagent une ordonnée forment une
 * ligne ; un saut vertical nettement plus grand que l'interligne médian ouvre
 * un paragraphe (ligne vide) ; une ligne dont la police dépasse la médiane
 * d'un quart, et qui reste courte, est un titre (`# `). Le bas de page, le
 * numéro de page et les en-têtes passent pour du texte : le lecteur les verra,
 * l'analyseur de références les ignore.
 *
 * Pure, pour être testée sur des fragments fabriqués : `pdf.js` n'a pas de
 * navigateur dans la suite de tests.
 */
export function lignesDepuisElements(elements: readonly ElementTexte[]): string {
  const lignes: Ligne[] = []
  let courante: Ligne | null = null
  let finDeLigne = false
  for (const e of elements) {
    if (typeof e.str !== 'string') continue
    const y = e.transform?.[5] ?? 0
    const hauteur = Math.abs(e.height ?? e.transform?.[3] ?? 0)
    const nouvelle = courante === null || finDeLigne || Math.abs(y - courante.y) > Math.max(hauteur, courante.hauteur, 1) * 0.5
    if (nouvelle) {
      courante = { texte: '', y, hauteur }
      lignes.push(courante)
    }
    courante!.texte += e.str
    courante!.hauteur = Math.max(courante!.hauteur, hauteur)
    finDeLigne = e.hasEOL === true
  }
  const pleines = lignes.map((l) => ({ ...l, texte: l.texte.replace(/\s+/g, ' ').trim() })).filter((l) => l.texte)
  if (pleines.length === 0) return ''
  const hauteurMediane = mediane(pleines.map((l) => l.hauteur).filter((h) => h > 0))
  const interlignes: number[] = []
  for (let i = 1; i < pleines.length; i++) interlignes.push(Math.abs(pleines[i - 1].y - pleines[i].y))
  const interligneMedian = mediane(interlignes.filter((d) => d > 0)) || hauteurMediane * 1.2

  const sortie: string[] = []
  for (const [i, l] of Array.from(pleines.entries())) {
    if (i > 0 && Math.abs(pleines[i - 1].y - l.y) > interligneMedian * 1.6) sortie.push('')
    const titre = hauteurMediane > 0 && l.hauteur >= hauteurMediane * 1.25 && l.texte.length < 120
    sortie.push(titre ? '# ' + l.texte : l.texte)
  }
  // Ni ligne vide devant un titre, ni derrière : sa grande police creuse
  // l'interligne, et le lecteur l'espace déjà.
  return sortie.join('\n').replace(/\n\n+(?=# )/g, '\n').replace(/^(# [^\n]*)\n\n+/gm, '$1\n').trim()
}

/**
 * `pdf.js`, chargé par `import()` au premier besoin, dans son propre chunk,
 * son worker venant de jsDelivr à la version exacte installée. Partagé entre
 * l'extraction du texte et le lecteur de pages (`LecteurDePdf`) : un seul
 * chargement, une seule version.
 */
export async function chargerPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  return pdfjs
}

/**
 * Le texte de chaque page, dans l'ordre — une entrée par page, vide quand la
 * page n'a rien donné, pour que l'indice reste le numéro de page moins un.
 * C'est cette forme que le plan « une page par jour » consomme : il lui faut
 * savoir quelles références se trouvent sur quelle page.
 */
export async function pagesDuPdf(
  fichier: File,
  locale: Locale,
  onProgression?: (p: ProgressionPdf) => void,
): Promise<string[]> {
  const pdfjs = await chargerPdfjs()
  // C'est la tâche de chargement qui se détruit, et elle emporte le document.
  const tache = pdfjs.getDocument({ data: new Uint8Array(await fichier.arrayBuffer()) })
  const document = await tache.promise
  const pages: string[] = []
  try {
    for (let n = 1; n <= document.numPages; n++) {
      onProgression?.({ page: n, pages: document.numPages })
      const page = await document.getPage(n)
      const contenu = await page.getTextContent()
      let texte = lignesDepuisElements(contenu.items as ElementTexte[])

      if (texte.length < SEUIL_TEXTE_PAR_PAGE) {
        // Une page scannée : rendue à la taille que l'OCR lit le mieux, puis lue.
        const brut = page.getViewport({ scale: 1 })
        const { largeur } = dimensionsReduites(brut.width, brut.height)
        const viewport = page.getViewport({ scale: largeur / brut.width })
        const canevas = window.document.createElement('canvas')
        canevas.width = Math.round(viewport.width)
        canevas.height = Math.round(viewport.height)
        const ctx = canevas.getContext('2d')
        if (!ctx) throw new Error('canevas indisponible')
        await page.render({ canvasContext: ctx, viewport, canvas: canevas }).promise
        const lu = await reconnaitreCanevas(canevas, locale, (part) => onProgression?.({ page: n, pages: document.numPages, ocr: part }))
        if (lu) texte = lu
      }
      pages.push(texte)
      page.cleanup()
    }
  } finally {
    await tache.destroy()
  }
  return pages
}

export async function texteDuPdf(
  fichier: File,
  locale: Locale,
  onProgression?: (p: ProgressionPdf) => void,
): Promise<string> {
  return (await pagesDuPdf(fichier, locale, onProgression)).filter(Boolean).join('\n\n')
}

/** Un repère dans le document : un signet (« bookmark ») et la page où il mène. */
export interface RepereDuPdf {
  page: number
  titre: string
  /** 1 pour un signet de premier rang, 2 pour ses enfants. Au-delà, ignoré. */
  niveau: 1 | 2
}

/**
 * Ce qu'un plan de lecture a besoin de savoir d'un PDF pour se découper :
 * son nombre de pages, ses signets — les chapitres, quand l'éditeur les a
 * posés — et la première ligne de chaque page, pour nommer un jour qui
 * commence sans signet. Pas d'OCR ici : une page scannée n'a pas de première
 * ligne, elle aura son numéro.
 */
export interface StructureDuPdf {
  pages: number
  reperes: RepereDuPdf[]
  premieresLignes: string[]
}

export async function structureDuPdf(
  source: File | ArrayBuffer,
  onProgression?: (p: ProgressionPdf) => void,
): Promise<StructureDuPdf> {
  const pdfjs = await chargerPdfjs()
  const octets = source instanceof ArrayBuffer ? source : await source.arrayBuffer()
  const tache = pdfjs.getDocument({ data: new Uint8Array(octets) })
  const document = await tache.promise
  try {
    const reperes: RepereDuPdf[] = []
    const plan = await document.getOutline().catch(() => null)
    const resoudre = async (dest: unknown): Promise<number | null> => {
      try {
        const tableau = typeof dest === 'string' ? await document.getDestination(dest) : dest
        if (!Array.isArray(tableau) || !tableau[0]) return null
        return (await document.getPageIndex(tableau[0])) + 1
      } catch {
        return null
      }
    }
    for (const item of plan ?? []) {
      const page = await resoudre(item.dest)
      if (page !== null && item.title?.trim()) reperes.push({ page, titre: item.title.trim(), niveau: 1 })
      for (const enfant of item.items ?? []) {
        const p = await resoudre(enfant.dest)
        if (p !== null && enfant.title?.trim()) reperes.push({ page: p, titre: enfant.title.trim(), niveau: 2 })
      }
    }
    reperes.sort((a, b) => a.page - b.page || a.niveau - b.niveau)

    const premieresLignes: string[] = []
    for (let n = 1; n <= document.numPages; n++) {
      onProgression?.({ page: n, pages: document.numPages })
      const page = await document.getPage(n)
      const contenu = await page.getTextContent()
      const texte = lignesDepuisElements(contenu.items as ElementTexte[])
      premieresLignes.push(texte.split('\n')[0]?.replace(/^#\s+/, '') ?? '')
      page.cleanup()
    }
    return { pages: document.numPages, reperes, premieresLignes }
  } finally {
    await tache.destroy()
  }
}
