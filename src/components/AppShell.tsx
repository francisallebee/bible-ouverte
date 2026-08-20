'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import AutoLogout from '@/components/AutoLogout'
import DiscoveryTour from '@/components/DiscoveryTour'
import SetupGate from '@/components/SetupGate'
import ProfileGate from '@/components/ProfileGate'
import Presence from '@/components/Presence'
import LayoutClient from '@/lib/pwa/layout-client'
import { getSettings, SETTINGS_CHANGED } from '@/lib/storage'
import { applyColorTheme, applyTheme, watchSystemTheme } from '@/lib/themes'
import { applyFonts } from '@/lib/fonts'
import { syncDeviceSubscription } from '@/lib/notifications'
import { APP_VERSION } from '@/lib/version'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')
  const isLanding = pathname === '/'

  // La page de présentation et les écrans d'authentification portent leur propre
  // palette et leur propre mise en page. Ils s'affichent donc tels quels, sans
  // barre latérale, sans conteneur centré et sans le thème enregistré : les
  // règles `html.dark` de globals.css visent `.bg-white` et `.text-gray-*` avec
  // des !important, et repeindraient leurs cartes.
  const isBare = isLanding || isAuthPage

  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState(0)
  const [hiddenPages, setHiddenPages] = useState<string[] | undefined>()

  useEffect(() => {
    if (isBare) {
      // `applyTheme` plutôt qu'un retrait direct de la classe : c'est lui qui
      // mémorise le mode courant, et l'écouteur système repeindrait sinon une
      // page nue restée en mode « système ».
      applyTheme('light')
      return
    }
    let cancelled = false
    const load = async () => {
      const s = await getSettings()
      if (cancelled) return
      if (s?.colorTheme) applyColorTheme(s.colorTheme, s.customColors)
      applyFonts({
        uiFont: s?.uiFont,
        readingFont: s?.readingFont,
        uiScale: s?.uiScale,
        readingSize: s?.readingSize,
        readingStyle: s?.readingStyle,
      })
      applyTheme(s?.theme)
      setAutoLogoutMinutes(s?.autoLogoutMinutes ?? 0)
      setHiddenPages(s?.hiddenPages)
      // Rattrapé ici et non dans l'écran des réglages : un appareil dont le
      // propriétaire n'ouvre jamais cet écran resterait sinon inconnu du
      // serveur, qui n'aurait personne à qui écrire.
      syncDeviceSubscription(s?.notificationsEnabled ?? false)
    }
    load()
    // Un réglage modifié doit prendre effet tout de suite, et non au prochain
    // chargement complet.
    window.addEventListener(SETTINGS_CHANGED, load)
    return () => {
      cancelled = true
      window.removeEventListener(SETTINGS_CHANGED, load)
    }
  }, [isBare])

  // Le système peut basculer jour/nuit pendant que l'application est ouverte.
  useEffect(() => watchSystemTheme(), [])

  if (isBare) return <>{children}</>

  return (
    <LayoutClient>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:text-[--primary] focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Aller au contenu
      </a>
      <Sidebar hiddenPages={hiddenPages} />
      <AutoLogout minutes={autoLogoutMinutes} />
      {/* Monté ici et non dans un écran : le parcours traverse l'application
          et doit survivre aux changements de page qu'il provoque lui-même. */}
      <DiscoveryTour />
      {/* Monté à côté du parcours, et pour la même raison : il conduit d'un
          écran à l'autre et doit survivre à la navigation qu'il provoque. */}
      <SetupGate />
      <ProfileGate />
      <Presence />
      <main id="main" className="lg:ml-[var(--nav-width)] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pt-24 lg:pt-10">
          {children}
        </div>
        {/* La barre latérale porte déjà la version, mais elle est repliée sur
            mobile : cette mention est la seule visible sans ouvrir le menu. */}
        <footer className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-center">
          <p className="text-xs text-[--text-secondary]">
            Bible Ouverte v{APP_VERSION}
          </p>
        </footer>
      </main>
    </LayoutClient>
  )
}
