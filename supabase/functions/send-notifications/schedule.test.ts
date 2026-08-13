import { describe, it, expect } from 'vitest'
import {
  minutesApart, localNow, daysBetween, withinWakingHours, readPrefs,
  collectDaily, collectPlanLate, collectSupportReplies, collectRoadmapDone,
  collectInactive, collectAll,
  WINDOW_MINUTES, INACTIVE_DAYS,
} from './schedule'
import type { SettingsRow, UserPrefs } from './schedule'

/**
 * Les règles d'envoi des notifications.
 *
 * Elles sont testées ici parce qu'elles sont invérifiables en production sans
 * attendre le lendemain, et parce que leurs cas limites — fuseaux décalés
 * d'une demi-heure, passage de minuit, relances répétées — ne se rencontrent
 * pas sur le poste de développement.
 */

/** 5 h UTC = 7 h à Paris en août. */
const SEPT_HEURES_PARIS = new Date('2026-08-13T05:00:00Z')
/** 12 h UTC = 14 h à Paris : hors de toute fenêtre de rappel à 7 h. */
const QUATORZE_HEURES_PARIS = new Date('2026-08-13T12:00:00Z')

const prefs = (over: Partial<UserPrefs> = {}): UserPrefs => ({
  userId: 'u1',
  triggers: {
    daily: true,
    'plan-late': true,
    'support-reply': true,
    'roadmap-done': true,
    inactive: true,
  },
  reminderTime: '07:00',
  timeZone: 'Europe/Paris',
  ...over,
})

describe('minutesApart', () => {
  it('mesure un écart ordinaire', () => {
    expect(minutesApart('07:00', '07:05')).toBe(5)
    expect(minutesApart('07:05', '07:00')).toBe(5)
  })

  it('tient compte du passage de minuit', () => {
    // Sans cela, 23 h 58 et 00 h 03 seraient distants de 1 435 minutes, et un
    // rappel réglé à minuit ne partirait jamais.
    expect(minutesApart('23:58', '00:03')).toBe(5)
    expect(minutesApart('00:03', '23:58')).toBe(5)
  })

  it('mesure le plus court des deux chemins', () => {
    expect(minutesApart('23:00', '01:00')).toBe(120)
    expect(minutesApart('01:00', '13:00')).toBe(720)
  })
})

describe('localNow', () => {
  const instant = new Date('2026-08-13T06:30:00Z')

  it('rend l\'heure locale du fuseau demandé', () => {
    expect(localNow('Europe/Paris', instant).time).toBe('08:30')
    expect(localNow('UTC', instant).time).toBe('06:30')
  })

  it('gère les fuseaux décalés d\'une demi-heure ou d\'un quart d\'heure', () => {
    // C'est ce cas qui impose une cadence au quart d'heure plutôt qu'à l'heure.
    expect(localNow('Asia/Kolkata', instant).time).toBe('12:00')
    expect(localNow('Asia/Kathmandu', instant).time).toBe('12:15')
  })

  it('rend la date locale, qui peut être celle du lendemain', () => {
    expect(localNow('Europe/Paris', instant).date).toBe('2026-08-13')
    expect(localNow('Pacific/Auckland', new Date('2026-08-13T13:00:00Z')).date).toBe('2026-08-14')
  })
})

describe('daysBetween', () => {
  it('compte les jours entiers', () => {
    expect(daysBetween('2026-08-13', '2026-08-13')).toBe(0)
    expect(daysBetween('2026-08-13', '2026-08-20')).toBe(7)
  })

  it('franchit les mois et les années', () => {
    expect(daysBetween('2026-08-31', '2026-09-01')).toBe(1)
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1)
  })

  it('rend un nombre négatif quand la seconde date précède', () => {
    expect(daysBetween('2026-08-20', '2026-08-13')).toBe(-7)
  })
})

describe('withinWakingHours', () => {
  it('accepte la journée et refuse la nuit', () => {
    expect(withinWakingHours('08:00')).toBe(true)
    expect(withinWakingHours('14:30')).toBe(true)
    expect(withinWakingHours('22:00')).toBe(true)
    expect(withinWakingHours('03:00')).toBe(false)
    expect(withinWakingHours('07:59')).toBe(false)
    expect(withinWakingHours('22:01')).toBe(false)
  })
})

