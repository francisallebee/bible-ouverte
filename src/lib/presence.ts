import { createClient } from '@/lib/supabase/client'

/**
 * Le signe de vie de l'application.
 *
 * **Pourquoi il faut l'écrire soi-même.** `auth.users.last_sign_in_at` ne bouge
 * qu'à une vraie saisie de mot de passe : mesuré le 20 août 2026, un compte en
 * pleine utilisation affichait une « dernière connexion » vieille de 117
 * minutes. Il ne peut donc pas dire qui est présent, et l'indicateur « En
 * ligne » du tableau d'administration, qui reposait dessus, ne s'allumait que
 * dans les minutes suivant une connexion.
 *
 * L'écriture passe **directement par Supabase**, avec la clé anon et la RLS :
 * c'est l'architecture du dépôt, et `last_seen_at` a son propre GRANT colonne.
 */

/** Au plus une écriture par intervalle, quel que soit le nombre de navigations. */
export const INTERVALLE_PING_MS = 3 * 60 * 1000

/** Au-delà, on ne prétend plus que la personne est là. Voir `statutDe`. */
export const FENETRE_PRESENCE_MS = 5 * 60 * 1000

const CLE_LOCALE = 'bo:dernier-ping'

/**
 * Faut-il écrire maintenant ?
 *
 * Le dernier envoi est retenu **dans le navigateur** et non en mémoire : une
 * navigation complète remonte le composant, et une variable de module repartirait
 * à zéro — une écriture par ouverture de page, ce qui est exactement ce qu'on
 * cherche à éviter.
 */
export function doitPinger(dernier: string | null, maintenant: number): boolean {
  if (!dernier) return true
  const quand = Number(dernier)
  if (!Number.isFinite(quand)) return true
  // Une date dans le futur — horloge remise à l'heure, fuseau changé — ne doit
  // pas bloquer les envois pour toujours.
  if (quand > maintenant) return true
  return maintenant - quand >= INTERVALLE_PING_MS
}

/**
 * Signale la présence, si l'intervalle est écoulé.
 *
 * Ne lève jamais et ne rend rien : un signe de vie qui échoue ne doit pas
 * troubler l'écran de qui le donne. Au pire, l'administration le verra hors
 * ligne — ce qui est une gêne, pas une panne.
 */
export async function signalerPresence(userId: string | null | undefined): Promise<void> {
  if (!userId || typeof window === 'undefined') return
  const maintenant = Date.now()
  if (!doitPinger(window.localStorage.getItem(CLE_LOCALE), maintenant)) return

  // Écrit avant l'envoi : deux appels rapprochés — montage et retour au premier
  // plan — ne doivent pas produire deux écritures.
  window.localStorage.setItem(CLE_LOCALE, String(maintenant))
  try {
    const supabase = createClient()
    // `.select()` après l'écriture : **sous RLS, une mise à jour qui ne
    // correspond à rien réussit sans erreur.** Sans relecture, une policy
    // manquante ou un GRANT oublié laisserait tout le monde « hors ligne » à
    // jamais, sans le moindre signal. Le piège est déjà consigné dans
    // REPRISE.md, il ne se repaye pas.
    const { data, error } = await supabase
      .from('profiles')
      .update({ last_seen_at: new Date(maintenant).toISOString() })
      .eq('id', userId)
      .select('id')

    if (error || !data || data.length === 0) {
      // Une ligne par intervalle au pire, jamais un flot : le compteur local
      // est écrit avant l'envoi.
      console.warn('signe de vie non enregistré', error?.message ?? 'aucune ligne touchée')
    }
  } catch (e) {
    console.warn('signe de vie non envoyé', e)
  }
}
