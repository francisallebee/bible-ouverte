import { createClient } from '@/lib/supabase/client'
import { getCurrentUserId } from './user-id'
import type { Message } from '@/lib/messages/messages'

/**
 * Les messages, lus **directement dans Supabase, sans cache IndexedDB**.
 *
 * C'est une exception assumée à l'architecture du dépôt, et elle mérite d'être
 * défendue. Partout ailleurs, le cache local sert une donnée que l'utilisateur
 * a produite : ses lectures, ses plans, ses contextes existent sur son
 * appareil avant d'exister en ligne. Un message reçu, non — il naît ailleurs.
 * Le mettre en cache donnerait une boîte de réception qui paraît à jour hors
 * ligne alors qu'elle ne peut pas l'être, et c'est précisément le genre de
 * mensonge que ce dépôt s'applique à éviter.
 *
 * Conséquence à connaître : **hors ligne, cet écran ne montre rien.** À
 * revoir le jour où un fil vaudra d'être relu sans réseau ; le prix serait une
 * version de plus de la base IndexedDB.
 */

const CHAMPS = 'id, user_id, from_admin, subject, body, sent_by_name, read_at, "createdAt"'

function versMessage(ligne: Record<string, any>): Message {
  return {
    id: ligne.id as number,
    userId: ligne.user_id as string,
    fromAdmin: !!ligne.from_admin,
    subject: (ligne.subject as string) ?? '',
    body: (ligne.body as string) ?? '',
    sentByName: (ligne.sent_by_name as string) ?? '',
    readAt: (ligne.read_at as string | null) ?? null,
    createdAt: (ligne.createdAt as string) ?? new Date().toISOString(),
  }
}

/** Le fil du compte courant. Vide plutôt qu'une exception si le réseau manque. */
export async function getMesMessages(): Promise<Message[]> {
  const userId = await getCurrentUserId()
  if (!userId || userId === 'local') return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages').select(CHAMPS).eq('user_id', userId).order('createdAt', { ascending: true })
  if (error || !data) return []
  return data.map(versMessage)
}

/**
 * Le nombre de messages non lus, sans transporter les messages.
 *
 * `head: true` rend le compte dans l'en-tête et rien dans le corps. La barre
 * latérale appelle cette fonction à chaque montage : y faire descendre les
 * corps de message serait la dette de resynchronisation décrite dans AGENTS.md,
 * avec du texte en plus.
 */
export async function compterMesNonLus(): Promise<number> {
  const userId = await getCurrentUserId()
  if (!userId || userId === 'local') return 0
  const supabase = createClient()
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('from_admin', true).is('read_at', null)
  if (error) return 0
  return count ?? 0
}

/**
 * Marque comme lus les messages reçus.
 *
 * `read_at` est la **seule colonne** que la RLS laisse écrire à l'utilisateur
 * (voir `20260820110000_messages.sql`) : le contrôle est au niveau des GRANT,
 * comme sur `profiles`. Une tentative sur une autre colonne échouerait, ce qui
 * est le comportement voulu.
 */
export async function marquerLus(ids: number[]): Promise<void> {
  if (ids.length === 0) return
  const supabase = createClient()
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids).is('read_at', null)
}

/**
 * Une réponse de l'utilisateur, dans son propre fil.
 *
 * `from_admin: false` et `sent_by` égal à soi-même ne sont pas des politesses :
 * la policy d'insertion les exige, et refuserait la ligne autrement. Les
 * réécrire ici les rend lisibles plutôt que mystérieux.
 */
export async function repondre(corps: string): Promise<Message | null> {
  const userId = await getCurrentUserId()
  if (!userId || userId === 'local') return null
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .insert({ user_id: userId, from_admin: false, sent_by: userId, body: corps.trim() })
    .select(CHAMPS)
    .single()
  // `.select()` après l'insertion : sous RLS, une écriture refusée peut
  // réussir en silence. Sans relecture, l'écran afficherait un message envoyé
  // qui n'existe pas — c'est le défaut d'`insertMemorised`, déjà payé.
  if (error || !data) return null
  return versMessage(data)
}

/** Le fil d'un utilisateur, vu par un administrateur. La RLS l'y autorise. */
export async function getFilDe(userId: string): Promise<Message[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages').select(CHAMPS).eq('user_id', userId).order('createdAt', { ascending: true })
  if (error || !data) return []
  return data.map(versMessage)
}
