import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Les ressources statiques ne passent pas par la vérification de session.
//
// La liste ne couvrait que des extensions d'images et de vidéos : /manifest.json
// répondait donc une redirection vers /auth/login pour un visiteur non
// connecté, ce qui empêchait le navigateur de proposer l'installation de la PWA
// avant la première connexion. Même problème pour le service worker, la page
// hors ligne et les traductions servies depuis /bibles/.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/login|auth/signup|auth/callback|bibles/|manifest\\.json|sw\\.js|sw-register\\.js|offline\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)',
  ],
}
