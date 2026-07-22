'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
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

function trySync() {
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    fullSync().catch(() => {})
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const synced = useRef(false)

  const refreshUser = async () => {
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
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
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
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN') {
        trySync()
        if (session?.user) {
          supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
            .then(({ data }) => setIsAdmin(!!data?.is_admin))
        }
      }
      if (event === 'SIGNED_OUT') setIsAdmin(false)
    })

    const handleOnline = () => trySync()
    window.addEventListener('online', handleOnline)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
