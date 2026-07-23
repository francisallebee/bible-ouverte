'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import LayoutClient from '@/lib/pwa/layout-client'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')

  if (isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-[#2a4f7a]">
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
