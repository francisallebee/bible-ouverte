/**
 * Le texte d'un fichier, extrait dans le navigateur, sans dépendance.
 *
 * Deuxième entrée de l'import de lectures (`spec/IMPORT-IA.md`) : le fichier
 * ne quitte pas l'appareil, seul son texte poursuit vers `extraireReferences`.
 * Décision du propriétaire du 17 septembre 2026 — « les deux » : extraction
 * locale ici, envoi au serveur pour le PDF quand le modèle existera.
 *
 * **Aucune bibliothèque.** Word, Excel, PowerPoint et OpenDocument sont des
 * archives zip de XML, et le navigateur sait dégonfler du deflate lui-même
 * (`DecompressionStream`, Safari ≥ 16.4, Chrome ≥ 80, Firefox ≥ 113). Un
 * lecteur zip de cinquante lignes remplace donc `mammoth` et `xlsx` — dont la
 * version publiée sur npm traîne des vulnérabilités que son auteur ne corrige
 * plus là. La règle 6 d'`AGENTS.md` tient.
 *
 * **La structure est gardée, en notation légère.** Un titre devient une ligne
 * `# Titre` (`##`, `###` selon le niveau), un élément de liste une ligne
 * `- élément`, un paragraphe une ligne, un changement de bloc une ligne vide.
 * Rien d'autre : c'est ce qu'il faut pour relire une page de méditation dans
 * la fenêtre de lecture d'un plan (`LecteurDeJour`) sans que tout soit aplati
 * en un seul bloc — demandé par le propriétaire le 17 septembre 2026, « sinon
 * c'est illisible ». L'analyseur de références ne voit dans `#` et `-` que
 * des caractères qui ne sont pas des lettres.
 *
 * Ce qui est lu : `txt`, `md`, `csv`, `tsv`, `html` ; `docx`, `xlsx`, `pptx` ;
 * `odt`, `ods`, `odp` ; `epub` et `fb2` — les livres numériques, demandés par
 * le propriétaire le 17 septembre 2026 ; `pdf`, par `pdf.js` dans `./pdf.ts`,
 * une extraction qui charge une bibliothèque — et l'OCR pour ses pages
 * scannées ; un **enregistrement audio** (`mp3`, `m4a`, `wav`…), transcrit
 * sur l'appareil par `./audio.ts`. Les formats **Kindle** (`mobi`,
 * `azw`, `azw3`, `kfx`) aussi, et pour de bon : un format binaire
 * propriétaire, et les livres achetés sont chiffrés par une clé que seul le
 * compte Amazon détient — aucun lecteur ne les ouvre sans elle. Rien ne
 * disparaît en silence.
 */

import type { Locale } from '@/lib/i18n/locales'
import type { ProgressionPdf } from './pdf'
import { lireZip, type Zip } from './zip'
import type { ProgressionAudio } from './audio'

export type RaisonRefus =
  | 'kindle-chiffre' | 'format-inconnu' | 'trop-gros' | 'illisible'
  /** Un enregistrement où Whisper n'a entendu aucune parole. */
  | 'audio-vide'
  /** Plus de trente minutes : le téléphone n'a plus la mémoire. */
  | 'audio-trop-long'

/**
 * Le texte lu — et, pour un PDF, **ses pages** une à une : le plan « une page
 * par jour » a besoin de savoir ce que chaque page porte, là où l'import de
 * lectures ne veut que le tout.
 */
export type LectureFichier = { texte: string; pages?: string[] } | { refus: RaisonRefus }

export interface OptionsLecture {
  /** La langue de l'OCR des pages scannées et de la transcription ; celle de l'interface. */
  locale: Locale
  onProgressionPdf?: (p: ProgressionPdf) => void
  onProgressionAudio?: (p: ProgressionAudio) => void
}

/** Rien ne quitte l'appareil, la borne ne sert qu'à ne pas figer l'onglet. */
export const TAILLE_MAXIMALE = 20 * 1024 * 1024

