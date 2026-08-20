import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'

// Voir src/app/api/admin/users/route.ts : cette route lit la session de
// l'appelant, elle ne doit jamais être évaluée au moment du build.
export const dynamic = 'force-dynamic'

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
  // `first_name`, `last_name`, `city` et `discovery_source` depuis le 20 août
  // 2026. `is_admin` et `suspended` n'y sont pas et ne doivent jamais y être :
  // cette route parle avec la session de l'appelant, pas la clé service_role.
  const allowed = [
    'name', 'avatar_url', 'birth_date', 'phone', 'bio', 'social_links', 'color',
    'first_name', 'last_name', 'city', 'discovery_source',
  ]
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
