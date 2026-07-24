export const READING_MAP: Record<string, string> = {
  id: 'id',
  userId: 'user_id',
  date: 'date',
  book: 'book',
  chapterStart: 'chapter',
  verseStart: 'verse_start',
  verseEnd: 'verse_end',
  passageText: 'content',
  translationId: 'translation_id',
  tags: 'tags',
  notes: 'notes',
  links: 'links',
  photos: 'photos',
  audio: 'audio',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

export const PLAN_MAP: Record<string, string> = {
  id: 'id',
  userId: 'user_id',
  name: 'name',
  versionId: 'bible_version',
  duration: 'duration',
  customDays: 'custom_days',
  books: 'books',
  startDate: 'start_date',
  totalDays: 'total_days',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

export const PLAN_DAY_MAP: Record<string, string> = {
  id: 'id',
  planId: 'plan_id',
  userId: 'user_id',
  day: 'day',
  date: 'date',
  book: 'book',
  chapterStart: 'chapter',
  chapterEnd: 'chapter_end',
  isRead: 'done',
  readingId: 'reading_id',
}

export const CONTEXT_MAP: Record<string, string> = {
  id: 'id',
  userId: 'user_id',
  name: 'name',
  slug: 'slug',
  color: 'color',
  icon: 'icon',
  emoji: 'emoji',
  parentId: 'parent_id',
  isSystemDefault: 'is_system_default',
}

function invert(map: Record<string, string>): Record<string, string> {
  const inv: Record<string, string> = {}
  for (const [k, v] of Object.entries(map)) {
    inv[v] = k
  }
  return inv
}

export function toSnake(record: any, map: Record<string, string>): any {
  const result: any = {}
  for (const [key, value] of Object.entries(record)) {
    const mapped = map[key] ?? key
    result[mapped] = value
  }
  return result
}

export function toCamel(record: any, map: Record<string, string>): any {
  const rev = invert(map)
  const result: any = {}
  for (const [key, value] of Object.entries(record)) {
    const mapped = rev[key] ?? key
    result[mapped] = value
  }
  return result
}
