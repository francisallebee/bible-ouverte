import { type NextRequest } from 'next/server'
import { requireAdmin, errorResponse } from '@/lib/supabase/api-client'
import { adresseAdmise, nomDeFichierPour, TAILLE_MAXIMALE_LIEN, DELAI_LIEN_MS } from '@/lib/import/lien'

// Sans cela, Next exécute le handler pendant `next build` pour décider s'il est
// statique — voir les routes d'administration.
export const dynamic = 'force-dynamic'

/**
 * Va chercher un document à une adresse et le rend tel quel au navigateur.
 *
 * La première route de l'import de lectures (`spec/IMPORT-IA.md`), et la
 * première route du dépôt qui ne sert pas la clé service_role : elle existe
 * parce qu'un navigateur ne peut pas lire une page d'un autre site (CORS),
 * pas parce qu'elle a un droit de plus. Elle **ne garde rien** — ni le
 * document, ni l'adresse — et ne fait rien du contenu : c'est le navigateur
 * qui en extrait le texte par `texteDuFichier`, comme d'un fichier choisi.
 *
 * Réservée à l'administrateur, **vérifié en base** par `requireAdmin` avec la
 * session de l'appelant. Bornée : `http(s)` seulement, aucune adresse interne
 * (`adresseAdmise`), dix secondes, quatre mégaoctets — la réponse d'une
 * fonction Vercel ne peut pas porter davantage.
 */
export async function POST(request: NextRequest) {
  const appelant = await requireAdmin(request)
  if (!appelant) return errorResponse('Accès refusé', 403)

  let brut: unknown
  try {
    brut = (await request.json())?.url
  } catch {
    return errorResponse('adresse-invalide', 400)
  }
  if (typeof brut !== 'string') return errorResponse('adresse-invalide', 400)
  const admission = adresseAdmise(brut)
  if ('refus' in admission) return errorResponse(admission.refus, 400)

  const controleur = new AbortController()
  const minuterie = setTimeout(() => controleur.abort(), DELAI_LIEN_MS)
  try {
    const reponse = await fetch(admission.url, {
      signal: controleur.signal,
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'User-Agent': 'BibleOuverte-Import/1.0', Accept: '*/*' },
    })
    if (!reponse.ok) return errorResponse('inaccessible', 502)

    // La redirection peut avoir changé d'hôte : on rejuge l'adresse finale,
    // sinon une adresse publique pourrait renvoyer vers une interne.
    if ('refus' in adresseAdmise(reponse.url || admission.url)) return errorResponse('adresse-interne', 400)

    const annonce = Number(reponse.headers.get('content-length') ?? 0)
    if (annonce > TAILLE_MAXIMALE_LIEN) return errorResponse('trop-gros', 413)

    // Lu par morceaux et arrêté net au-delà de la borne : un serveur qui
    // n'annonce pas sa taille ne doit pas pouvoir remplir la mémoire.
    const lecteur = reponse.body?.getReader()
    if (!lecteur) return errorResponse('inaccessible', 502)
    const morceaux: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await lecteur.read()
      if (done) break
      total += value.byteLength
      if (total > TAILLE_MAXIMALE_LIEN) { await lecteur.cancel(); return errorResponse('trop-gros', 413) }
      morceaux.push(value)
    }
    const corps = new Uint8Array(total)
    let pos = 0
    for (const m of morceaux) { corps.set(m, pos); pos += m.byteLength }

    const type = reponse.headers.get('content-type') ?? 'application/octet-stream'
    return new Response(corps, {
      status: 200,
      headers: {
        'Content-Type': type,
        'X-Import-Nom': encodeURIComponent(nomDeFichierPour(reponse.url || admission.url, type)),
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return errorResponse('inaccessible', 502)
  } finally {
    clearTimeout(minuterie)
  }
}