const TEXTE_BRUT = new Set(['txt', 'md', 'markdown', 'csv', 'tsv', 'text', 'log'])
const HTML = new Set(['html', 'htm'])
const OFFICE = new Set(['docx', 'xlsx', 'pptx'])
const OPEN_DOCUMENT = new Set(['odt', 'ods', 'odp'])
const KINDLE = new Set(['mobi', 'azw', 'azw3', 'azw4', 'kfx', 'prc'])
const AUDIO = new Set(['mp3', 'm4a', 'wav', 'ogg', 'oga', 'opus', 'aac', 'flac', 'webm', 'mp4', 'caf', 'aiff', 'aif'])

function extensionDe(nom: string): string {
  const point = nom.lastIndexOf('.')
  return point === -1 ? '' : nom.slice(point + 1).toLowerCase()
}

export async function texteDuFichier(fichier: File, options: OptionsLecture = { locale: 'fr' }): Promise<LectureFichier> {
  if (fichier.size > TAILLE_MAXIMALE) return { refus: 'trop-gros' }
  const ext = extensionDe(fichier.name)
  try {
    if (ext === 'pdf' || fichier.type === 'application/pdf') {
      const { pagesDuPdf } = await import('./pdf')
      const pages = await pagesDuPdf(fichier, options.locale, options.onProgressionPdf)
      return { texte: pages.filter(Boolean).join('\n\n'), pages }
    }
    if (AUDIO.has(ext) || fichier.type.startsWith('audio/')) {
      // Un enregistrement se choisit comme un document — décision du
      // propriétaire du 17 septembre 2026 au soir, après l'essai d'un bouton
      // à part : « une seule porte, ce sera plus simple ».
      const { transcrire } = await import('./audio')
      try {
        const texte = await transcrire(fichier, options.locale, options.onProgressionAudio)
        return texte ? { texte } : { refus: 'audio-vide' }
      } catch (e) {
        return { refus: e instanceof Error && e.message === 'trop-long' ? 'audio-trop-long' : 'illisible' }
      }
    }
    if (TEXTE_BRUT.has(ext) || fichier.type.startsWith('text/')) {
      return { texte: HTML.has(ext) ? texteDuHtml(await lireTexte(fichier)) : await lireTexte(fichier) }
    }
    if (HTML.has(ext)) return { texte: texteDuHtml(await lireTexte(fichier)) }
    if (OFFICE.has(ext)) return { texte: await texteOffice(ext, new Uint8Array(await fichier.arrayBuffer())) }
    if (OPEN_DOCUMENT.has(ext)) {
      const zip = await lireZip(new Uint8Array(await fichier.arrayBuffer()))
      const contenu = await zip.texte('content.xml')
      return { texte: contenu === null ? '' : texteOpenDocument(contenu) }
    }
    if (ext === 'epub') return { texte: await texteEpub(await lireZip(new Uint8Array(await fichier.arrayBuffer()))) }
    if (ext === 'fb2') return { texte: texteDuXml(await lireTexte(fichier), /<\/(?:p|v|subtitle|text-author)>|<empty-line\/>/g) }
    if (KINDLE.has(ext)) return { refus: 'kindle-chiffre' }
    return { refus: 'format-inconnu' }
  } catch {
    return { refus: 'illisible' }
  }
}

/**
 * UTF-8 d'abord, en refusant les octets invalides ; un fichier écrit en
 * latin-1 — une exportation Windows — lève, et se relit alors ainsi.
 */
async function lireTexte(fichier: File): Promise<string> {
  const octets = await fichier.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(octets)
  } catch {
    return new TextDecoder('windows-1252').decode(octets)
  }
}

