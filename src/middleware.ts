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
//
// `strong/` ajouté le 29 septembre 2026, et la mesure vaut d'être gardée : sans
// lui, `/strong/hebreu.json` répondait un 307 vers /auth/login qui aboutissait
// à **200 avec du HTML**. Le `res.ok` du chargeur est alors vrai et c'est
// `res.json()` qui casse sur `<!DOCTYPE`, si bien que l'utilisateur lit
// « Vérifie ta connexion » quand sa connexion va très bien. Un compte connecté
// n'était pas touché — ses cookies passent le middleware —, ce qui est
// précisément ce qui rendait le défaut invisible aux essais.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/login|auth/signup|auth/callback|bibles/|strong/|manifest\\.json|sw\\.js|sw-register\\.js|offline\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)',
  ],
}
