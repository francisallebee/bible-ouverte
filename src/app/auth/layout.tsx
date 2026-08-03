import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AuthBackground from '@/components/auth/AuthBackground'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <AuthBackground />

      <Link
        href="/"
        className="absolute top-5 left-5 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-[13px] text-white/70 no-underline backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Accueil
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
          Par{' '}
          <Link
            href="https://whatsapp.com/channel/0029VbApUEYE50UmmqSDoE0K"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white/70 underline underline-offset-2 transition-colors hover:text-white"
          >
            Ôappliday
          </Link>{' '}
          — Ressources et Vous
        </p>
      </div>
    </div>
  )
}