/** Les entités que du XML ou du HTML sorti d'un traitement de texte emploie. */
export function decoderEntites(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

/** Retire les balises ; celles qui séparent des blocs deviennent des sauts de ligne. */
function texteDuXml(xml: string, finsDeBloc: RegExp): string {
  return decoderEntites(
    xml
      .replace(finsDeBloc, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    // L'espace insécable (`&#160;`, `&nbsp;`) devient un espace : l'analyseur
    // n'a pas à connaître deux blancs.
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    // Une ligne vide devant un titre ou un élément de liste n'apporte rien :
    // le lecteur espace lui-même, et deux éléments de liste se suivent.
    .replace(/\n\n+(?=(?:#{1,3}|-) )/g, '\n')
    .trim()
}

/** `#` répété selon le niveau, trois au plus : au-delà, l'œil ne distingue plus. */
function marqueDeTitre(niveau: number): string {
  return '#'.repeat(Math.min(Math.max(niveau, 1), 3)) + ' '
}

function texteDuHtml(html: string): string {
  return texteDuXml(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      // Les titres et les listes portent leur marque avant que les balises tombent.
      .replace(/<h([1-6])\b[^>]*>/gi, (_, n) => '\n' + marqueDeTitre(Number(n)))
      .replace(/<li\b[^>]*>/gi, '\n- '),
    /<\/(?:p|div|li|h[1-6]|tr|td|th|blockquote|pre)>|<br\s*\/?>/gi,
  )
}

function texteOpenDocument(xml: string): string {
  return texteDuXml(
    xml
      .replace(/<text:h\b[^>]*outline-level="(\d+)"[^>]*>/g, (_, n) => '\n' + marqueDeTitre(Number(n)))
      .replace(/<text:h\b[^>]*>/g, '\n# ')
      .replace(/<text:list-item\b[^>]*>/g, '\n- '),
    /<\/text:(?:p|h)>|<text:line-break\/>/g,
  )
}

async function texteOffice(ext: string, octets: Uint8Array): Promise<string> {
  const zip = await lireZip(octets)
  if (ext === 'docx') {
    const doc = await zip.texte('word/document.xml')
    return doc === null ? '' : texteWord(doc)
  }
  if (ext === 'pptx') {
    const noms = zip.noms().filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
    const diapos: string[] = []
    for (const n of noms) {
      const xml = await zip.texte(n)
      if (xml === null) continue
      // La forme titrée d'une diapositive (`<p:ph type="title"/>`, ou `ctrTitle`)
      // devient un titre ; le reste, des paragraphes.
      const marque = xml.replace(/<p:sp>([\s\S]*?)<\/p:sp>/g, (bloc: string) =>
        /<p:ph\b[^>]*type="(?:ctr)?[tT]itle"/.test(bloc) ? bloc.replace(/<a:p\b[^>]*>/g, '\n# ') : bloc)
      diapos.push(texteDuXml(marque, /<\/a:p>/g))
    }
    return diapos.join('\n\n')
  }
  return texteExcel(zip)
}

/**
 * Un EPUB : `META-INF/container.xml` nomme le fichier OPF, dont la `spine`
 * donne l'ordre de lecture des chapitres XHTML — c'est cet ordre qui compte,
 * pas celui des entrées de l'archive. Un livre sans `container.xml` ou sans
 * `spine` retombe sur ses fichiers XHTML triés par nom : mieux vaut un texte
 * dans le désordre que rien.
 */
async function texteEpub(zip: Zip): Promise<string> {
  const conteneur = await zip.texte('META-INF/container.xml')
  const cheminOpf = conteneur ? /full-path="([^"]+)"/.exec(conteneur)?.[1] : undefined
  const opf = cheminOpf ? await zip.texte(cheminOpf) : null
  let chapitres: string[] = []
  if (opf) {
    const dossier = cheminOpf!.includes('/') ? cheminOpf!.slice(0, cheminOpf!.lastIndexOf('/') + 1) : ''
    const items = new Map<string, string>()
    for (const m of Array.from(opf.matchAll(/<item\b([^>]*)\/?>/g))) {
      const id = /\bid="([^"]+)"/.exec(m[1])?.[1]
      const href = /\bhref="([^"]+)"/.exec(m[1])?.[1]
      const type = /\bmedia-type="([^"]+)"/.exec(m[1])?.[1] ?? ''
      if (id && href && /html|xml/.test(type)) items.set(id, dossier + decodeURIComponent(href))
    }
    chapitres = Array.from(opf.matchAll(/<itemref\b[^>]*\bidref="([^"]+)"/g))
      .map((m) => items.get(m[1]))
      .filter((h): h is string => h !== undefined)
  }
  if (chapitres.length === 0) chapitres = zip.noms().filter((n) => /\.x?html?$/i.test(n)).sort()
  const textes: string[] = []
  for (const chemin of chapitres) {
    const xhtml = await zip.texte(chemin)
    if (xhtml !== null) textes.push(texteDuHtml(xhtml))
  }
  return textes.filter((t) => t !== '').join('\n\n')
}

