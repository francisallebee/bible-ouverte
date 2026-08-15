'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Vestige de l'écran des contextes, retiré depuis. La route est gardée pour les
 * anciens signets, mais elle renvoyait jusqu'ici vers `/settings`, où il
 * n'existe aucune section contextes : la redirection ne menait nulle part.
 * Les contextes se choisissent et se créent depuis le sélecteur de l'écran de
 * saisie — c'est donc là qu'il faut atterrir.
 */
export default function OldContextsPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/new-reading') }, [router])
  return null
}
