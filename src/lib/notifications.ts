/**
 * État des notifications, côté appareil.
 *
 * La règle vit ici, hors des composants, parce que ses cas limites sont ceux
 * qu'on ne peut pas reproduire depuis un poste de développement : un iPhone
 * dont l'application n'est pas installée sur l'écran d'accueil, un navigateur
 * sans l'API, une permission refusée qu'on ne peut plus redemander.
 * `notifications.test.ts` les couvre.
 */

/**
 * Ce qui déclenche une notification. Les identifiants sont ceux de la colonne
 * `kind` de `notification_log` : les changer suppose de changer sa contrainte.
 */
export const NOTIFICATION_TRIGGERS = [
  {
    id: 'daily',
    label: 'Rappel quotidien',
    hint: "À l'heure de ton choix, pour ne pas oublier ta lecture.",
  },
  {
    id: 'plan-late',
    label: 'Plan de lecture en retard',
    hint: "Quand un jour prévu n'a pas été coché.",
  },
  {
    id: 'support-reply',
    label: 'Réponse à un message de support',
    hint: 'Quand quelqu’un répond à un de tes tickets.',
  },
  {
    id: 'roadmap-done',
    label: 'Feuille de route',
    hint: "Quand une fonctionnalité attendue passe à « Terminé ».",
  },
  {
    id: 'inactive',
    label: 'Longue absence',
    hint: "Une relance après plusieurs jours sans lecture.",
  },
] as const

export type NotificationTrigger = typeof NOTIFICATION_TRIGGERS[number]['id']

/**
 * Le rappel quotidien est le seul à ne pas être actif d'emblée : il suppose une
 * heure, et en choisir une à la place de l'utilisateur reviendrait à le
 * réveiller à une heure qu'il n'a pas demandée.
 */
export const DEFAULT_TRIGGERS: Record<NotificationTrigger, boolean> = {
  daily: false,
  'plan-late': true,
  'support-reply': true,
  'roadmap-done': true,
  inactive: true,
}

/**
 * Complète les préférences enregistrées par les valeurs par défaut, et écarte
 * les clés inconnues. Un compte réglé avant l'ajout d'un déclencheur n'a pas sa
 * clé : sans ce complément, le déclencheur serait lu comme refusé.
 */
export function resolveTriggers(
  saved: Partial<Record<string, boolean>> | undefined,
): Record<NotificationTrigger, boolean> {
  const resolved = { ...DEFAULT_TRIGGERS }
  if (!saved) return resolved
  for (const { id } of NOTIFICATION_TRIGGERS) {
    if (typeof saved[id] === 'boolean') resolved[id] = saved[id] as boolean
  }
  return resolved
}

/** Heure du rappel quotidien, quand l'utilisateur n'en a pas choisi. */
export const DEFAULT_REMINDER_TIME = '07:00'

/**
 * Le fuseau de l'appareil, en identifiant IANA. Sans lui, « à 7 h » n'a pas de
 * sens côté serveur : les dates de l'application sont des `YYYY-MM-DD` nus.
 */
export function readTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'
  } catch {
    return 'Europe/Paris'
  }
}

export interface DeviceNotificationState {
  /** L'API `Notification` existe dans ce navigateur. */
  supported: boolean
  permission: 'default' | 'granted' | 'denied' | 'unsupported'
  /** L'application tourne comme application installée, hors onglet. */
  standalone: boolean
  ios: boolean
}

export type NotificationStatus =
  /** iOS ne délivre les notifications qu'aux applications installées. */
  | { kind: 'ios-not-installed' }
  | { kind: 'unsupported' }
  | { kind: 'denied' }
  | { kind: 'needs-permission' }
  | { kind: 'ready'; enabled: boolean }

/**
 * Ce que l'écran doit proposer.
 *
 * L'ordre des cas n'est pas indifférent. Sur un iPhone dont l'application
 * n'est pas installée, `Notification` est absent : sans ce premier cas, on
 * afficherait « ton navigateur ne gère pas les notifications », ce qui est
 * faux et ne dit pas quoi faire. Le message utile est « ajoute l'application
 * à ton écran d'accueil ».
 */
export function notificationStatus(
  device: DeviceNotificationState,
  enabled: boolean,
): NotificationStatus {
  if (device.ios && !device.standalone) return { kind: 'ios-not-installed' }
  if (!device.supported || device.permission === 'unsupported') return { kind: 'unsupported' }
  if (device.permission === 'denied') return { kind: 'denied' }
  if (device.permission === 'default') return { kind: 'needs-permission' }
  return { kind: 'ready', enabled }
}

/** Lit l'état réel de l'appareil. Renvoie un état neutre côté serveur. */
export function readDeviceState(): DeviceNotificationState {
  if (typeof window === 'undefined') {
    return { supported: false, permission: 'unsupported', standalone: false, ios: false }
  }

  const supported = 'Notification' in window
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches === true
    // Safari sur iOS n'implémente pas `display-mode: standalone` et expose
    // cette propriété non standard à la place.
    || (window.navigator as { standalone?: boolean }).standalone === true

  const ua = window.navigator.userAgent
  // Un iPad récent se présente comme un Mac : le point tactile le distingue.
  const ios = /iPad|iPhone|iPod/.test(ua)
    || (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1)

  return {
    supported,
    permission: supported ? Notification.permission : 'unsupported',
    standalone,
    ios,
  }
}

/**
 * Demande la permission. Doit être appelée depuis un geste de l'utilisateur :
 * les navigateurs refusent la demande autrement, sans toujours le dire.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export type TestNotificationResult =
  | 'sent'
  | 'no-permission'
  | 'unsupported'
  | 'failed'

const TEST_TITLE = 'Bible Ouverte'
const TEST_OPTIONS = {
  body: 'Les notifications fonctionnent sur cet appareil.',
  icon: '/icon-192.png',
  badge: '/icon-192.png',
}

/** `serviceWorker.ready` n'a pas de délai : sans garde, l'attente est infinie. */
function readyRegistration(timeoutMs = 3000): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]).catch(() => null)
}

/**
 * Affiche une notification de test, localement — sans serveur ni abonnement.
 * C'est ce qui permet de vérifier qu'un appareil les délivre vraiment avant
 * d'écrire quoi que ce soit côté envoi.
 *
 * Passe d'abord par le service worker. **iOS n'implémente pas le constructeur
 * `Notification`**, même dans une application installée : l'appeler ne fait
 * rien ou lève, et c'est la seule voie qui marche sur iPhone. Le constructeur
 * ne sert plus que de recours pour un navigateur sans service worker.
 */
export async function showTestNotification(): Promise<TestNotificationResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'granted') return 'no-permission'

  const registration = await readyRegistration()
  if (registration) {
    try {
      await registration.showNotification(TEST_TITLE, TEST_OPTIONS)
      return 'sent'
    } catch {
      // On retombe sur le constructeur plutôt que d'abandonner.
    }
  }

  try {
    new Notification(TEST_TITLE, TEST_OPTIONS)
    return 'sent'
  } catch {
    return 'failed'
  }
}
