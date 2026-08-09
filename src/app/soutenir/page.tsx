import Link from 'next/link'
import { Heart, ExternalLink, Route, MessageCircle } from 'lucide-react'

/**
 * Page statique : aucune donnée utilisateur, aucun appel réseau. Elle reste
 * derrière l'authentification comme le reste de l'application — la feuille de
 * route la décrit comme une page du menu, pas comme une page d'accueil
 * publique.
 */

const PATREON_URL = 'https://www.patreon.com/c/Oappliday'
const WHATSAPP_URL = 'https://whatsapp.com/channel/0029VbApUEYE50UmmqSDoE0K'

export const metadata = {
  title: 'Soutenir le projet — Bible Ouverte',
}

export default function SoutenirPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 bg-[--primary-light] rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-[--primary]" />
          </span>
          Soutenir le projet
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ml-[3.25rem]">
          Bible Ouverte est gratuite, sans publicité et sans revente de données
        </p>
      </div>

      <div className="bg-[--surface] rounded-xl border border-[--border] p-6 shadow-[--shadow] space-y-4">
        <p className="text-sm text-[--text] leading-relaxed">
          Les sept traductions proposées sont dans le domaine public : elles ne
          coûtent rien et ne coûteront jamais rien. L&apos;application, elle,
          repose sur un hébergement et une base de données qui ont un prix, et
          sur du temps de développement.
        </p>
        <p className="text-sm text-[--text] leading-relaxed">
          Rejoindre la communauté ÔAppliday sur Patreon, c&apos;est ce qui permet
          à ce travail de continuer et aux fonctionnalités annoncées dans la
          feuille de route de voir le jour.
        </p>

        <a
          href={PATREON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[--primary] text-white py-3 px-4 rounded-lg text-sm hover:bg-[--primary-hover] transition-colors flex items-center justify-center gap-2 no-underline font-medium"
        >
          <Heart className="w-4 h-4" aria-hidden="true" />
          Rejoindre la communauté sur Patreon
          <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
        </a>
      </div>

      <div className="bg-[--surface] rounded-xl border border-[--border] p-6 shadow-[--shadow] space-y-4 mt-4">
        <h2 className="text-base font-semibold text-[--text]">
          Soutenir sans rien dépenser
        </h2>
        <p className="text-sm text-[--text-secondary] leading-relaxed">
          En parler autour de vous suffit déjà. Et vos retours orientent
          directement ce qui est développé.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/support"
            className="border border-[--border] rounded-lg px-4 py-3 text-sm text-[--text] hover:border-[--primary]/30 transition-colors no-underline flex items-center gap-2.5"
          >
            <MessageCircle className="w-4 h-4 text-[--primary] shrink-0" aria-hidden="true" />
            Signaler un bug ou proposer une idée
          </Link>
          <Link
            href="/roadmap"
            className="border border-[--border] rounded-lg px-4 py-3 text-sm text-[--text] hover:border-[--primary]/30 transition-colors no-underline flex items-center gap-2.5"
          >
            <Route className="w-4 h-4 text-[--primary] shrink-0" aria-hidden="true" />
            Voter sur la feuille de route
          </Link>
        </div>

        <p className="text-sm text-[--text-secondary] leading-relaxed">
          La chaîne WhatsApp{' '}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[--primary] underline underline-offset-2"
          >
            ÔAppliday
          </a>{' '}
          annonce les nouveautés.
        </p>
      </div>
    </div>
  )
}
