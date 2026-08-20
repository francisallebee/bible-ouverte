import type { Dictionary } from './fr'

/**
 * العربية — typé contre la référence française : une clé manquante ne compile pas.
 *
 * Trois partis pris, et le premier est la raison d'être des valeurs en fonction.
 *
 * **Le pluriel arabe a six formes, pas deux.** Un `s` conditionnel n'y suffit
 * pas, ni même le `n !== 1` de l'espagnol : l'arabe distingue zéro, un, le duel,
 * le petit nombre (3 à 10), le grand nombre (11 à 99), et le reste — et le nom
 * repasse au singulier après 11. `pluriel()` applique les règles CLDR, et
 * chaque compteur fournit ses six formes. C'est exactement ce qu'un gabarit
 * `{n} lectures` aurait rendu impossible.
 *
 * **Les chiffres restent occidentaux** (1, 2, 3) et non indo-arabes (١، ٢، ٣) :
 * ils viennent de l'interpolation `${n}`, et non d'`Intl`. Les dates et les
 * nombres formatés, eux, passent par `i18n/format.ts` et suivent donc `tag: 'ar'`.
 * Uniformiser demanderait de faire passer chaque compteur par `Intl`, ce qui est
 * un autre chantier.
 *
 * **L'écriture va de droite à gauche.** Rien ici ne s'en occupe : `dir` est posé
 * sur `<html>` par `I18nContext`, et la mise en page suit parce que les écrans
 * emploient des propriétés logiques. C'est cette langue qui le vérifie.
 */
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/password'

/** Les six catégories cardinales de l'arabe, selon CLDR. */
function pluriel(
  n: number,
  f: { zero: string; un: string; deux: string; peu: string; beaucoup: string; autre: string },
): string {
  if (n === 0) return f.zero
  if (n === 1) return f.un
  if (n === 2) return f.deux
  const reste = n % 100
  if (reste >= 3 && reste <= 10) return f.peu
  if (reste >= 11 && reste <= 99) return f.beaucoup
  return f.autre
}

const lectures = (n: number) => pluriel(n, {
  zero: 'قراءة', un: 'قراءة واحدة', deux: 'قراءتان',
  peu: 'قراءات', beaucoup: 'قراءة', autre: 'قراءة',
})

const isahat = (n: number) => pluriel(n, {
  zero: 'إصحاح', un: 'إصحاح واحد', deux: 'إصحاحان',
  peu: 'إصحاحات', beaucoup: 'إصحاحًا', autre: 'إصحاح',
})

const aadad = (n: number) => pluriel(n, {
  zero: 'عدد', un: 'عدد واحد', deux: 'عددان',
  peu: 'أعداد', beaucoup: 'عددًا', autre: 'عدد',
})

const asfar = (n: number) => pluriel(n, {
  zero: 'سفر', un: 'سفر واحد', deux: 'سفران',
  peu: 'أسفار', beaucoup: 'سفرًا', autre: 'سفر',
})

const ruddod = (n: number) => pluriel(n, {
  zero: 'رد', un: 'رد واحد', deux: 'ردان',
  peu: 'ردود', beaucoup: 'ردًا', autre: 'رد',
})

const anasir = (n: number) => pluriel(n, {
  zero: 'عنصر', un: 'عنصر واحد', deux: 'عنصران',
  peu: 'عناصر', beaucoup: 'عنصرًا', autre: 'عنصر',
})

const rawabit = (n: number) => pluriel(n, {
  zero: 'رابط', un: 'رابط واحد', deux: 'رابطان',
  peu: 'روابط', beaucoup: 'رابطًا', autre: 'رابط',
})

const suwar = (n: number) => pluriel(n, {
  zero: 'صورة', un: 'صورة واحدة', deux: 'صورتان',
  peu: 'صور', beaucoup: 'صورة', autre: 'صورة',
})

const thawani = (n: number) => pluriel(n, {
  zero: 'ثانية', un: 'ثانية واحدة', deux: 'ثانيتان',
  peu: 'ثوانٍ', beaucoup: 'ثانية', autre: 'ثانية',
})

const nataij = (n: number) => pluriel(n, {
  zero: 'نتيجة', un: 'نتيجة واحدة', deux: 'نتيجتان',
  peu: 'نتائج', beaucoup: 'نتيجة', autre: 'نتيجة',
})

/* Les paliers de série valent 7, 30, 100 et 365 : à eux seuls ils traversent
 * trois des six formes — أيام pour 7, يومًا pour 30 et 365, يوم pour 100. */
const ayyam = (n: number) => pluriel(n, {
  zero: 'يوم', un: 'يوم واحد', deux: 'يومان',
  peu: 'أيام', beaucoup: 'يومًا', autre: 'يوم',
})

const daqaiq = (n: number) => pluriel(n, {
  zero: 'دقيقة', un: 'دقيقة واحدة', deux: 'دقيقتان',
  peu: 'دقائق', beaucoup: 'دقيقة', autre: 'دقيقة',
})

const hisabat = (n: number) => pluriel(n, {
  zero: 'حساب', un: 'حساب واحد', deux: 'حسابان',
  peu: 'حسابات', beaucoup: 'حسابًا', autre: 'حساب',
})

const rasail = (n: number) => pluriel(n, {
  zero: 'رسالة', un: 'رسالة واحدة', deux: 'رسالتان',
  peu: 'رسائل', beaucoup: 'رسالة', autre: 'رسالة',
})

