import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Inviter quelqu'un à un plan **par son adresse**.
 *
 * C'est la seule chose que le navigateur ne peut pas faire : `profiles` est
 * verrouillé sur « son propre profil » depuis le 1er août 2026, et le rester
 * est le choix juste. Résoudre une adresse en compte demande donc la clé
 * service_role, donc une route.
 *
 * **La réponse ne dit jamais si l'adresse a un compte.** C'est délibéré : une
 * route qui répond « cette adresse n'est pas inscrite » est un test
 * d'existence, et permet à n'importe qui de savoir qui utilise
 * l'application. L'invitation est donc créée dans les deux cas — avec
 * `invited_user` renseigné si le compte existe, nul sinon — et la personne la
 * trouve en s'inscrivant, `private.rattacher_invitations()` faisant le
 * rapprochement. L'expéditeur reçoit le même message dans les deux cas, et le
 * lien qu'il peut transmettre lui-même.
 *
 * La barrière reste en base : l'insertion passe par la **session de
 * l'appelant**, pas par la clé service_role, si bien que la policy « un membre
 * invite » s'applique. La clé ne sert qu'à la résolution de l'adresse.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const body = await request.json().catch(() => null)
  const planId = Number(body?.planId)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!Number.isFinite(planId) || planId <= 0) return errorResponse('Plan manquant')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse('Adresse invalide')
  // S'inviter soi-même n'est pas une erreur du système, mais ce n'est pas une
  // invitation non plus : autant le dire tout de suite.
  if (email === user.email?.toLowerCase()) return errorResponse('C’est votre propre adresse')

  /*
    La résolution, et elle seule, emprunte la clé service_role.

    Par une fonction et non par un `select` sur `profiles` : cette table **n'a
    pas de colonne `email`** — vérifié sur la production le 30 septembre 2026,
    ses 18 colonnes n'en comprennent aucune. L'adresse ne vit que dans
    `auth.users`, que PostgREST n'expose pas. Un `.ilike('email', …)` sur
    `profiles` aurait échoué **sans rien dire** : `invited_user` serait resté
    nul pour tout le monde, chaque invitation par adresse aurait été traitée
    comme « pas de compte », et personne ne l'aurait jamais reçue.
  */
  const admin = createAdminClient()
  const { data: compte } = await admin.rpc('compte_par_courriel', { p_email: email })

  // L'insertion repasse par la session de l'appelant : c'est la policy
  // « un membre invite » qui décide s'il en a le droit, pas cette route.
  const supabase = createApiClient(request)
  const { data, error } = await supabase
    .from('plan_invitations')
    .insert({
      plan_id: planId,
      created_by: user.id,
      email,
      invited_user: (compte as string | null) ?? null,
    })
    .select('jeton')
    .single()

  if (error) return errorResponse(error.message, 403)

  // Le jeton est rendu pour que l'expéditeur puisse transmettre le lien
  // lui-même — c'est ce qui rattrape le cas où l'adresse n'a pas de compte.
  return successResponse({ jeton: (data as { jeton: string }).jeton })
}
