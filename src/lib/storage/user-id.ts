const supabaseUserIdCache = { id: 'local' }

export async function getCurrentUserId(): Promise<string> {
  if (typeof window === 'undefined') return 'local'
  if (supabaseUserIdCache.id !== 'local') return supabaseUserIdCache.id
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      supabaseUserIdCache.id = data.user.id
      return data.user.id
    }
  } catch {}
  return 'local'
}

export function setCurrentUserId(id: string) {
  supabaseUserIdCache.id = id
}
