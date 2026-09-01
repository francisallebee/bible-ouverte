'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthCard from '@/components/auth/AuthCard'
import { useT } from '@/contexts/I18nContext'

export default function AuthCallbackPage() {
  const t = useT()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      // Vers `/` : le middleware y lit la page d'accueil choisie. Autrefois
      // le middleware renverrait aussitôt quelqu'un de connecté.
      if (event === 'SIGNED_IN') {
        router.push('/')
      }
    })
  }, [router])

  return (
    <AuthCard title={t.authScreens.confirming}>
      <div className="flex items-center gap-3.5 text-[14px] text-slate-500">
        <Loader2 className="w-5 h-5 shrink-0 animate-spin text-[#1e3a5f]" />
        <p>{t.authScreens.confirmingHint}</p>
      </div>
    </AuthCard>
  )
}
