import { decoderEntites } from '@/lib/import/fichiers'
import { lireZip, type Zip } from '@/lib/import/zip'
import type { Repere } from '@/lib/plans/portions'

/**
 * Les unités d'un document lu jour après jour — quand ce n'est pas un PDF.
 *
 * Un PDF a des pages, qu'on dessine. Un EPUB, un Word, un OpenDocument, un
 * HTML n'en ont pas : ils ont une **structure** — chapitres, titres — et une
 * **mise en forme** — gras, italique, listes, tableaux, images. Décision du
 * propriétaire du 17 septembre 2026 : les lire « dans un autre format que le
 * texte seul », et choisir ce que chaque jour lit. Ce module fait les deux :
 * il convertit le document en **unités** — un chapitre, une section — dont
 * chacune porte un titre et son HTML, et c'est sur ces unités que l'éditeur de
 * jours découpe, exactement comme sur les pages d'un PDF.
 *
 * - **EPUB** : une unité par entrée de la `spine`, son XHTML tel que
 *   l'éditeur l'a fait, ses images résolues depuis l'archive, sa feuille de
 *   style **filtrée** (`filtrerCss`) : la mise en page reste, la police, la
 *   taille et les couleurs sont celles de l'application — la typographie et
 *   le thème du lecteur, pas ceux de l'éditeur.
 * - **Word, OpenDocument, HTML** : convertis en blocs HTML (titres,
 *   paragraphes, listes, tableaux, images en `data:`), puis **sectionnés** au
 *   niveau de titre utile — le plus haut qui compte au moins deux titres.
 *
 * Rien ici n'assainit : le HTML rendu passe par `assainir` dans le lecteur,
 * côté navigateur, par `DOMParser` et liste blanche. Ce module tourne aussi en
 * Node, pour ses tests, et n'a pas de DOM.
 */

export interface Unite {
  titre: string
  html: string
}

/** Un bloc intermédiaire des formats sans chapitres : un titre de niveau `niveau`, ou un bloc de contenu. */
export interface Bloc {
  niveau?: number
  html: string
  texte: string
}

/** Ce que l'éditeur de jours attend d'un document — la même forme que pour un PDF. */
export interface StructureDuDocument {
  pages: number
  reperes: Repere[]
  premieresLignes: string[]
}

export const EXTENSIONS_HTML_RICHE = ['epub', 'docx', 'odt', 'html', 'htm'] as const

export function estPdf(nom: string): boolean {
  return /\.pdf$/i.test(nom)
}

export function extensionDe(nom: string): string {
  const point = nom.lastIndexOf('.')
  return point === -1 ? '' : nom.slice(point + 1).toLowerCase()
}

/** Le type MIME que le seau attend, par extension. */
export function typeMimeDe(nom: string): string {
  switch (extensionDe(nom)) {
    case 'pdf': return 'application/pdf'
    case 'epub': return 'application/epub+zip'
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'odt': return 'application/vnd.oasis.opendocument.text'
    case 'html': case 'htm': return 'text/html'
    default: return 'application/octet-stream'
  }
}

/* --------------------------------------------------------------------------
 * Outils
 * ------------------------------------------------------------------------ */

