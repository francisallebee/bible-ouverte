'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { autoLogoutState } from '@/lib/auto-logout'
import { useT } from '@/contexts/I18nContext'

/**
 * Déconnecte après une période sans activité, en prévenant une minute avant.
 *
 * L'avertissement n'est pas un ornement : une saisie de Nouvelle lecture —
 * notes, photos, enregistrement audio — vit entièrement dans l'état du
 * composant, et une coupure silencieuse la perdrait sans recours.
 *
 * Le retour sur l'onglet ne compte volontairement pas comme une activité : la
 * personne qui revient devant un appareil laissé sans surveillance n'est pas
 * forcément celle qui l'a quitté, et c'est précisément ce cas que ce réglage
 * couvre.
 */
export default function AutoLogout({ minutes }: { minutes: number }) {
  const t = useT()
  const router = useRouter()
  const [remaining, setRemaining] = useState<number | null>(null)
  const lastActivity = useRef(Date.now())
  const signingOut = useRef(false)

  const warning = remaining !== null

  const signOut = useCallback(async () => {
    if (signingOut.current) return
    signingOut.current = true
    try {
      await createClient().auth.signOut()
    } catch {
      // Même si Supabase ne répond pas, l'écran doit quitter la session.
    }
    router.push('/auth/login')
    router.refresh()
  }, [router])

  // Pendant l'avertissement, l'activité ne réarme plus rien : seul le bouton
  // « Je suis là » relance le compteur. Sinon un simple mouvement sous la
  // fenêtre la ferait disparaître sans que personne ne l'ait lue.
  useEffect(() => {
    if (!minutes || warning) return
    const touch = () => { lastActivity.current = Date.now() }
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart']
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, touch))
  }, [minutes, warning])

  useEffect(() => {
    if (!minutes) {
      setRemaining(null)
      return
    }
    // L'état se recalcule à chaque tour à partir de l'horloge plutôt que par
    // décrément : un onglet en arrière-plan voit ses minuteurs ralentis, et un
    // décompte ne retrouverait jamais l'heure réelle.
    const id = setInterval(() => {
      const state = autoLogoutState(minutes, lastActivity.current, Date.now())
      if (state.kind === 'expired') signOut()
      else setRemaining(state.kind === 'warning' ? state.seconds : null)
    }, 1000)
    return () => clearInterval(id)
  }, [minutes, signOut])

  if (!warning) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="auto-logout-titre"
        className="relative w-full max-w-sm bg-[--surface] rounded-2xl border border-[--border] shadow-xl p-6 text-center">
        <span className="w-12 h-12 bg-[--primary-light] rounded-xl flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-[--primary]" />
        </span>
        <h2 id="auto-logout-titre" className="text-lg font-semibold text-[--text]">
          {t.components.stillThere}
        </h2>
        <p className="text-sm text-[--text-secondary] mt-2">
          {t.components.sessionClosingBefore}
          <span className="font-semibold text-[--text]" aria-live="polite">
            {t.components.seconds(remaining!)}
          </span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button type="button" onClick={signOut}
            className="flex-1 border border-[--border] rounded-lg px-4 py-2.5 text-sm text-[--text] hover:bg-gray-50 transition-colors">
            {t.components.signOutNow}
          </button>
          <button type="button" autoFocus
            onClick={() => { lastActivity.current = Date.now(); setRemaining(null) }}
            className="flex-1 bg-[--primary] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[--primary-hover] transition-colors">
            {t.components.stayHere}
          </button>
        </div>
      </div>
    </div>
  )
}
