import { type NextRequest } from 'next/server'
import { requireAdmin, errorResponse, successResponse } from '@/lib/supabase/api-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { validerMessage, SUJET_MAX, CORPS_MAX } from '@/lib/messages/messages'
import { journaliser } from '@/lib/admin/journal'

// Voir src/app/api/admin/users/route.ts : cette route lit la session de
// l'appelant, elle ne doit jamais être évaluée au moment du build.
export const dynamic = 'force-dynamic'

/**
 * L'envoi d'un message par l'administration.
 *
 * **Pourquoi une route et non un appel direct depuis le navigateur.** La
 * policy d'insertion de `messages` refuse `from_admin = true` à un compte
 * `authenticated`, quel qu'il soit — administrateur compris. C'est délibéré :
 * un message d'apparence officielle ne doit pas pouvoir naître d'un
 * navigateur, même de bonne foi. L'écriture passe donc par la clé
 * service_role, après vérification du drapeau côté serveur.
 *
 * La validation est celle de `lib/messages`, la même que celle de l'écran :
 * le navigateur ne fait pas foi, et un appel direct à cette route non plus.
 */
export async function POST(request: NextRequest) {
  const appelant = await requireAdmin(request)
  if (!appelant) return errorResponse('Accès refusé', 403)

  const corps = await request.json().catch(() => null)
  if (!corps) return errorResponse('Requête illisible')

  const sujet = typeof corps.subject === 'string' ? corps.subject.trim() : ''
  const texte = typeof corps.body === 'string' ? corps.body.trim() : ''
  const destinataires: string[] = Array.isArray(corps.userIds)
    ? corps.userIds.filter((v: unknown): v is string => typeof v === 'string')
    : []

  const defaut = validerMessage({ subject: sujet, body: texte }, destinataires)
  if (defaut) return errorResponse(defaut)

  const admin = createAdminClient()

  // Le nom de l'expéditeur est **figé dans la ligne**, et non lu par jointure :
  // il doit survivre à un changement de nom, et même à la suppression du compte
  // administrateur, sans que le fil devienne anonyme.
  const { data: profil } = await admin
    .from('profiles').select('name').eq('id', appelant.id).single()

  const lignes = destinataires.map((id) => ({
    user_id: id,
    from_admin: true,
    subject: sujet.slice(0, SUJET_MAX),
    body: texte.slice(0, CORPS_MAX),
    sent_by: appelant.id,
    sent_by_name: profil?.name ?? '',
  }))

  const { data, error } = await admin.from('messages').insert(lignes).select('id')
  if (error) return errorResponse(error.message)

  // `.select()` et non un simple insert : sous RLS, une écriture qui ne
  // correspond à rien réussit sans erreur. Ici la clé service_role passe outre,
  // mais lire ce qui a réellement été écrit reste la seule preuve.
  // Une seule ligne de journal pour tout l'envoi, et non une par destinataire :
  // un envoi groupé à 112 personnes noierait le journal sous 112 lignes
  // identiques, et c'est le geste qu'on veut retrouver, pas ses répétitions.
  await journaliser({
    actorId: appelant.id,
    actorName: profil?.name ?? '',
    targetId: destinataires.length === 1 ? destinataires[0] : null,
    targetName: '',
    action: 'message',
    details: { destinataires: destinataires.length, sujet: sujet.slice(0, SUJET_MAX) },
  })

  return successResponse({ envoyes: data?.length ?? 0 })
}
