import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const supabase = createApiClient(request)
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return errorResponse('Accès refusé', 403)

  const admin = createAdminClient()
  const { data: tickets, error } = await admin
    .from('tickets')
    .select('*')
    .order('createdAt', { ascending: false })

  if (error) return errorResponse(error.message)
  return successResponse(tickets ?? [])
}

export async function PATCH(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const supabase = createApiClient(request)
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return errorResponse('Accès refusé', 403)

  const body = await request.json()
  if (!body.id) return errorResponse('ID ticket requis')

  const admin = createAdminClient()
  const updates: Record<string, any> = {}
  if (body.status) {
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(body.status)) {
      return errorResponse('Statut invalide')
    }
    updates.status = body.status
    updates.updatedAt = new Date().toISOString()
  }

  const { data, error } = await admin
    .from('tickets')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return errorResponse(error.message)
  return successResponse(data)
}
