/**
 * Règle de temps de la déconnexion automatique.
 *
 * Elle vit ici, hors du composant, pour être vérifiable sans navigateur :
 * chronométrer un compte à rebours à travers le réseau donne des relevés qu'on
 * ne sait pas relire. `auto-logout.test.ts` la couvre.
 */

/** Délais proposés dans les réglages. 0 : jamais. */
export const AUTO_LOGOUT_CHOICES = [
  { minutes: 0, label: 'Jamais' },
  { minutes: 15, label: 'Au bout de 15 minutes' },
  { minutes: 30, label: 'Au bout de 30 minutes' },
  { minutes: 60, label: "Au bout d'une heure" },
  { minutes: 240, label: 'Au bout de quatre heures' },
]

/** Durée de l'avertissement avant la coupure, en secondes. */
export const WARNING_SECONDS = 60

export type AutoLogoutState =
  | { kind: 'idle' }
  | { kind: 'warning'; seconds: number }
  | { kind: 'expired' }

/** Ce que le compteur doit faire à un instant donné. */
export function autoLogoutState(
  minutes: number,
  lastActivity: number,
  now: number,
): AutoLogoutState {
  if (!minutes || minutes <= 0) return { kind: 'idle' }
  const seconds = Math.ceil((minutes * 60_000 - (now - lastActivity)) / 1000)
  if (seconds <= 0) return { kind: 'expired' }
  if (seconds <= WARNING_SECONDS) return { kind: 'warning', seconds }
  return { kind: 'idle' }
}
