'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string
    const name = form.get('name') as string

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
      <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-[--primary] mb-4">Compte créé !</h1>
        <p className="text-gray-600 mb-6">
          Vérifie ta boîte mail pour confirmer ton adresse email.
        </p>
        <Link
          href="/auth/login"
          className="text-[--primary] font-medium hover:underline"
        >
          Aller à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8">
      <h1 className="text-2xl font-bold text-center text-[--primary] mb-6">Créer un compte</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
          <input
            name="name"
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[--primary]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[--primary]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[--primary]"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[--primary] text-white py-2 rounded-lg hover:bg-[--primary-hover] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Création...' : 'Créer le compte'}
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-gray-600">
        Déjà un compte ?{' '}
        <Link href="/auth/login" className="text-[--primary] font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
