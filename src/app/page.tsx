import type { Metadata } from 'next'
import LandingPage from '@/components/landing/LandingPage'

const TITLE = 'Bible Ouverte — le carnet de tes lectures bibliques'
const DESCRIPTION =
  'Enregistre tes lectures bibliques, suis tes plans et ta progression. ' +
  'Douze traductions en cinq langues, consultables hors ligne, synchronisées sur tous tes appareils. Gratuit.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Bible Ouverte',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/**
 * Racine du site : la page de présentation, seule page visible sans compte.
 *
 * Aucune vérification de session ici — elle est faite par le middleware, qui
 * renvoie un utilisateur connecté sur /new-reading avant d'arriver jusqu'ici
 * (voir src/lib/supabase/middleware.ts). La page reste ainsi entièrement
 * statique : rien à calculer à chaque visite.
 */
export default function RootPage() {
  return <LandingPage />
}
