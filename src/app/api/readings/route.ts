import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const supabase = createApiClient(request)
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const book = searchParams.get('book')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('readings')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (date) query = query.eq('date', date)
  if (book) query = query.eq('book', book)

  const { data, error } = await query
  if (error) return errorResponse(error.message)
  return successResponse(data)
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const body = await request.json()
  const supabase = createApiClient(request)

  const { data, error } = await supabase
    .from('readings')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) return errorResponse(error.message)
  return successResponse(data, 201)
}