export function echapper(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Le texte brut d'un fragment HTML, entités décodées, blancs réduits. */
export function texteDe(html: string): string {
  return decoderEntites(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

const MIME_IMAGE: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  svg: 'image/svg+xml', bmp: 'image/bmp', avif: 'image/avif',
}

/** Une image de l'archive, en adresse `data:` — la seule façon de la montrer sans rien stocker à part. */
export function versDataUrl(octets: Uint8Array, nom: string): string {
  const mime = MIME_IMAGE[extensionDe(nom)] ?? 'application/octet-stream'
  let binaire = ''
  for (let i = 0; i < octets.length; i += 0x8000) {
    binaire += String.fromCharCode.apply(null, Array.from(octets.subarray(i, i + 0x8000)))
  }
  return `data:${mime};base64,${btoa(binaire)}`
}

/** `a/b/../c.png` → `a/c.png` : le chemin d'une ressource relative à celui de son document. */
export function resoudreChemin(base: string, relatif: string): string {
  const dossier = base.includes('/') ? base.slice(0, base.lastIndexOf('/') + 1) : ''
  const parts: string[] = []
  for (const p of (dossier + decodeURIComponent(relatif.split('#')[0].split('?')[0])).split('/')) {
    if (p === '..') parts.pop()
    else if (p !== '.' && p !== '') parts.push(p)
  }
  return parts.join('/')
}

/**
 * La feuille d'un EPUB, moins ce qui appartient au lecteur : police, taille,
 * couleurs, interligne, et les `@font-face` qu'on ne saurait charger. Le
 * reste — marges, retraits, petites capitales, alignements — est la mise en
 * page de l'éditeur, et elle reste.
 */
const PROPRIETES_DU_LECTEUR = /^(?:font|font-family|font-size|color|background|background-color|background-image|line-height)$/i

export function filtrerCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import[^;]*;/gi, '')
    .replace(/@font-face\s*\{[^}]*\}/gi, '')
    // Déclaration par déclaration, dans chaque bloc : une expression sur le
    // tout avalait le `;` qui sépare deux déclarations et ratait la seconde.
    .replace(/\{([^{}]*)\}/g, (_, corps: string) => {
      const gardees = corps.split(';')
        .map((d) => d.trim())
        .filter((d) => d && !PROPRIETES_DU_LECTEUR.test(d.split(':')[0].trim()))
      return `{${gardees.join(';')}${gardees.length ? ';' : ''}}`
    })
    .replace(/\s+/g, ' ')
    .trim()
}

/* --------------------------------------------------------------------------
 * Le sectionnement des formats sans chapitres
 * ------------------------------------------------------------------------ */

/** Au-delà, un document sans titre se coupe en tranches de ce nombre de blocs — pour que l'éditeur ait quelque chose à découper. */
const BLOCS_PAR_TRANCHE = 12

/**
 * Des blocs aux unités. Le niveau de titre **utile** est le plus fin de
 * `h1`/`h2` qui compte au moins deux titres — les chapitres d'un livre en
 * parties, pas ses parties —, sinon le premier niveau qui en compte deux,
 * sinon le seul qu'il y a. Chaque titre de ce niveau ouvre une unité ; un
 * titre de rang supérieur (« Deuxième partie ») ne fait pas d'unité à lui seul,
 * il **s'accroche au chapitre qui suit**. Ce qui précède le premier titre est
 * une unité aussi. Sans aucun titre, des tranches de `BLOCS_PAR_TRANCHE`
 * blocs, nommées par leurs premiers mots.
 */
export function sectionner(blocs: readonly Bloc[]): Unite[] {
  const pleins = blocs.filter((b) => b.html.trim())
  if (pleins.length === 0) return []
  const compte = new Map<number, number>()
  for (const b of pleins) if (b.niveau) compte.set(b.niveau, (compte.get(b.niveau) ?? 0) + 1)
  const niveaux = Array.from(compte.entries()).sort((a, b) => a[0] - b[0])
  const utile = (compte.get(2) ?? 0) >= 2 ? 2
    : (compte.get(1) ?? 0) >= 2 ? 1
    : niveaux.find(([, n]) => n >= 2)?.[0] ?? niveaux[0]?.[0]

  if (utile === undefined) {
    const unites: Unite[] = []
    for (let i = 0; i < pleins.length; i += BLOCS_PAR_TRANCHE) {
      const tranche = pleins.slice(i, i + BLOCS_PAR_TRANCHE)
      unites.push({ titre: tranche[0].texte.slice(0, 80), html: tranche.map((b) => b.html).join('\n') })
    }
    return unites
  }

  const unites: Unite[] = []
  let courante: Bloc[] = []
  let titre = ''
  const fermer = () => {
    if (courante.length === 0) return
    unites.push({ titre: titre || courante.find((b) => b.texte)?.texte.slice(0, 80) || '', html: courante.map((b) => b.html).join('\n') })
    courante = []
  }
  for (const b of pleins) {
    if (b.niveau !== undefined && b.niveau <= utile) {
      // Une unité qui n'a encore que des titres n'est pas fermée : le titre de
      // partie attend son chapitre, et c'est le chapitre qui la nomme.
      if (!courante.every((c) => c.niveau !== undefined)) fermer()
      titre = b.texte
    }
    courante.push(b)
  }
  fermer()
  return unites
}

