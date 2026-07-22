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
