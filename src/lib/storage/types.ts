export type DisplayPreset = "smartphone" | "tablet" | "desktop";
export type PlanDuration = "1-year" | "6-months" | "3-months" | "1-month" | "custom";

/**
 * `scheduled` : les jours sont produits à partir d'une durée et d'une date de
 * début. `free` : une liste de passages sans date, cochés un à un à la date de
 * son choix. Absent sur les plans créés avant la migration `free_plans`, qui
 * sont tous datés — d'où le repli sur `scheduled` partout où on le lit.
 */
export type PlanKind = "scheduled" | "free";

export interface ReadingLink {
  url: string;
  title: string;
  thumbnail?: string;
}

export interface ReadingEntry {
  id?: number;
  date: string;
  book: string;
  chapterStart: number;
  chapterEnd: number;
  verseStart: number;
  verseEnd: number;
  passageText: string;
  translationId: string;
  tags: string[];
  /** Identifiant du ReadingContext. Chaîne vide = aucun contexte renseigné. */
  contextId: string;
  notes: string;
  userId: string;
  links?: ReadingLink[];
  photos?: string[];
  audio?: string;
  createdAt: string;
  updatedAt: string;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

export interface ReadingContext {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  emoji?: string;
  parentId?: string;
  isSystemDefault: boolean;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

export interface BibleVersion {
  id: string;
  name: string;
  language: string;
  copyrightStatus: string;
  source: string;
  isEnabled: boolean;
}

export interface BiblePassage {
  id?: number;
  versionId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface ReadingPlan {
  id?: number;
  userId: string;
  name: string;
  versionId: string;
  kind?: PlanKind;
  duration: PlanDuration;
  customDays?: number;
  books?: string[];
  startDate: string;
  totalDays: number;
  createdAt: string;
  updatedAt: string;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

export interface PlanDay {
  id?: number;
  planId: number;
  userId: string;
  day: number;
  /**
   * Plan daté : le jour prévu. Plan libre : chaîne vide tant que l'entrée n'est
   * pas cochée, puis la date de lecture choisie.
   */
  date: string;
  book: string;
  chapterStart: number;
  chapterEnd: number;
  /** 1 sur les plans datés, qui raisonnent au chapitre. */
  verseStart: number;
  verseEnd: number;
  isRead: boolean;
  readingId?: number;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

export interface ReadingGoal {
  type: "chapters-per-day" | "verses-per-day";
  target: number;
}

export interface RoadmapItem {
  id?: number;
  title: string;
  description: string;
  status: 'planned' | 'projet' | 'in-progress' | 'done' | 'cancelled';
  reactions?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

export interface SupportTicket {
  id?: number;
  userId: string;
  userName: string;
  type: 'bug' | 'suggestion';
  message: string;
  status?: string;
  createdAt: string;
  replies: SupportReply[];
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

export interface SupportReply {
  id: string;
  userId: string;
  userName: string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  defaultVersionId: string;
  theme: string;
  colorTheme: string;
  displayPreset: DisplayPreset;
  offlineModeEnabled: boolean;
  firstLaunchCompleted: boolean;

  readingGoal?: ReadingGoal;
  audioSpeed?: number;
  /**
   * Minutes d'inactivité avant déconnexion. 0 ou absent : jamais — c'est la
   * valeur des comptes qui n'ont rien réglé, dont le comportement ne doit pas
   * changer du jour au lendemain.
   */
  autoLogoutMinutes?: number;
  /**
   * Choix de l'utilisateur pour son compte. Ne dit rien de l'appareil : la
   * permission du navigateur peut avoir été révoquée depuis, et c'est elle qui
   * tranche (voir `notificationStatus` dans `lib/notifications.ts`).
   */
  notificationsEnabled?: boolean;
  /**
   * Un interrupteur par déclencheur, par identifiant. Une clé absente prend sa
   * valeur par défaut : voir `resolveTriggers` dans `lib/notifications.ts`, sans
   * quoi un déclencheur ajouté plus tard serait lu comme refusé.
   */
  notificationTriggers?: Record<string, boolean>;
  /** Heure du rappel quotidien, au format `HH:MM`. */
  dailyReminderTime?: string;
  /**
   * Fuseau de l'appareil, en identifiant IANA. Sans lui, « à 7 h » n'a pas de
   * sens côté serveur : les dates de l'application sont des `YYYY-MM-DD` nus.
   */
  timeZone?: string;
  /** true si une modification locale n'a pas encore été poussée vers le cloud */
  _dirty?: boolean;
}
