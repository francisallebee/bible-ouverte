/**
 * État des notifications, côté appareil.
 *
 * La règle vit ici, hors des composants, parce que ses cas limites sont ceux
 * qu'on ne peut pas reproduire depuis un poste de développement : un iPhone
 * dont l'application n'est pas installée sur l'écran d'accueil, un navigateur
 * sans l'API, une permission refusée qu'on ne peut plus redemander.
 * `notifications.test.ts` les couvre.
 */

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
 * Affiche une notification de test, localement — sans serveur ni abonnement.
 * C'est ce qui permet de vérifier que l'appareil les délivre vraiment avant
 * d'écrire quoi que ce soit côté envoi.
 */
export function showTestNotification(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false
  try {
    new Notification('Bible Ouverte', {
      body: 'Les notifications fonctionnent sur cet appareil.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
    return true
  } catch {
    return false
  }
}
