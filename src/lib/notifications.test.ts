import { describe, it, expect } from 'vitest'
import { notificationStatus } from './notifications'
import type { DeviceNotificationState } from './notifications'

/**
 * Les cas limites des notifications sont ceux qu'on ne peut pas reproduire
 * depuis un poste de développement : un iPhone dont l'application n'est pas
 * installée, un navigateur sans l'API, une permission déjà refusée. Ils sont
 * donc décrits ici plutôt que constatés à l'écran.
 */

const device = (over: Partial<DeviceNotificationState> = {}): DeviceNotificationState => ({
  supported: true,
  permission: 'default',
  standalone: false,
  ios: false,
  ...over,
})

describe('notificationStatus', () => {
  it('demande la permission sur un navigateur de bureau neuf', () => {
    expect(notificationStatus(device(), false)).toEqual({ kind: 'needs-permission' })
  })

  it('est prête une fois la permission accordée', () => {
    expect(notificationStatus(device({ permission: 'granted' }), true))
      .toEqual({ kind: 'ready', enabled: true })
    expect(notificationStatus(device({ permission: 'granted' }), false))
      .toEqual({ kind: 'ready', enabled: false })
  })

  it('reconnaît une permission refusée', () => {
    expect(notificationStatus(device({ permission: 'denied' }), true))
      .toEqual({ kind: 'denied' })
  })

  it('reconnaît un navigateur sans l\'API', () => {
    expect(notificationStatus(device({ supported: false, permission: 'unsupported' }), false))
      .toEqual({ kind: 'unsupported' })
  })

  it('sur iPhone hors application installée, réclame l\'installation et non l\'API', () => {
    // Le cas qui compte : `Notification` est absent, mais répondre « ton
    // navigateur ne gère pas les notifications » serait faux et sans issue.
    const iphoneSafari = device({ ios: true, standalone: false, supported: false, permission: 'unsupported' })
    expect(notificationStatus(iphoneSafari, false)).toEqual({ kind: 'ios-not-installed' })
  })

  it('sur iPhone hors application installée, même quand l\'API existe', () => {
    const iphoneAvecApi = device({ ios: true, standalone: false, permission: 'default' })
    expect(notificationStatus(iphoneAvecApi, false)).toEqual({ kind: 'ios-not-installed' })
  })

  it('sur iPhone en application installée, se comporte comme partout ailleurs', () => {
    const installee = device({ ios: true, standalone: true, permission: 'default' })
    expect(notificationStatus(installee, false)).toEqual({ kind: 'needs-permission' })

    const accordee = device({ ios: true, standalone: true, permission: 'granted' })
    expect(notificationStatus(accordee, true)).toEqual({ kind: 'ready', enabled: true })
  })

  it('ne réclame jamais l\'installation hors iOS, même en onglet', () => {
    // Un navigateur de bureau ne s'installe pas, et le message n'aurait aucun
    // sens : c'est bien `ios` qui commande, pas `standalone`.
    const bureau = device({ ios: false, standalone: false, permission: 'granted' })
    expect(notificationStatus(bureau, false)).toEqual({ kind: 'ready', enabled: false })
  })

  it('le réglage enregistré ne prime jamais sur l\'état de l\'appareil', () => {
    // Une permission révoquée depuis les réglages du navigateur laisse
    // `notificationsEnabled` à true côté compte : c'est l'appareil qui tranche.
    expect(notificationStatus(device({ permission: 'denied' }), true))
      .toEqual({ kind: 'denied' })
    expect(notificationStatus(device({ supported: false, permission: 'unsupported' }), true))
      .toEqual({ kind: 'unsupported' })
  })
})