/** Des blocs `<li>` consécutifs en un seul `<ul>`. */
function grouperListes(blocs: Bloc[]): Bloc[] {
  const sortie: Bloc[] = []
  for (const b of blocs) {
    const precedent = sortie[sortie.length - 1]
    if (b.html.startsWith('<li>') && precedent?.html.startsWith('<ul>')) {
      precedent.html = precedent.html.replace(/<\/ul>$/, b.html + '</ul>')
      precedent.texte += ' ' + b.texte
    } else if (b.html.startsWith('<li>')) {
      sortie.push({ html: `<ul>${b.html}</ul>`, texte: b.texte })
    } else {
      sortie.push(b)
    }
  }
  return sortie
}

/* --------------------------------------------------------------------------
 * Word
 * ------------------------------------------------------------------------ */

function relationsDe(xml: string | null): Map<string, string> {
  const rels = new Map<string, string>()
  for (const m of Array.from((xml ?? '').matchAll(/<Relationship\b([^>]*)\/?>/g))) {
    const id = /\bId="([^"]+)"/.exec(m[1])?.[1]
    const cible = /\bTarget="([^"]+)"/.exec(m[1])?.[1]
    if (id && cible) rels.set(id, cible)
  }
  return rels
}

/** Le HTML d'une suite de `<w:r>` et `<w:hyperlink>` : gras, italique, souligné, barré, exposant, images, liens, sauts. */
async function contenuWord(xml: string, rels: Map<string, string>, zip: Zip): Promise<string> {
  let html = ''
  for (const m of Array.from(xml.matchAll(/<w:hyperlink\b([^>]*)>([\s\S]*?)<\/w:hyperlink>|<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g))) {
    if (m[2] !== undefined) {
      const id = /\br:id="([^"]+)"/.exec(m[1])?.[1]
      const href = id ? rels.get(id) : undefined
      const interieur = await contenuWord(m[2], rels, zip)
      html += href && /^https?:/i.test(href) ? `<a href="${echapper(href)}" target="_blank" rel="noopener">${interieur}</a>` : interieur
      continue
    }
    const run = m[3] ?? ''
    const props = /<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(run)?.[1] ?? ''
    const actif = (balise: string) => new RegExp(`<w:${balise}\\b(?![^>]*w:val="(?:0|false|none)")`).test(props)
    let texte = ''
    for (const t of Array.from(run.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\b[^>]*\/>|<w:drawing>([\s\S]*?)<\/w:drawing>/g))) {
      if (t[0] === '<w:tab/>') texte += '&emsp;'
      else if (t[0].startsWith('<w:br')) texte += '<br>'
      else if (t[2] !== undefined) {
        const id = /r:embed="([^"]+)"/.exec(t[2])?.[1]
        const cible = id ? rels.get(id) : undefined
        const octets = cible ? await zip.octets('word/' + cible.replace(/^\/?word\//, '')) : null
        if (octets) texte += `<img src="${versDataUrl(octets, cible!)}" alt="">`
      } else texte += echapper(decoderEntites(t[1] ?? ''))
    }
    if (!texte) continue
    if (actif('b')) texte = `<strong>${texte}</strong>`
    if (actif('i')) texte = `<em>${texte}</em>`
    if (actif('u')) texte = `<u>${texte}</u>`
    if (actif('strike')) texte = `<s>${texte}</s>`
    if (/<w:vertAlign\b[^>]*w:val="superscript"/.test(props)) texte = `<sup>${texte}</sup>`
    html += texte
  }
  return html
}

