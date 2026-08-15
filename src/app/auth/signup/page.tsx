'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { describePasswordProblems, PASSWORD_MIN_LENGTH } from '@/lib/auth/password'
import AuthCard, {
  AuthError, authButton, authHint, authInput, authLabel, authLink,
} from '@/components/auth/AuthCard'
import { useT } from '@/contexts/I18nContext'

export default function SignupPage() {
  const t = useT()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  // La page de présentation envoie l'adresse saisie dans son formulaire par un
  // GET sur /auth/signup?email=… — la reprendre évite de la retaper.
  //
  // Lu depuis `window` plutôt qu'avec `useSearchParams`, qui obligerait à
  // envelopper la page dans un <Suspense> pour que le build passe. La lecture a
  // lieu après le montage : le rendu serveur et le premier rendu client restent
  // identiques.
  useEffect(() => {
    const fromLanding = new URLSearchParams(window.location.search).get('email')
    if (fromLanding) setEmail(fromLanding)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string
    const name = form.get('name') as string

    // Le serveur applique les mêmes règles ; les vérifier ici évite un
    // aller-retour et affiche un message en français plutôt que l'erreur brute.
    const problem = describePasswordProblems(
      password,
      t.auth.passwordRules.labels,
      t.auth.passwordRules.sentence,
      t.auth.passwordRules.and,
    )
    if (problem) {
      setError(problem)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <AuthCard title={t.authScreens.accountCreated}>
        <div className="flex items-start gap-3.5 rounded-xl bg-[#e8faf0] p-4">
          <MailCheck className="mt-0.5 w-5 h-5 shrink-0 text-[#1f9254]" />
          <p className="text-[14px] leading-relaxed text-[#1a6b41]">
            {t.authScreens.mailSentBefore}
            <span className="font-semibold">{email || t.authScreens.yourAddress}</span>
            {t.authScreens.mailSentAfter}
          </p>
        </div>
        <Link href="/auth/login" className={`${authButton} mt-5`}>
          {t.authScreens.goToLogin}
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t.authScreens.signupTitle} subtitle={t.authScreens.signupSubtitle}>
      {/* Voir le commentaire de `auth/login` : sans `method`, une soumission
          non hydratée emporte le mot de passe dans l'URL. */}
      <form method="post" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className={authLabel}>{t.authScreens.firstName}</label>
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            spellCheck={false}
            required
            className={authInput}
          />
        </div>
        <div>
          <label htmlFor="signup-email" className={authLabel}>{t.authScreens.email}</label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInput}
          />
        </div>
        <div>
          <label htmlFor="password" className={authLabel}>{t.authScreens.password}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            aria-describedby="password-hint"
            className={authInput}
          />
          <p id="password-hint" className={authHint}>
            {t.profile.passwordHint(PASSWORD_MIN_LENGTH)}
          </p>
        </div>
        {error && <AuthError>{error}</AuthError>}
        <button type="submit" disabled={loading} className={authButton}>
          {loading ? t.authScreens.creating : t.authScreens.createButton}
        </button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-[14px] text-slate-500">
        {t.authScreens.haveAccount}
        <Link href="/auth/login" className={authLink}>{t.authScreens.signIn}</Link>
      </p>
    </AuthCard>
  )
}
