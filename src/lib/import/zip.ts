/**
 * Un lecteur zip minimal, sans dépendance.
 *
 * Le répertoire central d'abord, puis chaque entrée à la demande. Deux
 * méthodes de compression existent dans les fichiers qu'on lit — aucune (0)
 * et deflate (8) —, et `DecompressionStream('deflate-raw')` sait la seconde.
 * Tout le reste du format (chiffrement, zip64, multi-volumes) n'a pas cours
 * dans un document de bureau ou un EPUB et n'est pas lu.
 *
 * Né dans `fichiers.ts` pour en extraire le texte ; sorti ici le 17 septembre
 * 2026 quand la lecture d'un document en HTML riche a eu besoin des **octets**
 * d'une entrée — les images d'un EPUB ou d'un Word — et pas seulement de son
 * texte.
 */

interface Entree {
  nom: string
  methode: number
  tailleCompressee: number
  decalage: number
}

export interface Zip {
  noms(): string[]
  texte(nom: string): Promise<string | null>
  octets(nom: string): Promise<Uint8Array | null>
}

const SIGNATURE_FIN = 0x06054b50
const SIGNATURE_CENTRALE = 0x02014b50
const SIGNATURE_LOCALE = 0x04034b50

export async function lireZip(octets: Uint8Array): Promise<Zip> {
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
    octets: async (nom) => {
      const e = entrees.get(nom)
      return e ? octetsDe(e) : null
    },
  }
}
