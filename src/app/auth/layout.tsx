'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AuthBackground from '@/components/auth/AuthBackground'
import { useT } from '@/contexts/I18nContext'

/**
 * Composant client, et non serveur comme il l'était.
 *
 * Il porte deux textes visibles — le retour à l'accueil et la signature — qui
 * restaient français quand le formulaire qu'il encadre était traduit. Un
 * composant serveur ne peut pas lire le dictionnaire : il est rendu avant que
 * la langue soit connue.
 *
 * Ce gabarit n'exporte aucun `metadata`, contrairement à `soutenir/page.tsx`
 * qui reste serveur pour cette seule raison — il n'y avait donc rien à
 * scinder. Le prérendu n'en souffre pas : `/auth/login` et `/auth/signup`
 * restent statiques au build, un composant client étant tout de même rendu en
 * HTML à ce moment-là.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useT()

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <AuthBackground />

      <Link
        href="/"
        className="absolute top-5 start-5 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-[13px] text-white/70 no-underline backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
        {t.authScreens.home}
      </Link>

      <div className="relative z-10 flex w-full flex-col items-center gap-7">
        <Link href="/" className="flex items-center gap-3 no-underline">
          {/* Le SVG porte un fond blanc pleine page : le cadrer en tuile
              arrondie en fait une intention plutôt qu'un carré posé sur le fond
              sombre. Même traitement que l'en-tête de la page de présentation. */}
          <span className="w-11 h-11 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width="44" height="44" className="w-11 h-11" />
          </span>
          <span className="text-[22px] font-bold tracking-tight text-white">Bible Ouverte</span>
        </Link>

        {children}

        <p className="text-[13px] text-white/40">
          {t.authScreens.byPrefix}
          <Link
            href="https://whatsapp.com/channel/0029VbApUEYE50UmmqSDoE0K"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white/70 underline underline-offset-2 transition-colors hover:text-white"
          >
            Ôappliday
          </Link>
          {t.authScreens.bySuffix}
        </p>
      </div>
    </div>
  )
}