describe('readPrefs', () => {
  const row = (data: Record<string, unknown> | null): SettingsRow => ({ user_id: 'u1', data })

  it('écarte un compte dont les notifications sont coupées', () => {
    expect(readPrefs(row({ notificationsEnabled: false }))).toBeNull()
    expect(readPrefs(row({}))).toBeNull()
    expect(readPrefs(row(null))).toBeNull()
  })

  it('n\'active pas le rappel quotidien d\'office', () => {
    const p = readPrefs(row({ notificationsEnabled: true }))
    expect(p?.triggers.daily).toBe(false)
  })

  it('active les quatre autres d\'office', () => {
    const p = readPrefs(row({ notificationsEnabled: true }))
    expect(p?.triggers['plan-late']).toBe(true)
    expect(p?.triggers['support-reply']).toBe(true)
    expect(p?.triggers['roadmap-done']).toBe(true)
    expect(p?.triggers.inactive).toBe(true)
  })

  it('complète un compte réglé avant l\'ajout d\'un déclencheur', () => {
    // Sans complément, une clé absente serait lue comme un refus et le
    // déclencheur nouvellement ajouté n'arriverait jamais.
    const p = readPrefs(row({
      notificationsEnabled: true,
      notificationTriggers: { daily: true, 'plan-late': false },
    }))
    expect(p?.triggers.daily).toBe(true)
    expect(p?.triggers['plan-late']).toBe(false)
    expect(p?.triggers.inactive).toBe(true)
  })

  it('applique les valeurs de repli pour l\'heure et le fuseau', () => {
    const p = readPrefs(row({ notificationsEnabled: true }))
    expect(p?.reminderTime).toBe('07:00')
    expect(p?.timeZone).toBe('Europe/Paris')
  })
})

describe('collectDaily', () => {
  it('retient un utilisateur à son heure', () => {
    const r = collectDaily([prefs()], SEPT_HEURES_PARIS)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ kind: 'daily', ref: '2026-08-13' })
  })

  it('écarte hors de la fenêtre', () => {
    expect(collectDaily([prefs()], QUATORZE_HEURES_PARIS)).toHaveLength(0)
  })

  it('accepte dans toute la fenêtre et refuse juste au-delà', () => {
    expect(collectDaily([prefs({ reminderTime: `07:0${WINDOW_MINUTES}` })], SEPT_HEURES_PARIS)).toHaveLength(1)
    expect(collectDaily([prefs({ reminderTime: '07:09' })], SEPT_HEURES_PARIS)).toHaveLength(0)
  })

  it('écarte qui ne l\'a pas demandé', () => {
    expect(collectDaily([prefs({ triggers: { daily: false } })], SEPT_HEURES_PARIS)).toHaveLength(0)
  })

  it('respecte le fuseau de chacun au même instant', () => {
    const rows = [
      prefs({ userId: 'paris', timeZone: 'Europe/Paris', reminderTime: '07:00' }),
      prefs({ userId: 'londres', timeZone: 'Europe/London', reminderTime: '07:00' }),
      prefs({ userId: 'londres-6h', timeZone: 'Europe/London', reminderTime: '06:00' }),
    ]
    expect(collectDaily(rows, SEPT_HEURES_PARIS).map((r) => r.userId)).toEqual(['paris', 'londres-6h'])
  })

  it('ignore un fuseau inconnu sans faire tomber les autres', () => {
    const rows = [prefs({ userId: 'casse', timeZone: 'Mars/Olympus' }), prefs({ userId: 'sain' })]
    expect(collectDaily(rows, SEPT_HEURES_PARIS).map((r) => r.userId)).toEqual(['sain'])
  })

  it('donne à chacun la date de son propre fuseau', () => {
    const r = collectDaily(
      [prefs({ userId: 'nz', timeZone: 'Pacific/Auckland', reminderTime: '01:00' })],
      new Date('2026-08-13T13:00:00Z'),
    )
    expect(r[0].ref).toBe('2026-08-14')
  })
})

