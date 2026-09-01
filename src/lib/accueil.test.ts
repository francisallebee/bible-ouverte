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
function bloc(nom: string, suivant: string): string {
  const source = readFileSync('src/components/Sidebar.tsx', 'utf8')
  const debut = source.indexOf(`export const ${nom}`)
  const fin = suivant ? source.indexOf(suivant, debut) : source.length
  expect(debut, `${nom} introuvable dans Sidebar.tsx`).toBeGreaterThan(-1)
  expect(fin, `fin de ${nom} introuvable`).toBeGreaterThan(debut)
  return source.slice(debut, fin)
}

/** Les entrées du menu principal. */
function hrefsDuMenu(): string[] {
  // `Array.from` et non l'étalement : `matchAll` rend un itérateur, que `tsc`
  // refuse d'étaler sans `--downlevelIteration` — vitest, lui, laisse passer.
  // C'est le piège 10 du dépôt, sous un autre visage que le `Set`.
  return Array.from(
    bloc('NAV_LINKS', 'export const NAV_COMPTE').matchAll(/\{ href: "([^"]+)"/g),
    (m) => m[1],
  )
}

/**
 * Les entrées du bloc du bas restées masquables.
 *
 * Feuille de route, Support et Soutenir y sont descendues le 2 septembre 2026
 * sans cesser d'être des pages ordinaires : elles ont perdu le
 * réordonnancement, pas la visibilité ni le droit d'être une page d'accueil.
 * C'est `masquable: true` qui les distingue de Réglages et des écrans réservés.
 */
function hrefsMasquablesDuBas(): string[] {
  return Array.from(
    bloc('NAV_COMPTE', 'export default function').matchAll(
      /\{ href: "([^"]+)"[^}]*masquable: true/g,
    ),
    (m) => m[1],
  )
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
  it('proposent exactement les écrans ordinaires, des deux blocs', () => {
    const menu = hrefsDuMenu()
    const basMasquables = hrefsMasquablesDuBas()
    expect(menu.length, 'le menu principal doit avoir des entrées').toBeGreaterThan(5)
    expect(basMasquables.length, 'le bloc du bas doit porter ses masquables').toBe(3)
    expect([...PAGES_ACCUEIL].sort()).toEqual([...menu, ...basMasquables].sort())
  })

  it('portent les trois pages descendues sous Réglages', () => {
    // Elles ont changé de bloc le 2 septembre 2026 ; les retirer du choix
    // d'accueil aurait été un effet de bord, pas une décision.
    for (const href of ['/roadmap', '/support', '/soutenir']) {
      expect(PAGES_ACCUEIL).toContain(href)
      expect(hrefsDuMenu(), `${href} a quitté le menu principal`).not.toContain(href)
    }
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

/**
 * Les chemins par lesquels on entre dans l'application.
 *
 * Le réglage a été livré le 1er septembre 2026 et **n'a rien changé pour son
 * demandeur**, qui a signalé le lendemain que l'application revenait toujours
 * sur Nouvelle lecture. La cause : le middleware ne décide que sur `/` et
 * `/auth/*`, et **quatre chemins ne passaient pas par là** — le `start_url` du
 * manifeste, que la PWA rouvre directement ; la redirection après connexion ;
 * celle du lien de confirmation ; et le logo de la barre latérale.
 *
 * L'essai qui avait validé la fonction naviguait explicitement vers `/` : il
 * n'a donc prouvé que le chemin qu'il avait traversé. C'est « un `200` ne
 * prouve que ce qu'il a traversé », transposé à une redirection.
 *
 * Ces tests-ci veillent sur les chemins, pas sur la règle : ils lisent les
 * sources, comme celui du menu plus haut, et pour la même raison.
 */
describe('les chemins d’entrée', () => {
  it('le manifeste ouvre la racine, pas un écran nommé', () => {
    // `start_url` est ce que la PWA ouvre depuis l'écran d'accueil, sans jamais
    // passer par le middleware si on y nomme une page.
    const manifeste = JSON.parse(readFileSync('public/manifest.json', 'utf8'))
    expect(manifeste.start_url).toBe('/')
  })

  it('la connexion et le lien de confirmation laissent décider le middleware', () => {
    for (const fichier of ['src/app/auth/login/page.tsx', 'src/app/auth/callback/page.tsx']) {
      const source = readFileSync(fichier, 'utf8')
      const pousses = Array.from(source.matchAll(/router\.(?:push|replace)\('([^']+)'\)/g), (m) => m[1])
      expect(pousses, `${fichier} ne doit pousser aucun écran nommé`)
        .not.toContain(ACCUEIL_DEFAUT)
    }
  })

  it('le logo de la barre latérale suit le réglage', () => {
    const source = readFileSync('src/components/Sidebar.tsx', 'utf8')
    expect(source, 'le logo doit appeler pageAccueil').toContain('href={pageAccueil(')
  })
})
