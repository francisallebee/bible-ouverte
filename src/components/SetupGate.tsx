'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getSettings, SETTINGS_CHANGED } from '@/lib/storage'
import type { AppSettings } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'
import { shouldForceSetup } from '@/lib/setup'

/**
 * Conduit un nouveau compte aux Réglages, une fois.
 *
 * Il n'affiche rien : il redirige, puis s'efface. L'écran Réglages porte
 * lui-même l'explication et le bouton qui clôt le passage — c'est là que la
 * personnalisation se fait, l'y annoncer ailleurs ferait deux endroits à tenir.
 *
 * La redirection est délibérément la seule contrainte : aucune page n'est
 * bloquée, aucun voile ne recouvre l'application. Quelqu'un qui insiste peut
 * repartir ailleurs, et il retombera ici à sa prochaine ouverture — tant que
 * la personnalisation n'est pas validée. Un blocage dur aurait enfermé un
 * compte au moindre défaut de chargement des réglages.
 */
export default function SetupGate() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [reglages, setReglages] = useState<AppSettings | null>(null)

  useEffect(() => {
    let annule = false
    const lire = async () => {
      const s = await getSettings()
      if (!annule) setReglages(s ?? null)
    }
    lire()
    window.addEventListener(SETTINGS_CHANGED, lire)
    return () => {
      annule = true
      window.removeEventListener(SETTINGS_CHANGED, lire)
    }
  }, [])

  useEffect(() => {
    if (pathname === '/settings') return
    if (!shouldForceSetup(user?.created_at, reglages)) return
    router.push('/settings')
  }, [user?.created_at, reglages, pathname, router])

  return null
}
