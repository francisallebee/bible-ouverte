/**
 * Le dictionnaire français — la référence.
 *
 * Le type des autres langues en découle (`type Dictionary = typeof fr`), si
 * bien qu'une clé oubliée dans une traduction est une erreur de compilation.
 * C'est le seul garde-fou qui tienne à l'échelle : personne ne relit mille
 * chaînes à l'œil pour vérifier qu'il n'en manque aucune.
 *
 * Les valeurs sont des chaînes, ou des fonctions quand le texte dépend d'un
 * nombre ou d'un nom. Une fonction plutôt qu'un gabarit à trous : chaque langue
 * décide alors elle-même de ses pluriels et de son ordre de mots, ce qu'un
 * `{n} lectures` figé interdirait.
 */

import { PASSWORD_MIN_LENGTH } from '@/lib/auth/password'

export const fr = {
  common: {
    ticketStatuses: {
      open: 'ouvert',
      in_progress: 'en cours',
      resolved: 'résolu',
      closed: 'clos',
    } as Record<string, string>,
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    back: 'Retour',
    loading: 'Chargement…',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    search: 'Rechercher',
    all: 'Tous',
    none: 'Aucun',
    add: 'Ajouter',
    create: 'Créer',
    today: "Aujourd'hui",
    yesterday: 'Hier',
    optional: 'facultatif',
    required: 'obligatoire',
    error: 'Une erreur est survenue',
    retry: 'Réessayer',
    seeAll: 'Tout voir',
    of: 'sur',
  },

  nav: {
    newReading: 'Nouvelle lecture',
    plans: 'Plans de lecture',
    search: 'Recherche biblique',
    progress: 'Progression',
    history: 'Mes lectures',
    stats: 'Statistiques',
    quiz: 'Quizz',
    versetDuJour: 'Verset du jour',
    memorisation: 'Mémorisation',
    settings: 'Réglages',
    roadmap: 'Feuille de route',
    support: 'Support',
    donate: 'Soutenir le projet',
    profile: 'Mon profil',
    admin: 'Administration',
    signOut: 'Déconnexion',
    menu: 'Menu',
  },

  language: {
    title: 'Langue',
    subtitle: "La langue de l'application.",
    /**
     * Le texte biblique suit désormais, mais partiellement : sept versions
     * françaises, une anglaise, une italienne et une arabe depuis le 16 août
     * 2026. Le dire ici plutôt que de laisser l'utilisateur le découvrir.
     */
    bibleLanguages:
      'Le texte biblique existe dans les cinq langues de l\'application. '
      + 'Choisis les versions à garder sur cet appareil dans les Réglages.',
  },

  newReading: {
    title: 'Nouvelle lecture',
    subtitle: 'Enregistre ta lecture du jour',
    date: 'Date',
    context: 'Contexte',
    book: 'Livre',
    selectBook: 'Sélectionner un livre',
    chaptersAndVerses: 'Chapitres et versets',
    selectBookFirst: "Sélectionne d'abord un livre",
    version: 'Version',
    addAnotherPassage: 'Ajouter un autre passage à cette date',
    sharedFields:
      'La date, le contexte, les notes et les médias sont communs à tous les '
      + 'passages.',
    passagesToSave: (n: number, withCurrent: boolean) =>
      `Passages à enregistrer (${n}${withCurrent ? ' + celui en cours' : ''})`,
    removePassage: (reference: string) => `Retirer ${reference}`,
    notes: 'Notes',
    notesPlaceholder: 'Tes réflexions sur ce passage…',
    links: 'Liens',
    linkTitlePlaceholder: 'Titre du lien',
    addLink: 'Ajouter le lien',
    openLink: 'Ouvrir le lien',
    removeLink: 'Retirer le lien',
    audio: 'Audio',
    photos: 'Photos',
    camera: 'Appareil',
    gallery: 'Galerie',
    removePhoto: 'Retirer la photo',
    saving: 'Enregistrement…',
    saveOne: 'Enregistrer la lecture',
    saveMany: (n: number) => `Enregistrer les ${n} lectures`,
    preview: 'Aperçu du texte',
    previewOpen: 'Voir le texte',
    leaveWarning:
      'Ta lecture n’est pas enregistrée. Quitter cette page la perdra. Continuer ?',
    previewEmpty: "Sélectionne un livre pour voir l'aperçu.",
    previewUnavailable: 'Texte non disponible pour cette référence.',
    summary: 'Résumé de la saisie',
    linkCount: (n: number) => `${n} lien${n > 1 ? 's' : ''}`,
    photoCount: (n: number) => `${n} photo${n > 1 ? 's' : ''}`,
    audioAttached: 'Audio joint',
  },

  contextPicker: {
    none: '— Aucun contexte —',
    add: 'Ajouter un contexte',
    cancelAdd: "Annuler l'ajout d'un contexte",
    cancel: 'Annuler',
    newName: 'Nom du nouveau contexte',
    namePlaceholder: 'Groupe de maison, Retraite…',
    emoji: 'Emoji',
    chooseEmoji: (emoji: string) => `Choisir l'emoji ${emoji}`,
    ownEmoji: 'ou colle le tien',
    adding: 'Ajout…',
    confirmAdd: 'Ajouter ce contexte',
    errorNoName: 'Donne un nom à ce contexte.',
    errorUnusable: 'Ce nom ne contient aucun caractère utilisable.',
    errorExists: 'Ce contexte existe déjà.',
  },

  history: {
    groupBy: 'Regrouper par',
    byDate: 'Date',
    byBook: 'Livre',
    byContext: 'Contexte',
    title: 'Mes lectures',
    select: 'Sélectionner',
    selectedCount: (n: number) => `${n} sélectionnée${n > 1 ? 's' : ''}`,
    selectAll: (n: number) => `Tout sélectionner (${n})`,
    contextToApply: 'Contexte à appliquer',
    apply: 'Appliquer',
    leave: 'Quitter',
    searchPlaceholder: 'Rechercher dans les notes ou le texte…',
    allBooks: 'Tous les livres',
    startDate: 'Date début',
    endDate: 'Date fin',
    reset: 'Réinitialiser',
    collapseAll: 'Tout replier',
    expandAll: 'Tout déplier',
    empty: 'Aucune lecture trouvée.',
    readingCount: (n: number) => `${n} lecture${n > 1 ? 's' : ''}`,
    confirmDeleteOne: 'Supprimer cette lecture ? Cette action est définitive.',
    confirmDeleteMany: (n: number) =>
      `Supprimer ces ${n} lectures ? Cette action est définitive.`,
  },

  settings: {
    goalUnitLabels: {
      chapters: 'Chapitres',
      verses: 'Versets',
      minutes: 'Minutes',
    } as Record<string, string>,
    goalUnit: 'Unité',
    goalPeriod: 'Période',
    goalTarget: 'Cible',
    goalUnits: {
      chapters: 'chapitres',
      verses: 'versets',
      minutes: 'minutes',
    } as Record<string, string>,
    goalPeriods: {
      day: 'par jour',
      week: 'par semaine',
      month: 'par mois',
      year: 'par an',
    } as Record<string, string>,
    goalSummary2: (n: number, u: string, p: string) => `${n} ${u} ${p}`,
    goalScope: 'Ce qui est compté',
    goalMinutesHint: (mots: number) =>
      `Les minutes sont estimées d’après le nombre de mots du passage, à ${mots} mots par minute. Rien n’est chronométré.`,
    goalScopes: { toutes: 'Toutes les lectures', livre: 'Un livre', plan: 'Un plan de lecture' },
    goalScopeBook: 'Livre',
    goalScopePlan: 'Plan',
    goalScopeMissing: 'plan supprimé',
    goalScopeSummary: (nom: string) => ` — dans ${nom}`,
    fontPreview:
      'Car Dieu a tant aimé le monde qu’il a donné son Fils unique.',
    uiScaleLabel: 'Taille de l’interface',
    readingSizeLabel: 'Taille du texte biblique',
    readingStyleLabel: 'Style du texte biblique',
    fontsTitle: 'Polices',
    fontsHint:
      'Deux réglages : l’un pour les menus, l’autre pour le texte biblique. L’arabe garde la police de ton appareil, qu’aucune de celles-ci ne couvre.',
    fontUi: 'Interface',
    fontReading: 'Texte biblique',
    customTheme: 'Charte personnalisée',
    customThemeHint: 'Choisis deux couleurs ; les nuances s’en déduisent.',
    customPrimary: 'Couleur principale',
    customAccent: 'Couleur d’accent',
    pages: 'Pages visibles',
    pagesHint:
      'Choisis les pages à garder dans le menu. Réglages et Nouvelle lecture '
      + 'restent toujours accessibles.',
    setupTitle: 'Personnalise ton application',
    setupHint:
      'Prends un moment pour régler la langue, le thème, ton objectif et les '
      + 'pages que tu veux voir. Tu ne repasseras pas par ici.',
    setupDone: 'Terminer la personnalisation',
    title: 'Réglages',
    subtitle: 'Personnalise ton expérience',
    active: 'Actif',

    theme: 'Thème',
    themeLight: '☀️ Clair',
    themeDark: '🌙 Sombre',
    themeSystem: '🖥️ Système',
    themeSystemHint:
      "L'application suit le réglage jour/nuit de ton appareil et bascule dès "
      + "qu'il change.",

    colorTheme: 'Charte graphique',
    colorThemeHint: "Change l'ambiance de l'application en un clic.",

    goal: 'Objectif de lecture',
    goalHint: 'Fixe un objectif quotidien pour suivre ta progression.',
    goalChapters: 'Chapitres / jour',
    goalVerses: 'Versets / jour',
    perDay: 'par jour',
    goalSummary: (target: number, chapters: boolean) =>
      `→ ${target} ${chapters ? 'chapitres' : 'versets'} par jour`,

    versions: 'Versions bibliques',
    versionsHint:
      'Une version activée est téléchargée sur cet appareil pour la lecture '
      + 'hors ligne — de 6 à 10 Mo selon la langue. La désactiver libère cette place.',
    versionDefault: 'Par défaut',
    versionDeleting: 'Suppression…',
    versionDownloading: 'Téléchargement…',
    versionEnabled: 'Activée',

    exportTitle: 'Export des données',
    exportHint: 'Télécharge toutes tes données au format JSON.',
    exportButton: 'Exporter en JSON',

    importTitle: 'Import des données',
    importHint: 'Importe un fichier JSON précédemment exporté.',
    importButton: 'Importer un fichier JSON',
    exportOk: 'Export réussi.',
    exportError: "Erreur lors de l'export.",
    importConfirm: 'Cette action remplacera vos données existantes. Continuer ?',
    importRunning: 'Import en cours…',
    importOk: (n: number) => `${n} élément${n > 1 ? 's' : ''} importé${n > 1 ? 's' : ''} avec succès.`,
    importError: (detail: string) => `Erreur : ${detail}`,
    importReadError: 'Erreur lors de la lecture du fichier.',
    /** Sert à colorer le message d'import en rouge ou en vert. */
    errorMarker: 'Erreur',

    autoLogout: 'Déconnexion automatique',
    autoLogoutHint:
      'Ferme la session après une période sans activité. Utile si tu lis '
      + 'depuis un appareil partagé.',
    autoLogoutWarning:
      'Une fenêtre te préviendra une minute avant la coupure, pour que rien de '
      + 'ce que tu es en train de saisir ne soit perdu.',
    autoLogoutChoices: {
      0: 'Jamais',
      15: 'Au bout de 15 minutes',
      30: 'Au bout de 30 minutes',
      60: "Au bout d'une heure",
      240: 'Au bout de quatre heures',
    } as Record<number, string>,

    tour: 'Parcours découverte',
    tourHint:
      "La visite guidée des écrans de l'application. Elle se lance une seule "
      + 'fois, à la première connexion — puis seulement si tu la redemandes ici.',
    tourDone: (date: string) => `Déjà suivi le ${date}.`,
    tourNotYet: "Tu ne l'as pas encore suivi : il s'ouvrira à ta prochaine visite.",
    tourReplay: 'Revoir le parcours',

    sync: 'Synchronisation cloud',
    syncHint:
      'Synchronise tes données avec ton compte pour les retrouver sur tous tes '
      + 'appareils.',

    deleteAccount: 'Supprimer mon compte',
    deleteWarning:
      'Cette action est irréversible. Toutes tes données seront définitivement '
      + 'effacées.',
    deleteConfirm:
      '⚠️ Es-tu sûr ? Tes lectures, plans et fichiers seront perdus à jamais.',
    deleteYes: 'Oui, tout supprimer',
    deleting: 'Suppression…',
    deleteDone: 'Compte supprimé. Redirection…',
    deleteError: 'Erreur lors de la suppression',

    info: 'Informations',
    infoApp: 'Application',
    infoVersion: 'Version',
    infoOffline: 'Mode hors ligne',
    infoOfflineOn: 'Activé',
    infoStorage: 'Stockage',
    infoVerses: 'Versets disponibles',
  },

  notifications: {
    title: 'Notifications',
    readingDevice: "Lecture de l'appareil…",
    iosNotInstalled:
      "Sur iPhone et iPad, les notifications ne sont délivrées qu'aux "
      + 'applications installées. Ouvre le menu de partage de Safari, puis '
      + "« Sur l'écran d'accueil », et reviens ici depuis l'application ainsi "
      + 'installée.',
    unsupported:
      'Ce navigateur ne gère pas les notifications. Le réglage reste '
      + 'disponible depuis un appareil qui les prend en charge.',
    denied:
      'Les notifications ont été refusées pour ce site. Une application ne '
      + 'peut pas revenir sur ce choix : il faut le rouvrir dans les réglages '
      + 'de ton navigateur.',
    needsPermission:
      'Reçois un rappel de lecture sur cet appareil. Ton navigateur va te '
      + 'demander ton accord.',
    waiting: 'En attente de ta réponse…',
    allow: 'Autoriser les notifications',
    receiveOnDevice: 'Recevoir des notifications sur cet appareil',
    whatTriggers: 'Ce qui déclenche une notification',
    at: 'À',
    timeZoneOf: (zone: string) => `heure de ${zone}`,
    granted:
      "L'autorisation est accordée et tes choix sont enregistrés.",
    sendTest: 'Envoyer une notification de test',
    testSending: 'Envoi…',
    testSent:
      "Notification envoyée. Si tu ne la vois pas apparaître, c'est que ton "
      + 'appareil la retient — vérifie ses réglages de notifications pour '
      + 'Bible Ouverte.',
    noPermission: "La permission n'est pas accordée sur cet appareil.",
    testUnsupported: 'Ce navigateur ne gère pas les notifications.',
    testFailed:
      "L'appareil a refusé l'envoi. Sur iPhone, l'application doit être "
      + "ouverte depuis l'écran d'accueil et non depuis Safari.",
    subscribeFailed:
      "Cet appareil n'a pas pu être abonné. Les réglages sont enregistrés, "
      + "mais rien n'y sera envoyé.",
    /** Libellés des cinq déclencheurs, par identifiant. */
    triggers: {
      daily: {
        label: 'Rappel quotidien',
        hint: "À l'heure de ton choix, pour ne pas oublier ta lecture.",
      },
      'plan-late': {
        label: 'Plan de lecture en retard',
        hint: "Quand un jour prévu n'a pas été coché.",
      },
      'support-reply': {
        label: 'Réponse à un message de support',
        hint: "Quand quelqu'un répond à un de tes tickets.",
      },
      'roadmap-done': {
        label: 'Feuille de route',
        hint: "Quand une fonctionnalité attendue passe à « Terminé ».",
      },
      inactive: {
        label: 'Longue absence',
        hint: 'Une relance après plusieurs jours sans lecture.',
      },
    },
  },

  plans: {
    title: 'Plans de lecture',
    newPlan: 'Nouveau plan',
    createTitle: 'Créer un plan de lecture',
    name: 'Nom',
    namePlaceholder: 'Mon plan 2026',
    kind: 'Type de plan',
    scheduled: 'Daté',
    scheduledHint: 'Un passage par jour, réparti sur une durée.',
    free: 'Libre',
    freeHint: 'Une liste de passages sans date, cochés à ton rythme.',
    duration: 'Durée',
    durations: {
      '1-year': '1 an',
      '6-months': '6 mois',
      '3-months': '3 mois',
      '1-month': '1 mois',
      custom: 'Personnalisé',
    } as Record<string, string>,
    durationDays: (days: number) => ` (${days} jours)`,
    customDaysPlaceholder: 'Nombre de jours',
    version: 'Version',
    startDate: 'Date de début',
    creating: 'Création…',
    create: 'Créer le plan',
    empty: 'Aucun plan de lecture.',
    emptyHint: 'Créez un plan pour lire la Bible sur une durée définie.',
    freePlan: 'Plan libre',
    scheduledSummary: (duration: string, days: number) =>
      `${duration} · ${days} jours`,
    undated: 'Sans date',
    deleteTitle: 'Supprimer ce plan ?',
    deletePlan: (nom: string) => `Supprimer le plan ${nom}`,
    deleteHint: 'Cette action est irréversible.',
  },

  /** Les dix catégories de livres, par identifiant de `BIBLE_CATEGORIES`. */
  bibleCategories: {
    pentateuch: 'Pentateuque',
    historical: 'Livres historiques',
    poetic: 'Livres poétiques',
    'major-prophets': 'Prophètes majeurs',
    'minor-prophets': 'Prophètes mineurs',
    gospels: 'Évangiles',
    acts: 'Histoire apostolique',
    'pauline-epistles': 'Épîtres pauliniennes',
    'general-epistles': 'Épîtres générales',
    revelation: 'Apocalypse',
  } as Record<string, string>,

  progress: {
    goalUnitPeriod: (u: string, p: string) => `${u} ${p}`,
    goalScope: (nom: string) => `Dans ${nom}`,
    title: 'Ma progression',
    level: (n: number) => `Niveau ${n}`,
    chaptersOf: (read: number, next: number) => `${read} / ${next} chapitres`,
    currentStreak: 'Série actuelle',
    days: 'jours',
    bestStreak: (n: number) => `Meilleure : ${n} jours`,
    nextMilestone: (n: number) => `Prochain palier : ${n} jours`,
    allMilestones: 'Tous les paliers atteints',
    milestoneReached: (n: number) => `${n} jours`,
    chaptersRead: 'Chapitres lus',
    booksStarted: (n: number) => `${n} livre${n > 1 ? 's' : ''} entamé${n > 1 ? 's' : ''}`,
    dailyGoal: 'Objectif',
    chaptersToday: "chapitres aujourd'hui",
    versesToday: "versets aujourd'hui",
    noGoal: 'Aucun objectif défini',
    goalReached: 'Objectif atteint ! 🎉',
    goalAlmost: "Encore un peu d'effort",
    goalToday: (current: number, target: number, unite: string, periode: string) =>
      `${current} / ${target} ${unite === 'chapters' ? 'chapitres' : unite === 'verses' ? 'versets' : 'minutes'} ${periode}`,
    oldTestament: 'Ancien Testament',
    newTestament: 'Nouveau Testament',
    chaptersOfTotal: (read: number, total: number) => `${read} / ${total} chapitres`,
    byContext: 'Progression par contexte',
    chapterCount: (n: number) => `${n} chapitre${n > 1 ? 's' : ''}`,
    noContext: 'Sans contexte',
    byCategory: 'Progression par catégorie',
    achievements: 'Succès & Récompenses',
    byBook: 'Détail par livre',
    /** Titres de niveau, par palier. */
    levels: {
      1: 'Apprenti lecteur',
      2: 'Lecteur du dimanche',
      3: 'Fidèle',
      4: 'Dévoué',
      5: 'Érudit',
      6: 'Théologien',
      7: 'Maître',
    } as Record<number, string>,
    badges: {
      first: { name: 'Premiers pas', description: 'Lire son premier chapitre' },
      ten: { name: 'Découvreur', description: 'Lire 10 chapitres' },
      fifty: { name: 'Explorateur', description: 'Lire 50 chapitres' },
      hundred: { name: 'Lecteur assidu', description: 'Lire 100 chapitres' },
      'two-fifty': { name: 'Scribe', description: 'Lire 250 chapitres' },
      'five-hundred': { name: 'Docteur de la Loi', description: 'Lire 500 chapitres' },
      thousand: { name: 'Veilleur', description: 'Lire 1000 chapitres' },
      'streak-3': { name: 'Régulier', description: 'Une série de 3 jours' },
      'streak-7': { name: 'Persévérant', description: 'Une série de 7 jours' },
      'streak-30': { name: 'Inarrêtable', description: 'Une série de 30 jours' },
      'streak-100': { name: 'Légende vivante', description: 'Une série de 100 jours' },
      'category-all': { name: 'Canon complet', description: 'Lire dans toutes les catégories' },
      'category-half': { name: 'À mi-parcours', description: 'Lire dans la moitié des catégories' },
    },
  },
  search: {
    context: 'Contexte (optionnel)',
    title: 'Recherche biblique',
    modeReference: 'Référence',
    modeKeyword: 'Libre',
    book: 'Livre',
    select: 'Sélectionner',
    chapter: 'Chapitre',
    verse: 'Verset (optionnel)',
    all: 'Tous',
    version: 'Version',
    go: 'Chercher',
    verseCount: (n: number) => `${n} verset${n > 1 ? 's' : ''}`,
    addThisReading: '+ Ajouter cette lecture',
    noResult: 'Aucun résultat.',
    keyword: 'Mot-clé',
    keywordPlaceholder: 'Entrez un mot ou une phrase…',
    searching: 'Recherche en cours…',
    noResultFor: (q: string) => `Aucun résultat pour « ${q} ».`,
    resultCount: (n: number, q: string) =>
      `${n} résultat${n > 1 ? 's' : ''} pour « ${q} »`,
    add: '+ Ajouter',
    truncated: 'Affichage des 100 premiers résultats. Précisez votre recherche.',
    addTitle: 'Ajouter une lecture',
    date: 'Date',
    notes: 'Notes (optionnel)',
    adding: 'Ajout…',
    addToReadings: 'Ajouter aux lectures',
    added: 'Ajouté ✓',
  },
  stats: {
    title: 'Statistiques',
    empty: 'Aucune donnée de lecture pour le moment.',
    total: 'Total lectures',
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    perDay: 'Lectures par jour (30 jours)',
    topBooks: 'Top 10 livres',
    byContext: 'Répartition par contexte',
    byVersion: 'Répartition par version',
    noContext: 'Sans contexte',
  },
  donate: {
    title: 'Soutenir le projet',
    subtitle: 'Bible Ouverte est gratuite, sans publicité et sans revente de données',
    freeText:
      'Les sept traductions proposées sont dans le domaine public : elles ne '
      + "coûtent rien et ne coûteront jamais rien. L'application, elle, repose "
      + 'sur un hébergement et une base de données qui ont un prix, et sur du '
      + 'temps de développement.',
    patreonText:
      "Rejoindre la communauté ÔAppliday sur Patreon, c'est ce qui permet à ce "
      + 'travail de continuer et aux fonctionnalités annoncées dans la feuille '
      + 'de route de voir le jour.',
    patreonButton: 'Rejoindre la communauté sur Patreon',
    freeWaysTitle: 'Soutenir sans rien dépenser',
    freeWaysText:
      'En parler autour de vous suffit déjà. Et vos retours orientent '
      + 'directement ce qui est développé.',
    reportBug: 'Signaler un bug ou proposer une idée',
    voteRoadmap: 'Voter sur la feuille de route',
    whatsappBefore: 'La chaîne WhatsApp ',
    whatsappAfter: ' annonce les nouveautés.',
  },
  roadmap: {
    title: 'Feuille de route',
    add: 'Ajouter',
    itemTitle: 'Titre',
    titlePlaceholder: 'Nom de la fonctionnalité',
    description: 'Description',
    descriptionPlaceholder: 'Décris brièvement…',
    status: 'Statut',
    empty: 'Aucun élément pour le moment',
    itemCount: (n: number) => `${n} élément${n > 1 ? 's' : ''}`,
    modifiedOn: (date: string) => ` · modifié ${date}`,
    confirmDelete: 'Supprimer cet élément de la feuille de route ?',
    footerAdmin: 'Vous pouvez ajouter, modifier ou supprimer des éléments.',
    footerUser: 'Les fonctionnalités à venir seront listées ici.',
    /** Les cinq statuts, par clé — celles-ci sont en base, elles ne changent pas. */
    statuses: {
      planned: 'Planifié',
      projet: 'Projet',
      'in-progress': 'En cours',
      done: 'Terminé',
      cancelled: 'Annulé',
    } as Record<string, string>,
  },
  support: {
    replyFailed:
      'Réponse non enregistrée. Le message est peut-être clos, ou la connexion perdue.',
    closedSection: (n: number) => `Clos (${n})`,
    closedNotice:
      'Ce message est clos. Seul un administrateur peut le rouvrir.',
    title: 'Support & Suggestions',
    subtitle: 'Signale un bug ou propose une amélioration',
    newMessage: 'Nouveau message',
    newMessageHint: "Partage ton retour sur l'application",
    type: 'Type',
    bug: '🐛 Bug',
    suggestion: '💡 Suggestion',
    name: 'Nom (visible par tous)',
    namePlaceholder: 'Ton prénom ou pseudo',
    message: 'Message',
    bugPlaceholder: "Décris le bug : que s'est-il passé ?",
    suggestionPlaceholder: "Décris ton idée d'amélioration…",
    send: 'Envoyer',
    empty: 'Aucun message pour le moment',
    emptyHint: 'Sois le premier à partager ton retour !',
    replyCount: (n: number) => `${n} réponse${n > 1 ? 's' : ''}`,
    admin: 'Admin',
    replyPlaceholder: 'Répondre…',
    commentPlaceholder: 'Ajouter un commentaire…',
    reply: '✏️ Répondre',
    comment: '💬 Commenter',
    confirmDelete:
      'Supprimer ce message et ses réponses ? Cette action est définitive.',
    deleteFailed:
      'Suppression impossible. Vérifie ta connexion — la suppression est '
      + 'réservée aux administrateurs.',
    defaultAdminName: 'Administrateur',
    defaultUserName: 'Utilisateur',
  },
  auth: {
    passwordRules: {
      labels: {
        length: `au moins ${PASSWORD_MIN_LENGTH} caractères`,
        lowercase: 'une minuscule',
        uppercase: 'une majuscule',
        digit: 'un chiffre',
        symbol: 'un symbole (par exemple ! ? * - .)',
      },
      sentence: (list: string) => `Le mot de passe doit contenir ${list}.`,
      and: 'et',
    },
  },

  profile: {
    title: 'Mon profil',
    loadError: 'Erreur de chargement du profil',
    removeAvatar: "Supprimer l'avatar",
    firstName: 'Prénom',
    email: 'Email',
    birthDate: 'Date de naissance',
    phone: 'Téléphone',
    phonePlaceholder: '+33 6 12 34 56 78',
    bio: 'Bio',
    bioPlaceholder: 'Quelques mots sur toi…',
    socials: 'Réseaux sociaux',
    addSocial: '+ Ajouter',
    noSocial: 'Aucun réseau ajouté',
    socialPrompt: 'Nom du réseau (ex : instagram, twitter, facebook)',
    saving: 'Enregistrement…',
    save: 'Enregistrer',
    saved: '✓ Profil mis à jour',
    password: 'Mot de passe',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le nouveau mot de passe',
    passwordHint: (min: number) =>
      `${min} caractères minimum, avec une minuscule, une majuscule, un `
      + 'chiffre et un symbole.',
    changing: 'Modification…',
    changePassword: 'Changer le mot de passe',
    passwordChanged: '✓ Mot de passe modifié. Il servira à ta prochaine connexion.',
    mismatch: 'Les deux saisies du nouveau mot de passe ne correspondent pas.',
    sameAsCurrent: "Le nouveau mot de passe doit être différent de l'actuel.",
    wrongCurrent: 'Mot de passe actuel incorrect.',
  },
  authScreens: {
    login: 'Bon retour',
    loginSubtitle: 'Reprends tes lectures là où tu les as laissées.',
    email: 'Email',
    password: 'Mot de passe',
    signingIn: 'Connexion…',
    signIn: 'Se connecter',
    noAccount: 'Pas encore de compte ? ',
    createAccount: 'Créer un compte',
    suspended: 'Ton compte a été suspendu par un administrateur.',

    signupTitle: 'Créer un compte',
    signupSubtitle: "Moins d'une minute, et c'est gratuit.",
    firstName: 'Prénom',
    creating: 'Création…',
    createButton: 'Créer le compte',
    haveAccount: 'Déjà un compte ? ',
    goToLogin: 'Aller à la connexion',
    accountCreated: 'Compte créé',
    mailSentBefore: 'Un message vient de partir vers ',
    mailSentAfter:
      '. Ouvre-le pour confirmer ton adresse, puis reviens te connecter.',
    yourAddress: 'ton adresse',

    confirming: 'Confirmation en cours',
    confirmingHint: "Ton adresse est en train d'être vérifiée. Encore un instant.",

    /**
     * Le cadre de l'écran, et non son formulaire : le bouton de retour et la
     * signature du pied de page. Coupée en deux parce qu'un lien s'intercale,
     * comme celle du canal WhatsApp dans `donate` — les espaces sont dans les
     * chaînes et non dans le JSX, pour que chaque langue en décide.
     */
    home: 'Accueil',
    byPrefix: 'Par ',
    bySuffix: ' — Ressources et Vous',
  },
  components: {
    syncAuto: 'Synchronisé automatiquement',
    syncSignIn: 'Connecte-toi pour sauvegarder tes données dans le cloud.',

    stillThere: 'Toujours là ?',
    sessionClosingBefore: 'Sans réponse, ta session se fermera dans ',
    seconds: (n: number) => `${n} seconde${n > 1 ? 's' : ''}`,
    signOutNow: 'Me déconnecter',
    stayHere: 'Je suis là',

    micUnavailable: "Impossible d'accéder au microphone.",
    stopRecording: (duration: string) => `Arrêter (${duration})`,
    record: 'Enregistrer',
    audioFile: 'Fichier audio',

    addPassage: 'Ajouter un passage',
    book: 'Livre',
    selectBook: 'Sélectionner un livre',
    selectBookFirst: "Sélectionne d'abord un livre",
    addToList: 'Ajouter à la liste',
  },
  bookPicker: {
    placeholder: 'Sélectionner un livre',
    dialogLabel: 'Choisir un livre',
    search: 'Rechercher un livre…',
    oldTestament: 'Ancien Testament',
    newTestament: 'Nouveau Testament',
    noMatch: 'Aucun livre ne correspond',
  },

  passageSearch: {
    title: 'Rechercher un passage',
    open: 'Rechercher un passage',
    use: 'Utiliser ce passage',
  },

  passagePicker: {
    dialogLabel: (bookName: string) => `Chapitres et versets — ${bookName}`,
    chapter: 'Chapitre',
    chapters: 'Chapitres',
    rangeHint: "Un second appui plus loin sélectionne l'intervalle.",
    verse: 'Verset',
    verses: 'Versets',
    wholeChapter: 'Tout le chapitre',
    allVerses: 'Tous les versets',
    firstVerseOf: (chapter: number) => `Premier verset — chapitre ${chapter}`,
    lastVerseOf: (chapter: number) => `Dernier verset — chapitre ${chapter}`,
    firstVerseLabel: (chapter: number) => `Premier verset, chapitre ${chapter}`,
    lastVerseLabel: (chapter: number) => `Dernier verset, chapitre ${chapter}`,
    validate: 'Valider',
  },
  admin: {
    title: 'Administration',
    refresh: 'Actualiser',
    denied: 'Accès refusé',
    notAdmin: "Tu n'es pas administrateur.",
    tabUsers: 'Utilisateurs',
    tabTickets: 'Tickets',
    statUsers: 'Utilisateurs',
    statUsersSub: (admins: number, actifs: number) =>
      `${admins} admin · ${actifs} actifs/7j`,
    statReadings: 'Lectures',
    statSuspended: 'Suspendus',
    statPlans: 'Plans',
    statPlanDays: (days: number) => `${days} jours`,
    statContexts: 'Contextes',
    colUser: 'Utilisateur',
    colEmail: 'Email',
    colRole: 'Rôle',
    colStatus: 'Statut',
    changeStatus: 'Changer le statut',
    colPlans: 'Plans',
    colLastSignIn: 'Connexion',
    colActions: 'Actions',
    noName: 'Sans nom',
    roleAdmin: 'Admin',
    roleUser: 'User',
    suspended: 'Suspendu',
    online: 'En ligne',
    offline: 'Hors ligne',
    never: 'Jamais',
    demote: 'Rétrograder',
    promote: 'Promouvoir admin',
    reactivate: 'Réactiver',
    suspend: 'Suspendre',
    confirmDelete: (name: string) => `Supprimer ${name} et toutes ses données ?`,
    allTickets: (n: number) => `Tous (${n})`,
    noTicket: 'Aucun ticket',
    by: (name: string) => `Par ${name}`,
    replyCount: (n: number) => `${n} réponse${n > 1 ? 's' : ''}`,
    categories: { bug: 'Bug', suggestion: 'Suggestion' } as Record<string, string>,
  },
  planDetail: {
    notFound: 'Plan introuvable.',
    backToPlans: 'Retour aux plans',
    passagesRead: (read: number, total: number, pct: number) =>
      `${read}/${total} passages lus${total > 0 ? ` (${pct}%)` : ''}`,
    daysRead: (read: number, total: number, pct: number) =>
      `${read}/${total} jours lus (${pct}%)`,
    export: 'Exporter',
    editPlan: 'Modifier le plan',
    name: 'Nom',
    duration: 'Durée',
    durations: {
      '1-year': '1 an (365 jours)',
      '6-months': '6 mois (182 jours)',
      '3-months': '3 mois (91 jours)',
      '1-month': '1 mois (30 jours)',
      custom: 'Personnalisé',
    } as Record<string, string>,
    customDays: 'Nombre de jours',
    version: 'Version',
    startDate: 'Date de début',
    booksLabel: 'Livres (laisser vide pour toute la Bible)',
    allBooks: 'Tous les livres',
    booksSelected: (n: number) => `${n} livre${n > 1 ? 's' : ''} sélectionné${n > 1 ? 's' : ''}`,
    saving: 'Enregistrement…',
    remaining: (n: number, total: number, free: boolean) =>
      `${n} ${free ? 'passages restants' : 'jours restants'} sur ${total}`,
    previous: 'Précédent',
    next: 'Suivant',
    emptyList: 'Cette liste est encore vide.',
    emptyListHint: "Ajoute les passages que tu veux lire, dans l'ordre qui te plaît.",
    day: (n: number) => `Jour ${n}`,
    readOn: 'Lu le ',
    notReadYet: 'Pas encore lu',
    remove: (reference: string) => `Retirer ${reference}`,
    readOnLabel: 'Lu le',
    validate: 'Valider',
  },
  readingDetail: {
    notFound: 'Lecture introuvable',
    backToHistory: "Retour à l'historique",
    editTitle: 'Modifier la lecture',
    detailTitle: 'Détail de la lecture',
    date: 'Date',
    book: 'Livre',
    chapterStart: 'Chapitre début',
    chapterEnd: 'Chapitre fin',
    verseStart: 'Verset début',
    verseEnd: 'Verset fin',
    version: 'Version',
    saveEdit: 'Sauvegarder',
    versionLabel: (name: string) => `Version : ${name}`,
    notes: 'Notes',
    links: 'Liens',
    audio: 'Audio',
    pause: 'Mettre en pause',
    play: "Écouter l'audio",
    audioAttached: 'Audio joint',
    photos: 'Photos',
    bibleText: 'Texte biblique',
    textUnavailable:
      'Texte non disponible pour cette référence avec la version sélectionnée.',
    confirmDelete: 'Supprimer cette lecture ?',
  },
  tour: {
    /** Le texte des 17 étapes, par identifiant de `TOUR_STEPS`. */
    steps: {
      bienvenue: {
        title: 'Bienvenue dans Bible Ouverte',
        body:
          'Cette application garde la trace de ce que tu lis dans la Bible — '
          + "quand, dans quel cadre, et ce que la lecture t'a laissé. Ce "
          + 'parcours passe en revue chaque écran. Il dure deux minutes et ne '
          + 'reviendra plus tout seul.',
        points: [
          'Tes données sont à toi seul et te suivent sur tous tes appareils.',
          'Tu peux le quitter à tout moment et le reprendre depuis les Réglages.',
        ],
      },
      'nouvelle-lecture': {
        title: 'Enregistrer une lecture',
        body:
          "C'est le geste central, et l'écran qui s'ouvre à chaque connexion. "
          + 'Tu choisis un livre, des chapitres, et si tu veux le détail des '
          + 'versets.',
        points: [
          'Plusieurs passages peuvent tenir dans une même lecture.',
          'Une note libre recueille ce que tu as compris ou retenu.',
          'Une photo de tes notes, un mémo vocal ou un lien peuvent y être joints.',
        ],
      },
      contextes: {
        title: 'Les contextes',
        body:
          'Chaque lecture se rattache à un cadre : méditation personnelle, '
          + "culte, prédication, podcast, livre audio. C'est ce qui rend les "
          + 'statistiques parlantes plus tard.',
        points: [
          'Le sélecteur « Contexte » de cet écran les propose.',
          'Dix existent au départ, avec leur emoji.',
          'Tu peux en créer un à la volée, sans quitter ta saisie.',
        ],
      },
      plans: {
        title: 'Les plans de lecture',
        body:
          'Un plan répartit un ensemble de textes sur la durée que tu choisis, '
          + 'puis te propose chaque jour sa part.',
        points: [
          'La Bible entière, le Nouveau Testament, ou un seul livre.',
          'Les plans libres acceptent des passages au verset près.',
          'Cocher un jour crée la lecture correspondante dans ton historique.',
        ],
      },
      recherche: {
        title: 'La recherche biblique',
        body:
          "Le texte complet est consultable ici, sans quitter l'application ni "
          + 'ouvrir un autre site.',
        points: [
          'Sept traductions françaises libres de droits, de 1667 à 1996.',
          'Cherche un mot, une expression, ou une référence comme « Jean 3:16 ».',
        ],
      },
      progression: {
        title: 'La progression',
        body:
          "Les soixante-six livres s'affichent et se remplissent à mesure que "
          + "tu les parcours. D'un coup d'œil, tu vois ce qui reste.",
        points: [
          'La progression se compte en chapitres, jamais en versets : noter '
          + 'Jean 3:16 marque tout Jean 3 comme lu.',
          'Ancien et Nouveau Testament sont suivis séparément.',
        ],
      },
      historique: {
        title: "L'historique",
        body:
          "Toutes tes lectures, de la plus récente à la plus ancienne. C'est "
          + "d'ici qu'on revient sur ce qu'on a écrit.",
        points: [
          'Filtre par livre, par contexte ou par période.',
          'Ouvre une lecture pour la corriger ou la compléter.',
          'Une sélection multiple permet de supprimer en bloc.',
        ],
      },
      statistiques: {
        title: 'Les statistiques',
        body:
          'Ce que tes lectures disent de tes habitudes, sans jugement ni '
          + 'objectif imposé.',
        points: [
          'Ton rythme dans le temps, et les séries de jours consécutifs.',
          'La répartition par contexte et les livres les plus fréquentés.',
        ],
      },
      reglages: {
        title: 'Les réglages',
        body:
          "L'écran le plus dense, et celui qu'on visite le moins. Il commande "
          + "l'apparence, les traductions gardées sur l'appareil et la sécurité "
          + 'du compte.',
        points: [
          'Active ou retire une traduction : chacune pèse de 6 à 10 Mo hors ligne.',
          'Thème clair, sombre, ou accordé à celui de ton système.',
          "Déconnexion automatique après un délai d'inactivité.",
          'Export et import de toutes tes données, pour en garder une copie.',
        ],
      },
      notifications: {
        title: 'Les rappels',
        body:
          'Cinq motifs peuvent te faire signe, et chacun se coupe séparément. '
          + "Rien ne part tant que tu n'as pas donné la permission sur "
          + "l'appareil.",
        points: [
          "Un rappel quotidien, à l'heure que tu fixes.",
          'Un plan de lecture en retard, ou une longue absence.',
          'Une réponse à un message de support, un item de la feuille de route terminé.',
          "Sur iPhone, l'application doit être installée sur l'écran d'accueil : "
          + 'iOS ne délivre rien depuis un onglet Safari.',
        ],
      },
      'hors-ligne': {
        title: 'Sans réseau, tout continue',
        body:
          "Les traductions actives et tes lectures sont gardées sur l'appareil. "
          + "Dans un train ou un sous-sol, l'application reste entière.",
        points: [
          'Ce que tu saisis hors ligne part vers le cloud dès le retour du signal.',
          "Le cloud fait foi : c'est lui qui accorde tes appareils entre eux.",
        ],
      },
      'feuille-de-route': {
        title: 'La feuille de route',
        body:
          'Ce qui est en chantier et ce qui viendra ensuite. Elle est publique, '
          + 'et tu peux dire ce qui compte pour toi.',
        points: [],
      },
      support: {
        title: 'Le support',
        body:
          'Une question, un défaut, une idée : ouvre un message et la réponse '
          + "t'arrivera ici.",
        points: [
          'Les messages sont visibles de tous les utilisateurs, avec le nom de '
          + "leur auteur : n'y mets rien de confidentiel.",
        ],
      },
      soutenir: {
        title: 'Soutenir le projet',
        body:
          "L'application est gratuite, sans publicité et sans revente de "
          + 'données. Cette page explique comment en soutenir les frais, si tu '
          + 'le souhaites.',
        points: [],
      },
      profil: {
        title: 'Ton profil',
        body:
          "Ton nom, ton avatar et tes informations. C'est aussi d'ici que se "
          + 'change le mot de passe et que se supprime le compte.',
        points: [
          'La suppression efface tout, définitivement, sans copie conservée.',
        ],
      },
      administration: {
        title: "L'administration",
        body:
          'Réservée à ton compte : la liste des utilisateurs, les messages de '
          + 'support reçus et la tenue de la feuille de route.',
        points: [],
      },
      fin: {
        title: 'À toi de jouer',
        body:
          'Tu as fait le tour. Le parcours ne se rouvrira plus de lui-même — '
          + "mais il t'attend dans les Réglages, section « Parcours découverte », "
          + 'le jour où tu voudras le refaire.',
        points: [
          "Commence par enregistrer une première lecture : c'est de là que tout part.",
        ],
      },
    },
  },
  tourUi: {
    close: 'Fermer le parcours découverte',
    stepOf: (n: number, total: number) => `Étape ${n} sur ${total}`,
    skip: 'Passer le parcours',
    previous: 'Précédent',
    next: 'Suivant',
    finish: 'Terminer',
  },
  fontSizes: {
    'compact': 'Compact',
    'normal': 'Normal',
    'grand': 'Grand',
    'tres-grand': 'Très grand',
    'geant': 'Géant',
  } as Record<string, string>,

  fontStyles: {
    'normal': 'Normal',
    'italique': 'Italique',
    'gras': 'Gras',
    'gras-italique': 'Gras italique',
  } as Record<string, string>,

  fonts: {
    systeme: 'Système',
    inter: 'Inter',
    lora: 'Lora',
    garamond: 'Garamond',
    hyperlegible: 'Hyperlisible',
  } as Record<string, string>,

  memorisation: {
    title: 'Mémorisation',
    subtitle: 'Apprends un verset, et retrouve-le quand il revient.',
    aRevoir: 'à revoir aujourd’hui',
    ajouterHasard: 'Un verset au hasard',
    aucun: 'Aucun verset en apprentissage',
    aucunAide: 'Choisis-en un ci-dessous, ou laisse le hasard décider.',
    choisir: 'Parmi tes lectures',
    reviser: 'Réviser',
    retirer: 'Retirer de l’apprentissage',
    duAujourdhui: 'À revoir aujourd’hui',
    terminer: 'J’ai terminé',
    reveler: 'Révéler ce mot',
    monte: 'Verset acquis d’un cran de plus.',
    reste: 'On le revoit bientôt, sans reculer beaucoup.',
    retour: 'Revenir à la liste',
    revoirLe: (d: string) => `À revoir le ${d}`,
    niveau: (n: number, max: number) => `Niveau ${n}/${max}`,
    consigne: (n: number) => n === 0 ? 'Touche un mot caché pour le révéler.' : `${n} mot${n > 1 ? 's' : ''} révélé${n > 1 ? 's' : ''}`,
    prochaine: (d: string) => `Prochaine révision le ${d}`,
  },

  versetDuJour: {
    title: 'Verset du jour',
    subtitle: 'Un verset tiré de tes lectures, le même toute la journée.',
    duJour: 'Aujourd’hui',
    marquerLu: 'J’ai lu ce verset',
    enregistrement: 'Enregistrement…',
    dejaLu: 'Lu aujourd’hui',
    ajouteAuxLectures: 'Il sera ajouté à tes lectures, contexte « Bible ».',
    noteLecture: 'Verset du jour',
    pasDeVerset: 'Aucun verset à proposer',
    pasDeVersetAide: 'Le verset du jour se tire de tes lectures. Enregistres-en une et reviens.',
    statJours: 'Jours suivis',
    statTotal: 'Versets lus',
    prochainDemain: (d: string) => `Un nouveau verset demain — aujourd’hui, ${d}`,
  },

  quiz: {
    title: 'Quizz de révision',
    subtitle: 'Révise ce que tu as lu, à ton rythme.',
    commencer: 'Commencer une partie',
    preparation: 'Préparation…',
    pasAssez: 'Pas encore assez de lectures',
    pasAssezAide: 'Enregistre quelques lectures et reviens : le quizz ne porte que sur ce que tu as lu.',
    suivante: 'Question suivante',
    terminer: 'Voir le résultat',
    rejouer: 'Rejouer',
    statParties: 'Parties',
    statReussite: 'Réussite',
    statMeilleur: 'Meilleur',
    statJours: 'Jours joués',
    bravoParfait: 'Sans faute. Impressionnant.',
    bravoBien: 'Très bien joué !',
    bravoMoyen: 'C’est en bonne voie.',
    bravoDebut: 'Chaque partie compte. On recommence ?',
    commencerAide: (n: number) => `${n} questions tirées de tes lectures`,
    progression: (i: number, n: number) => `Question ${i} sur ${n}`,
    bonnes: (n: number) => `${n} bonne${n > 1 ? 's' : ''}`,
    cetaitDans: (ref: string) => `C’était ${ref}`,
    resultat: (b: number, n: number) => `${b} bonnes réponses sur ${n}`,
    consignes: {
      livre: 'De quel livre vient ce verset ?',
      chapitre: 'De quel chapitre ?',
      trou: 'Quel mot manque ?',
      reference: 'Quelle est sa référence ?',
    } as Record<string, string>,
  },

  planCatalog: {
    title: 'Plans proposés',
    hint:
      'Des plans prêts à l’emploi. Ils sont engendrés par l’application, non repris d’un calendrier publié.',
    start: 'Démarrer',
    duration: 'Durée',
    dayCount: (n: number) => `${n} jours`,
    plans: {
      'at-evangiles-psaumes': { name: 'Ancien Testament, Évangiles et Psaumes', description: 'Chaque jour un passage de l’histoire d’Israël, un des Évangiles et un psaume.' },
      'nouveau-testament': { name: 'Le Nouveau Testament', description: 'Les vingt-sept livres, de Matthieu à l’Apocalypse, dans l’ordre.' },
      'evangiles-psaumes': { name: 'Les Évangiles et les Psaumes', description: 'Deux flux en parallèle, pour une lecture courte et quotidienne.' },
      'sagesse': { name: 'Un proverbe par jour', description: 'Les trente et un chapitres des Proverbes, un par jour du mois.' },
      'priere': { name: 'La prière', description: 'Quinze passages où l’Écriture prie, de Salomon à Jésus.' },
      'esperance': { name: 'L’espérance', description: 'Quatorze passages pour les temps où l’on attend.' },
      'pardon': { name: 'Le pardon', description: 'Onze passages sur la faute reconnue et la grâce reçue.' },
      'confiance': { name: 'Psaumes de confiance', description: 'Huit psaumes à relire quand la peur se rapproche.' },
    } as Record<string, { name: string; description: string }>,
  },

  colorThemes: {
    rubis: 'Rubis',
    turquoise: 'Turquoise',
    indigo: 'Indigo',
    rose: 'Rose',
    cafe: 'Café',
    perso: 'Personnalisée',
    marine: 'Marine',
    foret: 'Forêt',
    pourpre: 'Pourpre',
    ocre: 'Ocre',
    ardoise: 'Ardoise',
  } as Record<string, string>,

  errors: {
    title: 'Erreur',
    versionDownload: (name: string) =>
      `Téléchargement de « ${name} » impossible. Vérifie ta connexion.`,
    versionDelete: (name: string) =>
      `Suppression de « ${name} » impossible.`,
    importStructure: 'Structure JSON invalide : propriété « data » manquante.',
  },
}

/**
 * Pas de `as const` : il figerait chaque valeur en type littéral —
 * `save: 'Enregistrer'` et non `save: string` — et aucune traduction ne
 * pourrait plus satisfaire le type. Ce qu'on veut vérifier est la **forme**,
 * pas le contenu.
 */
export type Dictionary = typeof fr
