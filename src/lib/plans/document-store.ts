import { createClient } from '@/lib/supabase/client'
import { getDB } from '@/lib/storage/db'

/**
 * Le document d'un plan : le PDF gardé dans le seau `documents`, et sa copie
 * dans IndexedDB.
 *
 * C'est le premier fichier que l'application stocke — décision du propriétaire
 * du 17 septembre 2026, quand le texte extrait d'un PDF s'est révélé
 * illisible et qu'il a demandé un lecteur « qui respecte le document
 * original ». Le fichier ne vit qu'ici : sous le préfixe `{user_id}/` que la
 * policy du seau exige, et dans le cache local pour que le plan se lise hors
 * ligne comme les autres. Supprimer le plan le retire des deux.
 *
 * Aucune route API : la RLS du seau est la barrière, comme pour les tables —
 * la lecture au propriétaire, le dépôt à l'administrateur (`private.is_admin()`
 * dans la policy, pas dans un bouton).
 */

export const SEAU_DOCUMENTS = 'documents'

/** Le chemin d'un nouveau document : sous le préfixe du compte, un nom que personne ne devine. */
export function cheminDeDocument(userId: string): string {
  return `${userId}/${crypto.randomUUID()}.pdf`
}

async function garder(chemin: string, octets: ArrayBuffer): Promise<void> {
  const db = await getDB()
  await db.put('documents', { chemin, octets, taille: octets.byteLength, lu: new Date().toISOString() })
}

/**
 * Dépose le fichier dans le seau, et le garde aussitôt en cache : le premier
 * « Lire » n'attend pas de le retélécharger. Lève si le seau refuse — taille,
 * type, ou droit.
 */
export async function deposerDocument(chemin: string, fichier: File): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(SEAU_DOCUMENTS)
    .upload(chemin, fichier, { contentType: 'application/pdf', upsert: false })
  if (error) throw new Error(error.message)
  await garder(chemin, await fichier.arrayBuffer())
}

/**
 * Les octets du document — du cache s'il y est, du seau sinon, puis gardés.
 *
 * Le tampon rendu est **une copie** : `pdf.js` transfère au worker celui qu'on
 * lui donne, qui en ressort vide (« detached »), et une seconde lecture depuis
 * le même tampon dessinerait une page blanche. Ce coût de mémoire est celui
 * d'un PDF, pas plus.
 */
export async function octetsDuDocument(chemin: string): Promise<ArrayBuffer> {
  const db = await getDB()
  const local = await db.get('documents', chemin)
  if (local) return local.octets.slice(0)
  const supabase = createClient()
  const { data, error } = await supabase.storage.from(SEAU_DOCUMENTS).download(chemin)
  if (error || !data) throw new Error(error?.message ?? 'document introuvable')
  const octets = await data.arrayBuffer()
  await garder(chemin, octets)
  return octets.slice(0)
}

/** Retire le document du cache et du seau — à la suppression du plan. */
export async function oublierDocument(chemin: string): Promise<void> {
  const db = await getDB()
  await db.delete('documents', chemin)
  const supabase = createClient()
  const { error } = await supabase.storage.from(SEAU_DOCUMENTS).remove([chemin])
  if (error) throw new Error(error.message)
}
