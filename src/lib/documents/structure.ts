import { structureDuPdf, type ProgressionPdf } from '@/lib/import/pdf'
import { estPdf, structureDesUnites, unitesDuDocument, type StructureDuDocument, type Unite } from './unites'

/**
 * La structure d'un document, pour l'éditeur de jours — quel que soit son
 * format. Un PDF : ses pages, ses signets, la première ligne de chaque page.
 * Les autres : leurs unités (chapitres, sections), une par « page », leur
 * titre en repère. L'éditeur ne connaît que des nombres et des titres.
 */
export async function structureDuDocument(
  source: File | ArrayBuffer,
  nom: string,
  onProgression?: (p: ProgressionPdf) => void,
): Promise<StructureDuDocument> {
  if (estPdf(nom)) return structureDuPdf(source, onProgression)
  const octets = source instanceof ArrayBuffer ? source : await source.arrayBuffer()
  return structureDesUnites(await unitesDuDocument(octets, nom))
}

/**
 * Les unités d'un document, avec la dernière conversion gardée : le lecteur
 * rouvre le même document jour après jour, et convertir un EPUB de plusieurs
 * mégaoctets à chaque « jour suivant » se sentirait.
 */
let derniere: { chemin: string; unites: Unite[] } | null = null

export async function unitesEnCache(chemin: string, octets: () => Promise<ArrayBuffer>): Promise<Unite[]> {
  if (derniere?.chemin === chemin) return derniere.unites
  const unites = await unitesDuDocument(await octets(), chemin)
  derniere = { chemin, unites }
  return unites
}
