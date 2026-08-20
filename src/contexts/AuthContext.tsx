'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { clearUserCache } from '@/lib/supabase/store'
import { identiteComplete } from '@/lib/profil/identite'

type AuthContextType = {
  user: User | null
  loading: boolean
  isAdmin: boolean
  /**
   * Le prénom ou le nom manque — les 112 comptes d'avant le 20 août 2026 sont
   * dans ce cas.
   *
   * Il vient de la **même requête** que `is_admin`, à laquelle deux colonnes
   * ont été ajoutées : pas un aller-retour de plus. Un appel séparé aurait
   * aggravé la dette déjà documentée dans AGENTS.md — chaque écran
   * resynchronise déjà bien assez.
   *
   * `false` tant que rien n'est lu : on ne conduit personne nulle part sur la
   * foi d'un profil qu'on n'a pas encore vu.
   */
  identiteManquante: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  identiteManquante: false,
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [identiteManquante, setIdentiteManquante] = useState(false)

  const refreshUser = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, first_name, last_name')
        .eq('id', data.user.id)
        .single()
      setIsAdmin(!!profile?.is_admin)
      setIdentiteManquante(!!profile && !identiteComplete({
        firstName: profile.first_name, lastName: profile.last_name,
      }))
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
          .select('is_admin, first_name, last_name')
          .eq('id', data.user.id)
          .single()
        setIsAdmin(!!profile?.is_admin)
        setIdentiteManquante(!!profile && !identiteComplete({
          firstName: profile.first_name, lastName: profile.last_name,
        }))
      }
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN') {
        clearUserCache()
        if (session?.user) {
          supabase.from('profiles')
            .select('is_admin, first_name, last_name')
            .eq('id', session.user.id).single()
            .then(({ data }) => {
              setIsAdmin(!!data?.is_admin)
              setIdentiteManquante(!!data && !identiteComplete({
                firstName: data.first_name, lastName: data.last_name,
              }))
            })
        }
      }
      if (event === 'SIGNED_OUT') {
        setIsAdmin(false)
        setIdentiteManquante(false)
        clearUserCache()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, identiteManquante, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
