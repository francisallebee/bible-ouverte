/**
 * Règle de temps de la déconnexion automatique.
 *
 * Elle vit ici, hors du composant, pour être vérifiable sans navigateur :
 * chronométrer un compte à rebours à travers le réseau donne des relevés qu'on
 * ne sait pas relire. `auto-logout.test.ts` la couvre.
 */

/** Délais proposés dans les réglages. 0 : jamais. */
/**
 * Les durées proposées. Les libellés vivent dans les dictionnaires, sous
 * `settings.autoLogoutChoices`, indexés par ce nombre de minutes : « Au bout
 * d'une heure » ne se traduit pas en calculant, il s'écrit.
 */
export const AUTO_LOGOUT_CHOICES = [
  { minutes: 0 },
  { minutes: 15 },
  { minutes: 30 },
  { minutes: 60 },
  { minutes: 240 },
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
