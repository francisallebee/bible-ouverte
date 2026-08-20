import { createServerClient } from '@supabase/ssr'
import { type NextRequest } from 'next/server'

export function createApiClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )
}

export async function requireUser(request: NextRequest) {
  const supabase = createApiClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

export function successResponse(data: unknown, status = 200) {
  return Response.json({ data }, { status })
}

/**
 * L'appelant, s'il est administrateur — `null` sinon.
 *
 * Le drapeau est lu **avec la session de l'appelant**, jamais avec la clé
 * service_role : c'est ce qui fait de la RLS la barrière et non une politesse.
 * `is_admin` n'est modifiable que par le back-office (règle 2), donc lire sa
 * propre ligne suffit.
 *
 * Extrait le 20 août 2026, quand la troisième route en a eu besoin. Les deux
 * copies précédentes étaient identiques ; une troisième aurait fini par ne
 * plus l'être.
 */
export async function requireAdmin(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return null
  const supabase = createApiClient(request)
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return null
  return user
}
