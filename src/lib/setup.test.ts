import { describe, it, expect } from 'vitest'
import {
  HIDEABLE_PAGES, isHideable, isPageVisible, shouldForceSetup, SETUP_REQUIRED_FROM,
  ordonnerPages, deplacerPage,
} from './setup'

const APRES = new Date(SETUP_REQUIRED_FROM + 86400000).toISOString()
const AVANT = new Date(SETUP_REQUIRED_FROM - 86400000).toISOString()

describe('pages masquables', () => {
  it('ne laisse jamais masquer Réglages ni Nouvelle lecture', () => {
    expect(isHideable('/settings')).toBe(false)
    expect(isHideable('/new-reading')).toBe(false)
    expect(isHideable('/admin')).toBe(false)
  })

  it('laisse masquer les douze autres', () => {
    // Le compte est là pour être mis en défaut, et il l'a été deux fois le
    // 20 août 2026 : à l'ajout de `/messages`, puis au retrait de `/profil`,
    // qui a quitté le menu — le bloc avatar du bas de la barre y mène déjà.
    expect(HIDEABLE_PAGES).toHaveLength(12)
    expect(HIDEABLE_PAGES).toContain('/messages')
    expect(HIDEABLE_PAGES).not.toContain('/profil')
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


/** Un menu réduit, suffisant pour éprouver la règle. */
const MENU = [
  { href: '/new-reading' },
  { href: '/plans' },
  { href: '/search' },
  { href: '/history' },
]

describe('ordre des pages', () => {
  it('garde l’ordre d’origine sans réglage', () => {
    expect(ordonnerPages(MENU, undefined).map((e) => e.href))
      .toEqual(['/new-reading', '/plans', '/search', '/history'])
    expect(ordonnerPages(MENU, []).map((e) => e.href))
      .toEqual(['/new-reading', '/plans', '/search', '/history'])
  })

  it('suit l’ordre enregistré', () => {
    const ordre = ['/history', '/search', '/plans', '/new-reading']
    expect(ordonnerPages(MENU, ordre).map((e) => e.href)).toEqual(ordre)
  })

  /**
   * Le cas qui justifie la règle : une page livrée après que l'utilisateur a
   * rangé son menu doit apparaître, et non disparaître faute d'être citée.
   */
  it('fait suivre les pages absentes du réglage, à leur place d’origine', () => {
    const ordre = ['/history', '/plans']
    expect(ordonnerPages(MENU, ordre).map((e) => e.href))
      .toEqual(['/history', '/plans', '/new-reading', '/search'])
  })

  it('ignore un href qui n’existe plus', () => {
    const ordre = ['/page-supprimee', '/history']
    expect(ordonnerPages(MENU, ordre).map((e) => e.href))
      .toEqual(['/history', '/new-reading', '/plans', '/search'])
  })

  it('ne place pas deux fois un href répété', () => {
    const ordre = ['/plans', '/plans', '/search']
    const rendu = ordonnerPages(MENU, ordre).map((e) => e.href)
    expect(rendu).toEqual(['/plans', '/search', '/new-reading', '/history'])
    expect(new Set(rendu).size).toBe(rendu.length)
  })

  it('ne perd et n’invente aucune entrée', () => {
    for (const ordre of [undefined, [], ['/search'], ['/history', '/x', '/plans']]) {
      const rendu = ordonnerPages(MENU, ordre)
      expect(rendu).toHaveLength(MENU.length)
      expect(new Set(rendu.map((e) => e.href))).toEqual(new Set(MENU.map((e) => e.href)))
    }
  })
})

describe('déplacement d’un cran', () => {
  const L = ['/a', '/b', '/c']

  it('monte une entrée', () => {
    expect(deplacerPage(L, '/c', -1)).toEqual(['/a', '/c', '/b'])
  })

  it('descend une entrée', () => {
    expect(deplacerPage(L, '/a', 1)).toEqual(['/b', '/a', '/c'])
  })

  it('ne fait rien aux bornes', () => {
    expect(deplacerPage(L, '/a', -1)).toEqual(L)
    expect(deplacerPage(L, '/c', 1)).toEqual(L)
  })

  it('ne fait rien sur un href inconnu', () => {
    expect(deplacerPage(L, '/inconnu', -1)).toEqual(L)
  })

  it('ne modifie pas la liste reçue', () => {
    const source = ['/a', '/b', '/c']
    deplacerPage(source, '/a', 1)
    expect(source).toEqual(['/a', '/b', '/c'])
  })
})
