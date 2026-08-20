/**
 * La messagerie : ce qu'un message doit respecter avant de partir.
 *
 * Un fil par utilisateur, entre lui et l'administration. `userId` désigne le
 * **propriétaire du fil**, jamais l'auteur : sur un message venu de
 * l'administration, c'est le destinataire. Voir
 * `20260820110000_messages.sql`, dont la RLS repose sur ce choix.
 */

export interface Message {
  id: number
  userId: string
  fromAdmin: boolean
  subject: string
  body: string
  sentByName: string
  readAt: string | null
  createdAt: string
}

/**
 * Les bornes.
 *
 * Le sujet tient sur une ligne de liste ; le corps est généreux mais fini —
 * une colonne `text` accepterait un mégaoctet, que la boîte de réception
 * afficherait tel quel et que le courriel emporterait.
 */
export const SUJET_MAX = 120
export const CORPS_MAX = 4000

export type DefautMessage = 'corpsVide' | 'sujetTropLong' | 'corpsTropLong' | 'sansDestinataire'

/**
 * Ce qui empêche un message de partir, ou `null`.
 *
 * Rend un **identifiant** et non une phrase : le libellé vit dans les
 * dictionnaires, comme les statuts de ticket et les provenances. Le sujet est
 * facultatif — un mot court n'a pas toujours de titre —, le corps ne l'est pas.
 */
export function validerMessage(
  brouillon: { subject: string; body: string },
  destinataires: readonly string[],
): DefautMessage | null {
  if (destinataires.length === 0) return 'sansDestinataire'
  if (!brouillon.body.trim()) return 'corpsVide'
  if (brouillon.subject.trim().length > SUJET_MAX) return 'sujetTropLong'
  if (brouillon.body.trim().length > CORPS_MAX) return 'corpsTropLong'
  return null
}

/**
 * L'aperçu d'un message dans une liste.
 *
 * Les sauts de ligne deviennent des espaces : une liste dont chaque entrée
 * fait trois lignes selon ce qu'on a tapé n'est plus une liste. La coupe se
 * fait **au mot** — couper « anniversaire » en « annive… » se lit mal.
 */
export function apercu(corps: string, max = 90): string {
  const plat = corps.replace(/\s+/g, ' ').trim()
  if (plat.length <= max) return plat
  const coupe = plat.slice(0, max)
  const dernierEspace = coupe.lastIndexOf(' ')
  return (dernierEspace > max * 0.6 ? coupe.slice(0, dernierEspace) : coupe) + '…'
}

/**
 * Les messages non lus, du point de vue de l'utilisateur.
 *
 * Seuls ceux venus de l'administration comptent : ses propres réponses portent
 * un `readAt` nul et gonfleraient la pastille de sa propre parole.
 */
export function compterNonLus(messages: readonly Message[]): number {
  return messages.filter((m) => m.fromAdmin && !m.readAt).length
}

/**
 * Le fil, du plus ancien au plus récent.
 *
 * Une conversation se lit dans l'ordre où elle s'est tenue, contrairement à
 * une liste de tickets. La comparaison porte sur la chaîne ISO, qui se trie
 * comme une date sans qu'on ait à la lire.
 */
export function ordonnerFil(messages: readonly Message[]): Message[] {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
