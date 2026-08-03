'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import LayoutClient from '@/lib/pwa/layout-client'
import { getSettings } from '@/lib/storage'
import { applyColorTheme } from '@/lib/themes'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')
  const isLanding = pathname === '/'

  useEffect(() => {
    // La page de présentation porte sa propre palette. Lui appliquer le thème
    // enregistré la repeindrait : les règles `html.dark` de globals.css visent
    // `.bg-white` et `.text-gray-*` avec des !important.
    if (isLanding) {
      document.documentElement.classList.remove('dark')
      return
    }
    (async () => {
      const s = await getSettings()
      if (s?.colorTheme) applyColorTheme(s.colorTheme)
      if (s?.theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    })()
  }, [isLanding])

  // Ni barre latérale ni conteneur centré : la landing gère sa mise en page sur
  // toute la largeur.
  if (isLanding) return <>{children}</>

  if (isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[--primary] to-[--primary-hover]">
        {children}
      </div>
    )
  }

  return (
    <LayoutClient>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:text-[--primary] focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Aller au contenu
      </a>
      <Sidebar />
      <main id="main" className="lg:ml-[var(--nav-width)] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pt-24 lg:pt-10">
          {children}
        </div>
      </main>
    </LayoutClient>
  )
}
