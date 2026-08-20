import { describe, it, expect } from 'vitest'
import {
  PROVENANCES, estProvenance, nomAffiche, pourSAdresser, identiteComplete,
} from './identite'

describe('provenances', () => {
  it('n’en connaît que quatre, celles que la contrainte accepte', () => {
    expect(PROVENANCES).toEqual(['internet', 'reseaux', 'connaissance', 'autre'])
  })

  it('refuse ce que la base refuserait', () => {
    expect(estProvenance('internet')).toBe(true)
    expect(estProvenance('Internet')).toBe(false)
    expect(estProvenance('bouche-à-oreille')).toBe(false)
    expect(estProvenance(undefined)).toBe(false)
    expect(estProvenance(null)).toBe(false)
  })
})

describe('nom d’affichage', () => {
  it('compose le prénom et le nom', () => {
    expect(nomAffiche({ firstName: 'Jean', lastName: 'Dupont' })).toBe('Jean Dupont')
  })

  it('se contente du prénom quand le nom manque', () => {
    expect(nomAffiche({ firstName: 'Jean', lastName: null })).toBe('Jean')
  })

  it('garde le nom d’avant pour les comptes antérieurs', () => {
    // Les 112 comptes du 20 août 2026 n'ont que `name`.
    expect(nomAffiche({ firstName: null, lastName: null, name: 'francisallebee' }))
      .toBe('francisallebee')
  })

  it('préfère le composé au nom d’avant, pour que Profil se répercute partout', () => {
    // Sans cela, changer son prénom laisserait l'ancien nom dans le tableau
    // d'administration et sur ses tickets.
    expect(nomAffiche({ firstName: 'Jean', lastName: 'Dupont', name: 'jdupont' }))
      .toBe('Jean Dupont')
  })

  it('ignore les blancs, comme le trigger', () => {
    expect(nomAffiche({ firstName: '  ', lastName: '  ', name: 'repli' })).toBe('repli')
    expect(nomAffiche({ firstName: ' Jean ', lastName: ' Dupont ' })).toBe('Jean Dupont')
  })

  it('rend le repli plutôt que rien', () => {
    expect(nomAffiche({}, 'compte sans nom')).toBe('compte sans nom')
    expect(nomAffiche({})).toBe('')
  })
})

describe('comment s’adresser à quelqu’un', () => {
  it('emploie le prénom seul, jamais le nom de famille', () => {
    // « Bonjour Dupont » sonne comme une facture.
    expect(pourSAdresser({ firstName: 'Jean', lastName: 'Dupont' }, 'ami')).toBe('Jean')
  })

  it('retombe sur le nom d’affichage puis sur le repli', () => {
    expect(pourSAdresser({ name: 'jdupont' }, 'ami')).toBe('jdupont')
    expect(pourSAdresser({}, 'ami')).toBe('ami')
  })
})

describe('identité complète', () => {
  it('exige le prénom et le nom, et rien de plus', () => {
    expect(identiteComplete({ firstName: 'Jean', lastName: 'Dupont' })).toBe(true)
  })

  it('refuse l’un sans l’autre', () => {
    expect(identiteComplete({ firstName: 'Jean' })).toBe(false)
    expect(identiteComplete({ lastName: 'Dupont' })).toBe(false)
  })

  it('ne se laisse pas berner par des espaces', () => {
    expect(identiteComplete({ firstName: '   ', lastName: 'Dupont' })).toBe(false)
  })

  it('ne compte pas le `name` d’avant comme une identité', () => {
    // C'est exactement le cas des 112 comptes existants : ils ont un `name`,
    // et ils doivent tout de même passer par la complétion.
    expect(identiteComplete({ name: 'francisallebee' })).toBe(false)
  })

  it('rend faux plutôt que de lever sur un profil absent', () => {
    expect(identiteComplete(null)).toBe(false)
    expect(identiteComplete(undefined)).toBe(false)
  })
})