async function blocWord(pXml: string, rels: Map<string, string>, zip: Zip): Promise<Bloc | null> {
  const style = /<w:pStyle\b[^>]*w:val="([^"]+)"/.exec(pXml)?.[1] ?? ''
  const titre = /^(?:heading|titre|title|h)\s?(\d)?$/i.exec(style)
  const liste = /<w:numPr\b/.test(pXml)
  const html = (await contenuWord(pXml, rels, zip)).trim()
  if (!html) return null
  const texte = texteDe(html)
  if (titre) {
    const niveau = Math.min(6, Number(titre[1] ?? 1))
    return { niveau, html: `<h${niveau}>${html}</h${niveau}>`, texte }
  }
  if (liste) return { html: `<li>${html}</li>`, texte }
  const centre = /<w:jc\b[^>]*w:val="center"/.test(pXml) ? ' style="text-align:center"' : ''
  return { html: `<p${centre}>${html}</p>`, texte }
}

export async function blocsWord(zip: Zip): Promise<Bloc[]> {
  const doc = await zip.texte('word/document.xml')
  if (!doc) return []
  const rels = relationsDe(await zip.texte('word/_rels/document.xml.rels'))
  const corps = /<w:body>([\s\S]*)<\/w:body>/.exec(doc)?.[1] ?? doc
  const blocs: Bloc[] = []
  // Les tableaux d'abord dans l'alternance : un `<w:tbl>` contient des `<w:p>`,
  // qu'il ne faut pas lire une seconde fois au premier niveau. La branche
  // auto-fermante `<w:p/>` avant l'ouvrante, comme dans `texteWord`.
  for (const m of Array.from(corps.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>|<w:p\b[^>]*\/>|<w:p\b[^>]*>[\s\S]*?<\/w:p>/g))) {
    if (m[1] !== undefined) {
      const lignes: string[] = []
      for (const tr of Array.from(m[1].matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g))) {
        const cellules: string[] = []
        for (const tc of Array.from(tr[1].matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g))) {
          const paragraphes: string[] = []
          for (const p of Array.from(tc[1].matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g))) {
            const b = await blocWord(p[0], rels, zip)
            if (b) paragraphes.push(b.html)
          }
          cellules.push(`<td>${paragraphes.join('')}</td>`)
        }
        lignes.push(`<tr>${cellules.join('')}</tr>`)
      }
      const html = `<table>${lignes.join('')}</table>`
      blocs.push({ html, texte: texteDe(html) })
      continue
    }
    if (m[0].endsWith('/>')) continue
    const b = await blocWord(m[0], rels, zip)
    if (b) blocs.push(b)
  }
  return grouperListes(blocs)
}

/* --------------------------------------------------------------------------
 * OpenDocument
 * ------------------------------------------------------------------------ */

interface StyleTexte { gras: boolean; italique: boolean; souligne: boolean }

function stylesOpenDocument(xml: string): Map<string, StyleTexte> {
  const styles = new Map<string, StyleTexte>()
  for (const m of Array.from(xml.matchAll(/<style:style\b([^>]*)>([\s\S]*?)<\/style:style>/g))) {
    const nom = /style:name="([^"]+)"/.exec(m[1])?.[1]
    const props = /<style:text-properties\b([^>]*)\/?>/.exec(m[2])?.[1] ?? ''
    if (!nom) continue
    styles.set(nom, {
      gras: /fo:font-weight="bold"/.test(props),
      italique: /fo:font-style="italic"/.test(props),
      souligne: /style:text-underline-style="(?!none)[^"]+"/.test(props),
    })
  }
  return styles
}

