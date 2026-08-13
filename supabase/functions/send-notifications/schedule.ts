/**
 * Qui doit recevoir quoi, à un instant donné.
 *
 * Module sans dépendance : la fonction Deno l'importe, et vitest le teste tel
 * quel. C'est la partie la plus facile à se tromper — fuseaux décalés d'une
 * demi-heure, passage de minuit, relances répétées — et la moins agréable à
 * vérifier en production, où il faudrait attendre le lendemain.
 *
 * Deux familles de déclencheurs, qui ne se traitent pas de la même façon :
 *
 *   Périodiques (rappel quotidien, plan en retard, longue absence) : rien
 *   ne presse, ils partent à l'heure que la personne a choisie.
 *
 *   Événementiels (réponse support, feuille de route) : ils perdent leur sens
 *   s'ils attendent, mais n'ont rien à faire à 3 h du matin — d'où une plage
 *   de veille.
 */

/** Tolérance autour de l'heure choisie, en minutes : la moitié de la cadence. */
export const WINDOW_MINUTES = 8

/** Heure du rappel quand l'utilisateur n'en a pas choisi. */
export const DEFAULT_REMINDER_TIME = '07:00'

/** Fuseau de repli quand aucun n'a été enregistré. */
export const DEFAULT_TIME_ZONE = 'Europe/Paris'

/** Plage pendant laquelle un événement peut réveiller un téléphone. */
export const WAKING_START = '08:00'
export const WAKING_END = '22:00'

/** Jours sans lecture au bout desquels on relance. */
export const INACTIVE_DAYS = 7

export type TriggerKind = 'daily' | 'plan-late' | 'support-reply' | 'roadmap-done' | 'inactive'

export interface SettingsRow {
  user_id: string
  data: Record<string, unknown> | null
}

export interface Recipient {
  userId: string
  kind: TriggerKind
  ref: string
  title: string
  body: string
  url: string
}

/** Un plan dont un jour prévu est passé sans avoir été coché. */
export interface LatePlan {
  userId: string
  planId: number
  planName: string
  /** Le plus ancien jour non coché déjà passé. */
  earliestLateDate: string
}

/** Une réponse reçue sur un ticket de support. */
export interface SupportReply {
  userId: string
  ticketId: number
  replyId: string
  authorName: string
}

/** Un item de la feuille de route passé à « Terminé ». */
export interface RoadmapDone {
  itemId: number
  title: string
}

/** Date de la dernière lecture enregistrée d'un compte. */
export interface LastReading {
  userId: string
  /** `YYYY-MM-DD`. */
  date: string
}

/** Les préférences d'un compte, une fois lues et complétées. */
export interface UserPrefs {
  userId: string
  triggers: Record<string, boolean>
  reminderTime: string
  timeZone: string
}

/**
 * Valeurs par défaut, en miroir de `DEFAULT_TRIGGERS` côté navigateur.
 *
 * Le rappel quotidien est le seul inactif d'office : il suppose une heure, et
 * en choisir une à la place de l'utilisateur reviendrait à le réveiller à une
 * heure qu'il n'a pas demandée. Les quatre autres répondent à un événement
 * qu'on a de bonnes raisons de vouloir connaître.
 */
const DEFAULT_TRIGGERS: Record<TriggerKind, boolean> = {
  daily: false,
  'plan-late': true,
  'support-reply': true,
  'roadmap-done': true,
  inactive: true,
}

/**
 * Lit une ligne de réglages. Rend `null` si le compte n'a pas activé les
 * notifications — c'est l'interrupteur général, il prime sur tout le reste.
 */
