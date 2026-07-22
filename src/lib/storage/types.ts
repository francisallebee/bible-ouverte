export type DisplayPreset = "smartphone" | "tablet" | "desktop";
export type PlanDuration = "1-year" | "6-months" | "3-months" | "1-month" | "custom";

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

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
  contextId: string;
  notes: string;
  userId: string;
  links?: ReadingLink[];
  photos?: string[];
  audio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingContext {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  isSystemDefault: boolean;
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
  duration: PlanDuration;
  customDays?: number;
  books?: string[];
  startDate: string;
  totalDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDay {
  id?: number;
  planId: number;
  userId: string;
  day: number;
  date: string;
  book: string;
  chapterStart: number;
  chapterEnd: number;
  isRead: boolean;
  readingId?: number;
}

export interface ReadingGoal {
  type: "chapters-per-day" | "verses-per-day";
  target: number;
}

export interface AppSettings {
  id: string;
  defaultVersionId: string;
  theme: string;
  displayPreset: DisplayPreset;
  offlineModeEnabled: boolean;
  firstLaunchCompleted: boolean;
  currentUserId: string;
  readingGoal?: ReadingGoal;
  unsplashAccessKey?: string;
}