async function contenuOpenDocument(xml: string, styles: Map<string, StyleTexte>, zip: Zip): Promise<string> {
  let html = ''
  const motif = /<text:span\b([^>]*)>([\s\S]*?)<\/text:span>|<text:a\b([^>]*)>([\s\S]*?)<\/text:a>|<text:line-break\/>|<text:tab\/>|<text:s\b(?:\s+text:c="(\d+)")?\/>|<draw:frame\b[^>]*>([\s\S]*?)<\/draw:frame>|<[^>]+>|([^<]+)/g
  for (const m of Array.from(xml.matchAll(motif))) {
    if (m[2] !== undefined) {
      const nom = /text:style-name="([^"]+)"/.exec(m[1])?.[1]
      const s = nom ? styles.get(nom) : undefined
      let interieur = await contenuOpenDocument(m[2], styles, zip)
      if (s?.gras) interieur = `<strong>${interieur}</strong>`
      if (s?.italique) interieur = `<em>${interieur}</em>`
      if (s?.souligne) interieur = `<u>${interieur}</u>`
      html += interieur
    } else if (m[4] !== undefined) {
      const href = /xlink:href="([^"]+)"/.exec(m[3])?.[1]
      const interieur = await contenuOpenDocument(m[4], styles, zip)
      html += href && /^https?:/i.test(href) ? `<a href="${echapper(href)}" target="_blank" rel="noopener">${interieur}</a>` : interieur
    } else if (m[0] === '<text:line-break/>') html += '<br>'
    else if (m[0] === '<text:tab/>') html += '&emsp;'
    else if (m[0].startsWith('<text:s')) html += ' '.repeat(Number(m[5] ?? 1))
    else if (m[6] !== undefined) {
      const href = /<draw:image\b[^>]*xlink:href="([^"]+)"/.exec(m[6])?.[1]
      const octets = href ? await zip.octets(decodeURIComponent(href)) : null
      if (octets) html += `<img src="${versDataUrl(octets, href!)}" alt="">`
    } else if (m[7] !== undefined) html += echapper(decoderEntites(m[7]))
  }
  return html
}

export async function blocsOpenDocument(zip: Zip): Promise<Bloc[]> {
  const contenu = await zip.texte('content.xml')
  if (!contenu) return []
  const styles = stylesOpenDocument(contenu)
  const corps = /<office:text\b[^>]*>([\s\S]*)<\/office:text>/.exec(contenu)?.[1] ?? contenu
  const blocs: Bloc[] = []
  const paragraphe = async (xml: string, balise: string): Promise<Bloc | null> => {
    const html = (await contenuOpenDocument(xml, styles, zip)).trim()
    if (!html) return null
    return { html: `<${balise}>${html}</${balise}>`, texte: texteDe(html) }
  }
  // Les listes et les tableaux d'abord, pour ne pas relire leurs paragraphes
  // au premier niveau. Une liste imbriquée dans une liste referme la première
  // trop tôt : rare dans ce qu'on lit ici, et l'assainisseur remet d'aplomb.
  const motif = /<text:h\b([^>]*)>([\s\S]*?)<\/text:h>|<text:list\b[^>]*>([\s\S]*?)<\/text:list>|<table:table\b[^>]*>([\s\S]*?)<\/table:table>|<text:p\b[^>]*\/>|<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g
  for (const m of Array.from(corps.matchAll(motif))) {
    if (m[2] !== undefined) {
      const niveau = Math.min(6, Number(/text:outline-level="(\d)"/.exec(m[1])?.[1] ?? 1))
      const b = await paragraphe(m[2], `h${niveau}`)
      if (b) blocs.push({ ...b, niveau })
    } else if (m[3] !== undefined) {
      for (const item of Array.from(m[3].matchAll(/<text:list-item\b[^>]*>([\s\S]*?)<\/text:list-item>/g))) {
        const html = (await contenuOpenDocument(item[1].replace(/<\/?text:p\b[^>]*>/g, ' '), styles, zip)).trim()
        if (html) blocs.push({ html: `<li>${html}</li>`, texte: texteDe(html) })
      }
    } else if (m[4] !== undefined) {
      const lignes: string[] = []
      for (const tr of Array.from(m[4].matchAll(/<table:table-row\b[^>]*>([\s\S]*?)<\/table:table-row>/g))) {
        const cellules: string[] = []
        for (const tc of Array.from(tr[1].matchAll(/<table:table-cell\b[^>]*>([\s\S]*?)<\/table:table-cell>/g))) {
          const paragraphes: string[] = []
          for (const p of Array.from(tc[1].matchAll(/<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g))) {
            const b = await paragraphe(p[1], 'p')
            if (b) paragraphes.push(b.html)
          }
          cellules.push(`<td>${paragraphes.join('')}</td>`)
        }
        lignes.push(`<tr>${cellules.join('')}</tr>`)
      }
      const html = `<table>${lignes.join('')}</table>`
      blocs.push({ html, texte: texteDe(html) })
    } else if (m[5] !== undefined) {
      const b = await paragraphe(m[5], 'p')
      if (b) blocs.push(b)
    }
  }
  return grouperListes(blocs)
}