/**
 * Un document Word, paragraphe par paragraphe : le style `Heading1`/`Titre1`/
 * `Title` fait un titre de son niveau, un `<w:numPr>` un élément de liste, une
 * tabulation reste une tabulation. Les paragraphes vides — que Word emploie
 * pour espacer — deviennent des lignes vides, et `texteDuXml` les borne.
 */
function texteWord(xml: string): string {
  const lignes: string[] = []
  // La branche auto-fermante d'abord : `<w:p/>` satisfait aussi `<w:p[^>]*>`, et
  // la branche ouvrante avalerait alors le paragraphe suivant.
  for (const m of Array.from(xml.matchAll(/<w:p\b[^>]*\/>|<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g))) {
    const corps = m[1] ?? ''
    const style = /<w:pStyle\b[^>]*w:val="([^"]+)"/.exec(corps)?.[1] ?? ''
    const niveau = /^(?:heading|titre|title|h)\s?(\d)?/i.exec(style)
    const liste = /<w:numPr\b/.test(corps)
    const texte = decoderEntites(corps.replace(/<w:tab\/>/g, '\t').replace(/<w:br\/>/g, '\n').replace(/<[^>]+>/g, '')).trim()
    if (!texte) { lignes.push(''); continue }
    lignes.push(niveau ? marqueDeTitre(Number(niveau[1] ?? 1)) + texte : liste ? '- ' + texte : texte)
  }
  return lignes.join('\n').replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Une feuille Excel : les chaînes partagées d'abord, puis chaque cellule, les
 * colonnes séparées par une tabulation et les lignes par un saut de ligne —
 * le même texte qu'un CSV, sans les guillemets.
 */
async function texteExcel(zip: Zip): Promise<string> {
  const partagees: string[] = []
  const ss = await zip.texte('xl/sharedStrings.xml')
  if (ss !== null) {
    for (const si of Array.from(ss.matchAll(/<si>([\s\S]*?)<\/si>/g))) {
      partagees.push(decoderEntites(Array.from(si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map((m) => m[1]).join('')))
    }
  }
  const feuilles = zip.noms().filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
  const lignes: string[] = []
  for (const n of feuilles) {
    const xml = await zip.texte(n)
    if (xml === null) continue
    for (const row of Array.from(xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g))) {
      const cellules: string[] = []
      for (const c of Array.from(row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g))) {
        const attributs = c[1], corps = c[2] ?? ''
        const type = /\bt="([^"]+)"/.exec(attributs)?.[1]
        if (type === 's') {
          const i = Number(/<v>(\d+)<\/v>/.exec(corps)?.[1])
          cellules.push(partagees[i] ?? '')
        } else if (type === 'inlineStr') {
          cellules.push(decoderEntites(Array.from(corps.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map((m) => m[1]).join('')))
        } else {
          cellules.push(decoderEntites(/<v>([\s\S]*?)<\/v>/.exec(corps)?.[1] ?? ''))
        }
      }
      if (cellules.some((v) => v !== '')) lignes.push(cellules.join('\t'))
    }
    lignes.push('')
  }
  return lignes.join('\n').trim()
}
