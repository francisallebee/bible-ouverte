/**
 * Parcours découverte — la règle, hors des composants.
 *
 * Ce qu'on ne peut pas vérifier à l'écran sans se créer un compte neuf à chaque
 * essai : à quel moment le parcours se déclenche, ce qu'il montre à un
 * administrateur et pas aux autres, et comment il se termine. C'est donc ici,
 * et `tour.test.ts` le couvre.
 *
 * Le contenu vit ici aussi, et non dans le composant : c'est du texte qu'on
 * relit et qu'on corrige souvent, et il n'a pas à être noyé dans du JSX.
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
  | 'history' | 'chart' | 'settings' | 'bell' | 'cloud-off' | 'route'
  | 'message' | 'heart' | 'user' | 'shield' | 'check'

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
  title: string
  body: string
  /** Les points précis, ce que la phrase d'introduction ne peut pas porter. */
  points?: string[]
  /** Réservée aux administrateurs : masquée aux autres comptes. */
  adminOnly?: boolean
}

/**
 * Les étapes, dans l'ordre du parcours. Il suit la barre latérale plutôt que
 * l'ordre d'importance : quelqu'un qui refait le trajet plus tard retrouve les
 * écrans là où il les a laissés.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'bienvenue',
    href: null,
    icon: 'compass',
    title: 'Bienvenue dans Bible Ouverte',
    body:
      "Cette application garde la trace de ce que tu lis dans la Bible — quand, "
      + "dans quel cadre, et ce que la lecture t'a laissé. Ce parcours passe en "
      + "revue chaque écran. Il dure deux minutes et ne reviendra plus tout seul.",
    points: [
      'Tes données sont à toi seul et te suivent sur tous tes appareils.',
      'Tu peux le quitter à tout moment et le reprendre depuis les Réglages.',
    ],
  },
  {
    id: 'nouvelle-lecture',
    href: '/new-reading',
    icon: 'book-plus',
    title: 'Enregistrer une lecture',
    body:
      "C'est le geste central, et l'écran qui s'ouvre à chaque connexion. Tu "
      + "choisis un livre, des chapitres, et si tu veux le détail des versets.",
    points: [
      'Plusieurs passages peuvent tenir dans une même lecture.',
      'Une note libre recueille ce que tu as compris ou retenu.',
      'Une photo de tes notes, un mémo vocal ou un lien peuvent y être joints.',
    ],
  },
  {
    id: 'contextes',
    // Les contextes n'ont pas d'écran à eux : ils se choisissent et se créent
    // depuis le sélecteur de l'écran de saisie. `/contexts` existe encore mais
    // ne fait que rediriger — y envoyer le parcours l'enfermait dans une boucle.
    href: '/new-reading',
    icon: 'tags',
    title: 'Les contextes',
    body:
      "Chaque lecture se rattache à un cadre : méditation personnelle, culte, "
      + "prédication, podcast, livre audio. C'est ce qui rend les statistiques "
      + "parlantes plus tard.",
    points: [
      "Le sélecteur « Contexte » de cet écran les propose.",
      'Dix existent au départ, avec leur emoji.',
      'Tu peux en créer un à la volée, sans quitter ta saisie.',
    ],
  },
  {
    id: 'plans',
    href: '/plans',
    icon: 'book-open',
    title: 'Les plans de lecture',
    body:
      "Un plan répartit un ensemble de textes sur la durée que tu choisis, puis "
      + "te propose chaque jour sa part.",
    points: [
      "La Bible entière, le Nouveau Testament, ou un seul livre.",
      "Les plans libres acceptent des passages au verset près.",
      "Cocher un jour crée la lecture correspondante dans ton historique.",
    ],
  },
  {
    id: 'recherche',
    href: '/search',
    icon: 'search',
    title: 'La recherche biblique',
    body:
      "Le texte complet est consultable ici, sans quitter l'application ni "
      + "ouvrir un autre site.",
    points: [
      'Sept traductions françaises libres de droits, de 1667 à 1996.',
      "Cherche un mot, une expression, ou une référence comme « Jean 3:16 ».",
    ],
  },
  {
    id: 'progression',
    href: '/progress',
    icon: 'trophy',
    title: 'La progression',
    body:
      "Les soixante-six livres s'affichent et se remplissent à mesure que tu "
      + "les parcours. D'un coup d'œil, tu vois ce qui reste.",
    points: [
      "La progression se compte en chapitres, jamais en versets : noter "
      + "Jean 3:16 marque tout Jean 3 comme lu.",
      "Ancien et Nouveau Testament sont suivis séparément.",
    ],
  },
  {
    id: 'historique',
    href: '/history',
    icon: 'history',
    title: "L'historique",
    body:
      "Toutes tes lectures, de la plus récente à la plus ancienne. C'est d'ici "
      + "qu'on revient sur ce qu'on a écrit.",
    points: [
      'Filtre par livre, par contexte ou par période.',
      'Ouvre une lecture pour la corriger ou la compléter.',
      'Une sélection multiple permet de supprimer en bloc.',
    ],
  },
  {
    id: 'statistiques',
    href: '/stats',
    icon: 'chart',
    title: 'Les statistiques',
    body:
      "Ce que tes lectures disent de tes habitudes, sans jugement ni objectif "
      + "imposé.",
    points: [
      'Ton rythme dans le temps, et les séries de jours consécutifs.',
      'La répartition par contexte et les livres les plus fréquentés.',
    ],
  },
  {
    id: 'reglages',
    href: '/settings',
    icon: 'settings',
    title: 'Les réglages',
    body:
      "L'écran le plus dense, et celui qu'on visite le moins. Il commande "
      + "l'apparence, les traductions gardées sur l'appareil et la sécurité du "
      + "compte.",
    points: [
      "Active ou retire une traduction : chacune pèse environ 6 Mo hors ligne.",
      "Thème clair, sombre, ou accordé à celui de ton système.",
      "Déconnexion automatique après un délai d'inactivité.",
      "Export et import de toutes tes données, pour en garder une copie.",
    ],
  },
  {
    id: 'notifications',
    href: '/settings',
    icon: 'bell',
    title: 'Les rappels',
    body:
      "Cinq motifs peuvent te faire signe, et chacun se coupe séparément. Rien "
      + "ne part tant que tu n'as pas donné la permission sur l'appareil.",
    points: [
      "Un rappel quotidien, à l'heure que tu fixes.",
      "Un plan de lecture en retard, ou une longue absence.",
      "Une réponse à un message de support, un item de la feuille de route terminé.",
      "Sur iPhone, l'application doit être installée sur l'écran d'accueil : "
      + "iOS ne délivre rien depuis un onglet Safari.",
    ],
  },
  {
    id: 'hors-ligne',
    href: null,
    icon: 'cloud-off',
    title: 'Sans réseau, tout continue',
    body:
      "Les traductions actives et tes lectures sont gardées sur l'appareil. "
      + "Dans un train ou un sous-sol, l'application reste entière.",
    points: [
      'Ce que tu saisis hors ligne part vers le cloud dès le retour du signal.',
      "Le cloud fait foi : c'est lui qui accorde tes appareils entre eux.",
    ],
  },
  {
    id: 'feuille-de-route',
    href: '/roadmap',
    icon: 'route',
    title: 'La feuille de route',
    body:
      "Ce qui est en chantier et ce qui viendra ensuite. Elle est publique, et "
      + "tu peux dire ce qui compte pour toi.",
  },
  {
    id: 'support',
    href: '/support',
    icon: 'message',
    title: 'Le support',
    body:
      "Une question, un défaut, une idée : ouvre un message et la réponse "
      + "t'arrivera ici.",
    points: [
      "Les messages sont visibles de tous les utilisateurs, avec le nom de leur "
      + "auteur : n'y mets rien de confidentiel.",
    ],
  },
  {
    id: 'soutenir',
    href: '/soutenir',
    icon: 'heart',
    title: 'Soutenir le projet',
    body:
      "L'application est gratuite, sans publicité et sans revente de données. "
      + "Cette page explique comment en soutenir les frais, si tu le souhaites.",
  },
  {
    id: 'profil',
    href: '/profil',
    icon: 'user',
    title: 'Ton profil',
    body:
      "Ton nom, ton avatar et tes informations. C'est aussi d'ici que se change "
      + "le mot de passe et que se supprime le compte.",
    points: [
      'La suppression efface tout, définitivement, sans copie conservée.',
    ],
  },
  {
    id: 'administration',
    href: '/admin',
    icon: 'shield',
    adminOnly: true,
    title: "L'administration",
    body:
      "Réservée à ton compte : la liste des utilisateurs, les messages de "
      + "support reçus et la tenue de la feuille de route.",
  },
  {
    id: 'fin',
    href: null,
    icon: 'check',
    title: 'À toi de jouer',
    body:
      "Tu as fait le tour. Le parcours ne se rouvrira plus de lui-même — mais "
      + "il t'attend dans les Réglages, section « Parcours découverte », le jour "
      + "où tu voudras le refaire.",
    points: [
      "Commence par enregistrer une première lecture : c'est de là que tout part.",
    ],
  },
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
