import type { Locale } from '@/lib/i18n/locales'

/**
 * Le texte d'une photo, reconnu **sur l'appareil**.
 *
 * Troisième entrée de l'import de lectures (`spec/IMPORT-IA.md`), et la
 * décision 2 du propriétaire : l'OCR se fait ici, par `tesseract.js`, et la
 * photo ne quitte jamais l'appareil. Ce que le réseau fournit, à la demande
 * et une fois : le script du worker et le moteur WASM (jsDelivr, ~4 Mo) et le
 * dictionnaire de la langue (tessdata, 1 à 3 Mo), que la bibliothèque garde en
 * IndexedDB pour la fois suivante. Rien de la photo n'y entre.
 *
 * **La seule dépendance de la fonction**, et elle est bornée : chargée par
 * `import()` au premier usage, donc absente de tous les chunks tant qu'aucune
 * photo n'est choisie — la règle 4 d'`AGENTS.md` vise les 47 Mo de textes
 * bibliques, pas un module de 100 Ko qui n'entre que si on l'appelle. Mesuré à
 * l'installation : `npm audit` compte 31 vulnérabilités avant comme après.
 *
 * La photo est **réduite** à 2 000 px de côté et **redressée** selon son EXIF
 * avant la lecture : une photo d'iPhone fait 4 000 px et arrive couchée, et
 * Tesseract lit mal ce qui est trop grand comme ce qui est de travers.
 *
 * Le worker est gardé d'une photo à l'autre pour une même langue : son
 * initialisation coûte plusieurs secondes, la reconnaissance elle-même une ou
 * deux.
 */

/** Le dictionnaire Tesseract de chaque langue de l'interface. */
const LANGUES_OCR: Record<Locale, string> = {
  fr: 'fra',
  en: 'eng',
  es: 'spa',
  it: 'ita',
  ar: 'ara',
}

export function langueOcr(locale: Locale): string {
  return LANGUES_OCR[locale]
}

/** Le plus grand côté après réduction ; au-delà, Tesseract ralentit sans lire mieux. */
export const COTE_MAXIMAL = 2000

/** Les dimensions d'une image ramenée sous `max`, proportions gardées, jamais agrandie. */
export function dimensionsReduites(largeur: number, hauteur: number, max = COTE_MAXIMAL): { largeur: number; hauteur: number } {
  const facteur = Math.min(1, max / Math.max(largeur, hauteur, 1))
  return { largeur: Math.max(1, Math.round(largeur * facteur)), hauteur: Math.max(1, Math.round(hauteur * facteur)) }
}

type Worker = Awaited<ReturnType<typeof import('tesseract.js').createWorker>>

let courant: { langue: string; worker: Worker } | null = null

/**
 * Le rapporteur de progression de la lecture **en cours**. Le worker est
 * créé une fois par langue avec un seul `logger` ; s'il tenait la fonction de
 * la première photo, la seconde n'aurait plus de barre. Il lit donc ici.
 */
let progression: ((part: number) => void) | undefined

async function workerPour(langue: string): Promise<Worker> {
  if (courant && courant.langue === langue) return courant.worker
  if (courant) { await courant.worker.terminate(); courant = null }
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(langue, 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') progression?.(m.progress)
    },
  })
  courant = { langue, worker }
  return worker
}

/**
 * Dessine la photo réduite et redressée dans un canevas — c'est lui que le
 * moteur lit, jamais le fichier d'origine.
 */
async function canevasDe(fichier: File): Promise<HTMLCanvasElement> {
  const image = await createImageBitmap(fichier, { imageOrientation: 'from-image' })
  try {
    const { largeur, hauteur } = dimensionsReduites(image.width, image.height)
    const canevas = document.createElement('canvas')
    canevas.width = largeur
    canevas.height = hauteur
    const ctx = canevas.getContext('2d')
    if (!ctx) throw new Error('canevas indisponible')
    ctx.drawImage(image, 0, 0, largeur, hauteur)
    return canevas
  } finally {
    image.close()
  }
}

/**
 * Le texte d'un canevas déjà dessiné — une photo réduite, ou une page de PDF
 * scannée rendue par `pdf.js`. La progression va de 0 à 1 pendant la lecture
 * seule ; le chargement du moteur et du dictionnaire, qui la précède, n'a pas
 * de mesure.
 */
export async function reconnaitreCanevas(
  canevas: HTMLCanvasElement,
  locale: Locale,
  onProgression?: (part: number) => void,
): Promise<string> {
  const worker = await workerPour(langueOcr(locale))
  progression = onProgression
  try {
    const { data } = await worker.recognize(canevas)
    return data.text.trim()
  } finally {
    progression = undefined
  }
}

/** Le texte reconnu sur une photo, ou une chaîne vide si elle n'en porte pas. */
export async function reconnaitreTexte(
  fichier: File,
  locale: Locale,
  onProgression?: (part: number) => void,
): Promise<string> {
  return reconnaitreCanevas(await canevasDe(fichier), locale, onProgression)
}
