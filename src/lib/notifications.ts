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
/**
 * Les cinq déclencheurs, par identifiant et dans l'ordre d'affichage.
 *
 * Les libellés ne sont plus ici : ils vivent dans les dictionnaires, sous
 * `notifications.triggers`, où chaque langue les fournit. Ne restent que les
 * identifiants, qui sont de la logique — ils servent de clés à
 * `notificationTriggers` dans les réglages et à `notification_log` en base, et
 * ne doivent donc jamais changer.
 */
export const NOTIFICATION_TRIGGERS = [
  { id: 'daily' },
  { id: 'plan-late' },
  { id: 'support-reply' },
  { id: 'roadmap-done' },
  { id: 'inactive' },
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

/**
 * Clé publique VAPID. Elle est publique par construction : le navigateur la
 * transmet au service de push, et elle part donc dans chaque page. La clé
 * privée qui lui correspond ne vit que dans les secrets de la fonction d'envoi,
 * jamais ici.
 *
 * La changer invalide tous les abonnements existants : les appareils devront se
 * réabonner, faute de quoi ils ne recevront plus rien.
 */
export const VAPID_PUBLIC_KEY =
  'BMaCrMZf8hSSWSaQiuETdk7ly0TIM3ctGziuH4XxBV1GH2dYMSn7rlm1RIVHtTmUmNEhneRZ5iDTy_AmnTxpb00'

/**
 * `applicationServerKey` n'accepte pas le base64url : il lui faut les octets.
 *
 * Le tampon est alloué explicitement : un `Uint8Array` construit à partir d'une
 * longueur porte un `ArrayBufferLike`, que le typage de `applicationServerKey`
 * refuse — il exige un `ArrayBuffer` et non un `SharedArrayBuffer`.
 */
function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export type SubscribeResult = 'subscribed' | 'unsupported' | 'no-permission' | 'failed'

/**
 * Abonne cet appareil et enregistre l'abonnement côté compte.
 *
 * Un abonnement vaut pour un appareil, pas pour un compte : le téléphone et
 * l'ordinateur en ont chacun un, et se désabonnent séparément.
 */
export async function subscribeDevice(): Promise<SubscribeResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'
  if (Notification.permission !== 'granted') return 'no-permission'

  try {
    const registration = await navigator.serviceWorker.ready
    // Un abonnement déjà en place est réutilisé : en créer un second laisserait
    // le premier vivant côté service de push, et l'appareil recevrait deux fois.
    const existing = await registration.pushManager.getSubscription()
    const subscription = existing ?? await registration.pushManager.subscribe({
      // Obligatoire : les navigateurs refusent un abonnement silencieux.
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY),
    })

    const json = subscription.toJSON() as { endpoint?: string; keys?: Record<string, string> }
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return 'failed'

    const { savePushSubscription } = await import('@/lib/supabase/store')
    const saved = await savePushSubscription({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      userAgent: navigator.userAgent.slice(0, 255),
    })
    return saved ? 'subscribed' : 'failed'
  } catch {
    return 'failed'
  }
}

let deviceSyncedThisSession = false

/**
 * Rattrape l'abonnement d'un appareil que le serveur ne connaît pas encore.
 *
 * L'abonnement ne pouvait naître que du basculement de la case des réglages.
 * C'était insuffisant dans deux situations, dont la seconde est permanente :
 * un compte ayant activé les notifications avant l'existence de ce code n'a
 * plus rien à basculer, et surtout un **deuxième appareil** — nouveau
 * téléphone, ordinateur — trouve la case déjà cochée et ne s'abonne jamais.
 * L'abonnement vaut par appareil, son déclencheur ne pouvait pas être un
 * changement d'état par compte.
 *
 * Sans effet si les notifications sont désactivées ou la permission absente.
 * `subscribeDevice` réutilise l'abonnement en place et enregistre par `upsert`
 * sur l'`endpoint` : rappeler cette fonction ne crée jamais de doublon.
 */
export async function syncDeviceSubscription(enabled: boolean): Promise<void> {
  if (deviceSyncedThisSession || !enabled) return
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  // Le drapeau n'est posé qu'en cas de succès : un échec réseau doit pouvoir
  // être rattrapé à la session suivante.
  if (await subscribeDevice() === 'subscribed') deviceSyncedThisSession = true
}

/** Désabonne cet appareil, côté navigateur et côté compte. */
export async function unsubscribeDevice(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return true

    const endpoint = subscription.endpoint
    // La ligne est retirée d'abord : si le navigateur se désabonne mais que la
    // ligne survit, la fonction d'envoi continuerait de viser un endpoint mort.
    const { deletePushSubscription } = await import('@/lib/supabase/store')
    await deletePushSubscription(endpoint)
    return await subscription.unsubscribe()
  } catch {
    return false
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
