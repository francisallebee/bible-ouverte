export type DisplayPreset = "smartphone" | "tablet" | "desktop";
export type PlanDuration = "1-year" | "6-months" | "3-months" | "1-month" | "custom";

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
  emoji?: string;
  parentId?: string;
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

export interface RoadmapItem {
  id?: number;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'done' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface AudioSession {
  id?: number;
  versionId: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  position: number;
  duration: number;
  completed: boolean;
  date: string;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  defaultVersionId: string;
  theme: string;
  displayPreset: DisplayPreset;
  offlineModeEnabled: boolean;
  firstLaunchCompleted: boolean;

  readingGoal?: ReadingGoal;
  unsplashAccessKey?: string;
  audioSpeed?: number;
}
