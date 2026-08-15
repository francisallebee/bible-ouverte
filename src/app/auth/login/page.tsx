'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthCard, {
  AuthError, authButton, authInput, authLabel, authLink,
} from '@/components/auth/AuthCard'
import { useT } from '@/contexts/I18nContext'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState(searchParams.get('error') === 'suspended'
    ? t.authScreens.suspended
    : '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Vers /new-reading directement : `/` sert la page de présentation, dont le
    // middleware renverrait aussitôt quelqu'un de connecté.
    router.push('/new-reading')
    router.refresh()
  }

  return (
    <AuthCard title={t.authScreens.login} subtitle={t.authScreens.loginSubtitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className={authLabel}>{t.authScreens.email}</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            className={authInput}
          />
        </div>
        <div>
          <label htmlFor="login-password" className={authLabel}>{t.authScreens.password}</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={authInput}
          />
        </div>
        {error && <AuthError>{error}</AuthError>}
        <button type="submit" disabled={loading} className={authButton}>
          {loading ? t.authScreens.signingIn : t.authScreens.signIn}
        </button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-[14px] text-slate-500">
        {t.authScreens.noAccount}
        <Link href="/auth/signup" className={authLink}>{t.authScreens.createAccount}</Link>
      </p>
    </AuthCard>
  )
}
