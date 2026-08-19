import type { Dictionary } from './fr'

/**
 * English. Typed against the French reference: a missing key will not compile.
 */
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/password'

export const en: Dictionary = {
  common: {
    ticketStatuses: {
      open: 'open',
      in_progress: 'in progress',
      resolved: 'resolved',
      closed: 'closed',
    } as Record<string, string>,
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    loading: 'Loading…',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    search: 'Search',
    all: 'All',
    none: 'None',
    add: 'Add',
    create: 'Create',
    today: 'Today',
    yesterday: 'Yesterday',
    optional: 'optional',
    required: 'required',
    error: 'Something went wrong',
    retry: 'Try again',
    seeAll: 'See all',
    of: 'of',
  },

  nav: {
    newReading: 'New reading',
    plans: 'Reading plans',
    search: 'Bible search',
    progress: 'Progress',
    history: 'My readings',
    stats: 'Statistics',
    quiz: 'Quiz',
    versetDuJour: 'Verse of the day',
    memorisation: 'Memorisation',
    settings: 'Settings',
    roadmap: 'Roadmap',
    support: 'Support',
    donate: 'Support the project',
    profile: 'My profile',
    admin: 'Administration',
    signOut: 'Sign out',
    menu: 'Menu',
  },

  language: {
    title: 'Language',
    subtitle: 'The language of the application.',
    bibleLanguages:
      'Bible text is available in all five languages of the app. Choose '
      + 'which versions to keep on this device in Settings.',
  },

  newReading: {
    title: 'New reading',
    subtitle: 'Record what you read today',
    date: 'Date',
    context: 'Context',
    book: 'Book',
    selectBook: 'Select a book',
    chaptersAndVerses: 'Chapters and verses',
    selectBookFirst: 'Select a book first',
    version: 'Version',
    addAnotherPassage: 'Add another passage to this date',
    sharedFields:
      'The date, context, notes and media are shared across all passages.',
    passagesToSave: (n: number, withCurrent: boolean) =>
      `Passages to save (${n}${withCurrent ? ' + the current one' : ''})`,
    removePassage: (reference: string) => `Remove ${reference}`,
    notes: 'Notes',
    notesPlaceholder: 'Your thoughts on this passage…',
    links: 'Links',
    linkTitlePlaceholder: 'Link title',
    addLink: 'Add link',
    openLink: 'Open link',
    removeLink: 'Remove link',
    audio: 'Audio',
    photos: 'Photos',
    camera: 'Camera',
    gallery: 'Gallery',
    removePhoto: 'Remove photo',
    saving: 'Saving…',
    saveOne: 'Save reading',
    saveMany: (n: number) => `Save all ${n} readings`,
    preview: 'Text preview',
    previewOpen: 'View the text',
    leaveWarning:
      'Your reading is not saved. Leaving this page will discard it. Continue?',
    previewEmpty: 'Select a book to see the preview.',
    previewUnavailable: 'No text available for this reference.',
    summary: 'Entry summary',
    linkCount: (n: number) => `${n} link${n > 1 ? 's' : ''}`,
    photoCount: (n: number) => `${n} photo${n > 1 ? 's' : ''}`,
    audioAttached: 'Audio attached',
  },

  contextPicker: {
    none: '— No context —',
    add: 'Add a context',
    cancelAdd: 'Cancel adding a context',
    cancel: 'Cancel',
    newName: 'Name of the new context',
    namePlaceholder: 'Home group, Retreat…',
    emoji: 'Emoji',
    chooseEmoji: (emoji: string) => `Choose the ${emoji} emoji`,
    ownEmoji: 'or paste your own',
    adding: 'Adding…',
    confirmAdd: 'Add this context',
    errorNoName: 'Give this context a name.',
    errorUnusable: 'This name contains no usable character.',
    errorExists: 'This context already exists.',
  },

  history: {
    groupBy: 'Group by',
    byDate: 'Date',
    byBook: 'Book',
    byContext: 'Context',
    title: 'My readings',
    select: 'Select',
    selectedCount: (n: number) => `${n} selected`,
    selectAll: (n: number) => `Select all (${n})`,
    contextToApply: 'Context to apply',
    apply: 'Apply',
    leave: 'Leave',
    searchPlaceholder: 'Search the notes or the text…',
    allBooks: 'All books',
    startDate: 'Start date',
    endDate: 'End date',
    reset: 'Reset',
    collapseAll: 'Collapse all',
    expandAll: 'Expand all',
    empty: 'No reading found.',
    readingCount: (n: number) => `${n} reading${n > 1 ? 's' : ''}`,
    confirmDeleteOne: 'Delete this reading? This cannot be undone.',
    confirmDeleteMany: (n: number) =>
      `Delete these ${n} readings? This cannot be undone.`,
  },

  settings: {
    goalUnitLabels: {
      chapters: 'Chapters',
      verses: 'Verses',
    } as Record<string, string>,
    goalUnit: 'Unit',
    goalPeriod: 'Period',
    goalTarget: 'Target',
    goalUnits: {
      chapters: 'chapters',
      verses: 'verses',
    } as Record<string, string>,
    goalPeriods: {
      day: 'per day',
      week: 'per week',
      month: 'per month',
      year: 'per year',
    } as Record<string, string>,
    goalSummary2: (n: number, u: string, p: string) => `${n} ${u} ${p}`,
    fontPreview:
      'For God so loved the world that he gave his only Son.',
    uiScaleLabel: 'Interface size',
    readingSizeLabel: 'Biblical text size',
    readingStyleLabel: 'Biblical text style',
    fontsTitle: 'Fonts',
    fontsHint:
      'Two settings: one for the menus, one for the biblical text. Arabic keeps your device’s font, which none of these cover.',
    fontUi: 'Interface',
    fontReading: 'Biblical text',
    customTheme: 'Custom palette',
    customThemeHint: 'Pick two colours; the shades follow.',
    customPrimary: 'Main colour',
    customAccent: 'Accent colour',
    pages: 'Visible pages',
    pagesHint:
      'Choose which pages stay in the menu. Settings and New reading are '
      + 'always available.',
    setupTitle: 'Personalise your app',
    setupHint:
      'Take a moment to set the language, theme, your goal and the pages you '
      + 'want to see. You will not be asked again.',
    setupDone: 'Finish setup',
    title: 'Settings',
    subtitle: 'Make the app your own',
    active: 'Active',

    theme: 'Theme',
    themeLight: '☀️ Light',
    themeDark: '🌙 Dark',
    themeSystem: '🖥️ System',
    themeSystemHint:
      'The app follows your device’s light/dark setting and switches as soon '
      + 'as it changes.',

    colorTheme: 'Colour scheme',
    colorThemeHint: 'Change the mood of the app in one click.',

    goal: 'Reading goal',
    goalHint: 'Set a daily goal to follow your progress.',
    goalChapters: 'Chapters / day',
    goalVerses: 'Verses / day',
    perDay: 'per day',
    goalSummary: (target: number, chapters: boolean) =>
      `→ ${target} ${chapters ? 'chapters' : 'verses'} per day`,

    versions: 'Bible versions',
    versionsHint:
      'An enabled version is downloaded to this device for offline reading — '
      + '6 to 10 MB depending on the language. Disabling it frees that space.',
    versionDefault: 'Default',
    versionDeleting: 'Removing…',
    versionDownloading: 'Downloading…',
    versionEnabled: 'Enabled',

    exportTitle: 'Data export',
    exportHint: 'Download all your data as JSON.',
    exportButton: 'Export as JSON',

    importTitle: 'Data import',
    importHint: 'Import a JSON file you exported earlier.',
    importButton: 'Import a JSON file',
    exportOk: 'Export complete.',
    exportError: 'Export failed.',
    importConfirm: 'This will replace your existing data. Continue?',
    importRunning: 'Importing…',
    importOk: (n: number) => `${n} item${n > 1 ? 's' : ''} imported successfully.`,
    importError: (detail: string) => `Error: ${detail}`,
    importReadError: 'Could not read the file.',
    errorMarker: 'Error',

    autoLogout: 'Automatic sign-out',
    autoLogoutHint:
      'Closes the session after a period without activity. Useful if you read '
      + 'from a shared device.',
    autoLogoutWarning:
      'A dialog will warn you one minute before the cut-off, so nothing you '
      + 'are typing is lost.',
    autoLogoutChoices: {
      0: 'Never',
      15: 'After 15 minutes',
      30: 'After 30 minutes',
      60: 'After an hour',
      240: 'After four hours',
    } as Record<number, string>,

    tour: 'Guided tour',
    tourHint:
      'The guided tour of the app’s screens. It runs once, on your first '
      + 'sign-in — and after that only if you ask for it here.',
    tourDone: (date: string) => `Taken on ${date}.`,
    tourNotYet: 'You have not taken it yet: it will open on your next visit.',
    tourReplay: 'Take the tour again',

    sync: 'Cloud sync',
    syncHint:
      'Sync your data with your account to find it again on all your devices.',

    deleteAccount: 'Delete my account',
    deleteWarning:
      'This cannot be undone. All your data will be permanently erased.',
    deleteConfirm:
      '⚠️ Are you sure? Your readings, plans and files will be lost forever.',
    deleteYes: 'Yes, delete everything',
    deleting: 'Deleting…',
    deleteDone: 'Account deleted. Redirecting…',
    deleteError: 'Deletion failed',

    info: 'Information',
    infoApp: 'Application',
    infoVersion: 'Version',
    infoOffline: 'Offline mode',
    infoOfflineOn: 'Enabled',
    infoStorage: 'Storage',
    infoVerses: 'Verses available',
  },

  notifications: {
    title: 'Notifications',
    readingDevice: 'Reading the device…',
    iosNotInstalled:
      'On iPhone and iPad, notifications are only delivered to installed '
      + 'apps. Open Safari’s share menu, then “Add to Home Screen”, and come '
      + 'back here from the app installed that way.',
    unsupported:
      'This browser does not handle notifications. The setting stays '
      + 'available from a device that supports them.',
    denied:
      'Notifications were refused for this site. An app cannot undo that '
      + 'choice: you have to reopen it in your browser settings.',
    needsPermission:
      'Get a reading reminder on this device. Your browser will ask for your '
      + 'consent.',
    waiting: 'Waiting for your answer…',
    allow: 'Allow notifications',
    receiveOnDevice: 'Receive notifications on this device',
    whatTriggers: 'What triggers a notification',
    at: 'At',
    timeZoneOf: (zone: string) => `${zone} time`,
    granted: 'Permission is granted and your choices are saved.',
    sendTest: 'Send a test notification',
    testSending: 'Sending…',
    testSent:
      'Notification sent. If you do not see it appear, your device is holding '
      + 'it back — check its notification settings for Bible Ouverte.',
    noPermission: 'Permission is not granted on this device.',
    testUnsupported: 'This browser does not handle notifications.',
    testFailed:
      'The device refused the send. On iPhone, the app must be opened from '
      + 'the Home Screen and not from Safari.',
    subscribeFailed:
      'This device could not be subscribed. Your settings are saved, but '
      + 'nothing will be sent to it.',
    triggers: {
      daily: {
        label: 'Daily reminder',
        hint: 'At the time you choose, so you do not forget your reading.',
      },
      'plan-late': {
        label: 'Reading plan behind schedule',
        hint: 'When a planned day has not been ticked off.',
      },
      'support-reply': {
        label: 'Reply to a support message',
        hint: 'When someone answers one of your tickets.',
      },
      'roadmap-done': {
        label: 'Roadmap',
        hint: 'When an awaited feature moves to “Done”.',
      },
      inactive: {
        label: 'Long absence',
        hint: 'A nudge after several days without a reading.',
      },
    },
  },

  plans: {
    title: 'Reading plans',
    newPlan: 'New plan',
    createTitle: 'Create a reading plan',
    name: 'Name',
    namePlaceholder: 'My 2026 plan',
    kind: 'Plan type',
    scheduled: 'Dated',
    scheduledHint: 'One passage a day, spread over a period.',
    free: 'Free',
    freeHint: 'A list of passages without dates, ticked at your own pace.',
    duration: 'Duration',
    durations: {
      '1-year': '1 year',
      '6-months': '6 months',
      '3-months': '3 months',
      '1-month': '1 month',
      custom: 'Custom',
    } as Record<string, string>,
    durationDays: (days: number) => ` (${days} days)`,
    customDaysPlaceholder: 'Number of days',
    version: 'Version',
    startDate: 'Start date',
    creating: 'Creating…',
    create: 'Create the plan',
    empty: 'No reading plan.',
    emptyHint: 'Create a plan to read the Bible over a set period.',
    freePlan: 'Free plan',
    scheduledSummary: (duration: string, days: number) =>
      `${duration} · ${days} days`,
    undated: 'No dates',
    deleteTitle: 'Delete this plan?',
    deleteHint: 'This cannot be undone.',
  },

  bibleCategories: {
    pentateuch: 'Pentateuch',
    historical: 'Historical books',
    poetic: 'Poetic books',
    'major-prophets': 'Major prophets',
    'minor-prophets': 'Minor prophets',
    gospels: 'Gospels',
    acts: 'Apostolic history',
    'pauline-epistles': 'Pauline epistles',
    'general-epistles': 'General epistles',
    revelation: 'Revelation',
  } as Record<string, string>,

  progress: {
    goalUnitPeriod: (u: string, p: string) => `${u} ${p}`,
    title: 'My progress',
    level: (n: number) => `Level ${n}`,
    chaptersOf: (read: number, next: number) => `${read} / ${next} chapters`,
    currentStreak: 'Current streak',
    days: 'days',
    bestStreak: (n: number) => `Best: ${n} days`,
    chaptersRead: 'Chapters read',
    booksStarted: (n: number) => `${n} book${n > 1 ? 's' : ''} started`,
    dailyGoal: 'Today’s goal',
    chaptersToday: 'chapters today',
    versesToday: 'verses today',
    noGoal: 'No goal set',
    goalReached: 'Goal reached! 🎉',
    goalAlmost: 'Almost there',
    goalToday: (current: number, target: number, chapters: boolean) =>
      `${current} / ${target} ${chapters ? 'chapters' : 'verses'} today`,
    oldTestament: 'Old Testament',
    newTestament: 'New Testament',
    chaptersOfTotal: (read: number, total: number) => `${read} / ${total} chapters`,
    byContext: 'Progress by context',
    chapterCount: (n: number) => `${n} chapter${n > 1 ? 's' : ''}`,
    noContext: 'No context',
    byCategory: 'Progress by category',
    achievements: 'Achievements & rewards',
    byBook: 'Detail by book',
    levels: {
      1: 'Apprentice reader',
      2: 'Sunday reader',
      3: 'Faithful',
      4: 'Devoted',
      5: 'Scholar',
      6: 'Theologian',
      7: 'Master',
    } as Record<number, string>,
    badges: {
      first: { name: 'First steps', description: 'Read your first chapter' },
      ten: { name: 'Discoverer', description: 'Read 10 chapters' },
      fifty: { name: 'Explorer', description: 'Read 50 chapters' },
      hundred: { name: 'Diligent reader', description: 'Read 100 chapters' },
      'two-fifty': { name: 'Scribe', description: 'Read 250 chapters' },
      'five-hundred': { name: 'Doctor of the Law', description: 'Read 500 chapters' },
      thousand: { name: 'Watchman', description: 'Read 1000 chapters' },
      'streak-3': { name: 'Regular', description: '3 days in a row' },
      'streak-7': { name: 'Persevering', description: '7 days in a row' },
      'streak-30': { name: 'Unstoppable', description: '30 days in a row' },
      'streak-100': { name: 'Living legend', description: '100 days in a row' },
      'category-all': { name: 'Whole canon', description: 'Read in every category' },
      'category-half': { name: 'Halfway', description: 'Read in half the categories' },
    },
  },
  search: {
    context: 'Context (optional)',
    title: 'Bible search',
    modeReference: 'Reference',
    modeKeyword: 'Free text',
    book: 'Book',
    select: 'Select',
    chapter: 'Chapter',
    verse: 'Verse (optional)',
    all: 'All',
    version: 'Version',
    go: 'Search',
    verseCount: (n: number) => `${n} verse${n > 1 ? 's' : ''}`,
    addThisReading: '+ Add this reading',
    noResult: 'No result.',
    keyword: 'Keyword',
    keywordPlaceholder: 'Enter a word or a phrase…',
    searching: 'Searching…',
    noResultFor: (q: string) => `No result for “${q}”.`,
    resultCount: (n: number, q: string) =>
      `${n} result${n > 1 ? 's' : ''} for “${q}”`,
    add: '+ Add',
    truncated: 'Showing the first 100 results. Narrow your search.',
    addTitle: 'Add a reading',
    date: 'Date',
    notes: 'Notes (optional)',
    adding: 'Adding…',
    addToReadings: 'Add to readings',
    added: 'Added ✓',
  },
  stats: {
    title: 'Statistics',
    empty: 'No reading data yet.',
    total: 'Total readings',
    thisWeek: 'This week',
    thisMonth: 'This month',
    perDay: 'Readings per day (30 days)',
    topBooks: 'Top 10 books',
    byContext: 'Breakdown by context',
    byVersion: 'Breakdown by version',
    noContext: 'No context',
  },
  donate: {
    title: 'Support the project',
    subtitle: 'Bible Ouverte is free, ad-free, and never sells your data',
    freeText:
      'The seven translations on offer are in the public domain: they cost '
      + 'nothing and never will. The app itself runs on hosting and a database '
      + 'that do have a price, and on development time.',
    patreonText:
      'Joining the ÔAppliday community on Patreon is what keeps this work '
      + 'going and brings the features announced on the roadmap to life.',
    patreonButton: 'Join the community on Patreon',
    freeWaysTitle: 'Support without spending anything',
    freeWaysText:
      'Telling people about it is already enough. And your feedback directly '
      + 'shapes what gets built.',
    reportBug: 'Report a bug or suggest an idea',
    voteRoadmap: 'Vote on the roadmap',
    whatsappBefore: 'The WhatsApp channel ',
    whatsappAfter: ' announces what’s new.',
  },
  roadmap: {
    title: 'Roadmap',
    add: 'Add',
    itemTitle: 'Title',
    titlePlaceholder: 'Name of the feature',
    description: 'Description',
    descriptionPlaceholder: 'Describe it briefly…',
    status: 'Status',
    empty: 'Nothing here yet',
    itemCount: (n: number) => `${n} item${n > 1 ? 's' : ''}`,
    modifiedOn: (date: string) => ` · edited ${date}`,
    confirmDelete: 'Delete this roadmap item?',
    footerAdmin: 'You can add, edit or delete items.',
    footerUser: 'Upcoming features will be listed here.',
    statuses: {
      planned: 'Planned',
      projet: 'Idea',
      'in-progress': 'In progress',
      done: 'Done',
      cancelled: 'Cancelled',
    } as Record<string, string>,
  },
  support: {
    replyFailed:
      'Reply not saved. The message may be closed, or the connection lost.',
    closedSection: (n: number) => `Closed (${n})`,
    closedNotice:
      'This message is closed. Only an administrator can reopen it.',
    title: 'Support & suggestions',
    subtitle: 'Report a bug or suggest an improvement',
    newMessage: 'New message',
    newMessageHint: 'Share your feedback on the app',
    type: 'Type',
    bug: '🐛 Bug',
    suggestion: '💡 Suggestion',
    name: 'Name (visible to everyone)',
    namePlaceholder: 'Your first name or nickname',
    message: 'Message',
    bugPlaceholder: 'Describe the bug: what happened?',
    suggestionPlaceholder: 'Describe your idea for an improvement…',
    send: 'Send',
    empty: 'No message yet',
    emptyHint: 'Be the first to share your feedback!',
    replyCount: (n: number) => `${n} repl${n > 1 ? 'ies' : 'y'}`,
    admin: 'Admin',
    replyPlaceholder: 'Reply…',
    commentPlaceholder: 'Add a comment…',
    reply: '✏️ Reply',
    comment: '💬 Comment',
    confirmDelete: 'Delete this message and its replies? This cannot be undone.',
    deleteFailed:
      'Could not delete. Check your connection — deletion is reserved for '
      + 'administrators.',
    defaultAdminName: 'Administrator',
    defaultUserName: 'User',
  },
  auth: {
    passwordRules: {
      labels: {
        length: `at least ${PASSWORD_MIN_LENGTH} characters`,
        lowercase: 'a lowercase letter',
        uppercase: 'an uppercase letter',
        digit: 'a digit',
        symbol: 'a symbol (for example ! ? * - .)',
      },
      sentence: (list: string) => `The password must contain ${list}.`,
      and: 'and',
    },
  },

  profile: {
    title: 'My profile',
    loadError: 'Could not load the profile',
    removeAvatar: 'Remove the avatar',
    firstName: 'First name',
    email: 'Email',
    birthDate: 'Date of birth',
    phone: 'Phone',
    phonePlaceholder: '+33 6 12 34 56 78',
    bio: 'Bio',
    bioPlaceholder: 'A few words about you…',
    socials: 'Social links',
    addSocial: '+ Add',
    noSocial: 'No social link added',
    socialPrompt: 'Network name (e.g. instagram, twitter, facebook)',
    saving: 'Saving…',
    save: 'Save',
    saved: '✓ Profile updated',
    password: 'Password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm the new password',
    passwordHint: (min: number) =>
      `${min} characters minimum, with a lowercase letter, an uppercase `
      + 'letter, a digit and a symbol.',
    changing: 'Changing…',
    changePassword: 'Change the password',
    passwordChanged: '✓ Password changed. Use it at your next sign-in.',
    mismatch: 'The two entries of the new password do not match.',
    sameAsCurrent: 'The new password must be different from the current one.',
    wrongCurrent: 'Current password is incorrect.',
  },
  authScreens: {
    login: 'Welcome back',
    loginSubtitle: 'Pick up your readings where you left them.',
    email: 'Email',
    password: 'Password',
    signingIn: 'Signing in…',
    signIn: 'Sign in',
    noAccount: 'No account yet? ',
    createAccount: 'Create an account',
    suspended: 'Your account has been suspended by an administrator.',

    signupTitle: 'Create an account',
    signupSubtitle: 'Less than a minute, and it is free.',
    firstName: 'First name',
    creating: 'Creating…',
    createButton: 'Create the account',
    haveAccount: 'Already have an account? ',
    goToLogin: 'Go to sign-in',
    accountCreated: 'Account created',
    mailSentBefore: 'A message has just been sent to ',
    mailSentAfter: '. Open it to confirm your address, then come back and sign in.',
    yourAddress: 'your address',

    confirming: 'Confirmation in progress',
    confirmingHint: 'Your address is being verified. Just a moment.',

    home: 'Home',
    byPrefix: 'By ',
    bySuffix: ' — Resources and You',
  },
  components: {
    syncAuto: 'Synced automatically',
    syncSignIn: 'Sign in to save your data to the cloud.',

    stillThere: 'Still there?',
    sessionClosingBefore: 'Without an answer, your session will close in ',
    seconds: (n: number) => `${n} second${n > 1 ? 's' : ''}`,
    signOutNow: 'Sign me out',
    stayHere: 'I am here',

    micUnavailable: 'Could not access the microphone.',
    stopRecording: (duration: string) => `Stop (${duration})`,
    record: 'Record',
    audioFile: 'Audio file',

    addPassage: 'Add a passage',
    book: 'Book',
    selectBook: 'Select a book',
    selectBookFirst: 'Select a book first',
    addToList: 'Add to the list',
  },
  bookPicker: {
    placeholder: 'Select a book',
    dialogLabel: 'Choose a book',
    search: 'Search for a book…',
    oldTestament: 'Old Testament',
    newTestament: 'New Testament',
    noMatch: 'No matching book',
  },

  passageSearch: {
    title: 'Search for a passage',
    open: 'Search for a passage',
    use: 'Use this passage',
  },

  passagePicker: {
    dialogLabel: (bookName: string) => `Chapters and verses — ${bookName}`,
    chapter: 'Chapter',
    chapters: 'Chapters',
    rangeHint: 'A second tap further along selects the range.',
    verse: 'Verse',
    verses: 'Verses',
    wholeChapter: 'The whole chapter',
    allVerses: 'All the verses',
    firstVerseOf: (chapter: number) => `First verse — chapter ${chapter}`,
    lastVerseOf: (chapter: number) => `Last verse — chapter ${chapter}`,
    firstVerseLabel: (chapter: number) => `First verse, chapter ${chapter}`,
    lastVerseLabel: (chapter: number) => `Last verse, chapter ${chapter}`,
    validate: 'Confirm',
  },
  admin: {
    title: 'Administration',
    refresh: 'Refresh',
    denied: 'Access denied',
    notAdmin: 'You are not an administrator.',
    tabUsers: 'Users',
    tabTickets: 'Tickets',
    statUsers: 'Users',
    statUsersSub: (admins: number, actifs: number) =>
      `${admins} admin · ${actifs} active/7d`,
    statReadings: 'Readings',
    statSuspended: 'Suspended',
    statPlans: 'Plans',
    statPlanDays: (days: number) => `${days} days`,
    statContexts: 'Contexts',
    colUser: 'User',
    colEmail: 'Email',
    colRole: 'Role',
    colStatus: 'Status',
    colPlans: 'Plans',
    colLastSignIn: 'Last sign-in',
    colActions: 'Actions',
    noName: 'No name',
    roleAdmin: 'Admin',
    roleUser: 'User',
    suspended: 'Suspended',
    online: 'Online',
    offline: 'Offline',
    never: 'Never',
    demote: 'Demote',
    promote: 'Promote to admin',
    reactivate: 'Reactivate',
    suspend: 'Suspend',
    confirmDelete: (name: string) => `Delete ${name} and all their data?`,
    allTickets: (n: number) => `All (${n})`,
    noTicket: 'No ticket',
    by: (name: string) => `By ${name}`,
    replyCount: (n: number) => `${n} repl${n > 1 ? 'ies' : 'y'}`,
    categories: { bug: 'Bug', suggestion: 'Suggestion' } as Record<string, string>,
  },
  planDetail: {
    notFound: 'Plan not found.',
    backToPlans: 'Back to plans',
    passagesRead: (read: number, total: number, pct: number) =>
      `${read}/${total} passages read${total > 0 ? ` (${pct}%)` : ''}`,
    daysRead: (read: number, total: number, pct: number) =>
      `${read}/${total} days read (${pct}%)`,
    export: 'Export',
    editPlan: 'Edit the plan',
    name: 'Name',
    duration: 'Duration',
    durations: {
      '1-year': '1 year (365 days)',
      '6-months': '6 months (182 days)',
      '3-months': '3 months (91 days)',
      '1-month': '1 month (30 days)',
      custom: 'Custom',
    } as Record<string, string>,
    customDays: 'Number of days',
    version: 'Version',
    startDate: 'Start date',
    booksLabel: 'Books (leave empty for the whole Bible)',
    allBooks: 'All books',
    booksSelected: (n: number) => `${n} book${n > 1 ? 's' : ''} selected`,
    saving: 'Saving…',
    remaining: (n: number, total: number, free: boolean) =>
      `${n} ${free ? 'passages left' : 'days left'} of ${total}`,
    previous: 'Previous',
    next: 'Next',
    emptyList: 'This list is still empty.',
    emptyListHint: 'Add the passages you want to read, in the order you like.',
    day: (n: number) => `Day ${n}`,
    readOn: 'Read on ',
    notReadYet: 'Not read yet',
    remove: (reference: string) => `Remove ${reference}`,
    readOnLabel: 'Read on',
    validate: 'Confirm',
  },
  readingDetail: {
    notFound: 'Reading not found',
    backToHistory: 'Back to history',
    editTitle: 'Edit the reading',
    detailTitle: 'Reading detail',
    date: 'Date',
    book: 'Book',
    chapterStart: 'First chapter',
    chapterEnd: 'Last chapter',
    verseStart: 'First verse',
    verseEnd: 'Last verse',
    version: 'Version',
    saveEdit: 'Save',
    versionLabel: (name: string) => `Version: ${name}`,
    notes: 'Notes',
    links: 'Links',
    audio: 'Audio',
    pause: 'Pause',
    play: 'Play the audio',
    audioAttached: 'Audio attached',
    photos: 'Photos',
    bibleText: 'Bible text',
    textUnavailable:
      'No text available for this reference with the selected version.',
    confirmDelete: 'Delete this reading?',
  },
  tour: {
    steps: {
      bienvenue: {
        title: 'Welcome to Bible Ouverte',
        body:
          'This app keeps track of what you read in the Bible — when, in what '
          + 'setting, and what the reading left you with. This tour goes '
          + 'through every screen. It takes two minutes and will not come back '
          + 'on its own.',
        points: [
          'Your data is yours alone and follows you on all your devices.',
          'You can leave at any time and resume it from Settings.',
        ],
      },
      'nouvelle-lecture': {
        title: 'Record a reading',
        body:
          'This is the central action, and the screen that opens at every '
          + 'sign-in. You pick a book, chapters, and verses if you want the '
          + 'detail.',
        points: [
          'Several passages can fit in a single reading.',
          'A free note holds what you understood or want to remember.',
          'A photo of your notes, a voice memo or a link can be attached.',
        ],
      },
      contextes: {
        title: 'Contexts',
        body:
          'Each reading belongs to a setting: personal meditation, service, '
          + 'sermon, podcast, audiobook. That is what makes the statistics '
          + 'meaningful later on.',
        points: [
          'The “Context” selector on this screen offers them.',
          'Ten exist from the start, each with its emoji.',
          'You can create one on the fly, without leaving your entry.',
        ],
      },
      plans: {
        title: 'Reading plans',
        body:
          'A plan spreads a set of texts over the period you choose, then '
          + 'offers you its share each day.',
        points: [
          'The whole Bible, the New Testament, or a single book.',
          'Free plans accept passages down to the verse.',
          'Ticking a day creates the matching reading in your history.',
        ],
      },
      recherche: {
        title: 'Bible search',
        body:
          'The full text is available here, without leaving the app or opening '
          + 'another site.',
        points: [
          'Seven public-domain French translations, from 1667 to 1996.',
          'Search a word, a phrase, or a reference like “John 3:16”.',
        ],
      },
      progression: {
        title: 'Progress',
        body:
          'The sixty-six books appear and fill up as you work through them. At '
          + 'a glance, you see what is left.',
        points: [
          'Progress is counted in chapters, never in verses: recording '
          + 'John 3:16 marks the whole of John 3 as read.',
          'Old and New Testament are followed separately.',
        ],
      },
      historique: {
        title: 'History',
        body:
          'All your readings, from the most recent to the oldest. This is where '
          + 'you come back to what you wrote.',
        points: [
          'Filter by book, by context or by period.',
          'Open a reading to correct or complete it.',
          'A multiple selection lets you delete in bulk.',
        ],
      },
      statistiques: {
        title: 'Statistics',
        body:
          'What your readings say about your habits, without judgement or an '
          + 'imposed goal.',
        points: [
          'Your rhythm over time, and streaks of consecutive days.',
          'The breakdown by context and the books you visit most.',
        ],
      },
      reglages: {
        title: 'Settings',
        body:
          'The densest screen, and the one you visit least. It controls the '
          + 'appearance, the translations kept on the device, and account '
          + 'security.',
        points: [
          'Enable or remove a translation: each weighs 6 to 10 MB offline.',
          'Light theme, dark, or matched to your system.',
          'Automatic sign-out after a period of inactivity.',
          'Export and import of all your data, to keep a copy.',
        ],
      },
      notifications: {
        title: 'Reminders',
        body:
          'Five reasons can reach out to you, and each can be switched off '
          + 'separately. Nothing is sent until you grant permission on the '
          + 'device.',
        points: [
          'A daily reminder, at the time you set.',
          'A reading plan behind schedule, or a long absence.',
          'A reply to a support message, a roadmap item completed.',
          'On iPhone, the app must be installed on the Home Screen: iOS '
          + 'delivers nothing from a Safari tab.',
        ],
      },
      'hors-ligne': {
        title: 'Without a network, everything carries on',
        body:
          'The enabled translations and your readings are kept on the device. '
          + 'On a train or in a basement, the app stays whole.',
        points: [
          'What you enter offline goes to the cloud as soon as the signal returns.',
          'The cloud is the source of truth: it is what keeps your devices in step.',
        ],
      },
      'feuille-de-route': {
        title: 'Roadmap',
        body:
          'What is under way and what comes next. It is public, and you can say '
          + 'what matters to you.',
        points: [],
      },
      support: {
        title: 'Support',
        body:
          'A question, a fault, an idea: open a message and the answer will '
          + 'reach you here.',
        points: [
          'Messages are visible to every user, with their author’s name: put '
          + 'nothing confidential in them.',
        ],
      },
      soutenir: {
        title: 'Support the project',
        body:
          'The app is free, ad-free and never sells your data. This page '
          + 'explains how to help with its costs, if you wish.',
        points: [],
      },
      profil: {
        title: 'Your profile',
        body:
          'Your name, your avatar and your details. This is also where the '
          + 'password is changed and the account deleted.',
        points: [
          'Deletion erases everything, permanently, with no copy kept.',
        ],
      },
      administration: {
        title: 'Administration',
        body:
          'Reserved for your account: the list of users, the support messages '
          + 'received, and the upkeep of the roadmap.',
        points: [],
      },
      fin: {
        title: 'Over to you',
        body:
          'You have been all the way round. The tour will not reopen on its own '
          + '— but it waits for you in Settings, under “Guided tour”, the day '
          + 'you want to take it again.',
        points: [
          'Start by recording a first reading: everything follows from there.',
        ],
      },
    },
  },
  tourUi: {
    close: 'Close the guided tour',
    stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
    skip: 'Skip the tour',
    previous: 'Previous',
    next: 'Next',
    finish: 'Finish',
  },
  fontSizes: {
    'compact': 'Compact',
    'normal': 'Normal',
    'grand': 'Large',
    'tres-grand': 'Very large',
    'geant': 'Huge',
  } as Record<string, string>,

  fontStyles: {
    'normal': 'Normal',
    'italique': 'Italic',
    'gras': 'Bold',
    'gras-italique': 'Bold italic',
  } as Record<string, string>,

  fonts: {
    systeme: 'System',
    inter: 'Inter',
    lora: 'Lora',
    garamond: 'Garamond',
    hyperlegible: 'Hyperlegible',
  } as Record<string, string>,

  memorisation: {
    title: 'Memorisation',
    subtitle: 'Learn a verse, and find it again when it comes back.',
    aRevoir: 'to review today',
    ajouterHasard: 'A random verse',
    aucun: 'No verse being learnt',
    aucunAide: 'Pick one below, or let chance decide.',
    choisir: 'From your readings',
    reviser: 'Review',
    retirer: 'Remove from learning',
    duAujourdhui: 'Due today',
    terminer: 'I am done',
    reveler: 'Reveal this word',
    monte: 'One step further.',
    reste: 'We will see it again soon, without losing much.',
    retour: 'Back to the list',
    revoirLe: (d: string) => `Review on ${d}`,
    niveau: (n: number, max: number) => `Level ${n}/${max}`,
    consigne: (n: number) => n === 0 ? 'Tap a hidden word to reveal it.' : `${n} word${n > 1 ? 's' : ''} revealed`,
    prochaine: (d: string) => `Next review on ${d}`,
  },

  versetDuJour: {
    title: 'Verse of the day',
    subtitle: 'A verse drawn from your readings, the same all day.',
    duJour: 'Today',
    marquerLu: 'I have read this verse',
    enregistrement: 'Saving…',
    dejaLu: 'Read today',
    ajouteAuxLectures: 'It will be added to your readings, context “Bible”.',
    noteLecture: 'Verse of the day',
    pasDeVerset: 'No verse to offer',
    pasDeVersetAide: 'The verse of the day is drawn from your readings. Record one and come back.',
    statJours: 'Days followed',
    statTotal: 'Verses read',
    prochainDemain: (d: string) => `A new verse tomorrow — today, ${d}`,
  },

  quiz: {
    title: 'Revision quiz',
    subtitle: 'Review what you have read, at your own pace.',
    commencer: 'Start a round',
    preparation: 'Preparing…',
    pasAssez: 'Not enough readings yet',
    pasAssezAide: 'Record a few readings and come back: the quiz only covers what you have read.',
    suivante: 'Next question',
    terminer: 'See the result',
    rejouer: 'Play again',
    statParties: 'Rounds',
    statReussite: 'Accuracy',
    statMeilleur: 'Best',
    statJours: 'Days played',
    bravoParfait: 'Flawless. Impressive.',
    bravoBien: 'Very well played!',
    bravoMoyen: 'You are getting there.',
    bravoDebut: 'Every round counts. Again?',
    commencerAide: (n: number) => `${n} questions drawn from your readings`,
    progression: (i: number, n: number) => `Question ${i} of ${n}`,
    bonnes: (n: number) => `${n} correct`,
    cetaitDans: (ref: string) => `It was ${ref}`,
    resultat: (b: number, n: number) => `${b} correct out of ${n}`,
    consignes: {
      livre: 'Which book is this verse from?',
      chapitre: 'Which chapter?',
      trou: 'Which word is missing?',
      reference: 'What is its reference?',
    } as Record<string, string>,
  },

  planCatalog: {
    title: 'Suggested plans',
    hint:
      'Ready-made plans. They are generated by the app, not taken from a published calendar.',
    start: 'Start',
    duration: 'Length',
    dayCount: (n: number) => `${n} days`,
    plans: {
      'at-evangiles-psaumes': { name: 'Old Testament, Gospels and Psalms', description: 'Each day a passage from Israel\'s story, one from the Gospels and a psalm.' },
      'nouveau-testament': { name: 'The New Testament', description: 'All twenty-seven books, from Matthew to Revelation, in order.' },
      'evangiles-psaumes': { name: 'Gospels and Psalms', description: 'Two streams in parallel, for a short daily reading.' },
      'sagesse': { name: 'A proverb a day', description: 'The thirty-one chapters of Proverbs, one for each day of the month.' },
      'priere': { name: 'Prayer', description: 'Fifteen passages where Scripture prays, from Solomon to Jesus.' },
      'esperance': { name: 'Hope', description: 'Fourteen passages for the times of waiting.' },
      'pardon': { name: 'Forgiveness', description: 'Eleven passages on wrong admitted and grace received.' },
      'confiance': { name: 'Psalms of trust', description: 'Eight psalms to read again when fear draws near.' },
    } as Record<string, { name: string; description: string }>,
  },

  colorThemes: {
    rubis: 'Ruby',
    turquoise: 'Turquoise',
    indigo: 'Indigo',
    rose: 'Rose',
    cafe: 'Coffee',
    perso: 'Custom',
    marine: 'Navy',
    foret: 'Forest',
    pourpre: 'Purple',
    ocre: 'Ochre',
    ardoise: 'Slate',
  } as Record<string, string>,

  errors: {
    title: 'Error',
    versionDownload: (name: string) =>
      `Could not download “${name}”. Check your connection.`,
    versionDelete: (name: string) =>
      `Could not remove “${name}”.`,
    importStructure: 'Invalid JSON structure: “data” property missing.',
  },
}
