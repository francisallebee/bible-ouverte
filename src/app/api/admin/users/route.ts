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

  const enriched = await Promise.all((profiles || []).map(async (p) => {
    const { count: readings } = await supabase
      .from('readings').select('*', { count: 'exact', head: true }).eq('user_id', p.id)
    const { count: plans } = await supabase
      .from('plans').select('*', { count: 'exact', head: true }).eq('user_id', p.id)
    const { count: contexts } = await supabase
      .from('contexts').select('*', { count: 'exact', head: true }).eq('user_id', p.id)

    const authData = authMap.get(p.id)
    return {
      ...p,
      email: authData?.email ?? null,
      lastSignIn: authData?.lastSignIn ?? null,
      readings: readings ?? 0,
      plans: plans ?? 0,
      contexts: contexts ?? 0,
    }
  }))

  // Global stats
  const { count: totalReadings } = await supabase.from('readings').select('*', { count: 'exact', head: true })
  const { count: totalPlans } = await supabase.from('plans').select('*', { count: 'exact', head: true })
  const { count: totalContexts } = await supabase.from('contexts').select('*', { count: 'exact', head: true })
  const { count: totalPlanDays } = await supabase.from('plan_days').select('*', { count: 'exact', head: true })
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
