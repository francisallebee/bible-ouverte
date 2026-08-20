import { describe, it, expect } from 'vitest'
import { actionsDuPatch, ACTIONS_ADMIN } from './journal'

describe('ce qu’un PATCH a réellement changé', () => {
  const avant = { is_admin: false, suspended: false }

  it('reconnaît une promotion et une rétrogradation', () => {
    expect(actionsDuPatch({ is_admin: true }, avant)).toEqual(['promote'])
    expect(actionsDuPatch({ is_admin: false }, { ...avant, is_admin: true })).toEqual(['demote'])
  })

  it('reconnaît une suspension et une réactivation', () => {
    expect(actionsDuPatch({ suspended: true }, avant)).toEqual(['suspend'])
    expect(actionsDuPatch({ suspended: false }, { ...avant, suspended: true })).toEqual(['reactivate'])
  })

  it('n’inscrit rien quand la valeur demandée est déjà en place', () => {
    // Journaliser une suspension sur un compte déjà suspendu donnerait la trace
    // de quelque chose qui n'a pas eu lieu.
    expect(actionsDuPatch({ suspended: false }, avant)).toEqual([])
    expect(actionsDuPatch({ is_admin: false }, avant)).toEqual([])
  })

  it('rend les deux quand les deux bougent', () => {
    expect(actionsDuPatch({ is_admin: true, suspended: true }, avant))
      .toEqual(['promote', 'suspend'])
  })

  it('ignore un champ absent ou d’un autre type', () => {
    expect(actionsDuPatch({}, avant)).toEqual([])
    expect(actionsDuPatch({ suspended: 'oui' }, avant)).toEqual([])
    expect(actionsDuPatch({ is_admin: 1 }, avant)).toEqual([])
  })

  it('ne connaît que six actions', () => {
    expect(ACTIONS_ADMIN).toEqual([
      'promote', 'demote', 'suspend', 'reactivate', 'delete_account', 'message',
    ])
  })
})
