'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthCard from '@/components/auth/AuthCard'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      // Vers /new-reading directement : `/` sert la page de présentation, dont
      // le middleware renverrait aussitôt quelqu'un de connecté.
      if (event === 'SIGNED_IN') {
        router.push('/new-reading')
      }
    })
  }, [router])

  return (
    <AuthCard title="Confirmation en cours">
      <div className="flex items-center gap-3.5 text-[14px] text-slate-500">
        <Loader2 className="w-5 h-5 shrink-0 animate-spin text-[#1e3a5f]" />
        <p>Ton adresse est en train d&apos;être vérifiée. Encore un instant.</p>
      </div>
    </AuthCard>
  )
}
