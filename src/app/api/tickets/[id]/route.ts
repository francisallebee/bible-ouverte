import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const supabase = createApiClient(request)
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error) return errorResponse(error.message, 404)
  return successResponse(data)
}
