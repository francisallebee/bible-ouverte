'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { clearUserCache } from '@/lib/supabase/store'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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
      }
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN') {
        clearUserCache()
        if (session?.user) {
          supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
            .then(({ data }) => setIsAdmin(!!data?.is_admin))
        }
      }
      if (event === 'SIGNED_OUT') {
        setIsAdmin(false)
        clearUserCache()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
