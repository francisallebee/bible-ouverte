/**
 * Parcours découverte — la règle, hors des composants.
 *
 * Ce qu'on ne peut pas vérifier à l'écran sans se créer un compte neuf à chaque
 * essai : à quel moment le parcours se déclenche, ce qu'il montre à un
 * administrateur et pas aux autres, et comment il se termine. C'est donc ici,
 * et `tour.test.ts` le couvre.
 *
 * Le contenu, lui, vit dans les dictionnaires (`tour.steps`) : c'est du texte
 * traduisible, et il n'a pas à être noyé dans du JSX ni figé dans une langue.
 */

/**
 * Événement qui rouvre le parcours à la demande. Il vit ici plutôt que dans le
 * composant : les réglages n'ont pas à importer toute la carte pour émettre une
 * chaîne de caractères.
 */
export const TOUR_START = 'bo:tour-start'

/** L'icône est nommée, pas importée : ce module ne dépend pas de React. */
export type TourIcon =
  | 'compass' | 'book-plus' | 'tags' | 'book-open' | 'search' | 'trophy'
  | 'history' | 'chart' | 'sparkles' | 'sun' | 'brain' | 'settings' | 'bell'
  | 'cloud-off' | 'route' | 'mail' | 'message' | 'heart' | 'user' | 'shield'
  | 'check'

export interface TourStep {
  /** Stable : il sert de clé de rendu et d'ancre dans les tests. */
  id: string
  /**
   * Écran à afficher derrière la carte. `null` quand l'étape ne parle d'aucun
   * écran en particulier — l'accueil du parcours, la conclusion, l'hors-ligne
   * qui n'a pas de page à lui.
   */
  href: string | null
  icon: TourIcon
  /** Réservée aux administrateurs : masquée aux autres comptes. */
  adminOnly?: boolean
}

/**
 * Les étapes, dans l'ordre du parcours. Il suit la barre latérale plutôt que
 * l'ordre d'importance : quelqu'un qui refait le trajet plus tard retrouve les
 * écrans là où il les a laissés.
 */
/**
 * Les étapes, dans l'ordre du parcours. Il suit la barre latérale plutôt que
 * l'ordre d'importance : quelqu'un qui refait le trajet plus tard retrouve les
 * écrans là où il les a laissés.
 *
 * Le **texte** n'est plus ici : titres, corps et points vivent dans les
 * dictionnaires, sous `tour.steps`, indexés par ces mêmes identifiants. Ne
 * restent que la structure et les cibles, qui sont de la logique — et que
 * `tour.test.ts` continue de couvrir.
 */
export const TOUR_STEPS: TourStep[] = [
  { id: 'bienvenue', href: null, icon: 'compass' },
  { id: 'nouvelle-lecture', href: '/new-reading', icon: 'book-plus' },
  // Les contextes n'ont pas d'écran à eux : ils se choisissent et se créent
  // depuis le sélecteur de l'écran de saisie. `/contexts` existe encore mais
  // ne fait que rediriger — y envoyer le parcours l'enfermait dans une boucle.
  { id: 'contextes', href: '/new-reading', icon: 'tags' },
  { id: 'plans', href: '/plans', icon: 'book-open' },
  { id: 'recherche', href: '/search', icon: 'search' },
  { id: 'progression', href: '/progress', icon: 'trophy' },
  { id: 'historique', href: '/history', icon: 'history' },
  { id: 'statistiques', href: '/stats', icon: 'chart' },
  // Les quatre écrans arrivés entre le 19 et le 21 août 2026, que le parcours
  // ignorait : il s'arrêtait à douze des quatorze entrées de la barre latérale.
  { id: 'quiz', href: '/quiz', icon: 'sparkles' },
  { id: 'verset-du-jour', href: '/verset-du-jour', icon: 'sun' },
  { id: 'memorisation', href: '/memorisation', icon: 'brain' },
  { id: 'reglages', href: '/settings', icon: 'settings' },
  { id: 'notifications', href: '/settings', icon: 'bell' },
  { id: 'hors-ligne', href: null, icon: 'cloud-off' },
  { id: 'feuille-de-route', href: '/roadmap', icon: 'route' },
  { id: 'messages', href: '/messages', icon: 'mail' },
  { id: 'support', href: '/support', icon: 'message' },
  { id: 'soutenir', href: '/soutenir', icon: 'heart' },
  { id: 'profil', href: '/profil', icon: 'user' },
  { id: 'administration', href: '/admin', icon: 'shield', adminOnly: true },
  { id: 'fin', href: null, icon: 'check' },
]

/**
 * Les étapes réellement montrées à ce compte. L'écran d'administration
 * n'existe pas pour l'immense majorité des utilisateurs : le lui présenter
 * l'enverrait sur une page interdite.
 */
export function visibleSteps(isAdmin: boolean): TourStep[] {
  return TOUR_STEPS.filter((step) => !step.adminOnly || isAdmin)
}

/**
 * Le parcours se déclenche-t-il tout seul ?
 *
 * Seulement à la première connexion, et seulement une fois les réglages
 * chargés : les lancer avant reviendrait à le rejouer à chaque ouverture le
 * temps que le cache réponde. Passer le parcours vaut l'avoir vu — sans quoi
 * il reviendrait harceler quelqu'un qui a justement dit non.
 */
export function shouldStartTour(settings: { tourCompletedAt?: string } | null | undefined): boolean {
  if (!settings) return false
  return !settings.tourCompletedAt
}

/**
 * Ramène un indice dans les bornes, quelle que soit son origine.
 *
 * Seul `NaN` retombe au début : il ne désigne aucune position. Un infini, lui,
 * désigne bien un débordement — par le haut ou par le bas — et se rabat donc
 * sur l'extrémité correspondante plutôt que de renvoyer au premier écran.
 */
export function clampIndex(steps: TourStep[], index: number): number {
  if (steps.length === 0) return 0
  if (Number.isNaN(index)) return 0
  return Math.max(0, Math.min(steps.length - 1, Math.trunc(index)))
}

/** Vrai quand l'étape est la dernière, donc que le bouton doit conclure. */
export function isLastStep(steps: TourStep[], index: number): boolean {
  return steps.length > 0 && clampIndex(steps, index) === steps.length - 1
}

/**
 * L'écran à afficher pour une étape, ou `null` s'il ne faut pas naviguer.
 * Deux étapes de suite peuvent viser le même écran — les réglages et les
 * rappels — et une seconde navigation y provoquerait un rechargement inutile.
 */
export function hrefToVisit(
  steps: TourStep[],
  index: number,
  cheminActuel: string,
): string | null {
  const step = steps[clampIndex(steps, index)]
  if (!step?.href) return null
  return step.href === cheminActuel ? null : step.href
}
