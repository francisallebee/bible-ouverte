import { describe, it, expect } from 'vitest'
import {
  validerMessage, apercu, compterNonLus, ordonnerFil, SUJET_MAX, CORPS_MAX,
} from './messages'
import type { Message } from './messages'

const msg = (over: Partial<Message> = {}): Message => ({
  id: 1,
  userId: 'u1',
  fromAdmin: true,
  subject: 'Bonjour',
  body: 'Un message',
  archivedAt: null,
  sentByName: 'Admin',
  readAt: null,
  createdAt: '2026-08-20T09:00:00.000Z',
  ...over,
})

describe('validation', () => {
  const brouillon = { subject: 'Titre', body: 'Corps' }

  it('laisse passer un message correct', () => {
    expect(validerMessage(brouillon, ['u1'])).toBeNull()
  })

  it('refuse un envoi sans destinataire', () => {
    expect(validerMessage(brouillon, [])).toBe('sansDestinataire')
  })

  it('refuse un corps vide, même plein d’espaces', () => {
    expect(validerMessage({ subject: 'Titre', body: '   \n  ' }, ['u1'])).toBe('corpsVide')
  })

  it('accepte un sujet vide : un mot court n’a pas toujours de titre', () => {
    expect(validerMessage({ subject: '', body: 'Merci !' }, ['u1'])).toBeNull()
  })

  it('borne le sujet et le corps', () => {
    expect(validerMessage({ subject: 'x'.repeat(SUJET_MAX + 1), body: 'ok' }, ['u1']))
      .toBe('sujetTropLong')
    expect(validerMessage({ subject: '', body: 'x'.repeat(CORPS_MAX + 1) }, ['u1']))
      .toBe('corpsTropLong')
  })

  it('ne compte pas les espaces dans la longueur', () => {
    expect(validerMessage({ subject: ' ' + 'x'.repeat(SUJET_MAX) + ' ', body: 'ok' }, ['u1']))
      .toBeNull()
  })

  it('vérifie le destinataire avant le contenu', () => {
    // Dire « corps vide » alors que personne n'est sélectionné enverrait
    // corriger la mauvaise chose.
    expect(validerMessage({ subject: '', body: '' }, [])).toBe('sansDestinataire')
  })
})

describe('aperçu', () => {
  it('met les sauts de ligne à plat', () => {
    expect(apercu('deux\nlignes')).toBe('deux lignes')
  })

  it('rend le texte tel quel quand il tient', () => {
    expect(apercu('court')).toBe('court')
  })

  it('coupe au mot plutôt qu’au caractère', () => {
    const long = 'anniversaire '.repeat(20)
    const court = apercu(long, 30)
    expect(court.endsWith('…')).toBe(true)
    expect(court).not.toContain('annive…')
    expect(court.length).toBeLessThanOrEqual(31)
  })

  it('coupe tout de même un mot interminable', () => {
    // Sans le garde-fou du 60 %, un seul mot très long rendrait une chaîne vide.
    expect(apercu('x'.repeat(200), 20)).toBe('x'.repeat(20) + '…')
  })
})

describe('non lus', () => {
  it('ne compte que ce qui vient de l’administration', () => {
    // Ses propres réponses n'ont pas de `readAt` et gonfleraient la pastille.
    const l = [msg(), msg({ id: 2, fromAdmin: false }), msg({ id: 3, readAt: '2026-08-20T10:00:00.000Z' })]
    expect(compterNonLus(l)).toBe(1)
  })

  it('rend zéro sur un fil vide', () => {
    expect(compterNonLus([])).toBe(0)
  })
})

describe('ordre du fil', () => {
  it('se lit du plus ancien au plus récent', () => {
    const l = [msg({ id: 2, createdAt: '2026-08-20T12:00:00.000Z' }), msg({ id: 1, createdAt: '2026-08-20T09:00:00.000Z' })]
    expect(ordonnerFil(l).map((m) => m.id)).toEqual([1, 2])
  })

  it('ne modifie pas la liste reçue', () => {
    const l = [msg({ id: 2, createdAt: '2026-08-20T12:00:00.000Z' }), msg({ id: 1 })]
    ordonnerFil(l)
    expect(l.map((m) => m.id)).toEqual([2, 1])
  })
})
