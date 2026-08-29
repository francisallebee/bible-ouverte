/**
 * Personnalisation obligatoire à la première ouverture, et pages masquables.
 *
 * Deux choses distinctes qui vivent ensemble parce qu'elles se rencontrent au
 * même endroit : l'écran Réglages, par lequel tout nouveau compte doit passer
 * une fois, et où il choisit notamment les pages qu'il veut voir.
 *
 * Les deux réglages vivent dans la colonne `jsonb` — ni migration, ni piège
 * des trois chemins. C'est l'exception documentée dans `AGENTS.md`.
 */

/**
 * Les pages que l'utilisateur peut retirer de son menu.
 *
 * `/settings` n'y est pas, et ne doit jamais y être : la masquer rendrait tout
 * réglage irréversible, y compris celui-là. `/new-reading` non plus — c'est la
 * page d'arrivée après connexion, celle vers laquelle le middleware redirige.
 * `/admin` n'y figure pas davantage : elle est déjà réservée aux
 * administrateurs, et un masquage par-dessus n'ajouterait rien.
 */
/*
 * `/profil` n'y figure plus depuis le 20 août 2026 : elle a quitté le menu, le
 * bloc avatar du bas de la barre y menant déjà. Masquer une page qui n'est plus
 * listée n'aurait rien masqué. Les réglages qui la contiennent encore ne
 * gênent pas : `isPageVisible` ne consulte la liste que pour les pages
 * masquables.
 */
export const HIDEABLE_PAGES = [
  '/plans',
  '/search',
  '/progress',
  '/history',
  '/stats',
  '/quiz',
  '/verset-du-jour',
  '/memorisation',
  '/roadmap',
  '/messages',
  '/support',
  '/soutenir',
] as const

export type HideablePage = (typeof HIDEABLE_PAGES)[number]

export function isHideable(href: string): boolean {
  return (HIDEABLE_PAGES as readonly string[]).includes(href)
}

/**
 * Une page est visible tant qu'elle n'a pas été explicitement masquée.
 *
 * Le défaut est donc « tout visible », y compris pour un réglage absent : une
 * page ajoutée plus tard apparaît chez tout le monde, plutôt que de rester
 * invisible chez ceux qui avaient enregistré leur liste avant elle.
 */
export function isPageVisible(href: string, hidden: string[] | undefined): boolean {
  if (!hidden || hidden.length === 0) return true
  if (!isHideable(href)) return true
  return !hidden.includes(href)
}

/**
 * Le menu, rangé dans l'ordre choisi par l'utilisateur.
 *
 * **La liste enregistrée peut être partielle, et c'est le point.** Ce qui y
 * figure passe devant, dans cet ordre ; tout le reste suit dans l'ordre
 * d'origine. Une page livrée après que quelqu'un a rangé son menu apparaît
 * donc chez lui, à sa place naturelle, au lieu de disparaître faute d'être
 * citée — c'est la même règle de prudence que `isPageVisible`, où le défaut
 * est « visible ».
 *
 * Symétriquement, un `href` cité mais qui n'existe plus est ignoré : une page
 * retirée du produit ne doit pas laisser un trou dans le menu de ceux qui
 * l'avaient rangée.
 *
 * Générique parce que l'appelant possède ses propres entrées — la barre
 * latérale ses liens, l'écran Réglages les siens — et que ce module n'a pas à
 * connaître React ni les icônes.
 */
export function ordonnerPages<T extends { href: string }>(
  entrees: readonly T[],
  ordre: string[] | undefined,
): T[] {
  if (!ordre || ordre.length === 0) return [...entrees]

  const parHref = new Map(entrees.map((e) => [e.href, e]))
  const citees: T[] = []
  const dejaPlacees = new Set<string>()

  for (const href of ordre) {
    const entree = parHref.get(href)
    // Un href inconnu — page retirée, réglage d'une version antérieure — ne
    // produit rien plutôt qu'un trou.
    if (!entree || dejaPlacees.has(href)) continue
    citees.push(entree)
    dejaPlacees.add(href)
  }

  const reste = entrees.filter((e) => !dejaPlacees.has(e.href))
  return [...citees, ...reste]
}

/**
 * L'ordre après un déplacement d'un cran.
 *
 * Rend la liste **complète** des `href`, et non le seul fragment déplacé :
 * enregistrer un ordre partiel après un déplacement ferait remonter d'un coup
 * toutes les pages non citées, ce qui n'est pas ce qu'on vient de demander.
 *
 * Un déplacement hors des bornes rend la liste inchangée — le bouton
 * correspondant est désactivé à l'écran, mais la règle ne s'appuie pas là-dessus.
 */
export function deplacerPage(
  hrefs: readonly string[],
  href: string,
  sens: -1 | 1,
): string[] {
  const index = hrefs.indexOf(href)
  if (index === -1) return [...hrefs]

  const cible = index + sens
  if (cible < 0 || cible >= hrefs.length) return [...hrefs]

  const suite = [...hrefs]
  const [deplacee] = suite.splice(index, 1)
  suite.splice(cible, 0, deplacee)
  return suite
}

/**
 * Date de livraison du passage obligé.
 *
 * Les comptes créés avant elle en sont dispensés. Sans ce garde-fou, les 111
 * comptes existants auraient été renvoyés aux Réglages à leur ouverture
 * suivante — or la demande vise « tout nouvel utilisateur », pas tout le monde.
 */
export const SETUP_REQUIRED_FROM = Date.parse('2026-08-19T00:00:00.000Z')

/**
 * Faut-il conduire ce compte aux Réglages ?
 *
 * L'ordre importe et il a été choisi : **le parcours découverte passe
 * d'abord**. Il explique l'application ; on ne demande pas à quelqu'un de
 * masquer des pages qu'il n'a pas encore vues. Tant que `tourCompletedAt` est
 * absent, cette fonction se tait donc.
 *
 * Elle se tait aussi tant que les réglages ne sont pas chargés : les lancer
 * avant reviendrait à imposer le passage à chaque ouverture le temps que le
 * cache réponde. C'est la même précaution que `shouldStartTour`.
 */
export function shouldForceSetup(
  accountCreatedAt: string | undefined | null,
  settings: { tourCompletedAt?: string; setupCompletedAt?: string } | null | undefined,
): boolean {
  if (!settings) return false
  if (settings.setupCompletedAt) return false
  if (!settings.tourCompletedAt) return false
  if (!accountCreatedAt) return false

  const cree = Date.parse(accountCreatedAt)
  // Une date illisible ne vaut pas une invitation : on ne dérange personne sur
  // la foi d'une chaîne qu'on n'a pas su lire.
  if (Number.isNaN(cree)) return false

  return cree >= SETUP_REQUIRED_FROM
}
