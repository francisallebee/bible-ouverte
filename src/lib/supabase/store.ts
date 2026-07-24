import { createClient } from './client'

let authedUserId: string | null = null
let authPromise: Promise<string | null> | null = null

async function getUserId(): Promise<string | null> {
  if (authedUserId) return authedUserId
  if (authPromise) return authPromise
  authPromise = (async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    authedUserId = data.user?.id ?? null
    return authedUserId
  })()
  return authPromise
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

export function clearUserCache() {
  authedUserId = null
  authPromise = null
}

// -- Generic helpers -- //

async function select<T>(table: string, userId: string): Promise<T[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })
  if (error) {
    console.warn(`supabase select ${table}:`, error.message)
    return []
  }
  return (data as T[]) ?? []
}

async function insert<T>(table: string, record: T): Promise<T | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(table)
    .insert(record as any)
    .select()
    .single()
  if (error) {
    console.warn(`supabase insert ${table}:`, error.message)
    return null
  }
  return data as T
}

async function update<T>(table: string, id: number | string, record: Partial<T>): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from(table)
    .update(record as any)
    .eq('id', id)
  if (error) {
    console.warn(`supabase update ${table}:`, error.message)
    return false
  }
  return true
}

async function remove(table: string, id: number | string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
  if (error) {
    console.warn(`supabase delete ${table}:`, error.message)
    return false
  }
  return true
}

async function upsert<T extends { id?: number | string }>(table: string, record: T): Promise<T | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(table)
    .upsert(record as any, { onConflict: 'id' })
    .select()
    .single()
  if (error) {
    console.warn(`supabase upsert ${table}:`, error.message)
    return null
  }
  return data as T
}

export async function tryAuthenticated<T>(
  fn: (userId: string) => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!isOnline()) return fallback
  const userId = await getUserId()
  if (!userId) return fallback
  try {
    return await fn(userId)
  } catch (e) {
    console.warn('supabase operation failed:', e)
    return fallback
  }
}

// -- Reading store -- //

export interface ReadingRow {
  id: number
  user_id: string
  date: string
  book: string
  chapterStart: number
  chapterEnd: number
  verseStart: number
  verseEnd: number
  passageText: string
  translationId: string
  tags: string
  notes: string
  links: any
  photos: any
  audio: any
  createdAt: string
  updatedAt: string
}

export async function fetchReadings(): Promise<ReadingRow[]> {
  return tryAuthenticated(
    (uid) => select<ReadingRow>('readings', uid),
    [],
  )
}

export async function insertReading(reading: Omit<ReadingRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReadingRow | null> {
  return tryAuthenticated(
    (uid) => insert<ReadingRow>('readings', { ...reading, user_id: uid } as any),
    null,
  )
}

export async function updateReading(id: number, data: Partial<ReadingRow>): Promise<boolean> {
  return tryAuthenticated(
    () => update<ReadingRow>('readings', id, data),
    false,
  )
}

export async function deleteReading(id: number): Promise<boolean> {
  return tryAuthenticated(
    () => remove('readings', id),
    false,
  )
}

// -- Plan store -- //

export interface PlanRow {
  id: number
  user_id: string
  name: string
  versionId: string
  duration: string
  customDays: number | null
  books: any
  startDate: string
  totalDays: number
  createdAt: string
  updatedAt: string
}

export async function fetchPlans(): Promise<PlanRow[]> {
  return tryAuthenticated(
    (uid) => select<PlanRow>('plans', uid),
    [],
  )
}

export async function insertPlan(plan: Omit<PlanRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlanRow | null> {
  return tryAuthenticated(
    (uid) => insert<PlanRow>('plans', { ...plan, user_id: uid } as any),
    null,
  )
}

export async function updatePlan(id: number, data: Partial<PlanRow>): Promise<boolean> {
  return tryAuthenticated(
    () => update<PlanRow>('plans', id, data),
    false,
  )
}

export async function deletePlan(id: number): Promise<boolean> {
  return tryAuthenticated(
    () => remove('plans', id),
    false,
  )
}

// -- Plan day store -- //

export interface PlanDayRow {
  id: number
  plan_id: number
  user_id: string
  day: number
  date: string
  book: string
  chapterStart: number
  chapterEnd: number
  isRead: boolean
  readingId: number | null
}

export async function fetchPlanDays(planId: number): Promise<PlanDayRow[]> {
  const supabase = createClient()
  return tryAuthenticated(async (uid) => {
    const { data, error } = await supabase
      .from('plan_days')
      .select('*')
      .eq('plan_id', planId)
      .eq('user_id', uid)
      .order('day', { ascending: true })
    if (error) {
      console.warn('supabase fetchPlanDays:', error.message)
      return []
    }
    return (data as PlanDayRow[]) ?? []
  }, [])
}

export async function insertPlanDays(days: Omit<PlanDayRow, 'id'>[]): Promise<boolean> {
  return tryAuthenticated(async (uid) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('plan_days')
      .insert(days.map(d => ({ ...d, user_id: uid })) as any)
    if (error) {
      console.warn('supabase insertPlanDays:', error.message)
      return false
    }
    return true
  }, false)
}

export async function updatePlanDay(id: number, data: Partial<PlanDayRow>): Promise<boolean> {
  return tryAuthenticated(
    () => update<PlanDayRow>('plan_days', id, data),
    false,
  )
}

export async function deletePlanDaysByPlan(planId: number): Promise<boolean> {
  return tryAuthenticated(async (uid) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('plan_days')
      .delete()
      .eq('plan_id', planId)
      .eq('user_id', uid)
    if (error) {
      console.warn('supabase deletePlanDaysByPlan:', error.message)
      return false
    }
    return true
  }, false)
}

// -- Context store -- //

export interface ContextRow {
  id: string
  user_id: string
  name: string
  slug: string
  color: string
  icon: string
  emoji: string
  parentId: string
  isSystemDefault: boolean
}

export async function fetchContexts(): Promise<ContextRow[]> {
  return tryAuthenticated(
    (uid) => select<ContextRow>('contexts', uid),
    [],
  )
}

export async function upsertContext(context: Omit<ContextRow, 'user_id'>): Promise<boolean> {
  return tryAuthenticated(async (uid) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('contexts')
      .upsert({ ...context, user_id: uid } as any, { onConflict: 'id' })
    if (error) {
      console.warn('supabase upsertContext:', error.message)
      return false
    }
    return true
  }, false)
}

export async function deleteContext(id: string): Promise<boolean> {
  return tryAuthenticated(
    () => remove('contexts', id),
    false,
  )
}

// -- Settings store -- //

export interface SettingsRow {
  user_id: string
  theme: string
  fontSize: string
  fontFamily: string
  verseDisplay: string
  dailyGoal: number
  goalType: string
  reminder: boolean
  reminderTime: string
  updatedAt: string
}

export async function fetchSettings(): Promise<SettingsRow | null> {
  return tryAuthenticated(async (uid) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', uid)
      .single()
    if (error) {
      console.warn('supabase fetchSettings:', error.message)
      return null
    }
    return data as SettingsRow
  }, null)
}

export async function upsertSettings(settings: Omit<SettingsRow, 'user_id' | 'updatedAt'>): Promise<boolean> {
  return tryAuthenticated(async (uid) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('settings')
      .upsert({ ...settings, user_id: uid, updatedAt: new Date().toISOString() } as any, { onConflict: 'user_id' })
    if (error) {
      console.warn('supabase upsertSettings:', error.message)
      return false
    }
    return true
  }, false)
}
