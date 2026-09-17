import type { Locale } from '@/lib/i18n/locales'
import { reconnaitreCanevas, dimensionsReduites } from './ocr'

/**
 * Le texte d'un PDF, extrait dans le navigateur par `pdf.js` — le lecteur de
 * Firefox, `pdfjs-dist`, demandé par le propriétaire le 17 septembre 2026
 * une fois le modèle remis à plus tard. Le fichier ne quitte pas l'appareil.
 *
 * Deux sortes de PDF, et ce module les traite l'une après l'autre :
 * - un PDF **né numérique** porte son texte ; `getTextContent` le rend page
 *   par page, et `hasEOL` dit où les lignes finissent ;
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

interface ElementTexte { str: string; hasEOL: boolean }

export async function texteDuPdf(
  fichier: File,
  locale: Locale,
  onProgression?: (p: ProgressionPdf) => void,
): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  // C'est la tâche de chargement qui se détruit, et elle emporte le document.
  const tache = pdfjs.getDocument({ data: new Uint8Array(await fichier.arrayBuffer()) })
  const document = await tache.promise
  const pages: string[] = []
  try {
    for (let n = 1; n <= document.numPages; n++) {
      onProgression?.({ page: n, pages: document.numPages })
      const page = await document.getPage(n)
      const contenu = await page.getTextContent()
      let texte = ''
      for (const element of contenu.items as ElementTexte[]) {
        if (typeof element.str !== 'string') continue
        texte += element.str
        texte += element.hasEOL ? '\n' : ' '
      }
      texte = texte.replace(/[ \t]+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim()

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
      if (texte) pages.push(texte)
      page.cleanup()
    }
  } finally {
    await tache.destroy()
  }
  return pages.join('\n\n')
}