/* --------------------------------------------------------------------------
 * HTML
 * ------------------------------------------------------------------------ */

/** Un fichier HTML : son corps, coupé à ses titres. Scripts et feuilles ne passent pas. */
export function blocsHtml(html: string): Bloc[] {
  const corps = (/<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  const blocs: Bloc[] = []
  let pos = 0
  for (const m of Array.from(corps.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi))) {
    const avant = corps.slice(pos, m.index).trim()
    if (avant) blocs.push({ html: avant, texte: texteDe(avant) })
    blocs.push({ niveau: Number(m[1]), html: m[0], texte: texteDe(m[2]) })
    pos = m.index! + m[0].length
  }
  const reste = corps.slice(pos).trim()
  if (reste) blocs.push({ html: reste, texte: texteDe(reste) })
  return blocs
}

/* --------------------------------------------------------------------------
 * EPUB
 * ------------------------------------------------------------------------ */

/** Le chemin d'un fichier d'archive, tel que la table des matières le nomme : sans fragment ni requête. */
function cle(chemin: string): string {
  return chemin.split('#')[0].split('?')[0]
}

export async function unitesEpub(zip: Zip): Promise<Unite[]> {
  const conteneur = await zip.texte('META-INF/container.xml')
  const cheminOpf = conteneur ? /full-path="([^"]+)"/.exec(conteneur)?.[1] : undefined
  const opf = cheminOpf ? await zip.texte(cheminOpf) : null
  let chapitres: string[] = []
  const titres = new Map<string, string>()
  if (opf) {
    const dossierOpf = cheminOpf!.includes('/') ? cheminOpf!.slice(0, cheminOpf!.lastIndexOf('/') + 1) : ''
    const items = new Map<string, { chemin: string; nav: boolean }>()
    let ncx: string | null = null
    for (const m of Array.from(opf.matchAll(/<item\b([^>]*)\/?>/g))) {
      const id = /\bid="([^"]+)"/.exec(m[1])?.[1]
      const href = /\bhref="([^"]+)"/.exec(m[1])?.[1]
      const type = /\bmedia-type="([^"]+)"/.exec(m[1])?.[1] ?? ''
      const props = /\bproperties="([^"]*)"/.exec(m[1])?.[1] ?? ''
      if (!id || !href) continue
      const chemin = resoudreChemin(cheminOpf!, href)
      if (/html|xml/.test(type) && !/ncx/.test(type)) items.set(id, { chemin, nav: /\bnav\b/.test(props) })
      if (/ncx/.test(type)) ncx = chemin
      void dossierOpf
    }
    // La table des matières : le document `nav` (EPUB 3), sinon le NCX (EPUB 2).
    const nav = Array.from(items.values()).find((i) => i.nav)
    const navXml = nav ? await zip.texte(nav.chemin) : null
    if (navXml) {
      const toc = /<nav\b[^>]*epub:type="toc"[^>]*>([\s\S]*?)<\/nav>/.exec(navXml)?.[1] ?? navXml
      for (const a of Array.from(toc.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g))) {
        const chemin = cle(resoudreChemin(nav!.chemin, a[1]))
        if (!titres.has(chemin)) titres.set(chemin, texteDe(a[2]))
      }
    } else if (ncx) {
      const ncxXml = await zip.texte(ncx)
      for (const p of Array.from((ncxXml ?? '').matchAll(/<navPoint\b[^>]*>[\s\S]*?<text>([\s\S]*?)<\/text>[\s\S]*?<content\b[^>]*src="([^"]+)"/g))) {
        const chemin = cle(resoudreChemin(ncx, p[2]))
        if (!titres.has(chemin)) titres.set(chemin, texteDe(p[1]))
      }
    }
    chapitres = Array.from(opf.matchAll(/<itemref\b[^>]*\bidref="([^"]+)"/g))
      .map((m) => items.get(m[1]))
      .filter((i): i is { chemin: string; nav: boolean } => i !== undefined && !i.nav)
      .map((i) => i.chemin)
  }
  if (chapitres.length === 0) chapitres = zip.noms().filter((n) => /\.x?html?$/i.test(n)).sort()

  const feuilles = new Map<string, string>()
  const unites: Unite[] = []
  for (const [i, chemin] of Array.from(chapitres.entries())) {
    const xhtml = await zip.texte(chemin)
    if (xhtml === null) continue
    const tete = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(xhtml)?.[1] ?? ''
    let corps = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(xhtml)?.[1] ?? xhtml

    // La feuille de style du chapitre : ses `<link>` et ses `<style>`, filtrés.
    let css = ''
    for (const l of Array.from(tete.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>|<link\b[^>]*href="([^"]+)"[^>]*rel="stylesheet"[^>]*>/gi))) {
      const cheminCss = resoudreChemin(chemin, l[1] ?? l[2])
      if (!feuilles.has(cheminCss)) feuilles.set(cheminCss, filtrerCss((await zip.texte(cheminCss)) ?? ''))
      css += feuilles.get(cheminCss) + '\n'
    }
    for (const s of Array.from(tete.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi))) css += filtrerCss(s[1]) + '\n'

    // Les images : `src` et `xlink:href` relatifs à l'archive, en `data:`.
    const remplacements: Array<[string, string]> = []
    for (const m of Array.from(corps.matchAll(/\b(?:src|xlink:href)="([^"]+)"/g))) {
      if (/^(?:data:|https?:)/i.test(m[1])) continue
      const cheminImage = resoudreChemin(chemin, m[1])
      const octets = MIME_IMAGE[extensionDe(cheminImage)] ? await zip.octets(cheminImage) : null
      if (octets) remplacements.push([m[0], m[0].replace(m[1], versDataUrl(octets, cheminImage))])
    }
    for (const [de, vers] of remplacements) corps = corps.split(de).join(vers)

    const titre = titres.get(cle(chemin))
      || texteDe(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i.exec(corps)?.[1] ?? '')
      || texteDe(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(tete)?.[1] ?? '')
      || `${i + 1}`
    unites.push({ titre, html: (css.trim() ? `<style>${css}</style>\n` : '') + corps.trim() })
  }
  return unites
}

