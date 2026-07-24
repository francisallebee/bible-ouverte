export const READING_MAP: Record<string, string> = {
  id: 'id',
  userId: 'user_id',
  date: 'date',
  book: 'book',
  chapter: 'chapter',
  chapter_start: 'chapter_start',
  chapter_end: 'chapter_end',
  verse_start: 'verse_start',
  verse_end: 'verse_end',
  passage_text: 'passage_text',
  content: 'content',
  notes: 'notes',
  tags: 'tags',
  links: 'links',
  photos: 'photos',
  audio: 'audio',
  translation_id: 'translation_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

export const PLAN_MAP: Record<string, string> = {
  id: 'id',
  userId: 'user_id',
  name: 'name',
  versionId: 'version_id',
  version_id: 'version_id',
  duration: 'duration',
  customDays: 'custom_days',
  custom_days: 'custom_days',
  books: 'books',
  startDate: 'start_date',
  start_date: 'start_date',
  totalDays: 'total_days',
  total_days: 'total_days',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

export const PLAN_DAY_MAP: Record<string, string> = {
  id: 'id',
  planId: 'plan_id',
  plan_id: 'plan_id',
  userId: 'user_id',
  user_id: 'user_id',
  day: 'day',
  date: 'date',
  book: 'book',
  chapter: 'chapter',
  chapter_start: 'chapter_start',
  chapter_end: 'chapter_end',
  verse_start: 'verse_start',
  verse_end: 'verse_end',
  isRead: 'is_read',
  is_read: 'done',
  done: 'done',
  notes: 'notes',
  createdAt: 'created_at',
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
  parent_id: 'parent_id',
  isSystemDefault: 'is_system_default',
  is_system_default: 'is_system_default',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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
