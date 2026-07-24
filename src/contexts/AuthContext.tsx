'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fullSync } from '@/lib/supabase/sync'
import type { User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  loading: boolean
  isAdmin: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  refreshUser: async () => {},
})

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine
}

function trySync() {
  if (isOnline()) {
    fullSync().catch(() => {})
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const synced = useRef(false)
  const syncTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshUser = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single()
      setIsAdmin(!!profile?.is_admin)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single()
        setIsAdmin(!!profile?.is_admin)
        if (!synced.current) {
          synced.current = true
          trySync()
        }
      }
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN') {
        synced.current = false
        trySync()
        if (session?.user) {
          supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
            .then(({ data }) => setIsAdmin(!!data?.is_admin))
        }
      }
      if (event === 'SIGNED_OUT') setIsAdmin(false)
    })

    const handleOnline = () => {
      synced.current = false
      trySync()
    }
    window.addEventListener('online', handleOnline)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isOnline()) {
        trySync()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Periodic sync every 30s while user is logged in
    syncTimer.current = setInterval(() => {
      if (isOnline()) {
        trySync()
      }
    }, 30000)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (syncTimer.current) clearInterval(syncTimer.current)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
