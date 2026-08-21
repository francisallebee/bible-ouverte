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

  /**
   * Un courriel sans message dans l'application.
   *
   * La ligne est écrite comme les autres — c'est elle qui porte le texte, les
   * tentatives et `emailed_at` —, mais son `kind` la masque de la boîte du
   * destinataire, au niveau de la RLS et non d'une requête : le navigateur
   * parle directement à Supabase, et un filtre côté écran se contournerait
   * depuis la console. Voir `20260821150000_courriel_seul.sql`.
   */
  const courrielSeul = corps.emailOnly === true

  const defaut = validerMessage({ subject: sujet, body: texte }, destinataires)
  if (defaut) return errorResponse(defaut)

  const admin = createAdminClient()

  // Le nom de l'expéditeur est **figé dans la ligne**, et non lu par jointure :
  // il doit survivre à un changement de nom, et même à la suppression du compte
  // administrateur, sans que le fil devienne anonyme.
  const { data: profil } = await admin
    .from('profiles').select('name').eq('id', appelant.id).single()

  /**
   * Le nom du destinataire est figé lui aussi, et pour la raison qui a fait
   * figer celui de l'expéditeur : un journal d'audit doit rester lisible après
   * la suppression du compte auquel il se rapporte — c'est même pourquoi
   * `admin_actions.target_id` n'a aucune clé étrangère.
   *
   * Il ne se lit que pour un envoi à **une seule** personne : un envoi groupé
   * n'a pas de cible unique, et le journal en rend compte par son nombre.
   *
   * Sans cela, `targetName` restait la chaîne vide en dur, et le journal
   * affichait « a écrit à » suivi de rien — vu à l'écran le 21 août 2026.
   */
  let nomCible = ''
  if (destinataires.length === 1) {
    const { data: cible } = await admin
      .from('profiles').select('name').eq('id', destinataires[0]).single()
    nomCible = cible?.name ?? ''
  }

  const lignes = destinataires.map((id) => ({
    user_id: id,
    from_admin: true,
    kind: courrielSeul ? 'courriel' : null,
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
    targetName: nomCible,
    action: 'message',
    details: { destinataires: destinataires.length, sujet: sujet.slice(0, SUJET_MAX), courrielSeul },
  })

  /**
   * Le courriel part **maintenant**, et non au prochain quart d'heure.
   *
   * `declencher_envoi_messages()` rejoue la commande du planificateur à
   * l'intérieur de la base : ni l'URL ni `NOTIFY_CRON_SECRET` n'ont à exister
   * du côté de Vercel. Voir `20260821140000_envoi_immediat.sql`.
   *
   * **L'échec n'est pas remonté à l'appelant, et c'est délibéré.** Le message
   * est écrit — c'est ce que l'administrateur a demandé, et c'est fait. Si
   * l'appel immédiat échoue, `emailed_at` reste nul et le cron reprend l'envoi
   * au passage suivant : rendre une erreur ferait croire à un échec là où il
   * n'y a qu'un délai.
   */
  const { error: echecEnvoi } = await admin.rpc('declencher_envoi_messages')
  if (echecEnvoi) console.error('envoi immédiat impossible, le cron prendra le relais :', echecEnvoi.message)

  return successResponse({ envoyes: data?.length ?? 0 })
}
