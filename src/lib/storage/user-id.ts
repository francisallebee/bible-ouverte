export async function getCurrentUserId(): Promise<string> {
  if (typeof window === 'undefined') return 'local'
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    if (data.user) return data.user.id
  } catch {}
  return 'local'
}
