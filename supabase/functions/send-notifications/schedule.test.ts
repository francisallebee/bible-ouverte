import { describe, it, expect } from 'vitest'
import { minutesApart, localNow, collectDaily, WINDOW_MINUTES } from './schedule'
import type { SettingsRow } from './schedule'

/**
 * La règle d'envoi du rappel quotidien.
 *
 * Elle est testée ici parce qu'elle est invérifiable en production sans
 * attendre le lendemain, et parce que ses cas limites — fuseaux décalés d'une
 * demi-heure, passage de minuit, préférences absentes — ne se rencontrent pas
 * sur le poste de développement.
 */

const row = (data: Record<string, unknown>, id = 'u1'): SettingsRow => ({
  user_id: id,
  data: {
    notificationsEnabled: true,
    notificationTriggers: { daily: true },
    dailyReminderTime: '07:00',
    timeZone: 'Europe/Paris',
    ...data,
  },
})

describe('minutesApart', () => {
  it('mesure un écart ordinaire', () => {
    expect(minutesApart('07:00', '07:05')).toBe(5)
    expect(minutesApart('07:05', '07:00')).toBe(5)
  })

  it('vaut zéro à l\'heure exacte', () => {
    expect(minutesApart('07:00', '07:00')).toBe(0)
  })

  it('tient compte du passage de minuit', () => {
    // Sans cela, 23 h 58 et 00 h 03 seraient distants de 1 435 minutes, et un
    // rappel réglé à minuit ne serait jamais envoyé.
    expect(minutesApart('23:58', '00:03')).toBe(5)
    expect(minutesApart('00:03', '23:58')).toBe(5)
  })

  it('mesure le plus court des deux chemins', () => {
    expect(minutesApart('01:00', '13:00')).toBe(720)
    expect(minutesApart('23:00', '01:00')).toBe(120)
  })
})

describe('localNow', () => {
  // 6 h 30 UTC le 13 août 2026.
  const instant = new Date('2026-08-13T06:30:00Z')

  it('rend l\'heure locale du fuseau demandé', () => {
    // Paris est à UTC+2 en août.
    expect(localNow('Europe/Paris', instant).time).toBe('08:30')
    expect(localNow('UTC', instant).time).toBe('06:30')
  })

  it('gère les fuseaux décalés d\'une demi-heure', () => {
    // L'Inde est à UTC+5:30 : c'est ce cas qui impose une cadence au quart
    // d'heure plutôt qu'à l'heure.
    expect(localNow('Asia/Kolkata', instant).time).toBe('12:00')
    expect(localNow('Asia/Kathmandu', instant).time).toBe('12:15')
  })

  it('rend la date locale au format de l\'application', () => {
    expect(localNow('Europe/Paris', instant).date).toBe('2026-08-13')
    // À Auckland il est déjà le lendemain : c'est cette date-là qui doit
    // servir de référence, sinon deux rappels tomberaient le même jour local.
    expect(localNow('Pacific/Auckland', instant).date).toBe('2026-08-13')
    expect(localNow('Pacific/Auckland', new Date('2026-08-13T13:00:00Z')).date).toBe('2026-08-14')
  })
})

describe('collectDaily', () => {
  // 5 h 00 UTC = 7 h 00 à Paris en août.
  const septHeuresAParis = new Date('2026-08-13T05:00:00Z')

  it('retient un utilisateur à son heure', () => {
    const r = collectDaily([row({})], septHeuresAParis)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ userId: 'u1', kind: 'daily', ref: '2026-08-13' })
  })

  it('écarte un utilisateur hors de la fenêtre', () => {
    expect(collectDaily([row({ dailyReminderTime: '21:00' })], septHeuresAParis)).toHaveLength(0)
  })

  it('accepte dans toute la fenêtre et refuse juste au-delà', () => {
    const dansLaFenetre = `07:0${WINDOW_MINUTES}`.slice(0, 5)
    expect(collectDaily([row({ dailyReminderTime: dansLaFenetre })], septHeuresAParis)).toHaveLength(1)
    expect(collectDaily([row({ dailyReminderTime: '07:09' })], septHeuresAParis)).toHaveLength(0)
  })

  it('écarte un compte dont les notifications sont coupées', () => {
    expect(collectDaily([row({ notificationsEnabled: false })], septHeuresAParis)).toHaveLength(0)
  })

  it('écarte un compte qui n\'a pas demandé le rappel quotidien', () => {
    // Le rappel quotidien est le seul déclencheur inactif par défaut : une clé
    // absente vaut refus, à l'inverse des quatre autres.
    expect(collectDaily([row({ notificationTriggers: {} })], septHeuresAParis)).toHaveLength(0)
    expect(collectDaily([row({ notificationTriggers: { daily: false } })], septHeuresAParis)).toHaveLength(0)
  })

  it('applique l\'heure par défaut quand aucune n\'est enregistrée', () => {
    expect(collectDaily([row({ dailyReminderTime: undefined })], septHeuresAParis)).toHaveLength(1)
  })

  it('applique le fuseau de repli quand aucun n\'est enregistré', () => {
    expect(collectDaily([row({ timeZone: undefined })], septHeuresAParis)).toHaveLength(1)
  })

  it('ignore un fuseau inconnu sans faire tomber les autres', () => {
    const rows = [row({ timeZone: 'Mars/Olympus' }, 'casse'), row({}, 'sain')]
    const r = collectDaily(rows, septHeuresAParis)
    expect(r.map((x) => x.userId)).toEqual(['sain'])
  })

  it('respecte le fuseau de chacun au même instant', () => {
    // Même instant : 7 h à Paris, mais 5 h à Londres. Seul le Parisien qui
    // veut 7 h et le Londonien qui veut 5 h doivent être retenus.
    const rows = [
      row({ timeZone: 'Europe/Paris', dailyReminderTime: '07:00' }, 'paris'),
      row({ timeZone: 'Europe/London', dailyReminderTime: '07:00' }, 'londres'),
      row({ timeZone: 'Europe/London', dailyReminderTime: '06:00' }, 'londres-6h'),
    ]
    expect(collectDaily(rows, septHeuresAParis).map((x) => x.userId)).toEqual(['paris', 'londres-6h'])
  })

  it('donne à chacun la date de son propre fuseau', () => {
    // 13 h UTC : il est déjà le 14 à Auckland. La référence anti-doublon doit
    // suivre la date locale, sinon un utilisateur néo-zélandais recevrait deux
    // rappels dans sa journée.
    const treizeHeuresUTC = new Date('2026-08-13T13:00:00Z')
    const r = collectDaily(
      [row({ timeZone: 'Pacific/Auckland', dailyReminderTime: '01:00' }, 'nz')],
      treizeHeuresUTC,
    )
    expect(r).toHaveLength(1)
    expect(r[0].ref).toBe('2026-08-14')
  })

  it('supporte une ligne de réglages vide', () => {
    expect(collectDaily([{ user_id: 'u', data: null }], septHeuresAParis)).toHaveLength(0)
  })
})
