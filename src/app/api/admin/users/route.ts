import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const supabase = createApiClient(request)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return errorResponse('Accès refusé', 403)

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return errorResponse(error.message)

  const enriched = await Promise.all((users || []).map(async (u) => {
    const { count: readings } = await supabase
      .from('readings').select('*', { count: 'exact', head: true }).eq('user_id', u.id)
    const { count: plans } = await supabase
      .from('plans').select('*', { count: 'exact', head: true }).eq('user_id', u.id)
    const { count: contexts } = await supabase
      .from('contexts').select('*', { count: 'exact', head: true }).eq('user_id', u.id)

    return { ...u, readings: readings ?? 0, plans: plans ?? 0, contexts: contexts ?? 0 }
  }))

  return successResponse(enriched)
}
