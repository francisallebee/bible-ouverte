/**
 * Identifiant du compte connecté, ou `'local'` hors session.
 *
 * Cette fonction interrogeait `auth.getUser()` directement, sans cache. Elle
 * est appelée depuis vingt-neuf endroits — chaque store, chaque écran qui lit
 * ses données — et chaque appel payait donc un aller-retour réseau d'environ
 * 200 ms. Une simple ouverture d'écran en déclenchait quatre en parallèle.
 *
 * Elle s'appuie désormais sur `getUserId()` de `lib/supabase/store`, qui
 * mémorise l'identité pour la session et regroupe les appels simultanés. Une
 * seule source de vérité, qu'un changement d'authentification invalide par
 * `clearUserCache()`.
 *
 * L'import reste dynamique : ce module est lu par des chemins qui ne
 * s'exécutent pas tous dans le navigateur.
 */
export async function getCurrentUserId(): Promise<string> {
  if (typeof window === 'undefined') return 'local'
  try {
    const { getUserId } = await import('@/lib/supabase/store')
    return (await getUserId()) ?? 'local'
  } catch {}
  return 'local'
}
