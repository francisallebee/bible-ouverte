import { createClient } from '@/lib/supabase/client'
import type { InvitationVue, PlanInvitation, PlanMembre } from '@/lib/storage/types'

/**
 * Le partage d'un plan de lecture, côté navigateur.
 *
 * **Tout passe par des fonctions de la base, jamais par une table.** Ce n'est
 * pas un détour : `plan_invitations` n'a aucune policy de `select` pour
 * l'invité, et ce serait impossible autrement — une policy « lisible si on
 * connaît le jeton » n'existe pas, PostgREST appliquant le filtre **après** la
 * policy, si bien qu'un `select *` rendrait tous les jetons de la table. Le
 * jeton est une capacité, pas un critère de recherche.
 *
 * Les six fonctions sont en `security definer` et portent chacune leur propre
 * contrôle : c'est là qu'est la barrière, pas ici. Ce module ne fait que les
 * appeler et traduire leurs erreurs.
 *
 * Le schéma et son éprouvé sont décrits dans `supabase/README.md`, section
 * « Les plans partagés ».
 */

/** Les erreurs que les fonctions lèvent, reconnues pour être traduites. */
export type EchecInvitation =
  | 'introuvable' | 'expiree' | 'deja-traitee' | 'pas-pour-vous' | 'inconnu'

function classer(message: string): EchecInvitation {
  if (message.includes('introuvable')) return 'introuvable'
  if (message.includes('expirée')) return 'expiree'
  if (message.includes('déjà traitée')) return 'deja-traitee'
  if (message.includes('quelqu')) return 'pas-pour-vous'
  return 'inconnu'
}

export class ErreurInvitation extends Error {
  constructor(readonly cause: EchecInvitation) {
    super(cause)
    this.name = 'ErreurInvitation'
  }
}

/**
 * Ce qu'un invité voit avant de décider.
 *
 * Appelable **sans session** : c'est ce qui permet de dire « Marie vous invite
 * à suivre *Les Évangiles en 90 jours* » à quelqu'un qui n'a pas de compte, et
 * donc de lui donner une raison de s'inscrire plutôt qu'un mur de connexion.
 */
export async function lireInvitation(jeton: string): Promise<InvitationVue | null> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('invitation_par_jeton', { p_jeton: jeton })
  if (error) {
    console.warn('invitation_par_jeton:', error.message)
    return null
  }
  const ligne = (data as Record<string, unknown>[] | null)?.[0]
  if (!ligne) return null
  return {
    planNom: String(ligne.plan_nom ?? ''),
    invitePar: String(ligne.invite_par ?? ''),
    statut: ligne.statut as InvitationVue['statut'],
    expiree: Boolean(ligne.expiree),
    dejaMembre: Boolean(ligne.deja_membre),
    nominative: Boolean(ligne.nominative),
  }
}

/** Rejoint le plan. Rend son identifiant, pour y emmener aussitôt. */
export async function accepterInvitation(jeton: string): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('accepter_invitation', { p_jeton: jeton })
  if (error) throw new ErreurInvitation(classer(error.message))
  return Number(data)
}

/**
 * Refuse une invitation **nominative**.
 *
 * Un lien ouvert ne se refuse pas : le refuser le fermerait pour tous ceux qui
 * l'ont reçu. La fonction lève, et l'écran n'affiche donc le bouton que sur
 * une invitation qui porte un destinataire.
 */
export async function refuserInvitation(jeton: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('refuser_invitation', { p_jeton: jeton })
  if (error) throw new ErreurInvitation(classer(error.message))
}

/** Crée un lien ouvert : à qui veut, tant qu'il n'a pas expiré. */
export async function creerLien(planId: number): Promise<string | null> {
  const supabase = createClient()
  const { data: session } = await supabase.auth.getUser()
  const uid = session.user?.id
  if (!uid) return null

  const { data, error } = await supabase
    .from('plan_invitations')
    .insert({ plan_id: planId, created_by: uid })
    .select('jeton')
    .single()
  if (error) {
    console.warn('creerLien:', error.message)
    return null
  }
  return (data as { jeton: string }).jeton
}

