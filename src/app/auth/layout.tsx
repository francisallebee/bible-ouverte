import Link from 'next/link'
import VideoBackground from '@/components/VideoBackground'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <VideoBackground />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <img src="/logo.svg" alt="Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
        <h1 className="text-3xl font-bold tracking-wider text-white drop-shadow-lg">
          BIBLE OUVERTE
        </h1>
        {children}
        <p className="text-sm text-white/70 drop-shadow">
          Par{' '}
          <Link
            href="https://whatsapp.com/channel/0029VbApUEYE50UmmqSDoE0K"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white/90 hover:text-white underline underline-offset-2 transition-colors"
          >
            Ôappliday
          </Link>{' '}
          — Ressources et Vous
        </p>
      </div>
    </div>
  )
}