/* --------------------------------------------------------------------------
 * L'entrée
 * ------------------------------------------------------------------------ */

/** Les unités d'un document, par son nom : EPUB, Word, OpenDocument, HTML. Un PDF n'a pas d'unités HTML : ses pages se dessinent. */
export async function unitesDuDocument(octets: ArrayBuffer, nom: string): Promise<Unite[]> {
  const ext = extensionDe(nom)
  if (ext === 'html' || ext === 'htm') {
    return sectionner(blocsHtml(new TextDecoder('utf-8').decode(octets)))
  }
  const zip = await lireZip(new Uint8Array(octets))
  if (ext === 'epub') return unitesEpub(zip)
  if (ext === 'docx') return sectionner(await blocsWord(zip))
  if (ext === 'odt') return sectionner(await blocsOpenDocument(zip))
  throw new Error(`format ${ext} sans unités`)
}

/** La structure que l'éditeur de jours attend : une unité = une « page », son titre en repère. */
export function structureDesUnites(unites: readonly Unite[]): StructureDuDocument {
  return {
    pages: unites.length,
    reperes: unites.map((u, i) => ({ page: i + 1, titre: u.titre, niveau: 1 as const })),
    premieresLignes: unites.map((u) => u.titre || texteDe(u.html).slice(0, 120)),
  }
}
