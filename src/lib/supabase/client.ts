import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Client navigateur, une seule instance par onglet.
 *
 * `createBrowserClient` ne mémorise rien : chaque appel construit un client
 * d'authentification complet, qui restaure et valide la session de son côté.
 * Or `createClient()` est appelé au début de presque chaque fonction de
 * `store.ts` — quinze fois rien que dans ce fichier. Chaque opération sur les
 * données déclenchait donc son propre aller-retour vers `/auth/v1/user`,
 * environ 200 ms, et une session de navigation ordinaire cumulait une
 * soixantaine d'appels pour une dizaine de secondes.
 *
 * Ce module n'est importé que par des composants client ; l'instance ne peut
 * pas fuir d'une requête serveur à l'autre. Le rendu serveur passe par
 * `server.ts` et `middleware.ts`, qui construisent leur propre client par
 * requête et n'ont rien à voir avec celui-ci.
 */
let browserClient: SupabaseClient | undefined

export function createClient() {
  browserClient ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return browserClient
}