export function readPrefs(row: SettingsRow): UserPrefs | null {
  const data = row.data ?? {}
  if (data.notificationsEnabled !== true) return null

  const saved = (data.notificationTriggers ?? {}) as Record<string, boolean>
  const triggers: Record<string, boolean> = { ...DEFAULT_TRIGGERS }
  // Une clé absente prend sa valeur par défaut : un compte réglé avant l'ajout
  // d'un déclencheur ne doit pas être lu comme l'ayant refusé.
  for (const key of Object.keys(DEFAULT_TRIGGERS)) {
    if (typeof saved[key] === 'boolean') triggers[key] = saved[key]
  }

  return {
    userId: row.user_id,
    triggers,
    reminderTime: typeof data.dailyReminderTime === 'string'
      ? data.dailyReminderTime
      : DEFAULT_REMINDER_TIME,
    timeZone: typeof data.timeZone === 'string' && data.timeZone
      ? data.timeZone
      : DEFAULT_TIME_ZONE,
  }
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

/** L'heure locale, ou `null` si le fuseau enregistré est inconnu. */
function safeLocalNow(prefs: UserPrefs, now: Date): { time: string; date: string } | null {
  try {
    return localNow(prefs.timeZone, now)
  } catch {
    // Un fuseau inconnu ne doit pas faire tomber l'envoi des autres.
    return null
  }
}

/** Vrai dans la plage où l'on s'autorise à faire sonner un téléphone. */
export function withinWakingHours(time: string): boolean {
  return time >= WAKING_START && time <= WAKING_END
}

/** Nombre de jours entiers entre deux dates `YYYY-MM-DD`. */
export function daysBetween(from: string, to: string): number {
  const parse = (v: string) => {
    const [y, m, d] = v.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((parse(to) - parse(from)) / 86_400_000)
}

/** Vrai si l'instant tombe dans la fenêtre de l'heure choisie par la personne. */
function atReminderTime(prefs: UserPrefs, local: { time: string }): boolean {
  return minutesApart(local.time, prefs.reminderTime) <= WINDOW_MINUTES
}

// ---------------------------------------------------------------------------
// Les cinq déclencheurs
// ---------------------------------------------------------------------------

/** Le rappel quotidien, à l'heure choisie. */
export function collectDaily(prefsList: UserPrefs[], now: Date): Recipient[] {
  const out: Recipient[] = []
  for (const prefs of prefsList) {
    if (!prefs.triggers.daily) continue
    const local = safeLocalNow(prefs, now)
    if (!local || !atReminderTime(prefs, local)) continue
    out.push({
      userId: prefs.userId,
      kind: 'daily',
      // La date locale comme référence : l'unicité de `notification_log` fait
      // le travail d'anti-doublon, un seul rappel par jour et par personne.
      ref: local.date,
      title: 'Bible Ouverte',
      body: 'C’est l’heure de ta lecture du jour.',
      url: '/new-reading',
    })
  }
  return out
}

/**
 * Les plans dont un jour prévu est passé sans être coché.
 *
 * La référence est le plan **et** son plus ancien jour en retard. C'est ce qui
 * évite la relance quotidienne : tant que la personne ne rattrape rien, ce
 * jour ne bouge pas, la référence non plus, et l'unicité de `notification_log`
 * bloque le second envoi. Qu'elle rattrape une partie de son retard et le jour
 * avance : elle est alors relancée une fois, sur le suivant.
 */
export function collectPlanLate(
  prefsList: UserPrefs[],
  latePlans: LatePlan[],
  now: Date,
): Recipient[] {
  const byUser = new Map(prefsList.map((p) => [p.userId, p]))
  const out: Recipient[] = []

  for (const plan of latePlans) {
    const prefs = byUser.get(plan.userId)
    if (!prefs || !prefs.triggers['plan-late']) continue
    const local = safeLocalNow(prefs, now)
    if (!local || !atReminderTime(prefs, local)) continue

    const retard = daysBetween(plan.earliestLateDate, local.date)
    if (retard < 1) continue

    out.push({
      userId: plan.userId,
      kind: 'plan-late',
      ref: `${plan.planId}:${plan.earliestLateDate}`,
      title: plan.planName,
      body: retard === 1
        ? 'Une lecture de ton plan attend depuis hier.'
        : `Une lecture de ton plan attend depuis ${retard} jours.`,
      url: `/plans/${plan.planId}`,
    })
  }
  return out
}

/** Les réponses reçues sur un ticket de support. */
export function collectSupportReplies(
  prefsList: UserPrefs[],
  replies: SupportReply[],
  now: Date,
): Recipient[] {
  const byUser = new Map(prefsList.map((p) => [p.userId, p]))
  const out: Recipient[] = []

  for (const reply of replies) {
    const prefs = byUser.get(reply.userId)
    if (!prefs || !prefs.triggers['support-reply']) continue
    const local = safeLocalNow(prefs, now)
    // Événementiel : on n'attend pas l'heure du rappel, mais on ne fait pas
    // sonner un téléphone en pleine nuit non plus.
    if (!local || !withinWakingHours(local.time)) continue

    out.push({
      userId: reply.userId,
      kind: 'support-reply',
      // Une notification par réponse, et une seule.
      ref: `${reply.ticketId}:${reply.replyId}`,
      title: 'Réponse à ton message',
      body: `${reply.authorName} t’a répondu.`,
      url: '/support',
    })
  }
  return out
}

/**
 * Les items de la feuille de route passés à « Terminé ».
 *
 * Diffusion à tous les comptes qui l'ont demandé : c'est le seul déclencheur
 * qui ne dépend pas des données de la personne. Restreint au passage à
 * « Terminé », et non à toute création ou modification — sans quoi la moindre
 * correction de statut réveillerait tout le monde.
 */
export function collectRoadmapDone(
  prefsList: UserPrefs[],
  items: RoadmapDone[],
  now: Date,
): Recipient[] {
  const out: Recipient[] = []
  for (const prefs of prefsList) {
    if (!prefs.triggers['roadmap-done']) continue
    const local = safeLocalNow(prefs, now)
    if (!local || !withinWakingHours(local.time)) continue

    for (const item of items) {
      out.push({
        userId: prefs.userId,
        kind: 'roadmap-done',
        // Une notification par item et par personne, quel que soit le nombre
        // de passages du cron.
        ref: String(item.itemId),
        title: 'Feuille de route',
        body: `« ${item.title} » est disponible.`,
        url: '/roadmap',
      })
    }
  }
  return out
}

/**
 * Les comptes sans lecture depuis longtemps.
 *
 * La référence est la date de la dernière lecture, pas celle du jour : la
 * relance part une fois par période d'absence, et non chaque jour où l'absence
 * dure. Une nouvelle lecture ouvre une nouvelle période, donc un nouveau droit
 * à relance. Un compte qui n'a jamais rien lu n'est pas relancé : il n'y a pas
 * d'absence à constater, et ce n'est pas à ce mécanisme d'accueillir les
 * nouveaux venus.
 */
export function collectInactive(
  prefsList: UserPrefs[],
  lastReadings: LastReading[],
  now: Date,
): Recipient[] {
  const byUser = new Map(lastReadings.map((r) => [r.userId, r.date]))
  const out: Recipient[] = []

  for (const prefs of prefsList) {
    if (!prefs.triggers.inactive) continue
    const last = byUser.get(prefs.userId)
    if (!last) continue

    const local = safeLocalNow(prefs, now)
    if (!local || !atReminderTime(prefs, local)) continue

    if (daysBetween(last, local.date) < INACTIVE_DAYS) continue

    out.push({
      userId: prefs.userId,
      kind: 'inactive',
      ref: last,
      title: 'Bible Ouverte',
      body: 'Cela fait un moment. Reprends où tu t’es arrêté.',
      url: '/new-reading',
    })
  }
  return out
}

export interface CollectInput {
  settings: SettingsRow[]
  latePlans: LatePlan[]
  supportReplies: SupportReply[]
  roadmapDone: RoadmapDone[]
  lastReadings: LastReading[]
}

/** Tout ce qui doit partir à cet instant, tous déclencheurs confondus. */
export function collectAll(input: CollectInput, now: Date): Recipient[] {
  const prefsList = input.settings
    .map(readPrefs)
    .filter((p): p is UserPrefs => p !== null)

  return [
    ...collectDaily(prefsList, now),
    ...collectPlanLate(prefsList, input.latePlans, now),
    ...collectSupportReplies(prefsList, input.supportReplies, now),
    ...collectRoadmapDone(prefsList, input.roadmapDone, now),
    ...collectInactive(prefsList, input.lastReadings, now),
  ]
}
