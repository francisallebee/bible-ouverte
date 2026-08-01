import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const supabase = createApiClient(request)
  const admin = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return errorResponse('Accès refusé', 403)

  // Auth users (emails, last_sign_in)
  const { data: authUsers } = await admin.auth.admin.listUsers()
  const authMap = new Map((authUsers?.users || []).map(au => [au.id, {
    email: au.email,
    lastSignIn: au.last_sign_in_at,
    createdAt: au.created_at,
  }]))

  // Profiles with data counts
  const { data: profiles } = await admin.from('profiles').select('*').order('created_at', { ascending: false })
  if (!profiles) return successResponse({ users: [], stats: {} })

  // Les comptages passent par `admin` (clé service_role) et non par `supabase`
  // (session de l'appelant) : la RLS filtrerait chaque requête sur les lignes de
  // l'administrateur lui-même, et le tableau afficherait 0 pour tout le monde
  // sauf lui.
  const countFor = async (table: string, userId: string) => {
    const { count } = await admin
      .from(table).select('*', { count: 'exact', head: true }).eq('user_id', userId)
    return count ?? 0
  }

  const enriched = await Promise.all((profiles || []).map(async (p) => {
    const [readings, plans, contexts] = await Promise.all([
      countFor('readings', p.id),
      countFor('plans', p.id),
      countFor('contexts', p.id),
    ])

    const authData = authMap.get(p.id)
    return {
      ...p,
      email: authData?.email ?? null,
      lastSignIn: authData?.lastSignIn ?? null,
      readings,
      plans,
      contexts,
    }
  }))

  // Global stats
  const countAll = async (table: string) => {
    const { count } = await admin.from(table).select('*', { count: 'exact', head: true })
    return count ?? 0
  }

  const [totalReadings, totalPlans, totalContexts, totalPlanDays] = await Promise.all([
    countAll('readings'),
    countAll('plans'),
    countAll('contexts'),
    countAll('plan_days'),
  ])
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
    },
  })
}
