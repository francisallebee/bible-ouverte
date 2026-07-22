import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const supabase = createApiClient(request)
  const { searchParams } = new URL(request.url)
  const planId = searchParams.get('plan_id')
  const date = searchParams.get('date')

  let query = supabase
    .from('plan_days')
    .select('*')
    .eq('user_id', user.id)
    .order('day', { ascending: true })

  if (planId) query = query.eq('plan_id', planId)
  if (date) query = query.eq('date', date)

  const { data, error } = await query
  if (error) return errorResponse(error.message)
  return successResponse(data)
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const body = await request.json()
  const supabase = createApiClient(request)

  const items = Array.isArray(body) ? body : [body]
  const withUserId = items.map(item => ({ ...item, user_id: user.id }))

  const { data, error } = await supabase
    .from('plan_days')
    .insert(withUserId)
    .select()

  if (error) return errorResponse(error.message)
  return successResponse(data, 201)
}
