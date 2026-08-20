import { describe, it, expect } from 'vitest'
import { notificationStatus, resolveTriggers, DEFAULT_TRIGGERS, NOTIFICATION_TRIGGERS } from './notifications'
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

describe('resolveTriggers', () => {
  it('rend les valeurs par défaut quand rien n\'est enregistré', () => {
    expect(resolveTriggers(undefined)).toEqual(DEFAULT_TRIGGERS)
    expect(resolveTriggers({})).toEqual(DEFAULT_TRIGGERS)
  })

  it('n\'active pas le rappel quotidien d\'office', () => {
    // Il suppose une heure : en choisir une à la place de l'utilisateur
    // reviendrait à le réveiller à une heure qu'il n'a pas demandée.
    expect(resolveTriggers(undefined).daily).toBe(false)
  })

  it('respecte un refus enregistré', () => {
    const r = resolveTriggers({ 'support-reply': false })
    expect(r['support-reply']).toBe(false)
    // Les autres gardent leur défaut.
    expect(r['plan-late']).toBe(true)
  })

  it('respecte une activation enregistrée', () => {
    expect(resolveTriggers({ daily: true }).daily).toBe(true)
  })

  it('complète un compte réglé avant l\'ajout d\'un déclencheur', () => {
    // Le cas qui compte : sans complément, une clé absente serait lue comme un
    // refus, et le déclencheur nouvellement ajouté n'arriverait jamais.
    const ancien = { daily: true, 'plan-late': false }
    const r = resolveTriggers(ancien)
    expect(r.daily).toBe(true)
    expect(r['plan-late']).toBe(false)
    expect(r['roadmap-done']).toBe(DEFAULT_TRIGGERS['roadmap-done'])
    expect(r.inactive).toBe(DEFAULT_TRIGGERS.inactive)
  })

  it('écarte les clés inconnues et les valeurs qui ne sont pas des booléens', () => {
    const r = resolveTriggers({ inconnu: true, daily: 'oui' as unknown as boolean })
    expect(r).toEqual(DEFAULT_TRIGGERS)
    expect('inconnu' in r).toBe(false)
  })

  it('couvre exactement les six déclencheurs annoncés', () => {
    // La liste est écrite en toutes lettres pour être mise en défaut : elle
    // l'a été le 20 août 2026 à l'ajout de `birthday`, sixième déclencheur.
    // Elle doit rester le miroir de `DEFAULT_TRIGGERS` de `schedule.ts`, côté
    // fonction Edge — deux listes qui divergeraient feraient recevoir une
    // notification que l'utilisateur croit avoir refusée.
    expect(NOTIFICATION_TRIGGERS.map((t) => t.id).sort()).toEqual(
      ['birthday', 'daily', 'inactive', 'plan-late', 'roadmap-done', 'support-reply'],
    )
    expect(Object.keys(DEFAULT_TRIGGERS).sort()).toEqual(
      NOTIFICATION_TRIGGERS.map((t) => t.id).sort(),
    )
  })
})
