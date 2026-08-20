import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Le journal des actions d'administration.
 *
 * Les identifiants sont **stables et non traduits** : ils partent en base et
 * se lisent dans les dictionnaires à l'affichage, comme les statuts de ticket,
 * les contextes système et les provenances.
 */
export const ACTIONS_ADMIN = [
  'promote', 'demote', 'suspend', 'reactivate', 'delete_account', 'message',
] as const

export type ActionAdmin = (typeof ACTIONS_ADMIN)[number]

export interface LigneJournal {
  id: number
  actorName: string
  targetId: string | null
  targetName: string
  action: string
  details: Record<string, unknown>
  createdAt: string
}

/**
 * Ce qu'un `PATCH` a réellement changé.
 *
 * Le corps de la requête dit ce qui est demandé, pas ce qui bouge : une
 * suspension demandée sur un compte déjà suspendu ne change rien, et
 * l'inscrire au journal donnerait une trace de quelque chose qui n'a pas eu
 * lieu. On compare donc à l'état d'avant.
 *
 * Deux drapeaux peuvent bouger dans le même appel : la fonction rend une
 * **liste**, jamais une action unique.
 */
export function actionsDuPatch(
  demande: { is_admin?: unknown; suspended?: unknown },
  avant: { is_admin: boolean; suspended: boolean },
): ActionAdmin[] {
  const actions: ActionAdmin[] = []
  if (typeof demande.is_admin === 'boolean' && demande.is_admin !== avant.is_admin) {
    actions.push(demande.is_admin ? 'promote' : 'demote')
  }
  if (typeof demande.suspended === 'boolean' && demande.suspended !== avant.suspended) {
    actions.push(demande.suspended ? 'suspend' : 'reactivate')
  }
  return actions
}

/**
 * Écrit une ligne de journal. **Ne lève jamais.**
 *
 * Une action réussie dont la trace échoue reste une action réussie : faire
 * échouer la route reviendrait à annuler une suspension parce qu'on n'a pas su
 * l'écrire. L'échec part dans les journaux du serveur, où il se voit sans
 * casser l'écran — c'est le compromis inverse de celui de l'alerte
 * d'inscription, où la trace protège d'un doublon et mérite un 502.
 */
export async function journaliser(entree: {
  actorId: string
  actorName: string
  targetId: string | null
  targetName: string
  action: ActionAdmin
  details?: Record<string, unknown>
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('admin_actions').insert({
      actor_id: entree.actorId,
      actor_name: entree.actorName,
      target_id: entree.targetId,
      target_name: entree.targetName,
      action: entree.action,
      details: entree.details ?? {},
    })
    if (error) console.error('journal admin', entree.action, error.message)
  } catch (e) {
    console.error('journal admin', entree.action, e)
  }
}
