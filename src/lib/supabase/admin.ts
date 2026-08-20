import { createClient } from '@supabase/supabase-js'

/**
 * Le client à clé service_role, pour les routes d'administration.
 *
 * **`cache: 'no-store'` sur chaque appel, et ce n'est pas une précaution.**
 * Next.js remplace le `fetch` global par le sien, qui met en cache les requêtes
 * `GET` — y compris celles que `supabase-js` adresse à PostgREST, sans que rien
 * ne le laisse voir. `export const dynamic = 'force-dynamic'` empêche la mise
 * en cache de la *route*, pas celle des appels qu'elle passe.
 *
 * Le défaut mesuré le 20 août 2026 : un compte suspendu s'affichait bien sur sa
 * fiche et jamais dans la liste, filtre « Suspendus » à zéro. La base disait
 * `suspended = true`, les deux routes faisaient le même `select('*')` avec la
 * même clé, et le service worker exclut `/api/`. Rien ne pouvait les faire
 * diverger — sinon l'âge de leur réponse. L'entrée de cache de la liste avait
 * été remplie **avant** la suspension et resservie ensuite ; celle de la fiche,
 * **après**. Un déploiement vidait le cache, la pastille réapparaissait une
 * fois, puis disparaissait de nouveau.
 *
 * Une route d'administration lit toujours un état qui vient de changer : ici,
 * le cache ne peut être qu'un piège.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: 'no-store' }),
      },
    }
  )
}
