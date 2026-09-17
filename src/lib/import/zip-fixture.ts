import { deflateRawSync } from 'node:zlib'

/**
 * Un écrivain zip minimal, **pour les tests seulement** : fabriquer des
 * fixtures Word, OpenDocument, EPUB sans committer un seul octet binaire. Il
 * écrit ce que `lireZip` lit — méthode 8 (deflate) ou 0 — et rien d'autre ;
 * un vrai fichier de bureau porte en plus des CRC et des dates que le lecteur
 * ignore. Une entrée peut être binaire (une image).
 */
export function ecrireZip(entrees: Record<string, string | Uint8Array>, methode: 0 | 8 = 8): Uint8Array {
  const parties: Uint8Array[] = []
  const centrales: Uint8Array[] = []
  let decalage = 0
  const u16 = (n: number) => [n & 0xff, (n >> 8) & 0xff]
  const u32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]
  for (const [nom, contenu] of Object.entries(entrees)) {
    const nomOctets = new TextEncoder().encode(nom)
    const brut = typeof contenu === 'string' ? new TextEncoder().encode(contenu) : contenu
    const donnees = methode === 8 ? new Uint8Array(deflateRawSync(brut)) : brut
    const locale = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(methode), ...u16(0), ...u16(0), ...u32(0),
      ...u32(donnees.length), ...u32(brut.length), ...u16(nomOctets.length), ...u16(0),
      ...Array.from(nomOctets),
    ])
    parties.push(locale, donnees)
    centrales.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(methode), ...u16(0), ...u16(0), ...u32(0),
      ...u32(donnees.length), ...u32(brut.length), ...u16(nomOctets.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(decalage), ...Array.from(nomOctets),
    ]))
    decalage += locale.length + donnees.length
  }
  const tailleCentrale = centrales.reduce((s, c) => s + c.length, 0)
  const fin = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(centrales.length), ...u16(centrales.length),
    ...u32(tailleCentrale), ...u32(decalage), ...u16(0),
  ])
  const total = [...parties, ...centrales, fin]
  const sortie = new Uint8Array(total.reduce((s, p) => s + p.length, 0))
  let pos = 0
  for (const p of total) { sortie.set(p, pos); pos += p.length }
  return sortie
}
