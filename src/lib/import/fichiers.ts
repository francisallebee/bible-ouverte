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
 * Ce qui est lu : `txt`, `md`, `csv`, `tsv`, `html` ; `docx`, `xlsx`, `pptx` ;
 * `odt`, `ods`, `odp`. Le `pdf` est **refusé avec sa raison** tant que le
 * chemin serveur n'existe pas : rien ne disparaît en silence.
 */

export type RaisonRefus = 'pdf-a-venir' | 'format-inconnu' | 'trop-gros' | 'illisible'

export type LectureFichier = { texte: string } | { refus: RaisonRefus }

/** Rien ne quitte l'appareil, la borne ne sert qu'à ne pas figer l'onglet. */
export const TAILLE_MAXIMALE = 20 * 1024 * 1024

const TEXTE_BRUT = new Set(['txt', 'md', 'markdown', 'csv', 'tsv', 'text', 'log'])
const HTML = new Set(['html', 'htm'])
const OFFICE = new Set(['docx', 'xlsx', 'pptx'])
const OPEN_DOCUMENT = new Set(['odt', 'ods', 'odp'])

function extensionDe(nom: string): string {
  const point = nom.lastIndexOf('.')
  return point === -1 ? '' : nom.slice(point + 1).toLowerCase()
}

export async function texteDuFichier(fichier: File): Promise<LectureFichier> {
  if (fichier.size > TAILLE_MAXIMALE) return { refus: 'trop-gros' }
  const ext = extensionDe(fichier.name)
  try {
    if (ext === 'pdf' || fichier.type === 'application/pdf') return { refus: 'pdf-a-venir' }
    if (TEXTE_BRUT.has(ext) || fichier.type.startsWith('text/')) {
      return { texte: HTML.has(ext) ? texteDuHtml(await lireTexte(fichier)) : await lireTexte(fichier) }
    }
    if (HTML.has(ext)) return { texte: texteDuHtml(await lireTexte(fichier)) }
    if (OFFICE.has(ext)) return { texte: await texteOffice(ext, new Uint8Array(await fichier.arrayBuffer())) }
    if (OPEN_DOCUMENT.has(ext)) {
      const zip = await lireZip(new Uint8Array(await fichier.arrayBuffer()))
      const contenu = await zip.texte('content.xml')
      return { texte: contenu === null ? '' : texteDuXml(contenu, /<\/text:(?:p|h)>|<text:line-break\/>/g) }
    }
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
function decoderEntites(s: string): string {
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
    .trim()
}

function texteDuHtml(html: string): string {
  return texteDuXml(
    html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ''),
    /<\/(?:p|div|li|h[1-6]|tr|td|th|blockquote|pre)>|<br\s*\/?>/gi,
  )
}

async function texteOffice(ext: string, octets: Uint8Array): Promise<string> {
  const zip = await lireZip(octets)
  if (ext === 'docx') {
    const doc = await zip.texte('word/document.xml')
    return doc === null ? '' : texteDuXml(doc.replace(/<w:tab\/>/g, '\t'), /<\/w:p>|<w:br\/>/g)
  }
  if (ext === 'pptx') {
    const noms = zip.noms().filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
    const diapos: string[] = []
    for (const n of noms) {
      const xml = await zip.texte(n)
      if (xml !== null) diapos.push(texteDuXml(xml, /<\/a:p>/g))
    }
    return diapos.join('\n\n')
  }
  return texteExcel(zip)
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

/* ---------------------------------------------------------------------------
 * Un lecteur zip minimal : le répertoire central, puis chaque entrée à la
 * demande. Deux méthodes de compression existent dans ces fichiers — aucune
 * (0) et deflate (8) —, et `DecompressionStream('deflate-raw')` sait la
 * seconde. Tout le reste du format (chiffrement, zip64, multi-volumes) n'a
 * pas cours dans un document de bureau et n'est pas lu.
 * ------------------------------------------------------------------------- */

interface Entree {
  nom: string
  methode: number
  tailleCompressee: number
  decalage: number
}

interface Zip {
  noms(): string[]
  texte(nom: string): Promise<string | null>
}

const SIGNATURE_FIN = 0x06054b50
const SIGNATURE_CENTRALE = 0x02014b50
const SIGNATURE_LOCALE = 0x04034b50

async function lireZip(octets: Uint8Array): Promise<Zip> {
  const vue = new DataView(octets.buffer, octets.byteOffset, octets.byteLength)
  // La fin de répertoire est dans les derniers 64 Ko ; on remonte jusqu'à sa signature.
  let fin = -1
  for (let i = octets.length - 22; i >= Math.max(0, octets.length - 65558); i--) {
    if (vue.getUint32(i, true) === SIGNATURE_FIN) { fin = i; break }
  }
  if (fin === -1) throw new Error('pas une archive zip')
  const nombre = vue.getUint16(fin + 10, true)
  let pos = vue.getUint32(fin + 16, true)
  const entrees = new Map<string, Entree>()
  const decodeur = new TextDecoder('utf-8')
  for (let i = 0; i < nombre; i++) {
    if (vue.getUint32(pos, true) !== SIGNATURE_CENTRALE) throw new Error('répertoire zip corrompu')
    const methode = vue.getUint16(pos + 10, true)
    const tailleCompressee = vue.getUint32(pos + 20, true)
    const longueurNom = vue.getUint16(pos + 28, true)
    const longueurExtra = vue.getUint16(pos + 30, true)
    const longueurCommentaire = vue.getUint16(pos + 32, true)
    const decalage = vue.getUint32(pos + 42, true)
    const nom = decodeur.decode(octets.subarray(pos + 46, pos + 46 + longueurNom))
    entrees.set(nom, { nom, methode, tailleCompressee, decalage })
    pos += 46 + longueurNom + longueurExtra + longueurCommentaire
  }

  async function octetsDe(e: Entree): Promise<Uint8Array> {
    if (vue.getUint32(e.decalage, true) !== SIGNATURE_LOCALE) throw new Error('entrée zip corrompue')
    const longueurNom = vue.getUint16(e.decalage + 26, true)
    const longueurExtra = vue.getUint16(e.decalage + 28, true)
    const debut = e.decalage + 30 + longueurNom + longueurExtra
    const comprimes = octets.subarray(debut, debut + e.tailleCompressee)
    if (e.methode === 0) return comprimes
    if (e.methode !== 8) throw new Error(`compression zip ${e.methode} non lue`)
    // `slice` copie la vue en un tampon à elle : `Blob` refuse un `subarray`
    // dont le tampon pourrait être partagé.
    const flux = new Blob([comprimes.slice()]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    return new Uint8Array(await new Response(flux).arrayBuffer())
  }

  return {
    noms: () => Array.from(entrees.keys()),
    texte: async (nom) => {
      const e = entrees.get(nom)
      return e ? decodeur.decode(await octetsDe(e)) : null
    },
  }
}