describe('collectPlanLate', () => {
  const plan = { userId: 'u1', planId: 7, planName: 'Bible en un an', earliestLateDate: '2026-08-10' }

  it('relance sur un plan en retard, à l\'heure du rappel', () => {
    const r = collectPlanLate([prefs()], [plan], SEPT_HEURES_PARIS)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ kind: 'plan-late', ref: '7:2026-08-10', url: '/plans/7' })
    expect(r[0].body).toContain('3 jours')
  })

  it('n\'envoie rien hors de l\'heure du rappel', () => {
    // Ce n'est pas urgent : cela peut attendre le créneau choisi.
    expect(collectPlanLate([prefs()], [plan], QUATORZE_HEURES_PARIS)).toHaveLength(0)
  })

  it('accorde le pluriel au retard', () => {
    const hier = { ...plan, earliestLateDate: '2026-08-12' }
    expect(collectPlanLate([prefs()], [hier], SEPT_HEURES_PARIS)[0].body).toContain('depuis hier')
  })

  it('n\'alerte pas pour un jour prévu aujourd\'hui', () => {
    const aujourdhui = { ...plan, earliestLateDate: '2026-08-13' }
    expect(collectPlanLate([prefs()], [aujourdhui], SEPT_HEURES_PARIS)).toHaveLength(0)
  })

  it('garde la même référence tant que le retard n\'est pas entamé', () => {
    // C'est ce qui évite la relance quotidienne : la référence ne dépend pas
    // du jour courant mais du plus ancien jour non coché.
    const jour1 = collectPlanLate([prefs()], [plan], SEPT_HEURES_PARIS)[0].ref
    const jour2 = collectPlanLate([prefs()], [plan], new Date('2026-08-14T05:00:00Z'))[0].ref
    expect(jour1).toBe(jour2)
  })

  it('change de référence quand une partie du retard est rattrapée', () => {
    const rattrape = { ...plan, earliestLateDate: '2026-08-11' }
    const avant = collectPlanLate([prefs()], [plan], SEPT_HEURES_PARIS)[0].ref
    const apres = collectPlanLate([prefs()], [rattrape], SEPT_HEURES_PARIS)[0].ref
    expect(apres).not.toBe(avant)
  })

  it('écarte qui ne l\'a pas demandé, et un plan sans compte connu', () => {
    expect(collectPlanLate([prefs({ triggers: { 'plan-late': false } })], [plan], SEPT_HEURES_PARIS)).toHaveLength(0)
    expect(collectPlanLate([prefs({ userId: 'autre' })], [plan], SEPT_HEURES_PARIS)).toHaveLength(0)
  })
})

describe('collectSupportReplies', () => {
  const reply = { userId: 'u1', ticketId: 3, replyId: 'r-42', authorName: 'Francis' }

  it('prévient dès la plage de veille, sans attendre l\'heure du rappel', () => {
    const r = collectSupportReplies([prefs()], [reply], QUATORZE_HEURES_PARIS)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ kind: 'support-reply', ref: '3:r-42', url: '/support' })
    expect(r[0].body).toContain('Francis')
  })

  it('ne fait pas sonner un téléphone la nuit', () => {
    // 2 h UTC = 4 h à Paris.
    expect(collectSupportReplies([prefs()], [reply], new Date('2026-08-13T02:00:00Z'))).toHaveLength(0)
  })

  it('une référence par réponse, donc une notification par réponse', () => {
    const deux = [reply, { ...reply, replyId: 'r-43' }]
    expect(collectSupportReplies([prefs()], deux, QUATORZE_HEURES_PARIS).map((r) => r.ref))
      .toEqual(['3:r-42', '3:r-43'])
  })

  it('écarte qui ne l\'a pas demandé', () => {
    expect(collectSupportReplies([prefs({ triggers: { 'support-reply': false } })], [reply], QUATORZE_HEURES_PARIS)).toHaveLength(0)
  })
})

describe('collectRoadmapDone', () => {
  const item = { itemId: 18, title: 'Réglage automatique système' }

  it('prévient tous les comptes qui l\'ont demandé', () => {
    const r = collectRoadmapDone([prefs({ userId: 'a' }), prefs({ userId: 'b' })], [item], QUATORZE_HEURES_PARIS)
    expect(r.map((x) => x.userId)).toEqual(['a', 'b'])
    expect(r[0]).toMatchObject({ kind: 'roadmap-done', ref: '18', url: '/roadmap' })
    expect(r[0].body).toContain('Réglage automatique système')
  })

  it('ne fait pas sonner un téléphone la nuit', () => {
    expect(collectRoadmapDone([prefs()], [item], new Date('2026-08-13T02:00:00Z'))).toHaveLength(0)
  })

  it('une référence par item, donc une seule notification par personne', () => {
    const deux = [item, { itemId: 8, title: 'Modale de sélection' }]
    expect(collectRoadmapDone([prefs()], deux, QUATORZE_HEURES_PARIS).map((r) => r.ref)).toEqual(['18', '8'])
  })

  it('écarte qui ne l\'a pas demandé', () => {
    expect(collectRoadmapDone([prefs({ triggers: { 'roadmap-done': false } })], [item], QUATORZE_HEURES_PARIS)).toHaveLength(0)
  })
})