export const ar: Dictionary = {
  common: {
    ticketStatuses: {
      open: 'مفتوحة',
      in_progress: 'قيد المعالجة',
      resolved: 'محلولة',
      closed: 'مغلقة',
    } as Record<string, string>,
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    close: 'إغلاق',
    back: 'رجوع',
    loading: 'جارٍ التحميل…',
    confirm: 'تأكيد',
    yes: 'نعم',
    no: 'لا',
    search: 'بحث',
    all: 'الكل',
    none: 'لا شيء',
    add: 'إضافة',
    create: 'إنشاء',
    today: 'اليوم',
    yesterday: 'أمس',
    optional: 'اختياري',
    required: 'مطلوب',
    error: 'حدث خطأ',
    retry: 'إعادة المحاولة',
    seeAll: 'عرض الكل',
    of: 'من',
  },

  nav: {
    newReading: 'قراءة جديدة',
    plans: 'خطط القراءة',
    search: 'البحث في الكتاب المقدس',
    progress: 'التقدم',
    history: 'قراءاتي',
    stats: 'الإحصائيات',
    quiz: 'اختبار',
    versetDuJour: 'آية اليوم',
    memorisation: 'الحفظ',
    settings: 'الإعدادات',
    roadmap: 'خارطة الطريق',
    support: 'الدعم',
    messages: 'الرسائل',
    donate: 'ادعم المشروع',
    profile: 'ملفي الشخصي',
    admin: 'الإدارة',
    signOut: 'تسجيل الخروج',
    menu: 'القائمة',
  },

  language: {
    title: 'اللغة',
    subtitle: 'لغة التطبيق.',
    bibleLanguages:
      'النص الكتابي متاح بلغات التطبيق الخمس جميعها. اختر من '
      + 'الإعدادات الترجمات التي تحتفظ بها على هذا الجهاز.',
  },

  newReading: {
    title: 'قراءة جديدة',
    subtitle: 'سجّل قراءتك اليوم',
    date: 'التاريخ',
    context: 'السياق',
    book: 'السفر',
    selectBook: 'اختر سفرًا',
    chaptersAndVerses: 'الإصحاحات والأعداد',
    selectBookFirst: 'اختر سفرًا أولًا',
    version: 'الترجمة',
    addAnotherPassage: 'أضف مقطعًا آخر في هذا التاريخ',
    sharedFields:
      'التاريخ والسياق والملاحظات والملفات مشتركة بين جميع المقاطع.',
    passagesToSave: (n: number, withCurrent: boolean) =>
      `المقاطع المراد حفظها (${n}${withCurrent ? ' + الحالي' : ''})`,
    removePassage: (reference: string) => `إزالة ${reference}`,
    notes: 'ملاحظات',
    notesPlaceholder: 'تأملاتك في هذا المقطع…',
    links: 'روابط',
    linkTitlePlaceholder: 'عنوان الرابط',
    addLink: 'إضافة الرابط',
    openLink: 'فتح الرابط',
    removeLink: 'إزالة الرابط',
    audio: 'صوت',
    photos: 'صور',
    camera: 'الكاميرا',
    gallery: 'المعرض',
    removePhoto: 'إزالة الصورة',
    saving: 'جارٍ الحفظ…',
    saveOne: 'حفظ القراءة',
    saveMany: (n: number) => `حفظ ${n} ${lectures(n)}`,
    preview: 'معاينة النص',
    previewOpen: 'عرض النص',
    leaveWarning: 'قراءتك غير محفوظة. مغادرة هذه الصفحة ستفقدها. متابعة؟',
    previewEmpty: 'اختر سفرًا لعرض المعاينة.',
    previewUnavailable: 'النص غير متاح لهذا المرجع.',
    summary: 'ملخص ما أدخلته',
    linkCount: (n: number) => `${n} ${rawabit(n)}`,
    photoCount: (n: number) => `${n} ${suwar(n)}`,
    audioAttached: 'تسجيل صوتي مرفق',
  },

  contextPicker: {
    none: '— بلا سياق —',
    add: 'إضافة سياق',
    cancelAdd: 'إلغاء إضافة سياق',
    cancel: 'إلغاء',
    newName: 'اسم السياق الجديد',
    namePlaceholder: 'مجموعة بيتية، خلوة…',
    emoji: 'رمز تعبيري',
    chooseEmoji: (emoji: string) => `اختيار الرمز ${emoji}`,
    ownEmoji: 'أو الصق رمزك',
    adding: 'جارٍ الإضافة…',
    confirmAdd: 'إضافة هذا السياق',
    errorNoName: 'أعطِ اسمًا لهذا السياق.',
    errorUnusable: 'هذا الاسم لا يحتوي على أي حرف صالح.',
    errorExists: 'هذا السياق موجود بالفعل.',
  },

  history: {
    groupBy: 'التجميع حسب',
    byDate: 'التاريخ',
    byBook: 'السفر',
    byContext: 'السياق',
    title: 'قراءاتي',
    select: 'تحديد',
    selectedCount: (n: number) => `${n} ${pluriel(n, {
      zero: 'محددة', un: 'محددة واحدة', deux: 'محددتان',
      peu: 'محددة', beaucoup: 'محددة', autre: 'محددة',
    })}`,
    selectAll: (n: number) => `تحديد الكل (${n})`,
    contextToApply: 'السياق المراد تطبيقه',
    apply: 'تطبيق',
    leave: 'خروج',
    searchPlaceholder: 'ابحث في الملاحظات أو في النص…',
    allBooks: 'جميع الأسفار',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    reset: 'إعادة تعيين',
    collapseAll: 'طيّ الكل',
    expandAll: 'فتح الكل',
    empty: 'لم يُعثر على أي قراءة.',
    readingCount: (n: number) => `${n} ${lectures(n)}`,
    confirmDeleteOne: 'حذف هذه القراءة؟ هذا الإجراء نهائي.',
    confirmDeleteMany: (n: number) =>
      `حذف هذه ${n} ${lectures(n)}؟ هذا الإجراء نهائي.`,
  },

  settings: {
    goalUnitLabels: {
      chapters: 'الأصحاح',
      verses: 'الآيات',
      minutes: 'الدقائق',
    } as Record<string, string>,
    goalUnit: 'الوحدة',
    goalPeriod: 'المدّة',
    goalTarget: 'الهدف',
    goalUnits: {
      chapters: 'أصحاحًا',
      verses: 'آية',
      minutes: 'دقيقة',
    } as Record<string, string>,
    goalPeriods: {
      day: 'يوميًا',
      week: 'أسبوعيًا',
      month: 'شهريًا',
      year: 'سنويًا',
    } as Record<string, string>,
    goalSummary2: (n: number, u: string, p: string) => `${n} ${u} ${p}`,
    goalScope: 'ما يُحتسب',
    goalMinutesHint: (mots: number) =>
      `تُقدَّر الدقائق من عدد كلمات المقطع، بمعدل ${mots} كلمة في الدقيقة. لا شيء يُقاس بالتوقيت.`,
    goalScopes: { toutes: 'كل القراءات', livre: 'سفر واحد', plan: 'خطة قراءة واحدة' },
    goalScopeBook: 'السفر',
    goalScopePlan: 'الخطة',
    goalScopeMissing: 'خطة محذوفة',
    goalScopeSummary: (nom: string) => ` — في ${nom}`,
    fontPreview:
      'لأنه هكذا أحب الله العالم حتى بذل ابنه الوحيد.',
    uiScaleLabel: 'حجم الواجهة',
    readingSizeLabel: 'حجم النص الكتابي',
    readingStyleLabel: 'نمط النص الكتابي',
    fontsTitle: 'الخطوط',
    fontsHint:
      'إعدادان: واحد للقوائم وآخر للنص الكتابي. تحتفظ العربية بخط جهازك، فلا يغطيها أيّ من هذه الخطوط.',
    fontUi: 'الواجهة',
    fontReading: 'النص الكتابي',
    customTheme: 'لوحة مخصّصة',
    customThemeHint: 'اختر لونين؛ تُشتقّ الدرجات منهما.',
    customPrimary: 'اللون الأساسي',
    customAccent: 'لون التمييز',
    pages: 'الصفحات الظاهرة',
    pagesHint: 'اختر الصفحات التي تبقى في القائمة. الإعدادات والقراءة الجديدة متاحتان دائمًا.',
    setupTitle: 'خصّص تطبيقك',
    setupHint: 'خذ لحظة لضبط اللغة والمظهر وهدفك والصفحات التي تريد رؤيتها. لن نسألك مرة أخرى.',
    setupDone: 'إنهاء التخصيص',
    title: 'الإعدادات',
    subtitle: 'خصّص تجربتك',
    active: 'مُفعّل',

    theme: 'المظهر',
    themeLight: '☀️ فاتح',
    themeDark: '🌙 داكن',
    themeSystem: '🖥️ النظام',
    themeSystemHint:
      'يتبع التطبيق إعداد النهار والليل في جهازك ويتبدّل فور تبدّله.',

    colorTheme: 'لوحة الألوان',
    colorThemeHint: 'غيّر أجواء التطبيق بنقرة واحدة.',

    goal: 'هدف القراءة',
    goalHint: 'حدّد هدفًا يوميًا لتتابع تقدمك.',
    goalChapters: 'إصحاحات / يوم',
    goalVerses: 'أعداد / يوم',
    perDay: 'يوميًا',
    goalSummary: (target: number, chapters: boolean) =>
      `→ ${target} ${chapters ? isahat(target) : aadad(target)} يوميًا`,

    versions: 'ترجمات الكتاب المقدس',
    versionsHint:
      'تُنزَّل الترجمة المفعّلة على هذا الجهاز للقراءة دون اتصال — من 6 إلى 10 ميغابايت '
      + 'لكل واحدة. تعطيلها يحرّر تلك المساحة.',
    versionDefault: 'افتراضية',
    versionDeleting: 'جارٍ الحذف…',
    versionDownloading: 'جارٍ التنزيل…',
    versionEnabled: 'مفعّلة',

    exportTitle: 'تصدير البيانات',
    exportHint: 'نزّل كل بياناتك بصيغة JSON.',
    exportButton: 'تصدير بصيغة JSON',

    importTitle: 'استيراد البيانات',
    importHint: 'استورد ملف JSON سبق تصديره.',
    importButton: 'استيراد ملف JSON',
    exportOk: 'تم التصدير بنجاح.',
    exportError: 'خطأ أثناء التصدير.',
    importConfirm: 'سيستبدل هذا الإجراء بياناتك الحالية. هل تتابع؟',
    importRunning: 'جارٍ الاستيراد…',
    importOk: (n: number) => `تم استيراد ${n} ${anasir(n)} بنجاح.`,
    importError: (detail: string) => `خطأ: ${detail}`,
    importReadError: 'خطأ أثناء قراءة الملف.',
    /** يُستخدم لتلوين رسالة الاستيراد بالأحمر أو بالأخضر. */
    errorMarker: 'خطأ',

    autoLogout: 'تسجيل خروج تلقائي',
    autoLogoutHint:
      'يغلق الجلسة بعد فترة دون نشاط. مفيد إن كنت تقرأ من جهاز مشترك.',
    autoLogoutWarning:
      'ستنبّهك نافذة قبل الإغلاق بدقيقة، كي لا يضيع شيء مما تكتبه.',
    autoLogoutChoices: {
      0: 'أبدًا',
      15: 'بعد 15 دقيقة',
      30: 'بعد 30 دقيقة',
      60: 'بعد ساعة',
      240: 'بعد أربع ساعات',
    } as Record<number, string>,

    tour: 'الجولة التعريفية',
    tourHint:
      'جولة مرشدة في شاشات التطبيق. تنطلق مرة واحدة، عند أول اتصال — ثم لا تعود '
      + 'إلا إن طلبتها من هنا.',
    tourDone: (date: string) => `سبق أن تابعتها في ${date}.`,
    tourNotYet: 'لم تتابعها بعد: ستُفتح في زيارتك القادمة.',
    tourReplay: 'إعادة الجولة',

    sync: 'المزامنة السحابية',
    syncHint: 'زامن بياناتك مع حسابك لتجدها على كل أجهزتك.',

    deleteAccount: 'حذف حسابي',
    deleteWarning:
      'هذا الإجراء لا رجعة فيه. ستُمحى كل بياناتك نهائيًا.',
    deleteConfirm:
      '⚠️ هل أنت متأكد؟ ستضيع قراءاتك وخططك وملفاتك إلى الأبد.',
    deleteYes: 'نعم، احذف كل شيء',
    deleting: 'جارٍ الحذف…',
    deleteDone: 'تم حذف الحساب. جارٍ إعادة التوجيه…',
    deleteError: 'خطأ أثناء الحذف',

    info: 'معلومات',
    infoApp: 'التطبيق',
    infoVersion: 'الإصدار',
    infoOffline: 'وضع دون اتصال',
    infoOfflineOn: 'مفعّل',
    infoStorage: 'التخزين',
    infoVerses: 'الأعداد المتاحة',
  },

  notifications: {
    title: 'الإشعارات',
    readingDevice: 'جارٍ قراءة الجهاز…',
    iosNotInstalled:
      'على iPhone وiPad، لا تُسلَّم الإشعارات إلا للتطبيقات المثبّتة. افتح قائمة '
      + 'المشاركة في Safari، ثم «إضافة إلى الشاشة الرئيسية»، وعُد إلى هنا من '
      + 'التطبيق المثبّت.',
    unsupported:
      'هذا المتصفح لا يدعم الإشعارات. يبقى الإعداد متاحًا من جهاز يدعمها.',
    denied:
      'رُفضت الإشعارات لهذا الموقع. لا يستطيع أي تطبيق التراجع عن هذا الاختيار: '
      + 'عليك السماح بها من جديد في إعدادات متصفحك.',
    needsPermission:
      'تلقَّ تذكيرًا بالقراءة على هذا الجهاز. سيطلب متصفحك موافقتك.',
    waiting: 'في انتظار ردّك…',
    allow: 'السماح بالإشعارات',
    receiveOnDevice: 'تلقّي الإشعارات على هذا الجهاز',
    whatTriggers: 'ما الذي يُطلق إشعارًا',
    at: 'في',
    timeZoneOf: (zone: string) => `بتوقيت ${zone}`,
    granted: 'الإذن ممنوح واختياراتك محفوظة.',
    sendTest: 'إرسال إشعار تجريبي',
    testSending: 'جارٍ الإرسال…',
    testSent:
      'أُرسل الإشعار. إن لم تره يظهر، فجهازك يحتجزه — راجع إعدادات الإشعارات '
      + 'الخاصة بـ Bible Ouverte فيه.',
    noPermission: 'الإذن غير ممنوح على هذا الجهاز.',
    testUnsupported: 'هذا المتصفح لا يدعم الإشعارات.',
    testFailed:
      'رفض الجهاز الإرسال. على iPhone، يجب فتح التطبيق من الشاشة الرئيسية لا من '
      + 'Safari.',
    subscribeFailed:
      'تعذّر اشتراك هذا الجهاز. حُفظت الإعدادات، لكن لن يُرسَل إليه شيء.',
    /** تسميات المحفّزات الخمسة، بحسب المعرّف. */
    triggers: {
      daily: {
        label: 'تذكير يومي',
        hint: 'في الساعة التي تختارها، كي لا تنسى قراءتك.',
      },
      'plan-late': {
        label: 'خطة قراءة متأخرة',
        hint: 'عندما لا يُعلَّم يوم مقرّر.',
      },
      'support-reply': {
        label: 'رد على رسالة دعم',
        hint: 'عندما يردّ أحدهم على إحدى تذاكرك.',
      },
      'roadmap-done': {
        label: 'خارطة الطريق',
        hint: 'عندما تنتقل ميزة منتظَرة إلى «مُنجز».',
      },
      inactive: {
        label: 'غياب طويل',
        hint: 'تنبيه بعد عدة أيام دون قراءة.',
      },
    },
  },

  plans: {
    title: 'خطط القراءة',
    newPlan: 'خطة جديدة',
    createTitle: 'إنشاء خطة قراءة',
    name: 'الاسم',
    namePlaceholder: 'خطتي 2026',
    kind: 'نوع الخطة',
    scheduled: 'مؤرّخة',
    scheduledHint: 'مقطع كل يوم، موزّع على مدة.',
    free: 'حرة',
    freeHint: 'قائمة مقاطع بلا تواريخ، تُعلَّم على وتيرتك.',
    duration: 'المدة',
    durations: {
      '1-year': 'سنة واحدة',
      '6-months': '6 أشهر',
      '3-months': '3 أشهر',
      '1-month': 'شهر واحد',
      custom: 'مخصّصة',
    } as Record<string, string>,
    durationDays: (days: number) => ` (${days} يومًا)`,
    customDaysPlaceholder: 'عدد الأيام',
    version: 'الترجمة',
    startDate: 'تاريخ البداية',
    creating: 'جارٍ الإنشاء…',
    create: 'إنشاء الخطة',
    empty: 'لا توجد خطة قراءة.',
    emptyHint: 'أنشئ خطة لقراءة الكتاب المقدس خلال مدة محددة.',
    freePlan: 'خطة حرة',
    scheduledSummary: (duration: string, days: number) =>
      `${duration} · ${days} يومًا`,
    undated: 'بلا تاريخ',
    deleteTitle: 'حذف هذه الخطة؟',
    deletePlan: (nom: string) => `حذف خطة ${nom}`,
    deleteHint: 'هذا الإجراء لا رجعة فيه.',
  },

  /** فئات الأسفار العشر، بحسب معرّف `BIBLE_CATEGORIES`. */
  bibleCategories: {
    pentateuch: 'أسفار موسى الخمسة',
    historical: 'الأسفار التاريخية',
    poetic: 'الأسفار الشعرية',
    'major-prophets': 'الأنبياء الكبار',
    'minor-prophets': 'الأنبياء الصغار',
    gospels: 'الأناجيل',
    acts: 'تاريخ الرسل',
    'pauline-epistles': 'رسائل بولس',
    'general-epistles': 'الرسائل الجامعة',
    revelation: 'سفر الرؤيا',
  } as Record<string, string>,

  progress: {
    goalUnitPeriod: (u: string, p: string) => `${u} ${p}`,
    goalScope: (nom: string) => `في ${nom}`,
    title: 'تقدّمي',
    level: (n: number) => `المستوى ${n}`,
    chaptersOf: (read: number, next: number) => `${read} / ${next} إصحاحًا`,
    currentStreak: 'التتابع الحالي',
    days: 'أيام',
    bestStreak: (n: number) => `الأفضل: ${n} يومًا`,
    nextMilestone: (n: number) => `المرحلة التالية: ${n} ${ayyam(n)}`,
    allMilestones: 'تم بلوغ جميع المراحل',
    milestoneReached: (n: number) => `${n} ${ayyam(n)}`,
    chaptersRead: 'الإصحاحات المقروءة',
    booksStarted: (n: number) => `${n} ${asfar(n)} بُدئ بها`,
    dailyGoal: 'الهدف',
    chaptersToday: 'إصحاحًا اليوم',
    versesToday: 'عددًا اليوم',
    noGoal: 'لم يُحدَّد أي هدف',
    goalReached: 'تحقّق الهدف! 🎉',
    goalAlmost: 'بقي القليل من الجهد',
    goalToday: (current: number, target: number, unite: string, periode: string) =>
      `${current} / ${target} ${unite === 'chapters' ? isahat(target) : unite === 'verses' ? aadad(target) : daqaiq(target)} ${periode}`,
    oldTestament: 'العهد القديم',
    newTestament: 'العهد الجديد',
    chaptersOfTotal: (read: number, total: number) => `${read} / ${total} إصحاحًا`,
    byContext: 'التقدم بحسب السياق',
    chapterCount: (n: number) => `${n} ${isahat(n)}`,
    noContext: 'بلا سياق',
    byCategory: 'التقدم بحسب الفئة',
    achievements: 'الإنجازات والمكافآت',
    byBook: 'التفصيل بحسب السفر',
    /** ألقاب المستويات، بحسب الدرجة. */
    levels: {
      1: 'قارئ مبتدئ',
      2: 'قارئ الأحد',
      3: 'أمين',
      4: 'مُكرَّس',
      5: 'عالِم',
      6: 'لاهوتي',
      7: 'مُعلِّم',
    } as Record<number, string>,
    badges: {
      first: { name: 'الخطوات الأولى', description: 'قراءة أول إصحاح' },
      ten: { name: 'مكتشف', description: 'قراءة 10 إصحاحات' },
      fifty: { name: 'مستكشف', description: 'قراءة 50 إصحاحًا' },
      hundred: { name: 'قارئ مواظب', description: 'قراءة 100 إصحاح' },
      'two-fifty': { name: 'كاتب', description: 'قراءة 250 إصحاحًا' },
      'five-hundred': { name: 'مُعلِّم الناموس', description: 'قراءة 500 إصحاح' },
      thousand: { name: 'حارس', description: 'قراءة 1000 إصحاح' },
      'streak-3': { name: 'منتظم', description: 'سلسلة من 3 أيام' },
      'streak-7': { name: 'مثابر', description: 'سلسلة من 7 أيام' },
      'streak-30': { name: 'لا يُوقَف', description: 'سلسلة من 30 يومًا' },
      'streak-100': { name: 'أسطورة حية', description: 'سلسلة من 100 يوم' },
      'category-all': { name: 'القانون كاملًا', description: 'القراءة في كل الفئات' },
      'category-half': { name: 'في منتصف الطريق', description: 'القراءة في نصف الفئات' },
    },
  },
  search: {
    context: 'السياق (اختياري)',
    title: 'البحث في الكتاب المقدس',
    modeReference: 'مرجع',
    modeKeyword: 'حر',
    book: 'السفر',
    select: 'اختيار',
    chapter: 'الإصحاح',
    verse: 'العدد (اختياري)',
    all: 'الكل',
    version: 'الترجمة',
    go: 'ابحث',
    verseCount: (n: number) => `${n} ${aadad(n)}`,
    addThisReading: '+ إضافة هذه القراءة',
    noResult: 'لا نتائج.',
    keyword: 'كلمة مفتاحية',
    keywordPlaceholder: 'أدخل كلمة أو عبارة…',
    searching: 'جارٍ البحث…',
    noResultFor: (q: string) => `لا نتائج لـ «${q}».`,
    resultCount: (n: number, q: string) => `${n} ${nataij(n)} لـ «${q}»`,
    add: '+ إضافة',
    truncated: 'تُعرض أول 100 نتيجة. حدّد بحثك أكثر.',
    addTitle: 'إضافة قراءة',
    date: 'التاريخ',
    notes: 'ملاحظات (اختياري)',
    adding: 'جارٍ الإضافة…',
    addToReadings: 'إضافة إلى القراءات',
    added: 'أُضيفت ✓',
  },
  stats: {
    title: 'الإحصائيات',
    empty: 'لا توجد بيانات قراءة بعد.',
    total: 'مجموع القراءات',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    perDay: 'القراءات يوميًا (30 يومًا)',
    topBooks: 'أفضل 10 أسفار',
    byContext: 'التوزيع بحسب السياق',
    byVersion: 'التوزيع بحسب الترجمة',
    noContext: 'بلا سياق',
  },
  donate: {
    title: 'ادعم المشروع',
    subtitle: 'Bible Ouverte مجاني، بلا إعلانات وبلا بيع للبيانات',
    freeText:
      'الترجمات السبع المتاحة في الملك العام: لا تكلّف شيئًا ولن تكلّف شيئًا '
      + 'أبدًا. أما التطبيق فيقوم على استضافة وقاعدة بيانات لهما ثمن، وعلى وقت '
      + 'من التطوير.',
    patreonText:
      'الانضمام إلى مجتمع ÔAppliday على Patreon هو ما يتيح لهذا العمل أن يستمر '
      + 'ولما أُعلن في خارطة الطريق أن يرى النور.',
    patreonButton: 'انضم إلى المجتمع على Patreon',
    freeWaysTitle: 'ادعم دون أن تنفق شيئًا',
    freeWaysText:
      'يكفي أن تتحدث عنه لمن حولك. وملاحظاتك توجّه مباشرةً ما يجري تطويره.',
    reportBug: 'أبلغ عن خلل أو اقترح فكرة',
    voteRoadmap: 'صوّت في خارطة الطريق',
    whatsappBefore: 'قناة WhatsApp ',
    whatsappAfter: ' تُعلن الجديد.',
  },
  roadmap: {
    title: 'خارطة الطريق',
    add: 'إضافة',
    itemTitle: 'العنوان',
    titlePlaceholder: 'اسم الميزة',
    description: 'الوصف',
    descriptionPlaceholder: 'صِفها باختصار…',
    status: 'الحالة',
    empty: 'لا عناصر في الوقت الحالي',
    itemCount: (n: number) => `${n} ${anasir(n)}`,
    modifiedOn: (date: string) => ` · عُدّل في ${date}`,
    confirmDelete: 'حذف هذا العنصر من خارطة الطريق؟',
    footerAdmin: 'يمكنك إضافة العناصر أو تعديلها أو حذفها.',
    footerUser: 'ستُدرج الميزات القادمة هنا.',
    /** الحالات الخمس، بحسب المفتاح — وهي في قاعدة البيانات، لا تتغيّر. */
    statuses: {
      planned: 'مُخطَّط',
      projet: 'مشروع',
      'in-progress': 'قيد التنفيذ',
      done: 'مُنجز',
      cancelled: 'مُلغى',
    } as Record<string, string>,
  },
  support: {
    replyFailed: 'لم يُحفظ الرد. قد تكون الرسالة مغلقة، أو انقطع الاتصال.',
    closedSection: (n: number) => `مغلقة (${n})`,
    closedNotice: 'هذه الرسالة مغلقة. لا يمكن إعادة فتحها إلا لمشرف.',
    title: 'الدعم والاقتراحات',
    subtitle: 'أبلغ عن خلل أو اقترح تحسينًا',
    newMessage: 'رسالة جديدة',
    newMessageHint: 'شارك رأيك في التطبيق',
    type: 'النوع',
    bug: '🐛 خلل',
    suggestion: '💡 اقتراح',
    name: 'الاسم (ظاهر للجميع)',
    namePlaceholder: 'اسمك أو كنيتك',
    message: 'الرسالة',
    bugPlaceholder: 'صِف الخلل: ماذا حدث؟',
    suggestionPlaceholder: 'صِف فكرتك للتحسين…',
    send: 'إرسال',
    empty: 'لا رسائل في الوقت الحالي',
    emptyHint: 'كن أول من يشارك رأيه!',
    replyCount: (n: number) => `${n} ${ruddod(n)}`,
    admin: 'مشرف',
    replyPlaceholder: 'ردّ…',
    commentPlaceholder: 'أضف تعليقًا…',
    reply: '✏️ ردّ',
    comment: '💬 تعليق',
    confirmDelete: 'حذف هذه الرسالة وردودها؟ هذا الإجراء نهائي.',
    deleteFailed:
      'تعذّر الحذف. تحقّق من اتصالك — الحذف مقصور على المشرفين.',
    defaultAdminName: 'المشرف',
    defaultUserName: 'مستخدم',
  },
  auth: {
    passwordRules: {
      labels: {
        length: `${PASSWORD_MIN_LENGTH} حروف على الأقل`,
        lowercase: 'حرفًا صغيرًا',
        uppercase: 'حرفًا كبيرًا',
        digit: 'رقمًا',
        symbol: 'رمزًا (مثل ! ? * - .)',
      },
      sentence: (list: string) => `يجب أن تحتوي كلمة السر على ${list}.`,
      and: 'و',
    },
  },

  profile: {
    title: 'ملفي الشخصي',
    loadError: 'خطأ في تحميل الملف الشخصي',
    removeAvatar: 'حذف الصورة الرمزية',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    city: 'المدينة',
    completeTitle: 'أكمل ملفك الشخصي',
    completeHint:
      'اسمك الأول واسم عائلتك ناقصان. بهما نعرفك ونراسلك — حقلان، وينتهي الأمر.',
    email: 'البريد الإلكتروني',
    birthDate: 'تاريخ الميلاد',
    phone: 'الهاتف',
    phonePlaceholder: '+33 6 12 34 56 78',
    bio: 'نبذة',
    bioPlaceholder: 'بضع كلمات عنك…',
    socials: 'الشبكات الاجتماعية',
    addSocial: '+ إضافة',
    noSocial: 'لم تُضف أي شبكة',
    socialPrompt: 'اسم الشبكة (مثل: instagram، twitter، facebook)',
    saving: 'جارٍ الحفظ…',
    save: 'حفظ',
    saved: '✓ حُدّث الملف الشخصي',
    password: 'كلمة السر',
    currentPassword: 'كلمة السر الحالية',
    newPassword: 'كلمة السر الجديدة',
    confirmPassword: 'تأكيد كلمة السر الجديدة',
    passwordHint: (min: number) =>
      `${min} حروف على الأقل، مع حرف صغير وحرف كبير ورقم ورمز.`,
    changing: 'جارٍ التعديل…',
    changePassword: 'تغيير كلمة السر',
    passwordChanged: '✓ عُدّلت كلمة السر. ستستعملها في اتصالك القادم.',
    mismatch: 'إدخالا كلمة السر الجديدة غير متطابقين.',
    sameAsCurrent: 'يجب أن تختلف كلمة السر الجديدة عن الحالية.',
    wrongCurrent: 'كلمة السر الحالية غير صحيحة.',
  },
  authScreens: {
    login: 'أهلًا بعودتك',
    loginSubtitle: 'تابع قراءاتك من حيث توقفت.',
    email: 'البريد الإلكتروني',
    password: 'كلمة السر',
    signingIn: 'جارٍ الاتصال…',
    signIn: 'تسجيل الدخول',
    noAccount: 'ليس لديك حساب بعد؟ ',
    createAccount: 'أنشئ حسابًا',
    suspended: 'عُلّق حسابك من قِبل مشرف.',

    signupTitle: 'إنشاء حساب',
    signupSubtitle: 'أقل من دقيقة، وهو مجاني.',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    phoneField: 'الهاتف المحمول',
    city: 'المدينة',
    optional: ' (اختياري)',
    discoverySource: 'كيف تعرّفت على Bible Ouverte؟',
    discoveryPlaceholder: 'أفضّل عدم الإفصاح',
    discoverySources: {
      internet: 'الإنترنت',
      reseaux: 'وسائل التواصل الاجتماعي',
      connaissance: 'شخص أعرفه',
      autre: 'غير ذلك',
    } as Record<string, string>,
    creating: 'جارٍ الإنشاء…',
    createButton: 'إنشاء الحساب',
    haveAccount: 'لديك حساب بالفعل؟ ',
    goToLogin: 'اذهب إلى تسجيل الدخول',
    accountCreated: 'أُنشئ الحساب',
    mailSentBefore: 'انطلقت رسالة للتو إلى ',
    mailSentAfter: '. افتحها لتأكيد عنوانك، ثم عُد لتسجيل الدخول.',
    yourAddress: 'عنوانك',

    confirming: 'جارٍ التأكيد',
    confirmingHint: 'يجري التحقق من عنوانك. لحظة واحدة.',

    home: 'الرئيسية',
    byPrefix: 'من ',
    bySuffix: ' — موارد وأنت',
  },
  components: {
    syncAuto: 'مزامنة تلقائية',
    syncSignIn: 'سجّل الدخول لحفظ بياناتك في السحابة.',

    stillThere: 'أما زلت هنا؟',
    sessionClosingBefore: 'دون ردّ، ستُغلق جلستك خلال ',
    seconds: (n: number) => `${n} ${thawani(n)}`,
    signOutNow: 'سجّل خروجي',
    stayHere: 'أنا هنا',

    micUnavailable: 'تعذّر الوصول إلى الميكروفون.',
    stopRecording: (duration: string) => `إيقاف (${duration})`,
    record: 'تسجيل',
    audioFile: 'ملف صوتي',

    addPassage: 'إضافة مقطع',
    book: 'السفر',
    selectBook: 'اختر سفرًا',
    selectBookFirst: 'اختر سفرًا أولًا',
    addToList: 'إضافة إلى القائمة',
  },
  bookPicker: {
    placeholder: 'اختر سفرًا',
    dialogLabel: 'اختيار سفر',
    search: 'ابحث عن سفر…',
    oldTestament: 'العهد القديم',
    newTestament: 'العهد الجديد',
    noMatch: 'لا يوجد سفر مطابق',
  },

  passageSearch: {
    title: 'البحث عن مقطع',
    open: 'البحث عن مقطع',
    use: 'استخدام هذا المقطع',
  },

  passagePicker: {
    dialogLabel: (bookName: string) => `الإصحاحات والأعداد — ${bookName}`,
    chapter: 'الإصحاح',
    chapters: 'الإصحاحات',
    rangeHint: 'ضغطة ثانية أبعد تحدّد المجال.',
    verse: 'العدد',
    verses: 'الأعداد',
    wholeChapter: 'الإصحاح كاملًا',
    allVerses: 'كل الأعداد',
    firstVerseOf: (chapter: number) => `العدد الأول — الإصحاح ${chapter}`,
    lastVerseOf: (chapter: number) => `العدد الأخير — الإصحاح ${chapter}`,
    firstVerseLabel: (chapter: number) => `العدد الأول، الإصحاح ${chapter}`,
    lastVerseLabel: (chapter: number) => `العدد الأخير، الإصحاح ${chapter}`,
    validate: 'تأكيد',
  },
  messages: {
    title: 'الرسائل',
    navBadge: (n: number) => `${n} ${rasail(n)} غير مقروءة`,
    empty: 'لا رسائل حتى الآن.',
    emptyHint: 'سيكتب إليك فريق Bible Ouverte هنا عند الحاجة.',
    fromAdmin: 'Bible Ouverte',
    you: 'أنت',
    subject: 'الموضوع',
    subjectPlaceholder: 'اختياري',
    body: 'الرسالة',
    bodyPlaceholder: 'اكتب رسالتك…',
    send: 'إرسال',
    sending: 'جارٍ الإرسال…',
    sent: '✓ أُرسلت الرسالة',
    sendFailed: 'فشل الإرسال. تحقّق من اتصالك وأعد المحاولة.',
    reply: 'رد',
    writeTo: (nom: string) => `الكتابة إلى ${nom}`,
    writeToSelection: (n: number) => `الكتابة إلى ${n} ${hisabat(n)} معروضة`,
    confirmBulk: (n: number) => `إرسال هذه الرسالة إلى ${n} شخصًا؟`,
    sentCount: (n: number) => `✓ أُرسلت إلى ${n} شخصًا`,
    unread: 'غير مقروءة',
    errors: {
      corpsVide: 'الرسالة فارغة.',
      sujetTropLong: 'الموضوع طويل جدًا.',
      corpsTropLong: 'الرسالة طويلة جدًا.',
      sansDestinataire: 'لا مستقبِل.',
    } as Record<string, string>,
  },

  admin: {
    tabOverview: 'نظرة عامة',
    tabAcquisition: 'مصادر التسجيل',
    tabJournal: 'سجل الإجراءات',
    acqSources: 'من أين تأتي الحسابات',
    acqMonths: 'التسجيلات حسب الشهر',
    acqCities: 'أكثر المدن تمثيلًا',
    acqUnknown: 'غير محدَّد',
    acqNoCity: 'لا مدينة محدَّدة حتى الآن.',
    acqCount: (n: number, pourcent: number) => `${n} · ${pourcent} %`,
    journalEmpty: 'لا إجراءات مسجَّلة.',
    journalRecipients: (n: number) => `${n} شخصًا`,
    journalActions: {
      promote: 'رقّى',
      demote: 'خفّض رتبة',
      suspend: 'أوقف',
      reactivate: 'أعاد تفعيل',
      delete_account: 'حذف حساب',
      message: 'كتب إلى',
    } as Record<string, string>,

    manageUsers: 'إدارة المستخدمين',
    usersTitle: 'المستخدمون',
    usersSubtitle: (n: number) => `${n} ${hisabat(n)}`,
    backToAdmin: 'العودة إلى الإدارة',
    searchPlaceholder: 'الاسم أو البريد أو المدينة…',
    exportCsv: 'تصدير بصيغة CSV',
    noResult: 'لا يطابق أي حساب',
    showing: (debut: number, fin: number, total: number) => `${debut}–${fin} من ${total}`,
    pageOf: (page: number, pages: number) => `صفحة ${page} / ${pages}`,
    previous: 'السابق',
    next: 'التالي',
    segments: {
      tous: 'الكل',
      actifs: 'نشطون (7 أيام)',
      inactifs: 'غير نشطين (30 يومًا)',
      jamais: 'لم يسجّلوا الدخول قط',
      suspendus: 'موقوفون',
      admins: 'المشرفون',
      incomplets: 'ملف غير مكتمل',
    } as Record<string, string>,
    sortLabel: 'الترتيب حسب',
    sorts: {
      nom: 'الاسم',
      inscription: 'التسجيل',
      connexion: 'آخر دخول',
      lectures: 'القراءات',
    } as Record<string, string>,
    openFiche: 'فتح البطاقة',
    ficheNotFound: 'الحساب غير موجود',
    ficheIdentity: 'الهوية',
    ficheAccount: 'الحساب',
    ficheActivity: 'النشاط',
    ficheReadings: 'آخر القراءات',
    fichePlans: 'خطط القراءة',
    ficheTickets: 'تذاكر الدعم',
    ficheNothing: 'لا شيء لعرضه',
    ficheEmailConfirmed: 'بريد مؤكَّد',
    ficheEmailPending: 'بريد غير مؤكَّد',
    ficheSignedUp: 'سجّل في',
    ficheLanguage: 'اللغة',
    fichePushDevices: 'الأجهزة المشتركة في الإشعارات',
    ficheMemorised: 'آيات قيد الحفظ',
    ficheSessions: 'جلسات اللعب',
    fichePlanDays: 'أيام الخطة',
    ficheNotProvided: 'غير محدَّد',

    title: 'الإدارة',
    refresh: 'تحديث',
    denied: 'الوصول مرفوض',
    notAdmin: 'لست مشرفًا.',
    tabUsers: 'المستخدمون',
    tabTickets: 'التذاكر',
    statUsers: 'المستخدمون',
    statUsersSub: (admins: number, actifs: number) =>
      `${admins} مشرف · ${actifs} نشط/7 أيام`,
    statReadings: 'القراءات',
    statSuspended: 'المعلَّقون',
    statPlans: 'الخطط',
    statPlanDays: (days: number) => `${days} يومًا`,
    statContexts: 'السياقات',
    colUser: 'المستخدم',
    colEmail: 'البريد',
    colRole: 'الدور',
    colStatus: 'الحالة',
    changeStatus: 'تغيير الحالة',
    colPlans: 'الخطط',
    colLastSignIn: 'الاتصال',
    colActions: 'الإجراءات',
    noName: 'بلا اسم',
    roleAdmin: 'مشرف',
    roleUser: 'مستخدم',
    suspended: 'معلَّق',
    online: 'متصل',
    offline: 'غير متصل',
    never: 'أبدًا',
    demote: 'خفض الرتبة',
    promote: 'ترقية إلى مشرف',
    reactivate: 'إعادة التفعيل',
    suspend: 'تعليق',
    confirmDelete: (name: string) => `حذف ${name} وكل بياناته؟`,
    allTickets: (n: number) => `الكل (${n})`,
    noTicket: 'لا تذاكر',
    by: (name: string) => `بواسطة ${name}`,
    replyCount: (n: number) => `${n} ${ruddod(n)}`,
    categories: { bug: 'خلل', suggestion: 'اقتراح' } as Record<string, string>,
  },
  planDetail: {
    notFound: 'الخطة غير موجودة.',
    backToPlans: 'العودة إلى الخطط',
    passagesRead: (read: number, total: number, pct: number) =>
      `${read}/${total} مقطعًا مقروءًا${total > 0 ? ` (${pct}٪)` : ''}`,
    daysRead: (read: number, total: number, pct: number) =>
      `${read}/${total} يومًا مقروءًا (${pct}٪)`,
    export: 'تصدير',
    editPlan: 'تعديل الخطة',
    name: 'الاسم',
    duration: 'المدة',
    durations: {
      '1-year': 'سنة واحدة (365 يومًا)',
      '6-months': '6 أشهر (182 يومًا)',
      '3-months': '3 أشهر (91 يومًا)',
      '1-month': 'شهر واحد (30 يومًا)',
      custom: 'مخصّصة',
    } as Record<string, string>,
    customDays: 'عدد الأيام',
    version: 'الترجمة',
    startDate: 'تاريخ البداية',
    booksLabel: 'الأسفار (اتركه فارغًا للكتاب المقدس كاملًا)',
    allBooks: 'جميع الأسفار',
    booksSelected: (n: number) => `${n} ${asfar(n)} محددة`,
    saving: 'جارٍ الحفظ…',
    remaining: (n: number, total: number, free: boolean) =>
      `${n} ${free ? 'مقطعًا متبقيًا' : 'يومًا متبقيًا'} من ${total}`,
    previous: 'السابق',
    next: 'التالي',
    emptyList: 'هذه القائمة فارغة بعد.',
    emptyListHint: 'أضف المقاطع التي تريد قراءتها، بالترتيب الذي يعجبك.',
    day: (n: number) => `اليوم ${n}`,
    readOn: 'قُرئ في ',
    notReadYet: 'لم يُقرأ بعد',
    remove: (reference: string) => `إزالة ${reference}`,
    readOnLabel: 'قُرئ في',
    validate: 'تأكيد',
  },
  readingDetail: {
    notFound: 'القراءة غير موجودة',
    backToHistory: 'العودة إلى السجل',
    editTitle: 'تعديل القراءة',
    detailTitle: 'تفاصيل القراءة',
    date: 'التاريخ',
    book: 'السفر',
    chapterStart: 'الإصحاح الأول',
    chapterEnd: 'الإصحاح الأخير',
    verseStart: 'العدد الأول',
    verseEnd: 'العدد الأخير',
    version: 'الترجمة',
    saveEdit: 'حفظ',
    versionLabel: (name: string) => `الترجمة: ${name}`,
    notes: 'ملاحظات',
    links: 'روابط',
    audio: 'صوت',
    pause: 'إيقاف مؤقت',
    play: 'استماع للتسجيل',
    audioAttached: 'تسجيل صوتي مرفق',
    photos: 'صور',
    bibleText: 'النص الكتابي',
    textUnavailable: 'النص غير متاح لهذا المرجع بالترجمة المختارة.',
    confirmDelete: 'حذف هذه القراءة؟',
  },
  tour: {
    /** نص المراحل الـ17، بحسب معرّف `TOUR_STEPS`. */
    steps: {
      bienvenue: {
        title: 'أهلًا بك في Bible Ouverte',
        body:
          'يحفظ هذا التطبيق أثر ما تقرأه في الكتاب المقدس — متى، وفي أي إطار، وما '
          + 'الذي تركته فيك القراءة. تمرّ هذه الجولة على كل شاشة. تستغرق دقيقتين '
          + 'ولن تعود من تلقاء نفسها.',
        points: [
          'بياناتك لك وحدك وتتبعك على كل أجهزتك.',
          'يمكنك الخروج منها متى شئت واستئنافها من الإعدادات.',
        ],
      },
      'nouvelle-lecture': {
        title: 'تسجيل قراءة',
        body:
          'هذه هي الحركة المحورية، والشاشة التي تُفتح عند كل اتصال. تختار سفرًا '
          + 'وإصحاحات، وتفصيل الأعداد إن أردت.',
        points: [
          'يمكن أن تجتمع عدة مقاطع في قراءة واحدة.',
          'ملاحظة حرة تجمع ما فهمته أو احتفظت به.',
          'يمكن إرفاق صورة لملاحظاتك أو مذكّرة صوتية أو رابط.',
        ],
      },
      contextes: {
        title: 'السياقات',
        body:
          'ترتبط كل قراءة بإطار: تأمل شخصي، عبادة، عظة، بودكاست، كتاب مسموع. هذا '
          + 'ما يجعل الإحصائيات ناطقة لاحقًا.',
        points: [
          'يقدّمها مُنتقي «السياق» في هذه الشاشة.',
          'توجد عشرة منذ البداية، مع رموزها.',
          'يمكنك إنشاء واحد أثناء العمل، دون مغادرة ما تكتبه.',
        ],
      },
      plans: {
        title: 'خطط القراءة',
        body:
          'توزّع الخطة مجموعة نصوص على المدة التي تختارها، ثم تقترح عليك كل يوم '
          + 'نصيبه.',
        points: [
          'الكتاب المقدس كاملًا، أو العهد الجديد، أو سفر واحد.',
          'تقبل الخطط الحرة مقاطع بدقة العدد الواحد.',
          'تعليم يوم يُنشئ القراءة المقابلة في سجلك.',
        ],
      },
      recherche: {
        title: 'البحث في الكتاب المقدس',
        body:
          'يمكن الاطلاع على النص كاملًا هنا، دون مغادرة التطبيق ولا فتح موقع آخر.',
        points: [
          'سبع ترجمات فرنسية حرة الحقوق، من 1667 إلى 1996.',
          'ابحث عن كلمة أو عبارة أو مرجع مثل «يوحنا 3:16».',
        ],
      },
      progression: {
        title: 'التقدم',
        body:
          'تظهر الأسفار الستة والستون وتمتلئ كلما قطعتها. بنظرة واحدة ترى ما تبقّى.',
        points: [
          'يُحسب التقدم بالإصحاحات لا بالأعداد أبدًا: تدوين يوحنا 3:16 يُعلّم '
          + 'يوحنا 3 كله مقروءًا.',
          'يُتابَع العهد القديم والعهد الجديد كل على حدة.',
        ],
      },
      historique: {
        title: 'السجل',
        body:
          'كل قراءاتك، من الأحدث إلى الأقدم. من هنا يُعاد إلى ما كُتب.',
        points: [
          'صفِّ بحسب السفر أو السياق أو الفترة.',
          'افتح قراءة لتصحيحها أو إتمامها.',
          'يتيح التحديد المتعدد الحذف دفعة واحدة.',
        ],
      },
      statistiques: {
        title: 'الإحصائيات',
        body:
          'ما تقوله قراءاتك عن عاداتك، بلا حكم ولا هدف مفروض.',
        points: [
          'وتيرتك عبر الزمن، وسلاسل الأيام المتتالية.',
          'التوزيع بحسب السياق والأسفار الأكثر ترددًا عليها.',
        ],
      },
      reglages: {
        title: 'الإعدادات',
        body:
          'أكثف الشاشات، وأقلّها زيارة. تتحكم في المظهر، وفي الترجمات المحفوظة على '
          + 'الجهاز، وفي أمان الحساب.',
        points: [
          'فعّل ترجمة أو أزلها: تزن كل واحدة من 6 إلى 10 ميغابايت دون اتصال.',
          'مظهر فاتح أو داكن أو متوافق مع مظهر نظامك.',
          'تسجيل خروج تلقائي بعد مدة من الخمول.',
          'تصدير كل بياناتك واستيرادها، للاحتفاظ بنسخة.',
        ],
      },
      notifications: {
        title: 'التذكيرات',
        body:
          'خمسة أسباب قد تنبّهك، ويُقطع كل واحد على حدة. لا يخرج شيء ما لم تمنح '
          + 'الإذن على الجهاز.',
        points: [
          'تذكير يومي، في الساعة التي تحددها.',
          'خطة قراءة متأخرة، أو غياب طويل.',
          'رد على رسالة دعم، أو عنصر مُنجز في خارطة الطريق.',
          'على iPhone، يجب أن يكون التطبيق مثبّتًا على الشاشة الرئيسية: لا يسلّم '
          + 'iOS شيئًا من تبويب في Safari.',
        ],
      },
      'hors-ligne': {
        title: 'بلا شبكة، يستمر كل شيء',
        body:
          'تُحفظ الترجمات المفعّلة وقراءاتك على الجهاز. في قطار أو في قبو، يبقى '
          + 'التطبيق كاملًا.',
        points: [
          'ما تدخله دون اتصال ينطلق إلى السحابة فور عودة الإشارة.',
          'السحابة هي المرجع: هي التي توفّق بين أجهزتك.',
        ],
      },
      'feuille-de-route': {
        title: 'خارطة الطريق',
        body:
          'ما هو قيد العمل وما سيأتي بعده. وهي علنية، ويمكنك أن تقول ما يهمّك.',
        points: [],
      },
      support: {
        title: 'الدعم',
        body:
          'سؤال، أو خلل، أو فكرة: افتح رسالة وسيصلك الرد هنا.',
        points: [
          'الرسائل ظاهرة لكل المستخدمين، مع اسم كاتبها: لا تضع فيها شيئًا سريًا.',
        ],
      },
      soutenir: {
        title: 'ادعم المشروع',
        body:
          'التطبيق مجاني، بلا إعلانات وبلا بيع للبيانات. تشرح هذه الصفحة كيف '
          + 'تساهم في نفقاته، إن أردت.',
        points: [],
      },
      profil: {
        title: 'ملفك الشخصي',
        body:
          'اسمك وصورتك ومعلوماتك. ومن هنا أيضًا تُغيَّر كلمة السر ويُحذف الحساب.',
        points: [
          'الحذف يمحو كل شيء، نهائيًا، دون نسخة محفوظة.',
        ],
      },
      administration: {
        title: 'الإدارة',
        body:
          'مقصورة على حسابك: قائمة المستخدمين، ورسائل الدعم الواردة، وتعهّد خارطة '
          + 'الطريق.',
        points: [],
      },
      fin: {
        title: 'الدور عليك',
        body:
          'أتممت الجولة. لن تُفتح من تلقاء نفسها بعد الآن — لكنها تنتظرك في '
          + 'الإعدادات، قسم «الجولة التعريفية»، يوم تشاء إعادتها.',
        points: [
          'ابدأ بتسجيل قراءة أولى: من هناك ينطلق كل شيء.',
        ],
      },
    },
  },
  tourUi: {
    close: 'إغلاق الجولة التعريفية',
    stepOf: (n: number, total: number) => `الخطوة ${n} من ${total}`,
    skip: 'تخطّي الجولة',
    previous: 'السابق',
    next: 'التالي',
    finish: 'إنهاء',
  },
  fontSizes: {
    'compact': 'مضغوط',
    'normal': 'عادي',
    'grand': 'كبير',
    'tres-grand': 'كبير جدًا',
    'geant': 'ضخم',
  } as Record<string, string>,

  fontStyles: {
    'normal': 'عادي',
    'italique': 'مائل',
    'gras': 'عريض',
    'gras-italique': 'عريض مائل',
  } as Record<string, string>,

  fonts: {
    systeme: 'النظام',
    inter: 'Inter',
    lora: 'Lora',
    garamond: 'Garamond',
    hyperlegible: 'عالية الوضوح',
  } as Record<string, string>,

  memorisation: {
    title: 'الحفظ',
    subtitle: 'احفظ آية، وأعد إيجادها حين تعود.',
    aRevoir: 'للمراجعة اليوم',
    ajouterHasard: 'آية عشوائية',
    aucun: 'لا آية قيد الحفظ',
    aucunAide: 'اختر واحدة أدناه، أو دع الصدفة تقرّر.',
    choisir: 'من قراءاتك',
    reviser: 'راجع',
    retirer: 'إزالة من الحفظ',
    duAujourdhui: 'مستحقة اليوم',
    terminer: 'انتهيت',
    reveler: 'كشف هذه الكلمة',
    monte: 'درجة إضافية.',
    reste: 'سنعيدها قريبًا، دون خسارة كبيرة.',
    retour: 'العودة إلى القائمة',
    revoirLe: (d: string) => `المراجعة في ${d}`,
    niveau: (n: number, max: number) => `المستوى ${n}/${max}`,
    consigne: (n: number) => n === 0 ? 'المس كلمة مخفية لكشفها.' : `${n} كلمة مكشوفة`,
    prochaine: (d: string) => `المراجعة القادمة في ${d}`,
  },

  versetDuJour: {
    title: 'آية اليوم',
    subtitle: 'آية من قراءاتك، نفسها طوال اليوم.',
    duJour: 'اليوم',
    marquerLu: 'قرأت هذه الآية',
    enregistrement: 'جارٍ الحفظ…',
    dejaLu: 'قُرئت اليوم',
    ajouteAuxLectures: 'ستُضاف إلى قراءاتك، ضمن سياق «الكتاب المقدس».',
    noteLecture: 'آية اليوم',
    pasDeVerset: 'لا توجد آية لعرضها',
    pasDeVersetAide: 'تُؤخذ آية اليوم من قراءاتك. سجّل قراءة ثم عد.',
    statJours: 'الأيام المتابَعة',
    statTotal: 'الآيات المقروءة',
    prochainDemain: (d: string) => `آية جديدة غدًا — اليوم، ${d}`,
  },

  quiz: {
    title: 'اختبار المراجعة',
    subtitle: 'راجع ما قرأته، على وتيرتك.',
    commencer: 'ابدأ جولة',
    preparation: 'جارٍ التحضير…',
    pasAssez: 'لا توجد قراءات كافية بعد',
    pasAssezAide: 'سجّل بعض القراءات ثم عد: الاختبار لا يتناول إلا ما قرأته.',
    suivante: 'السؤال التالي',
    terminer: 'عرض النتيجة',
    rejouer: 'العب مرة أخرى',
    statParties: 'الجولات',
    statReussite: 'الدقة',
    statMeilleur: 'الأفضل',
    statJours: 'أيام اللعب',
    bravoParfait: 'بلا خطأ. مذهل.',
    bravoBien: 'أحسنت اللعب!',
    bravoMoyen: 'أنت في الطريق الصحيح.',
    bravoDebut: 'كل جولة تُحتسب. مرة أخرى؟',
    commencerAide: (n: number) => `${n} أسئلة من قراءاتك`,
    progression: (i: number, n: number) => `السؤال ${i} من ${n}`,
    bonnes: (n: number) => `${n} صحيحة`,
    cetaitDans: (ref: string) => `كانت ${ref}`,
    resultat: (b: number, n: number) => `${b} صحيحة من ${n}`,
    consignes: {
      livre: 'من أي سفر هذه الآية؟',
      chapitre: 'من أي أصحاح؟',
      trou: 'ما الكلمة الناقصة؟',
      reference: 'ما هو مرجعها؟',
    } as Record<string, string>,
  },

  planCatalog: {
    title: 'خطط مقترحة',
    hint:
      'خطط جاهزة للاستعمال. يولّدها التطبيق، ولم تُنقل عن تقويم منشور.',
    start: 'ابدأ',
    duration: 'المدّة',
    dayCount: (n: number) => `${n} يومًا`,
    plans: {
      'at-evangiles-psaumes': { name: 'العهد القديم والأناجيل والمزامير', description: 'كل يوم مقطع من تاريخ إسرائيل، وآخر من الأناجيل، ومزمور.' },
      'nouveau-testament': { name: 'العهد الجديد', description: 'الأسفار السبعة والعشرون، من متى إلى الرؤيا، بالترتيب.' },
      'evangiles-psaumes': { name: 'الأناجيل والمزامير', description: 'مساران متوازيان، لقراءة يومية قصيرة.' },
      'sagesse': { name: 'مثل كل يوم', description: 'أصحاحات الأمثال الواحد والثلاثون، واحد لكل يوم من الشهر.' },
      'priere': { name: 'الصلاة', description: 'خمسة عشر مقطعًا يصلّي فيها الكتاب، من سليمان إلى يسوع.' },
      'esperance': { name: 'الرجاء', description: 'أربعة عشر مقطعًا لأوقات الانتظار.' },
      'pardon': { name: 'المغفرة', description: 'أحد عشر مقطعًا عن الخطأ المعترف به والنعمة المقبولة.' },
      'confiance': { name: 'مزامير الثقة', description: 'ثمانية مزامير تُقرأ حين يقترب الخوف.' },
    } as Record<string, { name: string; description: string }>,
  },

  colorThemes: {
    rubis: 'ياقوتي',
    turquoise: 'فيروزي',
    indigo: 'نيلي',
    rose: 'وردي',
    cafe: 'بنّي',
    perso: 'مخصّصة',
    marine: 'أزرق بحري',
    foret: 'غابة',
    pourpre: 'أرجواني',
    ocre: 'مغرة',
    ardoise: 'أردوازي',
  } as Record<string, string>,

  errors: {
    title: 'خطأ',
    versionDownload: (name: string) =>
      `تعذّر تنزيل «${name}». تحقّق من اتصالك.`,
    versionDelete: (name: string) =>
      `تعذّر حذف «${name}».`,
    importStructure: 'بنية JSON غير صالحة: الخاصية «data» مفقودة.',
  },
}
