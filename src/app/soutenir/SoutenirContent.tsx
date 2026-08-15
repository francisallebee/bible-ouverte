'use client'

import Link from 'next/link'
import { Heart, ExternalLink, Route, MessageCircle } from 'lucide-react'
import { useT } from '@/contexts/I18nContext'

/**
 * Le contenu de la page Soutenir, côté client pour accéder au dictionnaire.
 *
 * La page elle-même reste un composant serveur : c'est elle qui porte
 * `metadata`, qu'un composant client n'a pas le droit d'exporter. Sans cette
 * séparation, le titre d'onglet de la page serait perdu.
 */

const PATREON_URL = 'https://www.patreon.com/c/Oappliday'
const WHATSAPP_URL = 'https://whatsapp.com/channel/0029VbApUEYE50UmmqSDoE0K'

export default function SoutenirContent() {
  const t = useT()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 bg-[--primary-light] rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-[--primary]" />
          </span>
          {t.donate.title}
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ms-[3.25rem]">
          {t.donate.subtitle}
        </p>
      </div>

      <div className="bg-[--surface] rounded-xl border border-[--border] p-6 shadow-[--shadow] space-y-4">
        <p className="text-sm text-[--text] leading-relaxed">
          {t.donate.freeText}
        </p>
        <p className="text-sm text-[--text] leading-relaxed">
          {t.donate.patreonText}
        </p>

        <a
          href={PATREON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[--primary] text-white py-3 px-4 rounded-lg text-sm hover:bg-[--primary-hover] transition-colors flex items-center justify-center gap-2 no-underline font-medium"
        >
          <Heart className="w-4 h-4" aria-hidden="true" />
          {t.donate.patreonButton}
          <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
        </a>
      </div>

      <div className="bg-[--surface] rounded-xl border border-[--border] p-6 shadow-[--shadow] space-y-4 mt-4">
        <h2 className="text-base font-semibold text-[--text]">
          {t.donate.freeWaysTitle}
        </h2>
        <p className="text-sm text-[--text-secondary] leading-relaxed">
          {t.donate.freeWaysText}
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/support"
            className="border border-[--border] rounded-lg px-4 py-3 text-sm text-[--text] hover:border-[--primary]/30 transition-colors no-underline flex items-center gap-2.5"
          >
            <MessageCircle className="w-4 h-4 text-[--primary] shrink-0" aria-hidden="true" />
            {t.donate.reportBug}
          </Link>
          <Link
            href="/roadmap"
            className="border border-[--border] rounded-lg px-4 py-3 text-sm text-[--text] hover:border-[--primary]/30 transition-colors no-underline flex items-center gap-2.5"
          >
            <Route className="w-4 h-4 text-[--primary] shrink-0" aria-hidden="true" />
            {t.donate.voteRoadmap}
          </Link>
        </div>

        <p className="text-sm text-[--text-secondary] leading-relaxed">
          {t.donate.whatsappBefore}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[--primary] underline underline-offset-2"
          >
            ÔAppliday
          </a>
          {t.donate.whatsappAfter}
        </p>
      </div>
    </div>
  )
}