/** Les invitations d'un plan que l'on a soi-même émises. */
export async function invitationsDuPlan(planId: number): Promise<PlanInvitation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('plan_invitations')
    .select('id, plan_id, jeton, email, statut, createdAt, expiresAt')
    .eq('plan_id', planId)
    .order('id', { ascending: false })
  if (error) {
    console.warn('invitationsDuPlan:', error.message)
    return []
  }
  return (data as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    planId: Number(r.plan_id),
    jeton: String(r.jeton),
    email: (r.email as string) ?? undefined,
    statut: r.statut as PlanInvitation['statut'],
    createdAt: String(r.createdAt),
    expiresAt: String(r.expiresAt),
  }))
}

/**
 * Les invitations **reçues** et encore en attente.
 *
 * Seules les nominatives paraissent ici : un lien ouvert n'est adressé à
 * personne, et n'a donc aucune raison d'attendre dans une boîte.
 */
export async function mesInvitations(): Promise<(PlanInvitation & { planNom: string })[]> {
  const supabase = createClient()
  const { data: session } = await supabase.auth.getUser()
  const uid = session.user?.id
  if (!uid) return []

  const { data, error } = await supabase
    .from('plan_invitations')
    .select('id, plan_id, jeton, email, statut, createdAt, expiresAt, plans(name)')
    .eq('invited_user', uid)
    .eq('statut', 'en_attente')
    .order('id', { ascending: false })
  if (error) {
    console.warn('mesInvitations:', error.message)
    return []
  }
  return (data as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    planId: Number(r.plan_id),
    jeton: String(r.jeton),
    email: (r.email as string) ?? undefined,
    statut: r.statut as PlanInvitation['statut'],
    createdAt: String(r.createdAt),
    expiresAt: String(r.expiresAt),
    // La jointure rend un objet ou un tableau selon la cardinalité déduite ;
    // les deux formes sont acceptées plutôt que supposées.
    planNom: String(
      (Array.isArray(r.plans) ? r.plans[0]?.name : (r.plans as { name?: string })?.name) ?? '',
    ),
  }))
}

/** Retire une invitation avant qu'elle ne soit acceptée. */
export async function revoquerInvitation(id: number): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('plan_invitations')
    .update({ statut: 'revoquee' })
    .eq('id', id)
  if (error) {
    console.warn('revoquerInvitation:', error.message)
    return false
  }
  return true
}

/**
 * Qui est dans le plan, **par leur nom**.
 *
 * Par une fonction et non par une jointure : `profiles` reste verrouillé sur
 * « son propre profil » depuis le 1er août 2026, et une policy ne sait pas se
 * restreindre à deux colonnes — l'ouvrir aux co-membres leur donnerait la
 * ville, la date de naissance et `is_admin`.
 */
export async function membresDuPlan(planId: number): Promise<PlanMembre[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('membres_du_plan', { p_plan_id: planId })
  if (error) {
    console.warn('membres_du_plan:', error.message)
    return []
  }
  return (data as Record<string, unknown>[]).map((r) => ({
    userId: String(r.user_id),
    nom: String(r.nom ?? ''),
    role: r.role as PlanMembre['role'],
    joinedAt: String(r.joinedAt ?? ''),
  }))
}

/** Sortir d'un plan rejoint. Le créateur ne peut pas quitter le sien. */
export async function quitterPlan(planId: number): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.rpc('quitter_plan', { p_plan_id: planId })
  if (error) {
    console.warn('quitter_plan:', error.message)
    return false
  }
  return true
}

/**
 * L'adresse d'un lien d'invitation.
 *
 * Construite depuis `window.location.origin` et non depuis une constante : le
 * même code sert en développement, en preview Vercel et en production, et une
 * URL figée aurait envoyé les invités de production vers `localhost`.
 */
export function lienDInvitation(jeton: string): string {
  const base = typeof window === 'undefined' ? '' : window.location.origin
  return `${base}/invitation/${jeton}`
}