describe('collectInactive', () => {
  const vieux = [{ userId: 'u1', date: '2026-08-01' }] // 12 jours avant le 13

  it('relance après le seuil d\'absence', () => {
    const r = collectInactive([prefs()], vieux, SEPT_HEURES_PARIS)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ kind: 'inactive', ref: '2026-08-01' })
  })

  it('ne relance pas avant le seuil', () => {
    const recent = [{ userId: 'u1', date: '2026-08-12' }]
    expect(collectInactive([prefs()], recent, SEPT_HEURES_PARIS)).toHaveLength(0)
  })

  it('relance pile au seuil', () => {
    const pile = [{ userId: 'u1', date: '2026-08-06' }] // 7 jours
    expect(daysBetween('2026-08-06', '2026-08-13')).toBe(INACTIVE_DAYS)
    expect(collectInactive([prefs()], pile, SEPT_HEURES_PARIS)).toHaveLength(1)
  })

  it('garde la même référence pendant toute l\'absence', () => {
    // La référence est la dernière lecture, pas le jour courant : la relance
    // part une fois par absence, et non chaque jour où l'absence dure.
    const j1 = collectInactive([prefs()], vieux, SEPT_HEURES_PARIS)[0].ref
    const j2 = collectInactive([prefs()], vieux, new Date('2026-08-20T05:00:00Z'))[0].ref
    expect(j1).toBe(j2)
  })

  it('ouvre un nouveau droit à relance après une lecture', () => {
    const apresLecture = [{ userId: 'u1', date: '2026-08-13' }]
    const plusTard = new Date('2026-08-25T05:00:00Z')
    const r = collectInactive([prefs()], apresLecture, plusTard)
    expect(r[0].ref).toBe('2026-08-13')
  })

  it('ne relance pas un compte qui n\'a jamais rien lu', () => {
    // Il n'y a pas d'absence à constater, et ce n'est pas à ce mécanisme
    // d'accueillir les nouveaux venus.
    expect(collectInactive([prefs()], [], SEPT_HEURES_PARIS)).toHaveLength(0)
  })

  it('attend l\'heure du rappel', () => {
    expect(collectInactive([prefs()], vieux, QUATORZE_HEURES_PARIS)).toHaveLength(0)
  })
})

describe('collectAll', () => {
  const settings: SettingsRow[] = [{
    user_id: 'u1',
    data: {
      notificationsEnabled: true,
      notificationTriggers: { daily: true },
      dailyReminderTime: '07:00',
      timeZone: 'Europe/Paris',
    },
  }]

  it('réunit les déclencheurs qui tombent au même instant', () => {
    const r = collectAll({
      settings,
      latePlans: [{ userId: 'u1', planId: 7, planName: 'Plan', earliestLateDate: '2026-08-10' }],
      supportReplies: [{ userId: 'u1', ticketId: 3, replyId: 'r-1', authorName: 'A' }],
      roadmapDone: [{ itemId: 18, title: 'T' }],
      lastReadings: [{ userId: 'u1', date: '2026-08-01' }],
    }, SEPT_HEURES_PARIS)

    // 7 h est dans la fenêtre du rappel, mais hors plage de veille (8 h–22 h) :
    // les deux déclencheurs événementiels attendent, les trois autres partent.
    expect(r.map((x) => x.kind).sort()).toEqual(['daily', 'inactive', 'plan-late'])
  })

  it('n\'envoie rien à un compte qui a coupé l\'interrupteur général', () => {
    const coupe: SettingsRow[] = [{ user_id: 'u1', data: { notificationsEnabled: false } }]
    const r = collectAll({
      settings: coupe,
      latePlans: [{ userId: 'u1', planId: 7, planName: 'Plan', earliestLateDate: '2026-08-10' }],
      supportReplies: [{ userId: 'u1', ticketId: 3, replyId: 'r-1', authorName: 'A' }],
      roadmapDone: [{ itemId: 18, title: 'T' }],
      lastReadings: [{ userId: 'u1', date: '2026-08-01' }],
    }, SEPT_HEURES_PARIS)
    expect(r).toHaveLength(0)
  })
})
