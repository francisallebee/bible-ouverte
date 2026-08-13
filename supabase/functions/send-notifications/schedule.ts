/**
 * Qui doit recevoir quoi, à un instant donné.
 *
 * Module sans dépendance : la fonction Deno l'importe, et vitest le teste tel
 * quel. C'est la partie la plus facile à se tromper — fuseaux décalés d'une
 * demi-heure, passage de minuit, clés absentes — et la moins agréable à
 * vérifier en production.
 */

/** Tolérance autour de l'heure choisie, en minutes : la moitié de la cadence. */
export const WINDOW_MINUTES = 8

/** Heure du rappel quand l'utilisateur n'en a pas choisi. */
export const DEFAULT_REMINDER_TIME = '07:00'

/** Fuseau de repli quand aucun n'a été enregistré. */
export const DEFAULT_TIME_ZONE = 'Europe/Paris'

export interface SettingsRow {
  user_id: string
  data: Record<string, unknown> | null
}

export interface Recipient {
  userId: string
  kind: 'daily'
  ref: string
  title: string
  body: string
  url: string
}

/**
 * Écart en minutes entre deux `HH:MM`, en tenant compte du passage de minuit :
 * 23 h 58 et 00 h 03 sont distants de cinq minutes, pas de 1 435.
 */
export function minutesApart(a: string, b: string): number {
  const toMinutes = (v: string) => {
    const [h, m] = v.split(':').map(Number)
    return h * 60 + m
  }
  const diff = Math.abs(toMinutes(a) - toMinutes(b))
  return Math.min(diff, 1440 - diff)
}

/**
 * L'heure et la date locales d'un fuseau. `fr-CA` est choisi pour son format
 * de date `YYYY-MM-DD`, celui-là même que l'application emploie partout.
 */
export function localNow(timeZone: string, now: Date): { time: string; date: string } {
  const fmt = new Intl.DateTimeFormat('fr-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]))
  return {
    time: `${parts.hour}:${parts.minute}`,
    date: `${parts.year}-${parts.month}-${parts.day}`,
  }
}

/** Qui doit recevoir un rappel quotidien à cet instant. */
export function collectDaily(rows: SettingsRow[], now: Date): Recipient[] {
  const recipients: Recipient[] = []

  for (const row of rows) {
    const data = row.data ?? {}
    if (data.notificationsEnabled !== true) continue

    const triggers = (data.notificationTriggers ?? {}) as Record<string, boolean>
    // Le rappel quotidien est le seul déclencheur inactif par défaut : une clé
    // absente vaut donc refus ici, à l'inverse des quatre autres.
    if (triggers.daily !== true) continue

    const wanted = typeof data.dailyReminderTime === 'string'
      ? data.dailyReminderTime
      : DEFAULT_REMINDER_TIME
    const zone = typeof data.timeZone === 'string' && data.timeZone
      ? data.timeZone
      : DEFAULT_TIME_ZONE

    let local: { time: string; date: string }
    try {
      local = localNow(zone, now)
    } catch {
      // Un fuseau inconnu ne doit pas faire tomber l'envoi des autres.
      continue
    }

    if (minutesApart(local.time, wanted) > WINDOW_MINUTES) continue

    recipients.push({
      userId: row.user_id,
      kind: 'daily',
      // La date locale comme référence : l'unicité de `notification_log` fait
      // alors le travail d'anti-doublon, un seul rappel par jour et par
      // personne, quel que soit le nombre de passages du cron.
      ref: local.date,
      title: 'Bible Ouverte',
      body: 'C’est l’heure de ta lecture du jour.',
      url: '/new-reading',
    })
  }

  return recipients
}
