'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Conduit aux Réglages du profil un compte dont le prénom ou le nom manque.
 *
 * C'est le cas des 112 comptes créés avant le 20 août 2026, date à laquelle le
 * formulaire d'inscription a commencé à les demander. Contrairement au passage
 * obligé de la personnalisation, celui-ci n'a **pas** de date de coupure : il
 * vise précisément les comptes antérieurs.
 *
 * **Il redirige, il ne bloque pas**, et c'est délibéré — la même leçon que
 * `SetupGate`, dont ce composant reprend la forme. Un voile qui recouvre
 * l'application enferme un compte au moindre défaut de lecture ; une
 * redirection laisse repartir qui insiste, et le ramène à l'ouverture
 * suivante. `identiteManquante` vaut d'ailleurs `false` tant que le profil n'a
 * pas été lu : on ne déplace personne sur la foi d'une réponse qu'on n'a pas.
 *
 * L'information vient de `AuthContext`, où elle voyage avec `is_admin` dans la
 * requête qui existait déjà. Aucun appel réseau n'est ajouté.
 */
export default function ProfileGate() {
  const { user, identiteManquante } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    if (pathname === '/profil') return
    if (!identiteManquante) return
    router.push('/profil')
  }, [user, identiteManquante, pathname, router])

  return null
}
