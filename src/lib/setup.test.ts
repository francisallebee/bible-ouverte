import { describe, it, expect } from 'vitest'
import {
  HIDEABLE_PAGES, isHideable, isPageVisible, shouldForceSetup, SETUP_REQUIRED_FROM,
} from './setup'

const APRES = new Date(SETUP_REQUIRED_FROM + 86400000).toISOString()
const AVANT = new Date(SETUP_REQUIRED_FROM - 86400000).toISOString()

describe('pages masquables', () => {
  it('ne laisse jamais masquer Réglages ni Nouvelle lecture', () => {
    expect(isHideable('/settings')).toBe(false)
    expect(isHideable('/new-reading')).toBe(false)
    expect(isHideable('/admin')).toBe(false)
  })

  it('laisse masquer les neuf autres', () => {
    expect(HIDEABLE_PAGES).toHaveLength(10)
    for (const href of HIDEABLE_PAGES) expect(isHideable(href)).toBe(true)
  })

  it('affiche tout quand rien n’est masqué', () => {
    expect(isPageVisible('/stats', undefined)).toBe(true)
    expect(isPageVisible('/stats', [])).toBe(true)
  })

  it('masque ce qui est listé, et rien d’autre', () => {
    expect(isPageVisible('/stats', ['/stats'])).toBe(false)
    expect(isPageVisible('/plans', ['/stats'])).toBe(true)
  })

  it('ignore une liste qui prétendrait masquer Réglages', () => {
    expect(isPageVisible('/settings', ['/settings'])).toBe(true)
    expect(isPageVisible('/new-reading', ['/new-reading'])).toBe(true)
  })
})

describe('passage obligé par les Réglages', () => {
  it('se tait tant que les réglages ne sont pas chargés', () => {
    expect(shouldForceSetup(APRES, null)).toBe(false)
    expect(shouldForceSetup(APRES, undefined)).toBe(false)
  })

  it('attend que le parcours découverte soit passé', () => {
    expect(shouldForceSetup(APRES, {})).toBe(false)
  })

  it('conduit un compte neuf aux Réglages après le parcours', () => {
    expect(shouldForceSetup(APRES, { tourCompletedAt: APRES })).toBe(true)
  })

  it('dispense les comptes créés avant la livraison', () => {
    expect(shouldForceSetup(AVANT, { tourCompletedAt: AVANT })).toBe(false)
  })

  it('ne redemande rien une fois la personnalisation faite', () => {
    expect(shouldForceSetup(APRES, { tourCompletedAt: APRES, setupCompletedAt: APRES })).toBe(false)
  })

  it('ne dérange personne sur une date illisible ou absente', () => {
    expect(shouldForceSetup('pas une date', { tourCompletedAt: APRES })).toBe(false)
    expect(shouldForceSetup(undefined, { tourCompletedAt: APRES })).toBe(false)
  })
})
