import { type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { requireAdmin, errorResponse, successResponse } from '@/lib/supabase/api-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { banActif } from '@/lib/admin/utilisateurs'

// Sans cela, Next exécute le handler pendant `next build` pour décider s'il est
// statique. `createAdminClient()` lève alors une exception là où les variables
// Supabase sont absentes (les previews Vercel), et le build échoue.
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const appelant = await requireAdmin(request)
  if (!appelant) return errorResponse('Accès refusé', 403)

  const admin = createAdminClient()

  // Auth users (emails, last_sign_in)
  //
  // `listUsers()` sans argument s'en remet à la pagination par défaut de
  // GoTrue : une seule page. Les comptes au-delà n'avaient alors ni adresse ni
  // date de connexion — colonne « — » et « Jamais » dans le tableau, et un
  // compte des actifs sur 7 jours faussé d'autant. On parcourt les pages
  // jusqu'à en recevoir une incomplète.
  const authUsers: User[] = []
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return errorResponse(error.message)
    const batch = data?.users ?? []
    authUsers.push(...batch)
    if (batch.length < 200) break
  }

  const authMap = new Map(authUsers.map(au => [au.id, {
    email: au.email,
    lastSignIn: au.last_sign_in_at,
    createdAt: au.created_at,
    // `banned_until` est ce qui empêche réellement de se connecter ;
    // `profiles.suspended` n'en est que le miroir. Voir `banActif`.
    bannedUntil: (au as unknown as { banned_until?: string | null }).banned_until ?? null,
  }]))

  // Profiles with data counts
  const { data: profiles } = await admin.from('profiles').select('*').order('created_at', { ascending: false })
  if (!profiles) return successResponse({ users: [], stats: {} })

  // Les comptages passent par `admin` (clé service_role) et non par `supabase`
  // (session de l'appelant) : la RLS filtrerait chaque requête sur les lignes de
  // l'administrateur lui-même, et le tableau afficherait 0 pour tout le monde
  // sauf lui.
  //
  // Ils tenaient auparavant en une requête par ligne et par table — 111 profils
  // fois trois tables, soit 333 allers-retours PostgREST, plus quatre pour les
  // totaux. Mesuré au navigateur le 18 août 2026 : la route mettait de 19 à 94
  // secondes à répondre. Sur Vercel, la fonction dépasse son délai maximum et
  // rend un 504 : le tableau ne se rafraîchit jamais, et une action qui a bel
  // et bien réussi paraît sans effet.
  //
  // On lit désormais la seule colonne `user_id` et on compte en mémoire : une
  // requête par table, quelques milliers de lignes. `range()` parce que
  // PostgREST plafonne une réponse à 1000 lignes — sans lui, les comptages
  // seraient silencieusement tronqués dès que la table dépasse ce seuil.
  const PAGE = 1000

  const countByUser = async (table: string) => {
    const parUtilisateur = new Map<string, number>()
    let total = 0
    for (let debut = 0; ; debut += PAGE) {
      const { data, error } = await admin
        .from(table).select('user_id').range(debut, debut + PAGE - 1)
      if (error) throw new Error(`${table} : ${error.message}`)
      for (const ligne of data ?? []) {
        total++
        if (!ligne.user_id) continue
        parUtilisateur.set(ligne.user_id, (parUtilisateur.get(ligne.user_id) ?? 0) + 1)
      }
      if ((data?.length ?? 0) < PAGE) break
    }
    return { parUtilisateur, total }
  }

  let readingsBy, plansBy, contextsBy, totalPlanDays
  try {
    const [r, pl, c, jours] = await Promise.all([
      countByUser('readings'),
      countByUser('plans'),
      countByUser('contexts'),
      admin.from('plan_days').select('*', { count: 'exact', head: true }),
    ])
    readingsBy = r; plansBy = pl; contextsBy = c
    totalPlanDays = jours.count ?? 0
  } catch (e: any) {
    return errorResponse(e?.message || 'Comptage impossible')
  }

  const enriched = profiles.map((p) => {
    const authData = authMap.get(p.id)
    return {
      ...p,
      email: authData?.email ?? null,
      lastSignIn: authData?.lastSignIn ?? null,
      // Le signe de vie, écrit par le navigateur. C'est lui — et non
      // `lastSignIn` — qui dit la présence : voir `lib/presence.ts`.
      lastSeen: (p as { last_seen_at?: string | null }).last_seen_at ?? null,
      // Les deux sources sont croisées : mieux vaut annoncer une suspension qui
      // n'a plus d'effet que de laisser passer pour libre quelqu'un qui ne peut
      // plus entrer.
      suspended: !!p.suspended || banActif(authData?.bannedUntil),
      readings: readingsBy.parUtilisateur.get(p.id) ?? 0,
      plans: plansBy.parUtilisateur.get(p.id) ?? 0,
      contexts: contextsBy.parUtilisateur.get(p.id) ?? 0,
    }
  })

  const totalReadings = readingsBy.total
  const totalPlans = plansBy.total
  const totalContexts = contextsBy.total
  const activeUsers = enriched.filter(u => u.lastSignIn && new Date(u.lastSignIn) > new Date(Date.now() - 7 * 86400000)).length

  return successResponse({
    users: enriched,
    stats: {
      totalUsers: enriched.length,
      activeUsers,
      totalReadings,
      totalPlans,
      totalPlanDays,
      totalContexts,
      admins: enriched.filter(u => u.is_admin).length,
      // Compté **ici**, sur les lignes que cette route s'apprête à rendre.
      // C'est l'observable qui départage un défaut de route d'un défaut
      // d'affichage : si cette carte annonce 1 quand le filtre du navigateur
      // compte 0, les deux ne regardent pas le même tableau.
      suspended: enriched.filter(u => u.suspended).length,
    },
  })
}
