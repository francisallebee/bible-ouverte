import type { Dictionary } from './fr'

/**
 * Español. Typé contre la référence française : une clé manquante ne compile pas.
 *
 * Deux partis pris de langue, qui expliquent les écarts avec `fr.ts` :
 *
 * - le tutoiement (`tú`), comme en français — l'application s'adresse à une
 *   personne, pas à une administration ;
 * - le pluriel se décide sur `n !== 1` et non `n > 1`, car « 0 lecturas » se dit
 *   au pluriel en espagnol là où « 0 lecture » reste au singulier en français.
 *   C'est précisément ce qu'un gabarit à trous interdirait.
 */
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/password'

export const es: Dictionary = {
  common: {
    ticketStatuses: {
      open: 'abierto',
      in_progress: 'en curso',
      resolved: 'resuelto',
      closed: 'cerrado',
    } as Record<string, string>,
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
    back: 'Volver',
    loading: 'Cargando…',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'No',
    search: 'Buscar',
    all: 'Todos',
    none: 'Ninguno',
    add: 'Añadir',
    create: 'Crear',
    today: 'Hoy',
    yesterday: 'Ayer',
    optional: 'opcional',
    required: 'obligatorio',
    error: 'Se ha producido un error',
    retry: 'Reintentar',
    seeAll: 'Ver todo',
    of: 'de',
  },

  nav: {
    newReading: 'Nueva lectura',
    plans: 'Planes de lectura',
    search: 'Búsqueda bíblica',
    progress: 'Progreso',
    history: 'Mis lecturas',
    stats: 'Estadísticas',
    quiz: 'Cuestionario',
    versetDuJour: 'Versículo del día',
    memorisation: 'Memorización',
    settings: 'Ajustes',
    roadmap: 'Hoja de ruta',
    support: 'Soporte',
    donate: 'Apoyar el proyecto',
    profile: 'Mi perfil',
    admin: 'Administración',
    signOut: 'Cerrar sesión',
    menu: 'Menú',
  },

  language: {
    title: 'Idioma',
    subtitle: 'El idioma de la aplicación.',
    bibleLanguages:
      'El texto bíblico está disponible en los cinco idiomas de la aplicación. '
      + 'Elige en los Ajustes qué versiones conservar en este dispositivo.',
  },

  newReading: {
    title: 'Nueva lectura',
    subtitle: 'Registra tu lectura de hoy',
    date: 'Fecha',
    context: 'Contexto',
    book: 'Libro',
    selectBook: 'Selecciona un libro',
    chaptersAndVerses: 'Capítulos y versículos',
    selectBookFirst: 'Selecciona primero un libro',
    version: 'Versión',
    addAnotherPassage: 'Añadir otro pasaje a esta fecha',
    sharedFields:
      'La fecha, el contexto, las notas y los archivos son comunes a todos los '
      + 'pasajes.',
    passagesToSave: (n: number, withCurrent: boolean) =>
      `Pasajes por guardar (${n}${withCurrent ? ' + el actual' : ''})`,
    removePassage: (reference: string) => `Quitar ${reference}`,
    notes: 'Notas',
    notesPlaceholder: 'Tus reflexiones sobre este pasaje…',
    links: 'Enlaces',
    linkTitlePlaceholder: 'Título del enlace',
    addLink: 'Añadir el enlace',
    openLink: 'Abrir el enlace',
    removeLink: 'Quitar el enlace',
    audio: 'Audio',
    photos: 'Fotos',
    camera: 'Cámara',
    gallery: 'Galería',
    removePhoto: 'Quitar la foto',
    saving: 'Guardando…',
    saveOne: 'Guardar la lectura',
    saveMany: (n: number) => `Guardar las ${n} lecturas`,
    preview: 'Vista previa del texto',
    previewOpen: 'Ver el texto',
    leaveWarning:
      'Tu lectura no está guardada. Salir de esta página la perderá. ¿Continuar?',
    previewEmpty: 'Selecciona un libro para ver la vista previa.',
    previewUnavailable: 'Texto no disponible para esta referencia.',
    summary: 'Resumen de lo introducido',
    linkCount: (n: number) => `${n} ${n !== 1 ? 'enlaces' : 'enlace'}`,
    photoCount: (n: number) => `${n} ${n !== 1 ? 'fotos' : 'foto'}`,
    audioAttached: 'Audio adjunto',
  },

  contextPicker: {
    none: '— Sin contexto —',
    add: 'Añadir un contexto',
    cancelAdd: 'Cancelar la creación de un contexto',
    cancel: 'Cancelar',
    newName: 'Nombre del nuevo contexto',
    namePlaceholder: 'Grupo de casa, Retiro…',
    emoji: 'Emoji',
    chooseEmoji: (emoji: string) => `Elegir el emoji ${emoji}`,
    ownEmoji: 'o pega el tuyo',
    adding: 'Añadiendo…',
    confirmAdd: 'Añadir este contexto',
    errorNoName: 'Ponle un nombre a este contexto.',
    errorUnusable: 'Este nombre no contiene ningún carácter utilizable.',
    errorExists: 'Este contexto ya existe.',
  },

  history: {
    groupBy: 'Agrupar por',
    byDate: 'Fecha',
    byBook: 'Libro',
    byContext: 'Contexto',
    title: 'Mis lecturas',
    select: 'Seleccionar',
    selectedCount: (n: number) => `${n} ${n !== 1 ? 'seleccionadas' : 'seleccionada'}`,
    selectAll: (n: number) => `Seleccionar todo (${n})`,
    contextToApply: 'Contexto por aplicar',
    apply: 'Aplicar',
    leave: 'Salir',
    searchPlaceholder: 'Buscar en las notas o en el texto…',
    allBooks: 'Todos los libros',
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de fin',
    reset: 'Restablecer',
    collapseAll: 'Plegar todo',
    expandAll: 'Desplegar todo',
    empty: 'No se ha encontrado ninguna lectura.',
    readingCount: (n: number) => `${n} ${n !== 1 ? 'lecturas' : 'lectura'}`,
    confirmDeleteOne: '¿Eliminar esta lectura? Esta acción es definitiva.',
    confirmDeleteMany: (n: number) =>
      `¿Eliminar estas ${n} lecturas? Esta acción es definitiva.`,
  },

  settings: {
    fontPreview:
      'Porque tanto amó Dios al mundo que dio a su Hijo único.',
    uiScaleLabel: 'Tamaño de la interfaz',
    readingSizeLabel: 'Tamaño del texto bíblico',
    readingStyleLabel: 'Estilo del texto bíblico',
    fontsTitle: 'Fuentes',
    fontsHint:
      'Dos ajustes: uno para los menús, otro para el texto bíblico. El árabe conserva la fuente de tu dispositivo, que ninguna de estas cubre.',
    fontUi: 'Interfaz',
    fontReading: 'Texto bíblico',
    customTheme: 'Paleta personalizada',
    customThemeHint: 'Elige dos colores; los matices se deducen.',
    customPrimary: 'Color principal',
    customAccent: 'Color de acento',
    pages: 'Páginas visibles',
    pagesHint:
      'Elige qué páginas quedan en el menú. Ajustes y Nueva lectura siempre '
      + 'están disponibles.',
    setupTitle: 'Personaliza tu aplicación',
    setupHint:
      'Tómate un momento para elegir el idioma, el tema, tu objetivo y las '
      + 'páginas que quieres ver. No volveremos a preguntártelo.',
    setupDone: 'Terminar la personalización',
    title: 'Ajustes',
    subtitle: 'Personaliza tu experiencia',
    active: 'Activo',

    theme: 'Tema',
    themeLight: '☀️ Claro',
    themeDark: '🌙 Oscuro',
    themeSystem: '🖥️ Sistema',
    themeSystemHint:
      'La aplicación sigue el ajuste de día y noche de tu dispositivo y cambia '
      + 'en cuanto él lo hace.',

    colorTheme: 'Paleta de colores',
    colorThemeHint: 'Cambia el ambiente de la aplicación con un clic.',

    goal: 'Objetivo de lectura',
    goalHint: 'Fija un objetivo diario para seguir tu progreso.',
    goalChapters: 'Capítulos / día',
    goalVerses: 'Versículos / día',
    perDay: 'al día',
    goalSummary: (target: number, chapters: boolean) =>
      `→ ${target} ${chapters ? 'capítulos' : 'versículos'} al día`,

    versions: 'Versiones bíblicas',
    versionsHint:
      'Una versión activada se descarga en este dispositivo para leerla sin '
      + 'conexión — de 6 a 10 MB según el idioma. Desactivarla libera ese espacio.',
    versionDefault: 'Por defecto',
    versionDeleting: 'Eliminando…',
    versionDownloading: 'Descargando…',
    versionEnabled: 'Activada',

    exportTitle: 'Exportar los datos',
    exportHint: 'Descarga todos tus datos en formato JSON.',
    exportButton: 'Exportar en JSON',

    importTitle: 'Importar datos',
    importHint: 'Importa un archivo JSON exportado anteriormente.',
    importButton: 'Importar un archivo JSON',
    exportOk: 'Exportación realizada.',
    exportError: 'Error durante la exportación.',
    importConfirm: 'Esta acción reemplazará tus datos actuales. ¿Continuar?',
    importRunning: 'Importación en curso…',
    importOk: (n: number) =>
      `${n} ${n !== 1 ? 'elementos importados' : 'elemento importado'} correctamente.`,
    importError: (detail: string) => `Error: ${detail}`,
    importReadError: 'Error al leer el archivo.',
    /** Sirve para colorear el mensaje de importación en rojo o en verde. */
    errorMarker: 'Error',

    autoLogout: 'Cierre de sesión automático',
    autoLogoutHint:
      'Cierra la sesión tras un periodo sin actividad. Útil si lees desde un '
      + 'dispositivo compartido.',
    autoLogoutWarning:
      'Una ventana te avisará un minuto antes del cierre, para que no se '
      + 'pierda nada de lo que estés escribiendo.',
    autoLogoutChoices: {
      0: 'Nunca',
      15: 'Al cabo de 15 minutos',
      30: 'Al cabo de 30 minutos',
      60: 'Al cabo de una hora',
      240: 'Al cabo de cuatro horas',
    } as Record<number, string>,

    tour: 'Recorrido guiado',
    tourHint:
      'La visita guiada de las pantallas de la aplicación. Se lanza una sola '
      + 'vez, en la primera conexión — y después solo si la pides aquí.',
    tourDone: (date: string) => `Ya lo hiciste el ${date}.`,
    tourNotYet: 'Aún no lo has hecho: se abrirá en tu próxima visita.',
    tourReplay: 'Volver a ver el recorrido',

    sync: 'Sincronización en la nube',
    syncHint:
      'Sincroniza tus datos con tu cuenta para encontrarlos en todos tus '
      + 'dispositivos.',

    deleteAccount: 'Eliminar mi cuenta',
    deleteWarning:
      'Esta acción es irreversible. Todos tus datos se borrarán '
      + 'definitivamente.',
    deleteConfirm:
      '⚠️ ¿Estás seguro? Tus lecturas, planes y archivos se perderán para siempre.',
    deleteYes: 'Sí, eliminarlo todo',
    deleting: 'Eliminando…',
    deleteDone: 'Cuenta eliminada. Redirigiendo…',
    deleteError: 'Error durante la eliminación',

    info: 'Información',
    infoApp: 'Aplicación',
    infoVersion: 'Versión',
    infoOffline: 'Modo sin conexión',
    infoOfflineOn: 'Activado',
    infoStorage: 'Almacenamiento',
    infoVerses: 'Versículos disponibles',
  },

  notifications: {
    title: 'Notificaciones',
    readingDevice: 'Leyendo el dispositivo…',
    iosNotInstalled:
      'En iPhone y iPad, las notificaciones solo se entregan a las '
      + 'aplicaciones instaladas. Abre el menú de compartir de Safari, elige '
      + '«Añadir a pantalla de inicio» y vuelve aquí desde la aplicación así '
      + 'instalada.',
    unsupported:
      'Este navegador no admite las notificaciones. El ajuste sigue disponible '
      + 'desde un dispositivo que sí las admita.',
    denied:
      'Las notificaciones han sido rechazadas para este sitio. Una aplicación '
      + 'no puede deshacer esa decisión: hay que volver a permitirlas en los '
      + 'ajustes de tu navegador.',
    needsPermission:
      'Recibe un recordatorio de lectura en este dispositivo. Tu navegador te '
      + 'pedirá permiso.',
    waiting: 'Esperando tu respuesta…',
    allow: 'Permitir las notificaciones',
    receiveOnDevice: 'Recibir notificaciones en este dispositivo',
    whatTriggers: 'Lo que provoca una notificación',
    at: 'A las',
    timeZoneOf: (zone: string) => `hora de ${zone}`,
    granted: 'El permiso está concedido y tus preferencias están guardadas.',
    sendTest: 'Enviar una notificación de prueba',
    testSending: 'Enviando…',
    testSent:
      'Notificación enviada. Si no la ves aparecer, es que tu dispositivo la '
      + 'está reteniendo — revisa sus ajustes de notificaciones para Bible '
      + 'Ouverte.',
    noPermission: 'El permiso no está concedido en este dispositivo.',
    testUnsupported: 'Este navegador no admite las notificaciones.',
    testFailed:
      'El dispositivo ha rechazado el envío. En iPhone, la aplicación debe '
      + 'abrirse desde la pantalla de inicio y no desde Safari.',
    subscribeFailed:
      'No se ha podido suscribir este dispositivo. Los ajustes están '
      + 'guardados, pero no se le enviará nada.',
    /** Etiquetas de los cinco disparadores, por identificador. */
    triggers: {
      daily: {
        label: 'Recordatorio diario',
        hint: 'A la hora que elijas, para no olvidar tu lectura.',
      },
      'plan-late': {
        label: 'Plan de lectura atrasado',
        hint: 'Cuando un día previsto no se ha marcado.',
      },
      'support-reply': {
        label: 'Respuesta a un mensaje de soporte',
        hint: 'Cuando alguien responde a uno de tus tickets.',
      },
      'roadmap-done': {
        label: 'Hoja de ruta',
        hint: 'Cuando una función esperada pasa a «Terminado».',
      },
      inactive: {
        label: 'Ausencia prolongada',
        hint: 'Un aviso tras varios días sin lectura.',
      },
    },
  },

  plans: {
    title: 'Planes de lectura',
    newPlan: 'Nuevo plan',
    createTitle: 'Crear un plan de lectura',
    name: 'Nombre',
    namePlaceholder: 'Mi plan 2026',
    kind: 'Tipo de plan',
    scheduled: 'Con fechas',
    scheduledHint: 'Un pasaje al día, repartido a lo largo de un periodo.',
    free: 'Libre',
    freeHint: 'Una lista de pasajes sin fecha, marcados a tu ritmo.',
    duration: 'Duración',
    durations: {
      '1-year': '1 año',
      '6-months': '6 meses',
      '3-months': '3 meses',
      '1-month': '1 mes',
      custom: 'Personalizada',
    } as Record<string, string>,
    durationDays: (days: number) => ` (${days} días)`,
    customDaysPlaceholder: 'Número de días',
    version: 'Versión',
    startDate: 'Fecha de inicio',
    creating: 'Creando…',
    create: 'Crear el plan',
    empty: 'Ningún plan de lectura.',
    emptyHint: 'Crea un plan para leer la Biblia en un periodo definido.',
    freePlan: 'Plan libre',
    scheduledSummary: (duration: string, days: number) =>
      `${duration} · ${days} días`,
    undated: 'Sin fecha',
    deleteTitle: '¿Eliminar este plan?',
    deleteHint: 'Esta acción es irreversible.',
  },

  /** Las diez categorías de libros, por identificador de `BIBLE_CATEGORIES`. */
  bibleCategories: {
    pentateuch: 'Pentateuco',
    historical: 'Libros históricos',
    poetic: 'Libros poéticos',
    'major-prophets': 'Profetas mayores',
    'minor-prophets': 'Profetas menores',
    gospels: 'Evangelios',
    acts: 'Historia apostólica',
    'pauline-epistles': 'Epístolas paulinas',
    'general-epistles': 'Epístolas generales',
    revelation: 'Apocalipsis',
  } as Record<string, string>,

  progress: {
    title: 'Mi progreso',
    level: (n: number) => `Nivel ${n}`,
    chaptersOf: (read: number, next: number) => `${read} / ${next} capítulos`,
    currentStreak: 'Racha actual',
    days: 'días',
    bestStreak: (n: number) => `Mejor: ${n} días`,
    chaptersRead: 'Capítulos leídos',
    booksStarted: (n: number) =>
      `${n} ${n !== 1 ? 'libros empezados' : 'libro empezado'}`,
    dailyGoal: 'Objetivo del día',
    chaptersToday: 'capítulos hoy',
    versesToday: 'versículos hoy',
    noGoal: 'Ningún objetivo definido',
    goalReached: '¡Objetivo alcanzado! 🎉',
    goalAlmost: 'Un poco más de esfuerzo',
    goalToday: (current: number, target: number, chapters: boolean) =>
      `${current} / ${target} ${chapters ? 'capítulos' : 'versículos'} hoy`,
    oldTestament: 'Antiguo Testamento',
    newTestament: 'Nuevo Testamento',
    chaptersOfTotal: (read: number, total: number) => `${read} / ${total} capítulos`,
    byContext: 'Progreso por contexto',
    chapterCount: (n: number) => `${n} ${n !== 1 ? 'capítulos' : 'capítulo'}`,
    noContext: 'Sin contexto',
    byCategory: 'Progreso por categoría',
    achievements: 'Logros y recompensas',
    byBook: 'Detalle por libro',
    /** Títulos de nivel, por escalón. */
    levels: {
      1: 'Lector aprendiz',
      2: 'Lector de domingo',
      3: 'Fiel',
      4: 'Entregado',
      5: 'Erudito',
      6: 'Teólogo',
      7: 'Maestro',
    } as Record<number, string>,
    badges: {
      first: { name: 'Primeros pasos', description: 'Leer su primer capítulo' },
      ten: { name: 'Descubridor', description: 'Leer 10 capítulos' },
      fifty: { name: 'Explorador', description: 'Leer 50 capítulos' },
      hundred: { name: 'Lector constante', description: 'Leer 100 capítulos' },
      'two-fifty': { name: 'Escriba', description: 'Leer 250 capítulos' },
      'five-hundred': { name: 'Doctor de la Ley', description: 'Leer 500 capítulos' },
      thousand: { name: 'Centinela', description: 'Leer 1000 capítulos' },
      'streak-3': { name: 'Regular', description: '3 días seguidos' },
      'streak-7': { name: 'Perseverante', description: '7 días seguidos' },
      'streak-30': { name: 'Imparable', description: '30 días seguidos' },
      'streak-100': { name: 'Leyenda viva', description: '100 días seguidos' },
      'category-all': { name: 'Canon completo', description: 'Leer en todas las categorías' },
      'category-half': { name: 'A mitad de camino', description: 'Leer en la mitad de las categorías' },
    },
  },
  search: {
    context: 'Contexto (opcional)',
    title: 'Búsqueda bíblica',
    modeReference: 'Referencia',
    modeKeyword: 'Libre',
    book: 'Libro',
    select: 'Seleccionar',
    chapter: 'Capítulo',
    verse: 'Versículo (opcional)',
    all: 'Todos',
    version: 'Versión',
    go: 'Buscar',
    verseCount: (n: number) => `${n} ${n !== 1 ? 'versículos' : 'versículo'}`,
    addThisReading: '+ Añadir esta lectura',
    noResult: 'Ningún resultado.',
    keyword: 'Palabra clave',
    keywordPlaceholder: 'Escribe una palabra o una frase…',
    searching: 'Buscando…',
    noResultFor: (q: string) => `Ningún resultado para «${q}».`,
    resultCount: (n: number, q: string) =>
      `${n} ${n !== 1 ? 'resultados' : 'resultado'} para «${q}»`,
    add: '+ Añadir',
    truncated: 'Se muestran los 100 primeros resultados. Afina tu búsqueda.',
    addTitle: 'Añadir una lectura',
    date: 'Fecha',
    notes: 'Notas (opcional)',
    adding: 'Añadiendo…',
    addToReadings: 'Añadir a las lecturas',
    added: 'Añadida ✓',
  },
  stats: {
    title: 'Estadísticas',
    empty: 'Todavía no hay datos de lectura.',
    total: 'Total de lecturas',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mes',
    perDay: 'Lecturas por día (30 días)',
    topBooks: 'Top 10 libros',
    byContext: 'Reparto por contexto',
    byVersion: 'Reparto por versión',
    noContext: 'Sin contexto',
  },
  donate: {
    title: 'Apoyar el proyecto',
    subtitle: 'Bible Ouverte es gratuita, sin publicidad y sin venta de datos',
    freeText:
      'Las siete traducciones que ofrecemos son de dominio público: no cuestan '
      + 'nada y nunca costarán nada. La aplicación, en cambio, se apoya en un '
      + 'alojamiento y en una base de datos que tienen un precio, y en tiempo '
      + 'de desarrollo.',
    patreonText:
      'Unirse a la comunidad ÔAppliday en Patreon es lo que permite que este '
      + 'trabajo continúe y que las funciones anunciadas en la hoja de ruta '
      + 'vean la luz.',
    patreonButton: 'Unirse a la comunidad en Patreon',
    freeWaysTitle: 'Apoyar sin gastar nada',
    freeWaysText:
      'Con hablar de ella a tu alrededor ya basta. Y tus comentarios orientan '
      + 'directamente lo que se desarrolla.',
    reportBug: 'Informar de un error o proponer una idea',
    voteRoadmap: 'Votar en la hoja de ruta',
    whatsappBefore: 'El canal de WhatsApp ',
    whatsappAfter: ' anuncia las novedades.',
  },
  roadmap: {
    title: 'Hoja de ruta',
    add: 'Añadir',
    itemTitle: 'Título',
    titlePlaceholder: 'Nombre de la función',
    description: 'Descripción',
    descriptionPlaceholder: 'Descríbela brevemente…',
    status: 'Estado',
    empty: 'Ningún elemento por ahora',
    itemCount: (n: number) => `${n} ${n !== 1 ? 'elementos' : 'elemento'}`,
    modifiedOn: (date: string) => ` · modificado el ${date}`,
    confirmDelete: '¿Eliminar este elemento de la hoja de ruta?',
    footerAdmin: 'Puedes añadir, modificar o eliminar elementos.',
    footerUser: 'Las funciones futuras se listarán aquí.',
    /** Los cinco estados, por clave — están en la base, no cambian. */
    statuses: {
      planned: 'Planificado',
      projet: 'Proyecto',
      'in-progress': 'En curso',
      done: 'Terminado',
      cancelled: 'Cancelado',
    } as Record<string, string>,
  },
  support: {
    replyFailed:
      'Respuesta no guardada. El mensaje puede estar cerrado, o se perdió la conexión.',
    closedSection: (n: number) => `Cerrados (${n})`,
    closedNotice:
      'Este mensaje está cerrado. Solo un administrador puede reabrirlo.',
    title: 'Soporte y sugerencias',
    subtitle: 'Informa de un error o propón una mejora',
    newMessage: 'Nuevo mensaje',
    newMessageHint: 'Comparte tu opinión sobre la aplicación',
    type: 'Tipo',
    bug: '🐛 Error',
    suggestion: '💡 Sugerencia',
    name: 'Nombre (visible para todos)',
    namePlaceholder: 'Tu nombre o apodo',
    message: 'Mensaje',
    bugPlaceholder: 'Describe el error: ¿qué ha ocurrido?',
    suggestionPlaceholder: 'Describe tu idea de mejora…',
    send: 'Enviar',
    empty: 'Ningún mensaje por ahora',
    emptyHint: '¡Sé el primero en compartir tu opinión!',
    replyCount: (n: number) => `${n} ${n !== 1 ? 'respuestas' : 'respuesta'}`,
    admin: 'Admin',
    replyPlaceholder: 'Responder…',
    commentPlaceholder: 'Añadir un comentario…',
    reply: '✏️ Responder',
    comment: '💬 Comentar',
    confirmDelete:
      '¿Eliminar este mensaje y sus respuestas? Esta acción es definitiva.',
    deleteFailed:
      'No se ha podido eliminar. Revisa tu conexión — la eliminación está '
      + 'reservada a los administradores.',
    defaultAdminName: 'Administrador',
    defaultUserName: 'Usuario',
  },
  auth: {
    passwordRules: {
      labels: {
        length: `al menos ${PASSWORD_MIN_LENGTH} caracteres`,
        lowercase: 'una minúscula',
        uppercase: 'una mayúscula',
        digit: 'un número',
        symbol: 'un símbolo (por ejemplo ! ? * - .)',
      },
      sentence: (list: string) => `La contraseña debe contener ${list}.`,
      and: 'y',
    },
  },

  profile: {
    title: 'Mi perfil',
    loadError: 'Error al cargar el perfil',
    removeAvatar: 'Eliminar el avatar',
    firstName: 'Nombre',
    email: 'Correo electrónico',
    birthDate: 'Fecha de nacimiento',
    phone: 'Teléfono',
    phonePlaceholder: '+34 612 34 56 78',
    bio: 'Biografía',
    bioPlaceholder: 'Unas palabras sobre ti…',
    socials: 'Redes sociales',
    addSocial: '+ Añadir',
    noSocial: 'Ninguna red añadida',
    socialPrompt: 'Nombre de la red (p. ej.: instagram, twitter, facebook)',
    saving: 'Guardando…',
    save: 'Guardar',
    saved: '✓ Perfil actualizado',
    password: 'Contraseña',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar la nueva contraseña',
    passwordHint: (min: number) =>
      `${min} caracteres como mínimo, con una minúscula, una mayúscula, un `
      + 'número y un símbolo.',
    changing: 'Modificando…',
    changePassword: 'Cambiar la contraseña',
    passwordChanged: '✓ Contraseña modificada. La usarás en tu próxima conexión.',
    mismatch: 'Las dos veces que has escrito la nueva contraseña no coinciden.',
    sameAsCurrent: 'La nueva contraseña debe ser distinta de la actual.',
    wrongCurrent: 'Contraseña actual incorrecta.',
  },
  authScreens: {
    login: 'Bienvenido de nuevo',
    loginSubtitle: 'Retoma tus lecturas donde las dejaste.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    signingIn: 'Conectando…',
    signIn: 'Iniciar sesión',
    noAccount: '¿Todavía no tienes cuenta? ',
    createAccount: 'Crear una cuenta',
    suspended: 'Un administrador ha suspendido tu cuenta.',

    signupTitle: 'Crear una cuenta',
    signupSubtitle: 'Menos de un minuto, y es gratis.',
    firstName: 'Nombre',
    creating: 'Creando…',
    createButton: 'Crear la cuenta',
    haveAccount: '¿Ya tienes cuenta? ',
    goToLogin: 'Ir al inicio de sesión',
    accountCreated: 'Cuenta creada',
    mailSentBefore: 'Acaba de salir un mensaje hacia ',
    mailSentAfter:
      '. Ábrelo para confirmar tu dirección y vuelve luego a iniciar sesión.',
    yourAddress: 'tu dirección',

    confirming: 'Confirmación en curso',
    confirmingHint: 'Tu dirección se está verificando. Un momento más.',

    home: 'Inicio',
    byPrefix: 'Por ',
    bySuffix: ' — Recursos y Tú',
  },
  components: {
    syncAuto: 'Sincronizado automáticamente',
    syncSignIn: 'Inicia sesión para guardar tus datos en la nube.',

    stillThere: '¿Sigues ahí?',
    sessionClosingBefore: 'Sin respuesta, tu sesión se cerrará en ',
    seconds: (n: number) => `${n} ${n !== 1 ? 'segundos' : 'segundo'}`,
    signOutNow: 'Cerrar sesión',
    stayHere: 'Aquí sigo',

    micUnavailable: 'No se ha podido acceder al micrófono.',
    stopRecording: (duration: string) => `Detener (${duration})`,
    record: 'Grabar',
    audioFile: 'Archivo de audio',

    addPassage: 'Añadir un pasaje',
    book: 'Libro',
    selectBook: 'Selecciona un libro',
    selectBookFirst: 'Selecciona primero un libro',
    addToList: 'Añadir a la lista',
  },
  bookPicker: {
    placeholder: 'Seleccionar un libro',
    dialogLabel: 'Elegir un libro',
    search: 'Buscar un libro…',
    oldTestament: 'Antiguo Testamento',
    newTestament: 'Nuevo Testamento',
    noMatch: 'Ningún libro coincide',
  },

  passageSearch: {
    title: 'Buscar un pasaje',
    open: 'Buscar un pasaje',
    use: 'Usar este pasaje',
  },

  passagePicker: {
    dialogLabel: (bookName: string) => `Capítulos y versículos — ${bookName}`,
    chapter: 'Capítulo',
    chapters: 'Capítulos',
    rangeHint: 'Un segundo toque más allá selecciona el intervalo.',
    verse: 'Versículo',
    verses: 'Versículos',
    wholeChapter: 'Todo el capítulo',
    allVerses: 'Todos los versículos',
    firstVerseOf: (chapter: number) => `Primer versículo — capítulo ${chapter}`,
    lastVerseOf: (chapter: number) => `Último versículo — capítulo ${chapter}`,
    firstVerseLabel: (chapter: number) => `Primer versículo, capítulo ${chapter}`,
    lastVerseLabel: (chapter: number) => `Último versículo, capítulo ${chapter}`,
    validate: 'Validar',
  },
  admin: {
    title: 'Administración',
    refresh: 'Actualizar',
    denied: 'Acceso denegado',
    notAdmin: 'No eres administrador.',
    tabUsers: 'Usuarios',
    tabTickets: 'Tickets',
    statUsers: 'Usuarios',
    statUsersSub: (admins: number, actifs: number) =>
      `${admins} admin · ${actifs} activos/7 d`,
    statReadings: 'Lecturas',
    statSuspended: 'Suspendidos',
    statPlans: 'Planes',
    statPlanDays: (days: number) => `${days} días`,
    statContexts: 'Contextos',
    colUser: 'Usuario',
    colEmail: 'Correo',
    colRole: 'Rol',
    colStatus: 'Estado',
    colPlans: 'Planes',
    colLastSignIn: 'Conexión',
    colActions: 'Acciones',
    noName: 'Sin nombre',
    roleAdmin: 'Admin',
    roleUser: 'User',
    suspended: 'Suspendido',
    online: 'En línea',
    offline: 'Sin conexión',
    never: 'Nunca',
    demote: 'Degradar',
    promote: 'Promover a admin',
    reactivate: 'Reactivar',
    suspend: 'Suspender',
    confirmDelete: (name: string) => `¿Eliminar a ${name} y todos sus datos?`,
    allTickets: (n: number) => `Todos (${n})`,
    noTicket: 'Ningún ticket',
    by: (name: string) => `Por ${name}`,
    replyCount: (n: number) => `${n} ${n !== 1 ? 'respuestas' : 'respuesta'}`,
    categories: { bug: 'Error', suggestion: 'Sugerencia' } as Record<string, string>,
  },
  planDetail: {
    notFound: 'Plan no encontrado.',
    backToPlans: 'Volver a los planes',
    passagesRead: (read: number, total: number, pct: number) =>
      `${read}/${total} pasajes leídos${total > 0 ? ` (${pct} %)` : ''}`,
    daysRead: (read: number, total: number, pct: number) =>
      `${read}/${total} días leídos (${pct} %)`,
    export: 'Exportar',
    editPlan: 'Modificar el plan',
    name: 'Nombre',
    duration: 'Duración',
    durations: {
      '1-year': '1 año (365 días)',
      '6-months': '6 meses (182 días)',
      '3-months': '3 meses (91 días)',
      '1-month': '1 mes (30 días)',
      custom: 'Personalizada',
    } as Record<string, string>,
    customDays: 'Número de días',
    version: 'Versión',
    startDate: 'Fecha de inicio',
    booksLabel: 'Libros (déjalo vacío para toda la Biblia)',
    allBooks: 'Todos los libros',
    booksSelected: (n: number) =>
      `${n} ${n !== 1 ? 'libros seleccionados' : 'libro seleccionado'}`,
    saving: 'Guardando…',
    remaining: (n: number, total: number, free: boolean) =>
      `${n} ${free ? 'pasajes restantes' : 'días restantes'} de ${total}`,
    previous: 'Anterior',
    next: 'Siguiente',
    emptyList: 'Esta lista todavía está vacía.',
    emptyListHint: 'Añade los pasajes que quieras leer, en el orden que prefieras.',
    day: (n: number) => `Día ${n}`,
    readOn: 'Leído el ',
    notReadYet: 'Todavía no leído',
    remove: (reference: string) => `Quitar ${reference}`,
    readOnLabel: 'Leído el',
    validate: 'Validar',
  },
  readingDetail: {
    notFound: 'Lectura no encontrada',
    backToHistory: 'Volver al historial',
    editTitle: 'Modificar la lectura',
    detailTitle: 'Detalle de la lectura',
    date: 'Fecha',
    book: 'Libro',
    chapterStart: 'Capítulo inicial',
    chapterEnd: 'Capítulo final',
    verseStart: 'Versículo inicial',
    verseEnd: 'Versículo final',
    version: 'Versión',
    saveEdit: 'Guardar',
    versionLabel: (name: string) => `Versión: ${name}`,
    notes: 'Notas',
    links: 'Enlaces',
    audio: 'Audio',
    pause: 'Pausar',
    play: 'Escuchar el audio',
    audioAttached: 'Audio adjunto',
    photos: 'Fotos',
    bibleText: 'Texto bíblico',
    textUnavailable:
      'Texto no disponible para esta referencia con la versión seleccionada.',
    confirmDelete: '¿Eliminar esta lectura?',
  },
  tour: {
    /** El texto de las 17 etapas, por identificador de `TOUR_STEPS`. */
    steps: {
      bienvenue: {
        title: 'Te damos la bienvenida a Bible Ouverte',
        body:
          'Esta aplicación guarda el rastro de lo que lees en la Biblia — '
          + 'cuándo, en qué marco, y lo que la lectura te ha dejado. Este '
          + 'recorrido repasa cada pantalla. Dura dos minutos y no volverá a '
          + 'aparecer solo.',
        points: [
          'Tus datos son solo tuyos y te siguen en todos tus dispositivos.',
          'Puedes salir en cualquier momento y retomarlo desde los Ajustes.',
        ],
      },
      'nouvelle-lecture': {
        title: 'Registrar una lectura',
        body:
          'Es el gesto central, y la pantalla que se abre en cada conexión. '
          + 'Eliges un libro, unos capítulos, y si quieres el detalle de los '
          + 'versículos.',
        points: [
          'Varios pasajes pueden caber en una misma lectura.',
          'Una nota libre recoge lo que has entendido o retenido.',
          'Puedes adjuntar una foto de tus notas, una nota de voz o un enlace.',
        ],
      },
      contextes: {
        title: 'Los contextos',
        body:
          'Cada lectura se vincula a un marco: meditación personal, culto, '
          + 'predicación, pódcast, audiolibro. Es lo que más tarde hará hablar '
          + 'a las estadísticas.',
        points: [
          'El selector «Contexto» de esta pantalla los ofrece.',
          'Al principio existen diez, con su emoji.',
          'Puedes crear uno sobre la marcha, sin salir de lo que escribes.',
        ],
      },
      plans: {
        title: 'Los planes de lectura',
        body:
          'Un plan reparte un conjunto de textos a lo largo del periodo que '
          + 'elijas, y luego te propone cada día su parte.',
        points: [
          'La Biblia entera, el Nuevo Testamento, o un solo libro.',
          'Los planes libres admiten pasajes hasta el versículo exacto.',
          'Marcar un día crea la lectura correspondiente en tu historial.',
        ],
      },
      recherche: {
        title: 'La búsqueda bíblica',
        body:
          'El texto completo se consulta aquí, sin salir de la aplicación ni '
          + 'abrir otro sitio.',
        points: [
          'Siete traducciones francesas libres de derechos, de 1667 a 1996.',
          'Busca una palabra, una expresión o una referencia como «Juan 3:16».',
        ],
      },
      progression: {
        title: 'El progreso',
        body:
          'Los sesenta y seis libros aparecen y se van llenando a medida que '
          + 'los recorres. De un vistazo, ves lo que queda.',
        points: [
          'El progreso se cuenta en capítulos, nunca en versículos: anotar '
          + 'Juan 3:16 marca todo Juan 3 como leído.',
          'El Antiguo y el Nuevo Testamento se siguen por separado.',
        ],
      },
      historique: {
        title: 'El historial',
        body:
          'Todas tus lecturas, de la más reciente a la más antigua. Es desde '
          + 'aquí que se vuelve sobre lo que se ha escrito.',
        points: [
          'Filtra por libro, por contexto o por periodo.',
          'Abre una lectura para corregirla o completarla.',
          'Una selección múltiple permite eliminar en bloque.',
        ],
      },
      statistiques: {
        title: 'Las estadísticas',
        body:
          'Lo que tus lecturas dicen de tus hábitos, sin juicio ni objetivo '
          + 'impuesto.',
        points: [
          'Tu ritmo en el tiempo, y las rachas de días seguidos.',
          'El reparto por contexto y los libros más frecuentados.',
        ],
      },
      reglages: {
        title: 'Los ajustes',
        body:
          'La pantalla más densa, y la que menos se visita. Manda sobre la '
          + 'apariencia, las traducciones guardadas en el dispositivo y la '
          + 'seguridad de la cuenta.',
        points: [
          'Activa o quita una traducción: cada una pesa de 6 a 10 MB sin conexión.',
          'Tema claro, oscuro, o acorde con el de tu sistema.',
          'Cierre de sesión automático tras un tiempo de inactividad.',
          'Exportación e importación de todos tus datos, para guardar una copia.',
        ],
      },
      notifications: {
        title: 'Los recordatorios',
        body:
          'Cinco motivos pueden avisarte, y cada uno se corta por separado. No '
          + 'sale nada mientras no hayas dado permiso en el dispositivo.',
        points: [
          'Un recordatorio diario, a la hora que tú fijes.',
          'Un plan de lectura atrasado, o una ausencia prolongada.',
          'Una respuesta a un mensaje de soporte, un elemento de la hoja de '
          + 'ruta terminado.',
          'En iPhone, la aplicación debe estar instalada en la pantalla de '
          + 'inicio: iOS no entrega nada desde una pestaña de Safari.',
        ],
      },
      'hors-ligne': {
        title: 'Sin red, todo continúa',
        body:
          'Las traducciones activas y tus lecturas se guardan en el '
          + 'dispositivo. En un tren o en un sótano, la aplicación sigue '
          + 'entera.',
        points: [
          'Lo que escribes sin conexión sale hacia la nube en cuanto vuelve la '
          + 'señal.',
          'La nube manda: es ella la que pone de acuerdo a tus dispositivos.',
        ],
      },
      'feuille-de-route': {
        title: 'La hoja de ruta',
        body:
          'Lo que está en obras y lo que vendrá después. Es pública, y puedes '
          + 'decir lo que cuenta para ti.',
        points: [],
      },
      support: {
        title: 'El soporte',
        body:
          'Una pregunta, un fallo, una idea: abre un mensaje y la respuesta te '
          + 'llegará aquí.',
        points: [
          'Los mensajes son visibles para todos los usuarios, con el nombre de '
          + 'su autor: no pongas en ellos nada confidencial.',
        ],
      },
      soutenir: {
        title: 'Apoyar el proyecto',
        body:
          'La aplicación es gratuita, sin publicidad y sin venta de datos. '
          + 'Esta página explica cómo ayudar a cubrir sus gastos, si te '
          + 'apetece.',
        points: [],
      },
      profil: {
        title: 'Tu perfil',
        body:
          'Tu nombre, tu avatar y tus datos. Es también desde aquí que se '
          + 'cambia la contraseña y se elimina la cuenta.',
        points: [
          'La eliminación lo borra todo, definitivamente, sin copia guardada.',
        ],
      },
      administration: {
        title: 'La administración',
        body:
          'Reservada a tu cuenta: la lista de usuarios, los mensajes de '
          + 'soporte recibidos y el mantenimiento de la hoja de ruta.',
        points: [],
      },
      fin: {
        title: 'Te toca a ti',
        body:
          'Ya has dado la vuelta. El recorrido no volverá a abrirse por sí '
          + 'solo — pero te espera en los Ajustes, sección «Recorrido guiado», '
          + 'el día que quieras repetirlo.',
        points: [
          'Empieza por registrar una primera lectura: de ahí parte todo.',
        ],
      },
    },
  },
  tourUi: {
    close: 'Cerrar el recorrido guiado',
    stepOf: (n: number, total: number) => `Paso ${n} de ${total}`,
    skip: 'Saltar el recorrido',
    previous: 'Anterior',
    next: 'Siguiente',
    finish: 'Terminar',
  },
  fontSizes: {
    'compact': 'Compacto',
    'normal': 'Normal',
    'grand': 'Grande',
    'tres-grand': 'Muy grande',
    'geant': 'Gigante',
  } as Record<string, string>,

  fontStyles: {
    'normal': 'Normal',
    'italique': 'Cursiva',
    'gras': 'Negrita',
    'gras-italique': 'Negrita cursiva',
  } as Record<string, string>,

  fonts: {
    systeme: 'Sistema',
    inter: 'Inter',
    lora: 'Lora',
    garamond: 'Garamond',
    hyperlegible: 'Hiperlegible',
  } as Record<string, string>,

  memorisation: {
    title: 'Memorización',
    subtitle: 'Aprende un versículo y reencuéntralo cuando vuelva.',
    aRevoir: 'para repasar hoy',
    ajouterHasard: 'Un versículo al azar',
    aucun: 'Ningún versículo en aprendizaje',
    aucunAide: 'Elige uno abajo, o deja que decida el azar.',
    choisir: 'De tus lecturas',
    reviser: 'Repasar',
    retirer: 'Quitar del aprendizaje',
    duAujourdhui: 'Para hoy',
    terminer: 'He terminado',
    reveler: 'Revelar esta palabra',
    monte: 'Un paso más.',
    reste: 'Lo veremos pronto, sin perder mucho.',
    retour: 'Volver a la lista',
    revoirLe: (d: string) => `Repasar el ${d}`,
    niveau: (n: number, max: number) => `Nivel ${n}/${max}`,
    consigne: (n: number) => n === 0 ? 'Toca una palabra oculta para revelarla.' : `${n} palabra${n !== 1 ? 's' : ''} revelada${n !== 1 ? 's' : ''}`,
    prochaine: (d: string) => `Próximo repaso el ${d}`,
  },

  versetDuJour: {
    title: 'Versículo del día',
    subtitle: 'Un versículo sacado de tus lecturas, el mismo todo el día.',
    duJour: 'Hoy',
    marquerLu: 'He leído este versículo',
    enregistrement: 'Guardando…',
    dejaLu: 'Leído hoy',
    ajouteAuxLectures: 'Se añadirá a tus lecturas, contexto «Biblia».',
    noteLecture: 'Versículo del día',
    pasDeVerset: 'No hay versículo que proponer',
    pasDeVersetAide: 'El versículo del día se saca de tus lecturas. Registra una y vuelve.',
    statJours: 'Días seguidos',
    statTotal: 'Versículos leídos',
    prochainDemain: (d: string) => `Un nuevo versículo mañana — hoy, ${d}`,
  },

  quiz: {
    title: 'Cuestionario de repaso',
    subtitle: 'Repasa lo que has leído, a tu ritmo.',
    commencer: 'Empezar una partida',
    preparation: 'Preparando…',
    pasAssez: 'Aún no hay suficientes lecturas',
    pasAssezAide: 'Registra algunas lecturas y vuelve: el cuestionario solo cubre lo que has leído.',
    suivante: 'Siguiente pregunta',
    terminer: 'Ver el resultado',
    rejouer: 'Jugar de nuevo',
    statParties: 'Partidas',
    statReussite: 'Acierto',
    statMeilleur: 'Mejor',
    statJours: 'Días jugados',
    bravoParfait: 'Sin fallos. Impresionante.',
    bravoBien: '¡Muy bien jugado!',
    bravoMoyen: 'Vas por buen camino.',
    bravoDebut: 'Cada partida cuenta. ¿Otra vez?',
    commencerAide: (n: number) => `${n} preguntas sacadas de tus lecturas`,
    progression: (i: number, n: number) => `Pregunta ${i} de ${n}`,
    bonnes: (n: number) => `${n} acertada${n !== 1 ? 's' : ''}`,
    cetaitDans: (ref: string) => `Era ${ref}`,
    resultat: (b: number, n: number) => `${b} aciertos de ${n}`,
    consignes: {
      livre: '¿De qué libro es este versículo?',
      chapitre: '¿De qué capítulo?',
      trou: '¿Qué palabra falta?',
      reference: '¿Cuál es su referencia?',
    } as Record<string, string>,
  },

  planCatalog: {
    title: 'Planes propuestos',
    hint:
      'Planes listos para usar. Los genera la aplicación; no proceden de un calendario publicado.',
    start: 'Empezar',
    duration: 'Duración',
    dayCount: (n: number) => `${n} días`,
    plans: {
      'at-evangiles-psaumes': { name: 'Antiguo Testamento, Evangelios y Salmos', description: 'Cada día un pasaje de la historia de Israel, uno de los Evangelios y un salmo.' },
      'nouveau-testament': { name: 'El Nuevo Testamento', description: 'Los veintisiete libros, de Mateo al Apocalipsis, en orden.' },
      'evangiles-psaumes': { name: 'Evangelios y Salmos', description: 'Dos corrientes en paralelo, para una lectura breve y diaria.' },
      'sagesse': { name: 'Un proverbio al día', description: 'Los treinta y un capítulos de Proverbios, uno por día del mes.' },
      'priere': { name: 'La oración', description: 'Quince pasajes donde la Escritura ora, de Salomón a Jesús.' },
      'esperance': { name: 'La esperanza', description: 'Catorce pasajes para los tiempos de espera.' },
      'pardon': { name: 'El perdón', description: 'Once pasajes sobre la falta reconocida y la gracia recibida.' },
      'confiance': { name: 'Salmos de confianza', description: 'Ocho salmos para releer cuando el miedo se acerca.' },
    } as Record<string, { name: string; description: string }>,
  },

  colorThemes: {
    rubis: 'Rubí',
    turquoise: 'Turquesa',
    indigo: 'Índigo',
    rose: 'Rosa',
    cafe: 'Café',
    perso: 'Personalizada',
    marine: 'Marino',
    foret: 'Bosque',
    pourpre: 'Púrpura',
    ocre: 'Ocre',
    ardoise: 'Pizarra',
  } as Record<string, string>,

  errors: {
    title: 'Error',
    versionDownload: (name: string) =>
      `No se ha podido descargar «${name}». Revisa tu conexión.`,
    versionDelete: (name: string) =>
      `No se ha podido eliminar «${name}».`,
    importStructure: 'Estructura JSON no válida: falta la propiedad «data».',
  },
}
