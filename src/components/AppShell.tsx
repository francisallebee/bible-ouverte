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
      <main className="lg:ml-[var(--nav-width)] p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
        {children}
      </main>
    </LayoutClient>
  )
}
