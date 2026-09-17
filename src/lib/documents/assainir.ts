import { filtrerCss } from './unites'

/**
 * L'assainissement du HTML d'un document avant qu'il n'entre dans la page.
 *
 * Le document est celui de l'administrateur, mais un EPUB téléchargé n'est
 * pas moins un fichier tiers : un script qui s'y cache s'exécuterait avec la
 * session ouverte. Ici, **liste blanche** : les balises et attributs de la
 * mise en forme passent, tout le reste tombe — `script`, `iframe`, `object`,
 * `form`, les gestionnaires `on*`, les adresses `javascript:`. Une balise
 * inconnue disparaît mais garde ses enfants : un `<section>` exotique ne fait
 * pas perdre son texte.
 *
 * Par `DOMParser`, dans le navigateur seulement — un analyseur HTML écrit à la
 * main est exactement ce qu'on ne veut pas ici. Ce module n'a donc pas de
 * test Vitest (environnement Node) : il est éprouvé dans le navigateur.
 */

const BALISES = new Set([
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'sup', 'sub', 'small',
  'span', 'div', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main', 'blockquote', 'pre', 'code',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col',
  'img', 'a', 'figure', 'figcaption', 'cite', 'q', 'abbr', 'mark', 'time', 'address', 'style', 'svg', 'image',
])

/** Ce qu'on retire **avec** ses enfants : rien de ce qu'ils contiennent n'est du texte à lire. */
const SUPPRIMEES = new Set(['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select',
  'link', 'meta', 'base', 'video', 'audio', 'template', 'noscript', 'head', 'title'])

const ATTRIBUTS = new Set(['class', 'id', 'style', 'href', 'src', 'alt', 'title', 'width', 'height', 'colspan', 'rowspan',
  'dir', 'lang', 'start', 'type', 'align', 'valign', 'viewbox', 'preserveaspectratio', 'xlink:href'])

function adresseAdmise(valeur: string, attribut: string): boolean {
  const v = valeur.trim().toLowerCase()
  if (attribut === 'href') return /^(?:https?:|mailto:|#)/.test(v) || v === ''
  return /^(?:data:image\/|https?:)/.test(v)
}

function nettoyer(source: Element, cible: Document): Node | null {
  const nom = source.localName.toLowerCase()
  if (SUPPRIMEES.has(nom)) return null
  if (!BALISES.has(nom)) {
    // Inconnue : ses enfants seuls, dans un fragment.
    const fragment = cible.createDocumentFragment()
    for (const enfant of Array.from(source.childNodes)) {
      const n = nettoyerNoeud(enfant, cible)
      if (n) fragment.appendChild(n)
    }
    return fragment
  }
  if (nom === 'style') {
    const style = cible.createElement('style')
    style.textContent = filtrerCss(source.textContent ?? '')
    return style
  }
  const element = nom === 'svg' || nom === 'image'
    ? cible.createElementNS('http://www.w3.org/2000/svg', nom)
    : cible.createElement(nom)
  for (const attr of Array.from(source.attributes)) {
    const a = attr.name.toLowerCase()
    if (!ATTRIBUTS.has(a) || a.startsWith('on')) continue
    if ((a === 'href' || a === 'src' || a === 'xlink:href') && !adresseAdmise(attr.value, a === 'src' || a === 'xlink:href' ? 'src' : 'href')) continue
    if (a === 'style' && /expression\s*\(|javascript:/i.test(attr.value)) continue
    if (a === 'xlink:href') element.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', attr.value)
    else element.setAttribute(attr.name, attr.value)
  }
  if (nom === 'a') { element.setAttribute('target', '_blank'); element.setAttribute('rel', 'noopener noreferrer') }
  for (const enfant of Array.from(source.childNodes)) {
    const n = nettoyerNoeud(enfant, cible)
    if (n) element.appendChild(n)
  }
  return element
}

function nettoyerNoeud(noeud: Node, cible: Document): Node | null {
  if (noeud.nodeType === Node.TEXT_NODE) return cible.createTextNode(noeud.textContent ?? '')
  if (noeud.nodeType === Node.ELEMENT_NODE) return nettoyer(noeud as Element, cible)
  return null
}

/** Le HTML d'une unité, assaini : ce qui peut entrer dans un Shadow DOM sans crainte. */
export function assainir(html: string): string {
  const source = new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, 'text/html')
  const cible = document.implementation.createHTMLDocument('')
  const conteneur = cible.createElement('div')
  for (const enfant of Array.from(source.body.childNodes)) {
    const n = nettoyerNoeud(enfant, cible)
    if (n) conteneur.appendChild(n)
  }
  return conteneur.innerHTML
}
