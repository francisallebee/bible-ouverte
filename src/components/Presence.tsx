'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { signalerPresence, INTERVALLE_PING_MS } from '@/lib/presence'

/**
 * Donne signe de vie, pour que l'administration sache qui est là.
 *
 * N'affiche rien, comme `SetupGate` et `ProfileGate`. Trois déclencheurs, et
 * chacun couvre un cas que les autres manquent :
 *
 * - **au montage**, pour l'ouverture de l'application ;
 * - **à intervalle**, pour la personne qui lit sans rien cliquer — c'est le cas
 *   le plus fréquent ici, l'application servant à lire ;
 * - **au retour au premier plan**, parce qu'un onglet caché voit ses minuteries
 *   ralenties par le navigateur, jusqu'à une par minute et parfois moins.
 *
 * L'écriture elle-même est bornée par `signalerPresence`, qui ne part qu'une
 * fois par intervalle quoi qu'il arrive : ces trois déclencheurs peuvent donc
 * se chevaucher sans multiplier les requêtes.
 *
 * On ne signale rien tant que la page est cachée : quelqu'un dont l'onglet
 * dort en arrière-plan n'est pas devant l'application.
 */
export default function Presence() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return
    const id = user.id

    const signaler = () => {
      if (document.visibilityState !== 'visible') return
      void signalerPresence(id)
    }

    signaler()
    const minuterie = setInterval(signaler, INTERVALLE_PING_MS)
    window.addEventListener('focus', signaler)
    document.addEventListener('visibilitychange', signaler)

    return () => {
      clearInterval(minuterie)
      window.removeEventListener('focus', signaler)
      document.removeEventListener('visibilitychange', signaler)
    }
  }, [user?.id])

  return null
}
