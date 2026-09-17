/**
 * Ce qu'un lien doit être pour qu'on aille le chercher, et le nom que prend
 * ce qu'on en rapporte.
 *
 * Quatrième entrée de l'import de lectures, demandée par le propriétaire le
 * 17 septembre 2026. Un navigateur ne peut pas lire une page d'un autre site
 * (CORS) : c'est la route `api/import/lien` qui va la chercher, **sans rien
 * garder**, et rend les octets au navigateur, qui les passe au même
 * `texteDuFichier` qu'un fichier choisi — une seule voie d'extraction.
 *
 * Ce module porte la part **pure** de la route, pour être testée sans
 * serveur : la règle d'admission d'une adresse, et le nom de fichier qu'on
 * donne à la réponse pour que `texteDuFichier` sache la lire.
 */

/**
 * L'adresse normalisée, ou la raison du refus.
 *
 * Une route qui va chercher ce qu'on lui dit est une porte vers le réseau du
 * serveur : on n'accepte que `http` et `https`, jamais une adresse interne —
 * `localhost`, les plages privées, le lien-local (`169.254.x`, où vivent les
 * métadonnées des hébergeurs), `.local` et `.internal`. La liste refuse ce
 * qu'on sait dangereux ; elle ne prétend pas connaître tout le reste.
 */
export function adresseAdmise(brut: string): { url: string } | { refus: 'adresse-invalide' | 'adresse-interne' } {
  let url: URL
  try {
    url = new URL(brut.trim())
  } catch {
    return { refus: 'adresse-invalide' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { refus: 'adresse-invalide' }
  if (url.username || url.password) return { refus: 'adresse-invalide' }
  const hote = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (hote === 'localhost' || hote.endsWith('.localhost') || hote.endsWith('.local') || hote.endsWith('.internal')) {
    return { refus: 'adresse-interne' }
  }
  if (hote === '::1' || hote === '::' || hote.startsWith('fe80:') || hote.startsWith('fc') || hote.startsWith('fd')) {
    return { refus: 'adresse-interne' }
  }
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hote)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    if (a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) {
      return { refus: 'adresse-interne' }
    }
  }
  return { url: url.toString() }
}

/** Ce que `texteDuFichier` sait lire, par type MIME, quand l'adresse ne porte pas d'extension. */
const EXTENSION_PAR_TYPE: Record<string, string> = {
  'text/html': 'html',
  'application/xhtml+xml': 'html',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.oasis.opendocument.text': 'odt',
  'application/vnd.oasis.opendocument.spreadsheet': 'ods',
  'application/vnd.oasis.opendocument.presentation': 'odp',
}

/**
 * Le nom de fichier de ce qu'un lien a rendu. Le dernier segment de l'adresse
 * s'il porte une extension connue ; sinon un nom bâti sur le type de la
 * réponse — une page d'accueil sans chemin devient `page.html`.
 */
export function nomDeFichierPour(urlFinale: string, contentType: string | null): string {
  let segment = ''
  try {
    const chemin = new URL(urlFinale).pathname
    segment = decodeURIComponent(chemin.split('/').filter(Boolean).pop() ?? '')
  } catch {
    segment = ''
  }
  const type = (contentType ?? '').split(';')[0].trim().toLowerCase()
  const extensionDuType = EXTENSION_PAR_TYPE[type]
  // Le nom de l'adresse fait foi quand le type ne dit rien de mieux, ou quand
  // il le confirme ; un `index.php` qui sert du HTML devient `index.html`,
  // faute de quoi `texteDuFichier` ne saurait pas le lire.
  if (/\.[a-z0-9]{2,5}$/i.test(segment) && (!extensionDuType || segment.toLowerCase().endsWith('.' + extensionDuType))) {
    return segment
  }
  const base = segment.replace(/\.[a-z0-9]{2,5}$/i, '') || 'page'
  return `${base}.${extensionDuType ?? (type.startsWith('text/') ? 'txt' : 'bin')}`
}

/** Rien ne quitte le serveur vers l'appelant au-delà : la réponse d'une fonction Vercel est bornée. */
export const TAILLE_MAXIMALE_LIEN = 4 * 1024 * 1024
export const DELAI_LIEN_MS = 10_000
