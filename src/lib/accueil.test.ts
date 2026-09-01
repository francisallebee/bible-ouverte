import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { pageAccueil, PAGES_ACCUEIL, ACCUEIL_DEFAUT } from './accueil'

/**
 * Les entrées du menu principal, **lues dans le source**.
 *
 * `Sidebar.tsx` ne peut pas être importé ici : vitest n'a pas de plugin JSX
 * dans ce dépôt, qui ne teste que des modules purs. Lire le fichier est
 * inhabituel, et c'est assumé — c'est le seul garde-fou possible contre la
 * divergence de deux listes qui décrivent la même réalité, et un garde-fou
 * inhabituel vaut mieux que pas de garde-fou. Il casse si le format des entrées
 * change, ce qui est exactement le moment où quelqu'un doit relire ce test.
 */
function hrefsDuMenu(): string[] {
  const source = readFileSync('src/components/Sidebar.tsx', 'utf8')
  const debut = source.indexOf('export const NAV_LINKS')
  const fin = source.indexOf('export const NAV_COMPTE')
  expect(debut, 'NAV_LINKS introuvable dans Sidebar.tsx').toBeGreaterThan(-1)
  expect(fin, 'NAV_COMPTE introuvable dans Sidebar.tsx').toBeGreaterThan(debut)
  // `Array.from` et non l'étalement : `matchAll` rend un itérateur, que `tsc`
  // refuse d'étaler sans `--downlevelIteration` — vitest, lui, laisse passer.
  // C'est le piège 10 du dépôt, sous un autre visage que le `Set`.
  return Array.from(source.slice(debut, fin).matchAll(/\{ href: "([^"]+)"/g), (m) => m[1])
}

/**
 * Ce que ces tests protègent.
 *
 * `PAGES_ACCUEIL` et `NAV_LINKS` disent la même chose et ne peuvent pas être le
 * même objet : l'une sert le middleware, sur le serveur, l'autre porte des
 * icônes React. Deux listes indépendantes qui décrivent la même réalité, c'est
 * exactement ce qui a fait payer la règle 13 — une version biblique qui
 * s'affichait, se laissait cocher et échouait au téléchargement, parce que la
 * troisième table l'ignorait. La comparaison dans les deux sens est le seul
 * garde-fou possible ici.
 */
describe('les deux listes de pages', () => {
  it('proposent exactement les écrans du menu principal', () => {
    const menu = hrefsDuMenu()
    expect(menu.length, 'le menu principal doit avoir des entrées').toBeGreaterThan(5)
    expect([...PAGES_ACCUEIL].sort()).toEqual([...menu].sort())
  })

  it('ne proposent aucun écran de compte', () => {
    // `/settings`, `/admin` et `/avance` vivent dans `NAV_COMPTE`. Un compte
    // ordinaire qui atterrirait sur une page réservée verrait un refus d'accès
    // à chaque ouverture de l'application.
    for (const href of ['/settings', '/admin', '/avance', '/profil']) {
      expect(PAGES_ACCUEIL).not.toContain(href)
    }
  })

  it('portent le défaut', () => {
    expect(PAGES_ACCUEIL).toContain(ACCUEIL_DEFAUT)
  })
})

describe('pageAccueil', () => {
  it('rend le défaut quand rien n’est choisi', () => {
    expect(pageAccueil(undefined)).toBe(ACCUEIL_DEFAUT)
    expect(pageAccueil(null)).toBe(ACCUEIL_DEFAUT)
    expect(pageAccueil('')).toBe(ACCUEIL_DEFAUT)
  })

  it('rend la page choisie', () => {
    expect(pageAccueil('/history')).toBe('/history')
    expect(pageAccueil('/verset-du-jour')).toBe('/verset-du-jour')
  })

  it('revient au défaut sur une page qui n’existe plus', () => {
    // Une page retirée du produit laisserait sinon son lecteur sur un 404 à
    // chaque ouverture, sans qu'il sache où le corriger.
    expect(pageAccueil('/contexts')).toBe(ACCUEIL_DEFAUT)
    expect(pageAccueil('/admin')).toBe(ACCUEIL_DEFAUT)
  })

  it('revient au défaut sur une page masquée', () => {
    // Les deux réglages vivent dans le même `jsonb` : rien n'empêche de choisir
    // une page puis de la masquer. Atterrir dessus donnerait un écran caché,
    // qu'on ne pourrait plus quitter par la barre latérale.
    expect(pageAccueil('/quiz', ['/quiz'])).toBe(ACCUEIL_DEFAUT)
  })

  it('ignore un masquage qui ne concerne pas le choix', () => {
    expect(pageAccueil('/quiz', ['/stats', '/roadmap'])).toBe('/quiz')
  })

  it('rend le défaut même si le défaut lui-même est masqué', () => {
    // `/new-reading` n'est pas masquable aujourd'hui, mais le repli ne doit
    // pas dépendre de cette promesse : il vaut mieux un écran caché qu'une
    // redirection vers rien.
    expect(pageAccueil('/quiz', ['/quiz', ACCUEIL_DEFAUT])).toBe(ACCUEIL_DEFAUT)
  })
})
