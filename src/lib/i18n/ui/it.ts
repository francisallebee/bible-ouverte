import type { Dictionary } from './fr'

/**
 * Italiano. Typé contre la référence française : une clé manquante ne compile pas.
 *
 * Deux partis pris de langue, qui expliquent les écarts avec `fr.ts` :
 *
 * - le tutoiement (`tu`), comme en français ;
 * - le pluriel se décide sur `n !== 1` et non `n > 1` — « 0 letture » se dit au
 *   pluriel en italien — et il ne s'obtient pas en ajoutant une lettre :
 *   `lettura` fait `letture`, `capitolo` fait `capitoli`. Les deux formes sont
 *   donc écrites en entier, ce qu'un gabarit à trous interdirait.
 */
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/password'

export const it: Dictionary = {
  common: {
    ticketStatuses: {
      open: 'aperto',
      in_progress: 'in corso',
      resolved: 'risolto',
      closed: 'chiuso',
    } as Record<string, string>,
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    close: 'Chiudi',
    back: 'Indietro',
    loading: 'Caricamento…',
    confirm: 'Conferma',
    yes: 'Sì',
    no: 'No',
    search: 'Cerca',
    all: 'Tutti',
    none: 'Nessuno',
    add: 'Aggiungi',
    create: 'Crea',
    today: 'Oggi',
    yesterday: 'Ieri',
    optional: 'facoltativo',
    required: 'obbligatorio',
    error: 'Si è verificato un errore',
    retry: 'Riprova',
    seeAll: 'Vedi tutto',
    of: 'su',
  },

  nav: {
    newReading: 'Nuova lettura',
    plans: 'Piani di lettura',
    search: 'Ricerca biblica',
    progress: 'Avanzamento',
    history: 'Le mie letture',
    stats: 'Statistiche',
    quiz: 'Quiz',
    versetDuJour: 'Versetto del giorno',
    memorisation: 'Memorizzazione',
    settings: 'Impostazioni',
    roadmap: 'Tabella di marcia',
    support: 'Assistenza',
    messages: 'Messaggi',
    donate: 'Sostieni il progetto',
    profile: 'Il mio profilo',
    admin: 'Amministrazione',
    avance: 'Funzioni avanzate',
    signOut: 'Esci',
    menu: 'Menu',
  },

  language: {
    title: 'Lingua',
    subtitle: "La lingua dell'applicazione.",
    bibleLanguages:
      'Il testo biblico è disponibile in tutte e cinque le lingue dell\'app. '
      + 'Scegli nelle Impostazioni quali versioni tenere su questo dispositivo.',
  },

  newReading: {
    title: 'Nuova lettura',
    subtitle: 'Registra la tua lettura di oggi',
    date: 'Data',
    context: 'Contesto',
    book: 'Libro',
    selectBook: 'Seleziona un libro',
    chaptersAndVerses: 'Capitoli e versetti',
    selectBookFirst: 'Seleziona prima un libro',
    version: 'Versione',
    notes: 'Note',
    notesPlaceholder: 'Le tue riflessioni su questo passo…',
    links: 'Link',
    linkTitlePlaceholder: 'Titolo del link',
    addLink: 'Aggiungi il link',
    openLink: 'Apri il link',
    removeLink: 'Rimuovi il link',
    audio: 'Audio',
    photos: 'Foto',
    camera: 'Fotocamera',
    gallery: 'Galleria',
    removePhoto: 'Rimuovi la foto',
    saving: 'Salvataggio…',
    saveOne: 'Salva la lettura',
    preview: 'Anteprima del testo',
    previewOpen: 'Vedi il testo',
    leaveTitle: 'Lettura non salvata',
    leaveWarning:
      'La tua lettura non è ancora salvata. Puoi salvarla ora, oppure uscire '
      + 'da questa pagina e perderla.',
    leaveSave: 'Salva, poi continua',
    leaveDiscard: 'Esci senza salvare',
    leaveStay: 'Resta sulla pagina',
    previewEmpty: "Seleziona un libro per vedere l'anteprima.",
    previewUnavailable: 'Testo non disponibile per questo riferimento.',
    summary: "Riepilogo di ciò che hai inserito",
    sessionTitle: 'La sessione',
    nameSession: 'Dai un nome alla sessione',
    nameSessionIntro: (n: number) =>
      `${n} ${n !== 1 ? 'letture verranno salvate' : 'lettura verrà salvata'}.`,
    nameSessionPlaceholder: 'Culto della domenica, Studio su Romani…',
    nameSessionWhy:
      'Un titolo raccoglie queste letture sotto un unico nome in «Le mie '
      + 'letture», dove si ordinano per prime nella loro giornata. È ciò che ti '
      + 'permetterà di ritrovare uno studio o un culto mesi dopo, senza '
      + 'rileggere tutti i riferimenti.',
    saveWithoutName: 'Salva senza nome',
    sessionHint:
      'Conferma un passo e verrà aggiunto alla lista. La data, il contesto, la '
      + 'versione e le note valgono per tutta la sessione.',
    removePassage: (reference: string) => `Rimuovi ${reference}`,
    saveMany: (n: number) => `Salva le ${n} letture`,
    saved: (n: number) => `${n} ${n !== 1 ? 'letture salvate' : 'lettura salvata'}`,
    linkCount: (n: number) => `${n} ${n !== 1 ? 'link' : 'link'}`,
    photoCount: (n: number) => `${n} ${n !== 1 ? 'foto' : 'foto'}`,
    audioAttached: 'Audio allegato',
  },

  contextPicker: {
    none: '— Nessun contesto —',
    add: 'Aggiungi un contesto',
    cancelAdd: "Annulla l'aggiunta di un contesto",
    cancel: 'Annulla',
    newName: 'Nome del nuovo contesto',
    namePlaceholder: 'Gruppo di casa, Ritiro…',
    emoji: 'Emoji',
    chooseEmoji: (emoji: string) => `Scegli l'emoji ${emoji}`,
    ownEmoji: 'oppure incolla il tuo',
    adding: 'Aggiunta…',
    confirmAdd: 'Aggiungi questo contesto',
    errorNoName: 'Dai un nome a questo contesto.',
    errorUnusable: 'Questo nome non contiene alcun carattere utilizzabile.',
    errorExists: 'Questo contesto esiste già.',
  },

  history: {
    groupBy: 'Raggruppa per',
    byDate: 'Data',
    byBook: 'Libro',
    byContext: 'Contesto',
    title: 'Le mie letture',
    select: 'Seleziona',
    selectedCount: (n: number) => `${n} ${n !== 1 ? 'selezionate' : 'selezionata'}`,
    selectAll: (n: number) => `Seleziona tutto (${n})`,
    contextToApply: 'Contesto da applicare',
    apply: 'Applica',
    leave: 'Esci',
    searchPlaceholder: 'Cerca nelle note o nel testo…',
    allBooks: 'Tutti i libri',
    startDate: 'Data di inizio',
    endDate: 'Data di fine',
    reset: 'Reimposta',
    collapseAll: 'Comprimi tutto',
    expandAll: 'Espandi tutto',
    empty: 'Nessuna lettura trovata.',
    readingCount: (n: number) => `${n} ${n !== 1 ? 'letture' : 'lettura'}`,
    passageCount: (n: number) => `${n} ${n !== 1 ? 'passi' : 'passo'}`,
    andMore: (n: number) => `e altri ${n}`,
    selectGroup: 'Seleziona tutte le letture di questa registrazione',
    confirmDeleteOne: 'Eliminare questa lettura? Questa azione è definitiva.',
    confirmDeleteMany: (n: number) =>
      `Eliminare queste ${n} letture? Questa azione è definitiva.`,
  },

  settings: {
    goalUnitLabels: {
      chapters: 'Capitoli',
      verses: 'Versetti',
      minutes: 'Minuti',
    } as Record<string, string>,
    goalUnit: 'Unità',
    goalPeriod: 'Periodo',
    goalTarget: 'Obiettivo',
    goalTargetHint: 'Digita il numero, poi Invio — oppure tocca altrove sullo schermo.',
    goalUnits: {
      chapters: 'capitoli',
      verses: 'versetti',
      minutes: 'minuti',
    } as Record<string, string>,
    goalPeriods: {
      day: 'al giorno',
      week: 'alla settimana',
      month: 'al mese',
      year: 'all’anno',
    } as Record<string, string>,
    goalSummary2: (n: number, u: string, p: string) => `${n} ${u} ${p}`,
    goalScope: 'Ciò che viene contato',
    goalMinutesHint: (mots: number) =>
      `I minuti sono stimati dal numero di parole del passo, a ${mots} parole al minuto. Nulla viene cronometrato.`,
    goalScopes: { toutes: 'Tutte le letture', livre: 'Un libro', plan: 'Un piano di lettura' },
    goalScopeBook: 'Libro',
    goalScopePlan: 'Piano',
    goalScopeMissing: 'piano eliminato',
    goalScopeSummary: (nom: string) => ` — in ${nom}`,
    fontPreview:
      'Dio infatti ha tanto amato il mondo da dare il suo Figlio unigenito.',
    uiScaleLabel: 'Dimensione dell’interfaccia',
    readingSizeLabel: 'Dimensione del testo biblico',
    readingStyleLabel: 'Stile del testo biblico',
    fontsTitle: 'Caratteri',
    fontsHint:
      'Due impostazioni: una per i menu, l’altra per il testo biblico. L’arabo mantiene il carattere del tuo dispositivo, che nessuno di questi copre.',
    fontUi: 'Interfaccia',
    fontReading: 'Testo biblico',
    customTheme: 'Tavolozza personalizzata',
    customThemeHint: 'Scegli due colori; le sfumature ne derivano.',
    customPrimary: 'Colore principale',
    customAccent: 'Colore d’accento',
    pages: 'Pagine visibili',
    homePage: 'Pagina iniziale',
    homePageHint:
      'La schermata su cui arrivi aprendo l’applicazione. Se nascondi quella '
      + 'pagina più sotto, tornerai a Nuova lettura.',
    pagesUnderSettings: 'Collocate sotto Impostazioni, in ordine fisso:',
    pagesHint:
      'Scegli quali pagine restano nel menu. Impostazioni e Nuova lettura '
      + 'sono sempre disponibili.',
    pagesOrderHint:
      'Ordinale come preferisci: le frecce spostano una pagina di un posto. '
      + 'Impostazioni e Amministrazione restano sotto il tuo profilo.',
    pageUp: (nom: string) => `Sposta ${nom} in alto`,
    pageDown: (nom: string) => `Sposta ${nom} in basso`,
    pagesOrderReset: "Ripristina l'ordine originale",
    setupTitle: 'Personalizza la tua applicazione',
    setupHint:
      'Prenditi un momento per impostare lingua, tema, obiettivo e le pagine '
      + 'che vuoi vedere. Non te lo chiederemo più.',
    setupDone: 'Termina la personalizzazione',
    title: 'Impostazioni',
    subtitle: 'Personalizza la tua esperienza',
    active: 'Attivo',

    theme: 'Tema',
    themeLight: '☀️ Chiaro',
    themeDark: '🌙 Scuro',
    themeSystem: '🖥️ Sistema',
    themeSystemHint:
      "L'applicazione segue l'impostazione giorno/notte del tuo dispositivo e "
      + 'cambia non appena cambia lui.',

    colorTheme: 'Combinazione di colori',
    colorThemeHint: "Cambia l'atmosfera dell'applicazione con un clic.",

    goal: 'Obiettivo di lettura',
    goalHint: 'Fissa un obiettivo quotidiano per seguire i tuoi progressi.',
    goalChapters: 'Capitoli / giorno',
    goalVerses: 'Versetti / giorno',
    perDay: 'al giorno',
    goalSummary: (target: number, chapters: boolean) =>
      `→ ${target} ${chapters ? 'capitoli' : 'versetti'} al giorno`,

    versions: 'Versioni bibliche',
    versionsHint:
      'Una versione attivata viene scaricata su questo dispositivo per la '
      + 'lettura offline — da 6 a 10 MB a seconda della lingua. Disattivarla libera quello '
      + 'spazio.',
    versionDefault: 'Predefinita',
    versionDeleting: 'Eliminazione…',
    versionDownloading: 'Download…',
    versionEnabled: 'Attivata',

    exportTitle: 'Esportazione dei dati',
    exportHint: 'Scarica tutti i tuoi dati in formato JSON.',
    exportButton: 'Esporta in JSON',

    importTitle: 'Importazione dei dati',
    importHint: 'Importa un file JSON esportato in precedenza.',
    importButton: 'Importa un file JSON',
    exportOk: 'Esportazione riuscita.',
    exportError: "Errore durante l'esportazione.",
    importConfirm: 'Questa azione sostituirà i tuoi dati attuali. Continuare?',
    importRunning: 'Importazione in corso…',
    importOk: (n: number) =>
      `${n} ${n !== 1 ? 'elementi importati' : 'elemento importato'} correttamente.`,
    importReadError: 'Errore durante la lettura del file.',
    importError: (detail: string) => `Errore: ${detail}`,
    /** Serve a colorare il messaggio di importazione in rosso o in verde. */
    errorMarker: 'Errore',

    autoLogout: 'Disconnessione automatica',
    autoLogoutHint:
      'Chiude la sessione dopo un periodo di inattività. Utile se leggi da un '
      + 'dispositivo condiviso.',
    autoLogoutWarning:
      'Una finestra ti avviserà un minuto prima della chiusura, perché non '
      + 'vada perso nulla di ciò che stai scrivendo.',
    autoLogoutChoices: {
      0: 'Mai',
      15: 'Dopo 15 minuti',
      30: 'Dopo 30 minuti',
      60: "Dopo un'ora",
      240: 'Dopo quattro ore',
    } as Record<number, string>,

    tour: 'Percorso guidato',
    tourHint:
      "La visita guidata delle schermate dell'applicazione. Parte una sola "
      + 'volta, al primo accesso — e poi solo se la richiedi da qui.',
    tourDone: (date: string) => `Già seguito il ${date}.`,
    tourNotYet: 'Non lo hai ancora seguito: si aprirà alla tua prossima visita.',
    tourReplay: 'Rivedi il percorso',

    sync: 'Sincronizzazione cloud',
    syncHint:
      'Sincronizza i tuoi dati con il tuo account per ritrovarli su tutti i '
      + 'tuoi dispositivi.',

    deleteAccount: 'Elimina il mio account',
    deleteWarning:
      'Questa azione è irreversibile. Tutti i tuoi dati saranno cancellati '
      + 'definitivamente.',
    deleteConfirm:
      '⚠️ Sei sicuro? Le tue letture, i piani e i file andranno persi per sempre.',
    deleteYes: 'Sì, elimina tutto',
    deleting: 'Eliminazione…',
    deleteDone: 'Account eliminato. Reindirizzamento…',
    deleteError: "Errore durante l'eliminazione",

    info: 'Informazioni',
    infoApp: 'Applicazione',
    infoVersion: 'Versione',
    infoOffline: 'Modalità offline',
    infoOfflineOn: 'Attiva',
    infoStorage: 'Archiviazione',
    infoVerses: 'Versetti disponibili',
  },

  notifications: {
    title: 'Notifiche',
    readingDevice: 'Lettura del dispositivo…',
    iosNotInstalled:
      'Su iPhone e iPad le notifiche vengono consegnate solo alle '
      + 'applicazioni installate. Apri il menu di condivisione di Safari, poi '
      + '«Aggiungi a Home», e torna qui dall\'applicazione così installata.',
    unsupported:
      'Questo browser non gestisce le notifiche. L\'impostazione resta '
      + 'disponibile da un dispositivo che le supporta.',
    denied:
      'Le notifiche sono state rifiutate per questo sito. Un\'applicazione non '
      + 'può tornare su questa scelta: va riaperta nelle impostazioni del tuo '
      + 'browser.',
    needsPermission:
      'Ricevi un promemoria di lettura su questo dispositivo. Il tuo browser '
      + 'ti chiederà il consenso.',
    waiting: 'In attesa della tua risposta…',
    allow: 'Autorizza le notifiche',
    receiveOnDevice: 'Ricevi notifiche su questo dispositivo',
    whatTriggers: 'Ciò che fa scattare una notifica',
    at: 'Alle',
    timeZoneOf: (zone: string) => `ora di ${zone}`,
    granted: "L'autorizzazione è concessa e le tue scelte sono salvate.",
    sendTest: 'Invia una notifica di prova',
    testSending: 'Invio…',
    testSent:
      'Notifica inviata. Se non la vedi comparire, è il tuo dispositivo a '
      + 'trattenerla — controlla le sue impostazioni di notifica per Bible '
      + 'Ouverte.',
    noPermission: "L'autorizzazione non è concessa su questo dispositivo.",
    testUnsupported: 'Questo browser non gestisce le notifiche.',
    testFailed:
      "Il dispositivo ha rifiutato l'invio. Su iPhone, l'applicazione deve "
      + 'essere aperta dalla schermata Home e non da Safari.',
    subscribeFailed:
      'Non è stato possibile registrare questo dispositivo. Le impostazioni '
      + 'sono salvate, ma non gli verrà inviato nulla.',
    /** Etichette dei cinque motivi, per identificatore. */
    triggers: {
      daily: {
        label: 'Promemoria quotidiano',
        hint: "All'ora che scegli, per non dimenticare la tua lettura.",
      },
      'plan-late': {
        label: 'Piano di lettura in ritardo',
        hint: 'Quando un giorno previsto non è stato spuntato.',
      },
      'support-reply': {
        label: 'Risposta a un messaggio di assistenza',
        hint: 'Quando qualcuno risponde a un tuo ticket.',
      },
      'roadmap-done': {
        label: 'Tabella di marcia',
        hint: 'Quando una funzione attesa passa a «Completato».',
      },
      inactive: {
        label: 'Lunga assenza',
        hint: 'Un richiamo dopo diversi giorni senza letture.',
      },
      birthday: {
        label: 'Compleanno',
        hint: 'Il giorno del tuo compleanno.',
      },
    },
  },

  plans: {
    title: 'Piani di lettura',
    newPlan: 'Nuovo piano',
    createTitle: 'Crea un piano di lettura',
    name: 'Nome',
    namePlaceholder: 'Il mio piano 2026',
    kind: 'Tipo di piano',
    scheduled: 'Con date',
    scheduledHint: 'Un passo al giorno, distribuito su una durata.',
    free: 'Libero',
    freeHint: 'Un elenco di passi senza data, spuntati al tuo ritmo.',
    duration: 'Durata',
    durations: {
      '1-year': '1 anno',
      '6-months': '6 mesi',
      '3-months': '3 mesi',
      '1-month': '1 mese',
      custom: 'Personalizzata',
    } as Record<string, string>,
    durationDays: (days: number) => ` (${days} giorni)`,
    customDaysPlaceholder: 'Numero di giorni',
    version: 'Versione',
    startDate: 'Data di inizio',
    creating: 'Creazione…',
    create: 'Crea il piano',
    empty: 'Nessun piano di lettura.',
    emptyHint: 'Crea un piano per leggere la Bibbia in un periodo definito.',
    freePlan: 'Piano libero',
    scheduledSummary: (duration: string, days: number) =>
      `${duration} · ${days} giorni`,
    undated: 'Senza data',
    deleteTitle: 'Eliminare questo piano?',
    deletePlan: (nom: string) => `Elimina il piano ${nom}`,
    deleteHint: 'Questa azione è irreversibile.',
  },

  /** Le dieci categorie di libri, per identificatore di `BIBLE_CATEGORIES`. */
  bibleCategories: {
    pentateuch: 'Pentateuco',
    historical: 'Libri storici',
    poetic: 'Libri poetici',
    'major-prophets': 'Profeti maggiori',
    'minor-prophets': 'Profeti minori',
    gospels: 'Vangeli',
    acts: 'Storia apostolica',
    'pauline-epistles': 'Epistole paoline',
    'general-epistles': 'Epistole cattoliche',
    revelation: 'Apocalisse',
  } as Record<string, string>,

  progress: {
    goalUnitPeriod: (u: string, p: string) => `${u} ${p}`,
    goalScope: (nom: string) => `In ${nom}`,
    title: 'I miei progressi',
    level: (n: number) => `Livello ${n}`,
    chaptersOf: (read: number, next: number) => `${read} / ${next} capitoli`,
    currentStreak: 'Serie attuale',
    days: 'giorni',
    bestStreak: (n: number) => `Migliore: ${n} giorni`,
    nextMilestone: (n: number) => `Prossimo traguardo: ${n} giorni`,
    allMilestones: 'Tutti i traguardi raggiunti',
    milestoneReached: (n: number) => `${n} giorni`,
    chaptersRead: 'Capitoli letti',
    booksStarted: (n: number) =>
      `${n} ${n !== 1 ? 'libri iniziati' : 'libro iniziato'}`,
    dailyGoal: 'Obiettivo',
    chaptersToday: 'capitoli oggi',
    versesToday: 'versetti oggi',
    noGoal: 'Nessun obiettivo definito',
    goalReached: 'Obiettivo raggiunto! 🎉',
    goalAlmost: 'Ancora un piccolo sforzo',
    goalToday: (current: number, target: number, unite: string, periode: string) =>
      `${current} / ${target} ${unite === 'chapters' ? 'capitoli' : unite === 'verses' ? 'versetti' : 'minuti'} ${periode}`,
    oldTestament: 'Antico Testamento',
    newTestament: 'Nuovo Testamento',
    chaptersOfTotal: (read: number, total: number) => `${read} / ${total} capitoli`,
    enPourcentage: 'In percentuale',
    byContext: 'Avanzamento per contesto',
    chapterCount: (n: number) => `${n} ${n !== 1 ? 'capitoli' : 'capitolo'}`,
    noContext: 'Senza contesto',
    byCategory: 'Avanzamento per categoria',
    achievements: 'Traguardi e ricompense',
    byBook: 'Dettaglio per libro',
    /** Titoli di livello, per soglia. */
    levels: {
      1: 'Lettore apprendista',
      2: 'Lettore della domenica',
      3: 'Fedele',
      4: 'Devoto',
      5: 'Erudito',
      6: 'Teologo',
      7: 'Maestro',
    } as Record<number, string>,
    badges: {
      first: { name: 'Primi passi', description: 'Leggere il primo capitolo' },
      ten: { name: 'Scopritore', description: 'Leggere 10 capitoli' },
      fifty: { name: 'Esploratore', description: 'Leggere 50 capitoli' },
      hundred: { name: 'Lettore assiduo', description: 'Leggere 100 capitoli' },
      'two-fifty': { name: 'Scriba', description: 'Leggere 250 capitoli' },
      'five-hundred': { name: 'Dottore della Legge', description: 'Leggere 500 capitoli' },
      thousand: { name: 'Sentinella', description: 'Leggere 1000 capitoli' },
      'streak-3': { name: 'Costante', description: 'Una serie di 3 giorni' },
      'streak-7': { name: 'Perseverante', description: 'Una serie di 7 giorni' },
      'streak-30': { name: 'Inarrestabile', description: 'Una serie di 30 giorni' },
      'streak-100': { name: 'Leggenda vivente', description: 'Una serie di 100 giorni' },
      'category-all': { name: 'Canone completo', description: 'Leggere in tutte le categorie' },
      'category-half': { name: 'A metà strada', description: 'Leggere in metà delle categorie' },
    },
  },
  themes: {
    title: 'Cerca per tema',
    hint: 'Scegli un tema: i passi appaiono nella versione che hai selezionato.',
    passages: (n: number) => `${n} ${n !== 1 ? 'passi' : 'passo'}`,
    /**
     * Les quinze thèmes, par identifiant. Les références vivent dans
     * `features/bible/themes.ts` — un thème sans libellé y est refusé
     * par son test, dans les deux sens.
     */
    labels: {
      amour: 'Amore',
      foi: 'Fede',
      esperance: 'Speranza',
      paix: 'Pace',
      consolation: 'Consolazione',
      pardon: 'Perdono',
      priere: 'Preghiera',
      courage: 'Coraggio',
      sagesse: 'Saggezza',
      joie: 'Gioia',
      reconnaissance: 'Gratitudine',
      humilite: 'Umiltà',
      patience: 'Pazienza',
      creation: 'Creazione',
      salut: 'Salvezza',
    },
  },

  search: {
    context: 'Contesto (facoltativo)',
    title: 'Ricerca biblica',
    modeReference: 'Riferimento',
    modeKeyword: 'Libera',
    modeTheme: 'Tema',
    book: 'Libro',
    select: 'Seleziona',
    chapter: 'Capitolo',
    verse: 'Versetto (facoltativo)',
    all: 'Tutti',
    version: 'Versione',
    go: 'Cerca',
    verseCount: (n: number) => `${n} ${n !== 1 ? 'versetti' : 'versetto'}`,
    addThisReading: '+ Aggiungi questa lettura',
    noResult: 'Nessun risultato.',
    keyword: 'Parola chiave',
    keywordPlaceholder: 'Inserisci una parola o una frase…',
    searching: 'Ricerca in corso…',
    noResultFor: (q: string) => `Nessun risultato per «${q}».`,
    resultCount: (n: number, q: string) =>
      `${n} ${n !== 1 ? 'risultati' : 'risultato'} per «${q}»`,
    add: '+ Aggiungi',
    truncated: 'Sono mostrati i primi 100 risultati. Affina la tua ricerca.',
    addTitle: 'Aggiungi una lettura',
    date: 'Data',
    notes: 'Note (facoltativo)',
    adding: 'Aggiunta…',
    addToReadings: 'Aggiungi alle letture',
    added: 'Aggiunta ✓',
  },
  stats: {
    title: 'Statistiche',
    empty: 'Ancora nessun dato di lettura.',
    total: 'Totale letture',
    thisWeek: 'Questa settimana',
    thisMonth: 'Questo mese',
    perDay: 'Letture al giorno (30 giorni)',
    topBooks: 'Top 10 libri',
    byContext: 'Ripartizione per contesto',
    byVersion: 'Ripartizione per versione',
    noContext: 'Senza contesto',
  },
  donate: {
    title: 'Sostieni il progetto',
    subtitle: 'Bible Ouverte è gratuita, senza pubblicità e senza rivendita di dati',
    freeText:
      'Le dodici traduzioni proposte sono di pubblico dominio: non costano '
      + "nulla e non costeranno mai nulla. L'applicazione, invece, si regge su "
      + 'un hosting e su un database che hanno un prezzo, e su tempo di '
      + 'sviluppo.',
    patreonText:
      'Unirsi alla comunità ÔAppliday su Patreon è ciò che permette a questo '
      + 'lavoro di continuare e alle funzioni annunciate nella tabella di '
      + 'marcia di vedere la luce.',
    patreonButton: 'Unisciti alla comunità su Patreon',
    freeWaysTitle: 'Sostenere senza spendere nulla',
    freeWaysText:
      'Parlarne a chi ti sta intorno basta già. E i tuoi riscontri orientano '
      + 'direttamente ciò che viene sviluppato.',
    reportBug: 'Segnala un bug o proponi un\'idea',
    voteRoadmap: 'Vota nella tabella di marcia',
    whatsappBefore: 'Il canale WhatsApp ',
    whatsappAfter: ' annuncia le novità.',
  },
  roadmap: {
    title: 'Tabella di marcia',
    add: 'Aggiungi',
    itemTitle: 'Titolo',
    titlePlaceholder: 'Nome della funzione',
    description: 'Descrizione',
    descriptionPlaceholder: 'Descrivila brevemente…',
    status: 'Stato',
    empty: 'Nessun elemento al momento',
    itemCount: (n: number) => `${n} ${n !== 1 ? 'elementi' : 'elemento'}`,
    modifiedOn: (date: string) => ` · modificato il ${date}`,
    confirmDelete: 'Eliminare questo elemento dalla tabella di marcia?',
    footerAdmin: 'Puoi aggiungere, modificare o eliminare elementi.',
    footerUser: 'Le funzioni future saranno elencate qui.',
    /** I cinque stati, per chiave — sono nel database, non cambiano. */
    statuses: {
      planned: 'Pianificato',
      projet: 'Progetto',
      'in-progress': 'In corso',
      suspendu: 'Sospeso',
      done: 'Completato',
      cancelled: 'Annullato',
    } as Record<string, string>,
  },
  support: {
    replyFailed:
      'Risposta non salvata. Il messaggio potrebbe essere chiuso, o la connessione persa.',
    closedSection: (n: number) => `Chiusi (${n})`,
    closedNotice:
      'Questo messaggio è chiuso. Solo un amministratore può riaprirlo.',
    title: 'Assistenza e suggerimenti',
    subtitle: 'Segnala un bug o proponi un miglioramento',
    newMessage: 'Nuovo messaggio',
    newMessageHint: "Condividi la tua opinione sull'applicazione",
    type: 'Tipo',
    bug: '🐛 Bug',
    suggestion: '💡 Suggerimento',
    name: 'Nome (visibile a tutti)',
    namePlaceholder: 'Il tuo nome o soprannome',
    message: 'Messaggio',
    bugPlaceholder: 'Descrivi il bug: che cosa è successo?',
    suggestionPlaceholder: 'Descrivi la tua idea di miglioramento…',
    send: 'Invia',
    empty: 'Nessun messaggio al momento',
    emptyHint: 'Sii il primo a condividere la tua opinione!',
    replyCount: (n: number) => `${n} ${n !== 1 ? 'risposte' : 'risposta'}`,
    admin: 'Admin',
    replyPlaceholder: 'Rispondi…',
    commentPlaceholder: 'Aggiungi un commento…',
    reply: '✏️ Rispondi',
    comment: '💬 Commenta',
    confirmDelete:
      'Eliminare questo messaggio e le sue risposte? Questa azione è definitiva.',
    deleteFailed:
      'Eliminazione impossibile. Controlla la tua connessione — '
      + "l'eliminazione è riservata agli amministratori.",
    defaultAdminName: 'Amministratore',
    defaultUserName: 'Utente',
  },
  auth: {
    passwordRules: {
      labels: {
        length: `almeno ${PASSWORD_MIN_LENGTH} caratteri`,
        lowercase: 'una minuscola',
        uppercase: 'una maiuscola',
        digit: 'una cifra',
        symbol: 'un simbolo (per esempio ! ? * - .)',
      },
      sentence: (list: string) => `La password deve contenere ${list}.`,
      and: 'e',
    },
  },

  profile: {
    title: 'Il mio profilo',
    loadError: 'Errore nel caricamento del profilo',
    removeAvatar: "Elimina l'avatar",
    firstName: 'Nome',
    lastName: 'Cognome',
    city: 'Città',
    completeTitle: 'Completa il tuo profilo',
    completeHint:
      'Mancano il tuo nome e il tuo cognome. Servono a riconoscerti e a '
      + 'scriverti: due campi ed è fatta.',
    email: 'Email',
    birthDate: 'Data di nascita',
    phone: 'Telefono',
    phonePlaceholder: '+39 312 345 6789',
    bio: 'Biografia',
    bioPlaceholder: 'Qualche parola su di te…',
    socials: 'Social',
    addSocial: '+ Aggiungi',
    noSocial: 'Nessun social aggiunto',
    socialPrompt: 'Nome del social (es.: instagram, twitter, facebook)',
    saving: 'Salvataggio…',
    save: 'Salva',
    saved: '✓ Profilo aggiornato',
    password: 'Password',
    currentPassword: 'Password attuale',
    newPassword: 'Nuova password',
    confirmPassword: 'Conferma la nuova password',
    passwordHint: (min: number) =>
      `${min} caratteri minimo, con una minuscola, una maiuscola, una cifra e `
      + 'un simbolo.',
    changing: 'Modifica…',
    changePassword: 'Cambia la password',
    passwordChanged: '✓ Password modificata. La userai al prossimo accesso.',
    mismatch: 'Le due volte in cui hai scritto la nuova password non coincidono.',
    sameAsCurrent: "La nuova password deve essere diversa da quella attuale.",
    wrongCurrent: 'Password attuale errata.',
  },
  authScreens: {
    login: 'Bentornato',
    loginSubtitle: 'Riprendi le tue letture da dove le hai lasciate.',
    email: 'Email',
    password: 'Password',
    signingIn: 'Accesso…',
    signIn: 'Accedi',
    noAccount: 'Non hai ancora un account? ',
    createAccount: 'Crea un account',
    suspended: 'Il tuo account è stato sospeso da un amministratore.',

    signupTitle: 'Crea un account',
    signupSubtitle: 'Meno di un minuto, ed è gratis.',
    firstName: 'Nome',
    lastName: 'Cognome',
    phoneField: 'Cellulare',
    city: 'Città',
    birthDate: 'Data di nascita',
    optional: ' (facoltativo)',
    discoverySource: 'Come hai conosciuto Bible Ouverte?',
    discoveryPlaceholder: 'Preferisco non dirlo',
    discoverySources: {
      internet: 'Internet',
      reseaux: 'Social network',
      connaissance: 'Un conoscente',
      autre: 'Altro',
    } as Record<string, string>,
    creating: 'Creazione…',
    createButton: "Crea l'account",
    haveAccount: 'Hai già un account? ',
    goToLogin: "Vai all'accesso",
    accountCreated: 'Account creato',
    mailSentBefore: 'Un messaggio è appena partito verso ',
    mailSentAfter:
      '. Aprilo per confermare il tuo indirizzo, poi torna ad accedere.',
    yourAddress: 'il tuo indirizzo',

    confirming: 'Conferma in corso',
    confirmingHint: 'Il tuo indirizzo è in fase di verifica. Ancora un istante.',

    home: 'Home',
    byPrefix: 'Di ',
    bySuffix: ' — Risorse e Te',
  },
  components: {
    syncAuto: 'Sincronizzato automaticamente',
    syncSignIn: 'Accedi per salvare i tuoi dati nel cloud.',

    stillThere: 'Ci sei ancora?',
    sessionClosingBefore: 'Senza risposta, la tua sessione si chiuderà tra ',
    seconds: (n: number) => `${n} ${n !== 1 ? 'secondi' : 'secondo'}`,
    signOutNow: 'Esci ora',
    stayHere: 'Sono qui',

    micUnavailable: 'Impossibile accedere al microfono.',
    stopRecording: (duration: string) => `Interrompi (${duration})`,
    record: 'Registra',
    audioFile: 'File audio',

    addPassage: 'Aggiungi un passo',
    book: 'Libro',
    selectBook: 'Seleziona un libro',
    selectBookFirst: 'Seleziona prima un libro',
    addToList: "Aggiungi all'elenco",
  },
  bookPicker: {
    placeholder: 'Seleziona un libro',
    dialogLabel: 'Scegli un libro',
    search: 'Cerca un libro…',
    oldTestament: 'Antico Testamento',
    newTestament: 'Nuovo Testamento',
    noMatch: 'Nessun libro corrisponde',
  },

  passageSearch: {
    title: 'Cerca un passo',
    open: 'Cerca un passo',
    use: 'Usa questo passo',
  },

  passagePicker: {
    dialogLabel: (bookName: string) => `Capitoli e versetti — ${bookName}`,
    chapter: 'Capitolo',
    chapters: 'Capitoli',
    rangeHint: 'Un secondo tocco più avanti seleziona l\'intervallo.',
    verse: 'Versetto',
    verses: 'Versetti',
    wholeChapter: 'Tutto il capitolo',
    allVerses: 'Tutti i versetti',
    firstVerseOf: (chapter: number) => `Primo versetto — capitolo ${chapter}`,
    lastVerseOf: (chapter: number) => `Ultimo versetto — capitolo ${chapter}`,
    firstVerseLabel: (chapter: number) => `Primo versetto, capitolo ${chapter}`,
    lastVerseLabel: (chapter: number) => `Ultimo versetto, capitolo ${chapter}`,
    validate: 'Conferma',
  },
  messages: {
    emailOnly: 'Solo per email',
    emailOnlyHint: 'Il destinatario riceve l’email, senza che il messaggio compaia nella sua casella.',
    title: 'Messaggi',
    navBadge: (n: number) => `${n} messagg${n > 1 ? 'i' : 'io'} non lett${n > 1 ? 'i' : 'o'}`,
    empty: 'Nessun messaggio per ora.',
    emptyHint: 'Il team di Bible Ouverte ti scriverà qui se necessario.',
    active: 'Attivi',
    archived: 'Archiviati',
    emptyArchived: 'Nessun messaggio archiviato.',
    archive: 'Archivia',
    unarchive: 'Rimuovi dall’archivio',
    confirmDelete: 'Rimuovere questo messaggio dalla tua casella?',
    fromAdmin: 'Bible Ouverte',
    you: 'Tu',
    subject: 'Oggetto',
    subjectPlaceholder: 'Facoltativo',
    body: 'Messaggio',
    bodyPlaceholder: 'Scrivi il tuo messaggio…',
    send: 'Invia',
    sending: 'Invio…',
    sent: '✓ Messaggio inviato',
    sendFailed: 'Invio non riuscito. Controlla la connessione e riprova.',
    reply: 'Rispondi',
    writeTo: (nom: string) => `Scrivi a ${nom}`,
    writeToSelection: (n: number) => `Scrivi ai ${n} account mostrati`,
    confirmBulk: (n: number) => `Inviare questo messaggio a ${n} persone?`,
    sentCount: (n: number) => `✓ Inviato a ${n} person${n > 1 ? 'e' : 'a'}`,
    unread: 'Non letto',
    errors: {
      corpsVide: 'Il messaggio è vuoto.',
      sujetTropLong: 'L’oggetto è troppo lungo.',
      corpsTropLong: 'Il messaggio è troppo lungo.',
      sansDestinataire: 'Nessun destinatario.',
    } as Record<string, string>,
  },

  avance: {
    title: 'Funzioni avanzate',
    subtitle: 'Il banco di prova delle prossime funzioni',
    empty: 'Nulla in prova per ora.',
    emptyHint:
      'Questa sezione ospita le funzioni in prova, prima che siano proposte a '
      + 'tutti. Solo il tuo account può vederla.',
  },
  admin: {
    tabOverview: 'Panoramica',
    tabAcquisition: 'Acquisizione',
    tabJournal: 'Registro',
    acqSources: 'Da dove arrivano gli account',
    acqMonths: 'Iscrizioni per mese',
    acqCities: 'Città più rappresentate',
    acqUnknown: 'Non indicato',
    acqNoCity: 'Nessuna città indicata per ora.',
    acqCount: (n: number, pourcent: number) => `${n} · ${pourcent} %`,
    journalEmpty: 'Nessuna azione registrata.',
    journalRecipients: (n: number) => `${n} person${n > 1 ? 'e' : 'a'}`,
    journalActions: {
      promote: 'ha promosso',
      demote: 'ha retrocesso',
      suspend: 'ha sospeso',
      reactivate: 'ha riattivato',
      delete_account: 'ha eliminato l’account di',
      message: 'ha scritto a',
    } as Record<string, string>,

    manageUsers: 'Gestisci gli utenti',
    usersTitle: 'Utenti',
    usersSubtitle: (n: number) => `${n} account`,
    backToAdmin: 'Torna all’amministrazione',
    searchPlaceholder: 'Nome, email o città…',
    exportCsv: 'Esporta in CSV',
    noResult: 'Nessun account corrisponde',
    showing: (debut: number, fin: number, total: number) => `${debut}–${fin} di ${total}`,
    pageOf: (page: number, pages: number) => `Pagina ${page} / ${pages}`,
    previous: 'Precedente',
    next: 'Successivo',
    segments: {
      tous: 'Tutti',
      enligne: 'Online',
      actifs: 'Attivi (7 g)',
      inactifs: 'Inattivi (30 g)',
      jamais: 'Mai connessi',
      suspendus: 'Sospesi',
      admins: 'Amministratori',
      incomplets: 'Profilo incompleto',
    } as Record<string, string>,
    sortLabel: 'Ordina per',
    sorts: {
      nom: 'Nome',
      statut: 'Stato',
      inscription: 'Iscrizione',
      connexion: 'Ultimo accesso',
      lectures: 'Letture',
    } as Record<string, string>,
    openFiche: 'Apri la scheda',
    ficheNotFound: 'Account non trovato',
    ficheIdentity: 'Identità',
    ficheAccount: 'Account',
    ficheActivity: 'Attività',
    ficheReadings: 'Ultime letture',
    fichePlans: 'Piani di lettura',
    ficheTickets: 'Ticket di supporto',
    ficheNothing: 'Niente da mostrare',
    ficheEmailConfirmed: 'Email confermata',
    ficheEmailPending: 'Email non confermata',
    ficheSignedUp: 'Iscritto il',
    ficheLanguage: 'Lingua',
    ficheLastSeen: 'Ultimo segnale',
    ficheNotifications: 'Notifiche',
    fichePushDevices: 'Dispositivi iscritti alle notifiche',
    ficheMemorised: 'Versetti in apprendimento',
    ficheSessions: 'Sessioni di gioco',
    fichePlanDays: 'Giorni di piano',
    ficheNotProvided: 'Non indicato',

    title: 'Amministrazione',
    refresh: 'Aggiorna',
    denied: 'Accesso negato',
    notAdmin: 'Non sei amministratore.',
    tabUsers: 'Utenti',
    tabTickets: 'Ticket',
    statUsers: 'Utenti',
    statUsersSub: (admins: number, actifs: number) =>
      `${admins} admin · ${actifs} attivi/7 gg`,
    statReadings: 'Letture',
    statSuspended: 'Sospesi',
    statPlans: 'Piani',
    statPlanDays: (days: number) => `${days} giorni`,
    statContexts: 'Contesti',
    colUser: 'Utente',
    colEmail: 'Email',
    colRole: 'Ruolo',
    colStatus: 'Stato',
    changeStatus: 'Cambia stato',
    colPlans: 'Piani',
    colLastSignIn: 'Accesso',
    colActions: 'Azioni',
    noName: 'Senza nome',
    roleAdmin: 'Admin',
    roleUser: 'User',
    suspended: 'Sospeso',
    online: 'Online',
    offline: 'Offline',
    never: 'Mai',
    demote: 'Retrocedi',
    promote: 'Promuovi ad admin',
    reactivate: 'Riattiva',
    suspend: 'Sospendi',
    confirmDelete: (name: string) => `Eliminare ${name} e tutti i suoi dati?`,
    allTickets: (n: number) => `Tutti (${n})`,
    noTicket: 'Nessun ticket',
    by: (name: string) => `Di ${name}`,
    replyCount: (n: number) => `${n} ${n !== 1 ? 'risposte' : 'risposta'}`,
    categories: { bug: 'Bug', suggestion: 'Suggerimento' } as Record<string, string>,
  },
  planDetail: {
    notFound: 'Piano non trovato.',
    backToPlans: 'Torna ai piani',
    passagesRead: (read: number, total: number, pct: number) =>
      `${read}/${total} passi letti${total > 0 ? ` (${pct} %)` : ''}`,
    daysRead: (read: number, total: number, pct: number) =>
      `${read}/${total} giorni letti (${pct} %)`,
    export: 'Esporta',
    editPlan: 'Modifica il piano',
    name: 'Nome',
    duration: 'Durata',
    durations: {
      '1-year': '1 anno (365 giorni)',
      '6-months': '6 mesi (182 giorni)',
      '3-months': '3 mesi (91 giorni)',
      '1-month': '1 mese (30 giorni)',
      custom: 'Personalizzata',
    } as Record<string, string>,
    customDays: 'Numero di giorni',
    version: 'Versione',
    startDate: 'Data di inizio',
    booksLabel: 'Libri (lascia vuoto per tutta la Bibbia)',
    allBooks: 'Tutti i libri',
    booksSelected: (n: number) =>
      `${n} ${n !== 1 ? 'libri selezionati' : 'libro selezionato'}`,
    saving: 'Salvataggio…',
    remaining: (n: number, total: number, free: boolean) =>
      `${n} ${free ? 'passi rimanenti' : 'giorni rimanenti'} su ${total}`,
    previous: 'Precedente',
    next: 'Successivo',
    emptyList: 'Questo elenco è ancora vuoto.',
    emptyListHint: "Aggiungi i passi che vuoi leggere, nell'ordine che preferisci.",
    day: (n: number) => `Giorno ${n}`,
    readOn: 'Letto il ',
    notReadYet: 'Non ancora letto',
    remove: (reference: string) => `Rimuovi ${reference}`,
    readOnLabel: 'Letto il',
    validate: 'Conferma',
  },
  readingDetail: {
    notFound: 'Lettura non trovata',
    backToHistory: 'Torna alla cronologia',
    editTitle: 'Modifica la lettura',
    detailTitle: 'Dettaglio della lettura',
    date: 'Data',
    book: 'Libro',
    chapterStart: 'Capitolo iniziale',
    chapterEnd: 'Capitolo finale',
    verseStart: 'Versetto iniziale',
    verseEnd: 'Versetto finale',
    version: 'Versione',
    saveEdit: 'Salva',
    versionLabel: (name: string) => `Versione: ${name}`,
    notes: 'Note',
    links: 'Link',
    audio: 'Audio',
    pause: 'Metti in pausa',
    play: "Ascolta l'audio",
    audioAttached: 'Audio allegato',
    photos: 'Foto',
    bibleText: 'Testo biblico',
    textUnavailable:
      'Testo non disponibile per questo riferimento con la versione selezionata.',
    confirmDelete: 'Eliminare questa lettura?',
  },
  tour: {
    /** Il testo delle 17 tappe, per identificatore di `TOUR_STEPS`. */
    steps: {
      bienvenue: {
        title: 'Benvenuto in Bible Ouverte',
        body:
          'Questa applicazione tiene traccia di ciò che leggi nella Bibbia — '
          + 'quando, in quale cornice, e ciò che la lettura ti ha lasciato. '
          + 'Questo percorso passa in rassegna ogni schermata. Dura due minuti '
          + 'e non tornerà più da solo.',
        points: [
          'I tuoi dati sono soltanto tuoi e ti seguono su tutti i tuoi dispositivi.',
          'Puoi uscirne in qualsiasi momento e riprenderlo dalle Impostazioni.',
        ],
      },
      'nouvelle-lecture': {
        title: 'Registrare una lettura',
        body:
          "È il gesto centrale, e la schermata che si apre a ogni accesso. "
          + 'Scegli un libro, dei capitoli, e se vuoi il dettaglio dei versetti.',
        points: [
          'Il testo compare prima della conferma: leggi, poi salvi.',
          'Una nota libera raccoglie ciò che hai capito o trattenuto.',
          'Puoi allegare una foto dei tuoi appunti, un memo vocale o un link.',
        ],
      },
      contextes: {
        title: 'I contesti',
        body:
          'Ogni lettura si collega a una cornice: meditazione personale, '
          + 'culto, predicazione, podcast, audiolibro. È ciò che più tardi '
          + 'renderà eloquenti le statistiche.',
        points: [
          'Il selettore «Contesto» di questa schermata li propone.',
          "All'inizio ne esistono dieci, con la loro emoji.",
          'Puoi crearne uno al volo, senza uscire da ciò che stai scrivendo.',
        ],
      },
      plans: {
        title: 'I piani di lettura',
        body:
          'Un piano distribuisce un insieme di testi sulla durata che scegli, '
          + 'poi ti propone ogni giorno la sua parte.',
        points: [
          "L'intera Bibbia, il Nuovo Testamento, o un solo libro.",
          'I piani liberi accettano passi fino al singolo versetto.',
          'Spuntare un giorno crea la lettura corrispondente nella tua cronologia.',
        ],
      },
      recherche: {
        title: 'La ricerca biblica',
        body:
          "Il testo completo si consulta qui, senza uscire dall'applicazione né "
          + 'aprire un altro sito.',
        points: [
          'Dodici traduzioni libere da diritti in cinque lingue, dal 1611 al 1996.',
          'Cerca una parola, un\'espressione o un riferimento come «Giovanni 3:16».',
        ],
      },
      progression: {
        title: "L'avanzamento",
        body:
          'I sessantasei libri compaiono e si riempiono man mano che li '
          + "percorri. Con un colpo d'occhio, vedi ciò che resta.",
        points: [
          "L'avanzamento si conta in capitoli, mai in versetti: annotare "
          + 'Giovanni 3:16 segna tutto Giovanni 3 come letto.',
          'Antico e Nuovo Testamento sono seguiti separatamente.',
        ],
      },
      historique: {
        title: 'La cronologia',
        body:
          'Tutte le tue letture, dalla più recente alla più antica. È da qui '
          + 'che si torna su ciò che si è scritto.',
        points: [
          'Filtra per libro, per contesto o per periodo.',
          'Apri una lettura per correggerla o completarla.',
          'Una selezione multipla permette di eliminare in blocco.',
        ],
      },
      statistiques: {
        title: 'Le statistiche',
        body:
          'Ciò che le tue letture dicono delle tue abitudini, senza giudizio '
          + 'né obiettivo imposto.',
        points: [
          'Il tuo ritmo nel tempo, e le serie di giorni consecutivi.',
          'La ripartizione per contesto e i libri più frequentati.',
        ],
      },
      quiz: {
        title: 'Il quiz',
        body:
          'Alcune domande tratte dalle tue stesse letture, per vedere che cosa '
          + 'ne resta. Nulla viene votato, nulla viene confrontato con nessuno.',
        points: [
          'Le domande vengono dai passi che hai registrato.',
          'Tre forme: il libro, il capitolo o la parola mancante.',
        ],
      },
      'verset-du-jour': {
        title: 'Il versetto del giorno',
        body:
          'Un versetto offerto ogni giorno, lo stesso per tutti, che cambia a '
          + 'mezzanotte. Nulla da impostare: è lì quando apri la pagina.',
        points: [
          'Puoi conservarlo come lettura, con il suo contesto, con un gesto.',
          'Non dipende né dai tuoi piani né dalla tua cronologia.',
        ],
      },
      memorisation: {
        title: 'La memorizzazione',
        body:
          'Imparare un versetto a memoria ritrovandolo a intervalli che si '
          + 'allargano. Le parole si nascondono un po\' di più a ogni passaggio riuscito.',
        points: [
          'Al primo passaggio non si nasconde nulla: leggi il versetto intero.',
          'Il ripasso torna quando serve, e non quando lo chiedi.',
          'Esiste un allenamento libero, che non tocca alcuna scadenza.',
        ],
      },
      reglages: {
        title: 'Le impostazioni',
        body:
          'La schermata più densa, e quella che si visita di meno. Comanda '
          + "l'aspetto, le traduzioni tenute sul dispositivo e la sicurezza "
          + "dell'account.",
        points: [
          'Attiva o togli una traduzione: ciascuna pesa da 6 a 10 MB offline.',
          'Tema chiaro, scuro, o in accordo con quello del tuo sistema.',
          'Disconnessione automatica dopo un tempo di inattività.',
          'Esportazione e importazione di tutti i tuoi dati, per tenerne una copia.',
        ],
      },
      notifications: {
        title: 'I promemoria',
        body:
          'Cinque motivi possono farti un cenno, e ciascuno si disattiva '
          + 'separatamente. Non parte nulla finché non hai dato il permesso sul '
          + 'dispositivo.',
        points: [
          "Un promemoria quotidiano, all'ora che fissi tu.",
          'Un piano di lettura in ritardo, o una lunga assenza.',
          'Una risposta a un messaggio di assistenza, un elemento della tabella '
          + 'di marcia completato.',
          "Su iPhone, l'applicazione deve essere installata sulla schermata "
          + 'Home: iOS non consegna nulla da una scheda di Safari.',
        ],
      },
      'hors-ligne': {
        title: 'Senza rete, tutto continua',
        body:
          'Le traduzioni attive e le tue letture sono tenute sul dispositivo. '
          + "In un treno o in uno scantinato, l'applicazione resta intera.",
        points: [
          'Ciò che scrivi offline parte verso il cloud appena torna il segnale.',
          'Il cloud fa fede: è lui a mettere d\'accordo i tuoi dispositivi.',
        ],
      },
      'feuille-de-route': {
        title: 'La tabella di marcia',
        body:
          'Ciò che è in cantiere e ciò che verrà dopo. È pubblica, e puoi dire '
          + 'ciò che conta per te.',
        points: [],
      },
      messages: {
        title: 'I messaggi',
        body:
          "Un filo tra te e l'amministrazione dell'applicazione. Ciò che ti "
          + 'viene scritto qui ti è inviato anche per email.',
        points: [
          'Puoi rispondere da questa pagina.',
          'Offline resta vuota: è la sola schermata senza cache locale.',
        ],
      },
      support: {
        title: "L'assistenza",
        body:
          'Una domanda, un difetto, un\'idea: apri un messaggio e la risposta '
          + 'ti arriverà qui.',
        points: [
          'I messaggi sono visibili a tutti gli utenti, con il nome del loro '
          + 'autore: non metterci nulla di riservato.',
        ],
      },
      soutenir: {
        title: 'Sostenere il progetto',
        body:
          "L'applicazione è gratuita, senza pubblicità e senza rivendita di "
          + 'dati. Questa pagina spiega come sostenerne le spese, se lo '
          + 'desideri.',
        points: [],
      },
      profil: {
        title: 'Il tuo profilo',
        body:
          'Il tuo nome, il tuo avatar e le tue informazioni. È anche da qui '
          + "che si cambia la password e si elimina l'account.",
        points: [
          "L'eliminazione cancella tutto, definitivamente, senza copia conservata.",
        ],
      },
      administration: {
        title: "L'amministrazione",
        body:
          'Riservata al tuo account: l\'elenco degli utenti, i messaggi di '
          + 'assistenza ricevuti e la tenuta della tabella di marcia.',
        points: [],
      },
      avance: {
        title: 'Funzioni avanzate',
        body:
          'Il banco di prova: le funzioni si mostrano qui prima di essere '
          + 'proposte a tutti. Riservato al tuo account, e vuoto finché non c’è '
          + 'nulla in prova.',
        points: [],
      },
      fin: {
        title: 'Tocca a te',
        body:
          'Hai fatto il giro. Il percorso non si riaprirà più da solo — ma ti '
          + 'aspetta nelle Impostazioni, sezione «Percorso guidato», il giorno '
          + 'in cui vorrai rifarlo.',
        points: [
          'Inizia col registrare una prima lettura: è da lì che parte tutto.',
        ],
      },
    },
  },
  tourUi: {
    close: 'Chiudi il percorso guidato',
    stepOf: (n: number, total: number) => `Tappa ${n} su ${total}`,
    skip: 'Salta il percorso',
    previous: 'Precedente',
    next: 'Successivo',
    finish: 'Termina',
  },
  fontSizes: {
    'compact': 'Compatto',
    'normal': 'Normale',
    'grand': 'Grande',
    'tres-grand': 'Molto grande',
    'geant': 'Gigante',
  } as Record<string, string>,

  fontStyles: {
    'normal': 'Normale',
    'italique': 'Corsivo',
    'gras': 'Grassetto',
    'gras-italique': 'Grassetto corsivo',
  } as Record<string, string>,

  fonts: {
    systeme: 'Sistema',
    inter: 'Inter',
    lora: 'Lora',
    garamond: 'Garamond',
    hyperlegible: 'Iperleggibile',
  } as Record<string, string>,

  memorisation: {
    title: 'Memorizzazione',
    subtitle: 'Impara un versetto e ritrovalo quando torna.',
    aRevoir: 'da rivedere oggi',
    ajouterHasard: 'Un versetto a caso',
    aucun: 'Nessun versetto in apprendimento',
    aucunAide: 'Scegline uno qui sotto, o lascia decidere il caso.',
    choisir: 'Dalle tue letture',
    reviser: 'Ripassa',
    retirer: 'Togli dall’apprendimento',
    duAujourdhui: 'Da rivedere oggi',
    terminer: 'Ho finito',
    reveler: 'Rivela questa parola',
    monte: 'Un gradino più su.',
    reste: 'Lo rivedremo presto, senza perdere molto.',
    retour: 'Torna alla lista',
    revoirLe: (d: string) => `Da rivedere il ${d}`,
    niveau: (n: number, max: number) => `Livello ${n}/${max}`,
    consigne: (reveles: number, masques: number) =>
      masques === 0
        ? 'Primo passaggio: leggi questo versetto per intero. Alcune parole saranno nascoste nelle revisioni successive.'
        : reveles === 0
          ? 'Tocca una parola nascosta per rivelarla.'
          : `${reveles} parol${reveles !== 1 ? 'e' : 'a'} rivelat${reveles !== 1 ? 'e' : 'a'}`,
    prochaine: (d: string) => `Prossimo ripasso il ${d}`,
    sentrainer: 'Esercitarsi',
    entrainementBilan: 'Bell’esercizio.',
    entrainementSansEffet: 'Esercizio libero: né il livello né la scadenza sono cambiati.',
  },

  versetDuJour: {
    title: 'Versetto del giorno',
    subtitle: 'Un versetto tratto dalle tue letture, lo stesso per tutto il giorno.',
    duJour: 'Oggi',
    marquerLu: 'Ho letto questo versetto',
    enregistrement: 'Salvataggio…',
    dejaLu: 'Letto oggi',
    ajouteAuxLectures: 'Sarà aggiunto alle tue letture, contesto «Bibbia».',
    noteLecture: 'Versetto del giorno',
    pasDeVerset: 'Nessun versetto da proporre',
    pasDeVersetAide: 'Il versetto del giorno è tratto dalle tue letture. Registrane una e torna.',
    statJours: 'Giorni seguiti',
    statTotal: 'Versetti letti',
    prochainDemain: (d: string) => `Un nuovo versetto domani — oggi, ${d}`,
  },

  quiz: {
    title: 'Quiz di ripasso',
    subtitle: 'Ripassa ciò che hai letto, al tuo ritmo.',
    commencer: 'Inizia una partita',
    preparation: 'Preparazione…',
    pasAssez: 'Non ci sono ancora abbastanza letture',
    pasAssezAide: 'Registra qualche lettura e torna: il quiz riguarda solo ciò che hai letto.',
    suivante: 'Domanda successiva',
    terminer: 'Vedi il risultato',
    rejouer: 'Gioca ancora',
    statParties: 'Partite',
    statReussite: 'Riuscita',
    statMeilleur: 'Migliore',
    statJours: 'Giorni giocati',
    bravoParfait: 'Senza errori. Notevole.',
    bravoBien: 'Molto bene!',
    bravoMoyen: 'Sei sulla buona strada.',
    bravoDebut: 'Ogni partita conta. Ancora?',
    commencerAide: (n: number) => `${n} domande tratte dalle tue letture`,
    progression: (i: number, n: number) => `Domanda ${i} di ${n}`,
    bonnes: (n: number) => `${n} corrett${n !== 1 ? 'e' : 'a'}`,
    cetaitDans: (ref: string) => `Era ${ref}`,
    resultat: (b: number, n: number) => `${b} corrette su ${n}`,
    consignes: {
      livre: 'Da quale libro viene questo versetto?',
      chapitre: 'Da quale capitolo?',
      trou: 'Quale parola manca?',
      reference: 'Qual è il suo riferimento?',
    } as Record<string, string>,
    consigneChapitre: (livre: string) => `${livre}: da quale capitolo viene questo versetto?`,
  },

  planCatalog: {
    title: 'Piani proposti',
    hint:
      'Piani pronti all’uso. Sono generati dall’applicazione, non ripresi da un calendario pubblicato.',
    start: 'Inizia',
    duration: 'Durata',
    dayCount: (n: number) => `${n} giorni`,
    plans: {
      'at-evangiles-psaumes': { name: 'Antico Testamento, Vangeli e Salmi', description: 'Ogni giorno un passo della storia d’Israele, uno dei Vangeli e un salmo.' },
      'nouveau-testament': { name: 'Il Nuovo Testamento', description: 'I ventisette libri, da Matteo all’Apocalisse, in ordine.' },
      'evangiles-psaumes': { name: 'Vangeli e Salmi', description: 'Due percorsi in parallelo, per una lettura breve e quotidiana.' },
      'sagesse': { name: 'Un proverbio al giorno', description: 'I trentuno capitoli dei Proverbi, uno per ogni giorno del mese.' },
      'priere': { name: 'La preghiera', description: 'Quindici passi in cui la Scrittura prega, da Salomone a Gesù.' },
      'esperance': { name: 'La speranza', description: 'Quattordici passi per i tempi dell’attesa.' },
      'pardon': { name: 'Il perdono', description: 'Undici passi sulla colpa riconosciuta e la grazia ricevuta.' },
      'confiance': { name: 'Salmi di fiducia', description: 'Otto salmi da rileggere quando la paura si avvicina.' },
    } as Record<string, { name: string; description: string }>,
  },

  colorThemes: {
    rubis: 'Rubino',
    turquoise: 'Turchese',
    indigo: 'Indaco',
    rose: 'Rosa',
    cafe: 'Caffè',
    perso: 'Personalizzata',
    marine: 'Blu marino',
    foret: 'Foresta',
    pourpre: 'Porpora',
    ocre: 'Ocra',
    ardoise: 'Ardesia',
  } as Record<string, string>,

  errors: {
    title: 'Errore',
    versionDownload: (name: string) =>
      `Impossibile scaricare «${name}». Controlla la tua connessione.`,
    versionDelete: (name: string) =>
      `Impossibile eliminare «${name}».`,
    importStructure: 'Struttura JSON non valida: manca la proprietà «data».',
  },
}
