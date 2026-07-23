import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const supabase = createApiClient(request)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return errorResponse(error.message, 404)
  return successResponse(data)
}

export async function PATCH(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const body = await request.json()
  const allowed = ['name', 'avatar_url', 'birth_date', 'phone', 'bio', 'social_links', 'color']
  const updates: Record<string, any> = {}

  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) return errorResponse('Aucune donnée à mettre à jour')

  const supabase = createApiClient(request)
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return errorResponse(error.message)
  return successResponse(data)
}
