const LAST_USER_KEY = 'bible-ouverte-last-user'

function getLastUserId(): string {
  if (typeof window === 'undefined') return 'local'
  try {
    return localStorage.getItem(LAST_USER_KEY) || 'local'
  } catch {
    return 'local'
  }
}

function setLastUserId(id: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LAST_USER_KEY, id)
  } catch {}
}

export async function getCurrentUserId(): Promise<string> {
  if (typeof window === 'undefined') return 'local'
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      setLastUserId(data.user.id)
      return data.user.id
    }
  } catch {}
  const last = getLastUserId()
  return last !== 'local' ? last : 'local'
}

export function clearLastUserId() {
  setLastUserId('local')
}
