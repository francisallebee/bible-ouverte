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

  useEffect(() => {
    (async () => {
      const s = await getSettings()
      if (s?.colorTheme) applyColorTheme(s.colorTheme)
      if (s?.theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    })()
  }, [])

  if (isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[--primary] to-[--primary-hover]">
        {children}
      </div>
    )
  }

  return (
    <LayoutClient>
      <Sidebar />
      <main className="lg:ml-[var(--nav-width)] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pt-24 lg:pt-10">
          {children}
        </div>
      </main>
    </LayoutClient>
  )
}
