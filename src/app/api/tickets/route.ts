import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const supabase = createApiClient(request)
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return errorResponse(error.message)
  return successResponse(data)
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const body = await request.json()
  if (!body.title?.trim()) return errorResponse('Le titre est requis')

  const supabase = createApiClient(request)
  const { data, error } = await supabase
    .from('tickets')
    .insert({ title: body.title, description: body.description || '', category: body.category || 'bug', user_id: user.id })
    .select()
    .single()

  if (error) return errorResponse(error.message)
  return successResponse(data, 201)
}
