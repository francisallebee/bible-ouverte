'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Recharge les données quand on revient sur l'écran.
 *
 * **Le défaut qu'il corrige, mesuré le 20 août 2026.** Un administrateur
 * suspend un compte depuis sa fiche, revient à la liste — et la liste le donne
 * toujours pour actif, le filtre « Suspendus » comptant zéro. Les deux écrans
 * lisent pourtant la même colonne, par la même clé service_role : la base
 * disait bien `suspended = true`. Ce n'était donc pas les données.
 *
 * C'est le **cache de segments du routeur** de l'App Router : revenir sur une
 * route déjà visitée ne remonte pas son composant. Un `useEffect(..., [])` ne
 * repart alors jamais, et l'état local reste celui d'avant l'action. Rien ne le
 * signale — l'écran affiche un état cohérent, seulement périmé, ce qui est pire
 * qu'une erreur.
 *
 * Deux déclencheurs, parce qu'ils couvrent des cas différents :
 *
 * - **le retour sur la route**, qui attrape l'aller-retour vers une fiche ;
 * - **le retour au premier plan**, qui attrape l'onglet laissé de côté, le
 *   téléphone reverrouillé, et l'action faite depuis un autre appareil.
 *
 * `recharger` doit être stable — un `useCallback` — sans quoi chaque rendu
 * relancerait l'effet, et l'effet un rendu.
 */
export function useRechargeALaVisite(recharger: () => void, route: string): void {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== route) return
    recharger()
  }, [pathname, route, recharger])

  useEffect(() => {
    const auRetour = () => {
      if (document.visibilityState === 'visible') recharger()
    }
    window.addEventListener('focus', auRetour)
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      window.removeEventListener('focus', auRetour)
      document.removeEventListener('visibilitychange', auRetour)
    }
  }, [recharger])
}
