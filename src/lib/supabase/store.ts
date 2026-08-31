import type { PlanPassage } from '@/lib/storage/plan-passages'
import { createClient } from './client'

let authedUserId: string | null = null
let authPromise: Promise<string | null> | null = null

/**
 * Identité du compte connecté, mémorisée pour toute la session.
 *
 * Exportée pour que `lib/storage/user-id.ts` s'appuie dessus : il appelait
 * `auth.getUser()` de son côté, sans cache, depuis vingt-neuf endroits — un
 * aller-retour réseau d'environ 200 ms à chaque lecture de données.
 * `clearUserCache()` gouverne désormais les deux chemins.
 */
export async function getUserId(): Promise<string | null> {
  if (authedUserId) return authedUserId
  if (authPromise) return authPromise
  authPromise = (async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    authedUserId = data.user?.id ?? null
    // Ne pas mettre en cache un résultat null : réessayer au prochain appel
    // (sinon un appel avant l'hydratation de la session bloque tout en "non connecté")
    authPromise = null
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
// select retourne null en cas d'erreur (à distinguer d'une liste vide,
// pour ne jamais purger le cache local sur un échec réseau/auth)

async function select<T>(table: string, userId: string): Promise<T[] | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })
  if (error) {
    console.warn(`supabase select ${table}:`, error.message)
    return null
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
  contextId: string
  sessionTitle: string | null
  notes: string
  links: string
  photos: string
  audio: string
  createdAt: string
  updatedAt: string
}

export async function fetchReadings(): Promise<ReadingRow[] | null> {
  return tryAuthenticated(
    (uid) => select<ReadingRow>('readings', uid),
    null,
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
  kind: string
  duration: string
  customDays: number | null
  books: any
  startDate: string
  totalDays: number
  createdAt: string
  updatedAt: string
}

export async function fetchPlans(): Promise<PlanRow[] | null> {
  return tryAuthenticated(
    (uid) => select<PlanRow>('plans', uid),
    null,
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
  verseStart: number
  verseEnd: number
  isRead: boolean
  readingId: number | null
  /**
   * Passages du jour, quand il y en a plusieurs. Nulle sur les lignes écrites
   * avant la migration `20260819120000` — voir `dayPassages`, qui reconstitue
   * alors le passage unique depuis les colonnes.
   */
  passages: PlanPassage[] | null
}

export async function fetchPlanDays(planId: number): Promise<PlanDayRow[] | null> {
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
      return null
    }
    return (data as PlanDayRow[]) ?? []
  }, null)
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

/**
 * Retire une entrée de plan. Utile aux plans libres, dont la liste se corrige à
 * l'unité — les plans datés, eux, sont toujours régénérés en bloc.
 */
export async function deletePlanDay(id: number): Promise<boolean> {
  return tryAuthenticated(
    () => remove('plan_days', id),
    false,
  )
}

// -- Push subscriptions -- //

export interface PushSubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
  userAgent: string | null
}

/**
 * Enregistre l'abonnement de cet appareil.
 *
 * `upsert` sur l'`endpoint` plutôt qu'un `insert` : le navigateur rend le même
 * endpoint tant que l'abonnement n'a pas été révoqué, et une réinstallation
 * ferait sinon échouer l'insertion sur la contrainte d'unicité.
 */
export async function savePushSubscription(sub: PushSubscriptionRow): Promise<boolean> {
  return tryAuthenticated(async (uid) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { ...sub, user_id: uid, lastSeenAt: new Date().toISOString() } as any,
        { onConflict: 'endpoint' },
      )
    if (error) {
      console.warn('supabase savePushSubscription:', error.message)
      return false
    }
    return true
  }, false)
}

/** Retire l'abonnement de cet appareil, sans toucher aux autres. */
export async function deletePushSubscription(endpoint: string): Promise<boolean> {
  return tryAuthenticated(async (uid) => {
    const supabase = createClient()
    // `.select()` pour distinguer une suppression d'un refus silencieux : sous
    // RLS, un delete qui ne correspond à rien réussit sans erreur.
    const { data, error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', uid)
      .select()
    if (error) {
      console.warn('supabase deletePushSubscription:', error.message)
      return false
    }
    return (data?.length ?? 0) > 0
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

export async function fetchContexts(): Promise<ContextRow[] | null> {
  return tryAuthenticated(
    (uid) => select<ContextRow>('contexts', uid),
    null,
  )
}

export async function upsertContext(context: Omit<ContextRow, 'user_id'>): Promise<boolean> {
  return tryAuthenticated(async (uid) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('contexts')
      .upsert({ ...context, user_id: uid } as any, { onConflict: 'id,user_id' })
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

// -- Settings store (payload JSON complet dans la colonne jsonb `data`) -- //

export interface SettingsRow {
  user_id: string
  data: any
  updatedAt: string
}

export async function fetchSettings(): Promise<SettingsRow | null> {
  return tryAuthenticated(async (uid) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()
    if (error) {
      console.warn('supabase fetchSettings:', error.message)
      return null
    }
    return data as SettingsRow | null
  }, null)
}

export async function upsertSettings(payload: any): Promise<boolean> {
  return tryAuthenticated(async (uid) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('settings')
      .upsert({ user_id: uid, data: payload, updatedAt: new Date().toISOString() } as any, { onConflict: 'user_id' })
    if (error) {
      console.warn('supabase upsertSettings:', error.message)
      return false
    }
    return true
  }, false)
}

// -- Roadmap store (contenu global : lecture pour tous, gestion par les admins) -- //

export interface RoadmapRow {
  id: number
  title: string
  description: string
  status: string
  reactions: Record<string, string>
  createdAt: string
  updatedAt: string
}

export async function fetchRoadmapItems(): Promise<RoadmapRow[] | null> {
  return tryAuthenticated(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .order('id', { ascending: true })
    if (error) {
      console.warn('supabase fetchRoadmapItems:', error.message)
      return null
    }
    return (data as RoadmapRow[]) ?? []
  }, null)
}

export async function insertRoadmapItem(item: Omit<RoadmapRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoadmapRow | null> {
  return tryAuthenticated(
    () => insert<RoadmapRow>('roadmap_items', item as RoadmapRow),
    null,
  )
}

export async function updateRoadmapItemRemote(id: number, data: Partial<RoadmapRow>): Promise<boolean> {
  return tryAuthenticated(
    () => update<RoadmapRow>('roadmap_items', id, data),
    false,
  )
}

export async function deleteRoadmapItemRemote(id: number): Promise<boolean> {
  return tryAuthenticated(
    () => remove('roadmap_items', id),
    false,
  )
}

// -- Tickets support (visibles par tous les utilisateurs connectés) -- //

export interface TicketRow {
  id: number
  user_id: string
  userName: string
  type: string
  message: string
  status: string
  replies: any[]
  createdAt: string
  updatedAt: string
}

export async function fetchTickets(): Promise<TicketRow[] | null> {
  return tryAuthenticated(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('id', { ascending: true })
    if (error) {
      console.warn('supabase fetchTickets:', error.message)
      return null
    }
    return (data as TicketRow[]) ?? []
  }, null)
}

export async function insertTicket(ticket: Omit<TicketRow, 'id' | 'user_id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<TicketRow | null> {
  return tryAuthenticated(
    (uid) => insert<TicketRow>('tickets', { ...ticket, user_id: uid } as TicketRow),
    null,
  )
}

export async function updateTicketRemote(id: number, data: Partial<TicketRow>): Promise<boolean> {
  return tryAuthenticated(
    () => update<TicketRow>('tickets', id, data),
    false,
  )
}

/**
 * La policy « admins can delete tickets » est la seule barrière.
 *
 * `remove()` ne convient pas ici : sous RLS, un delete qui ne correspond à
 * aucune ligne visible réussit sans erreur, et renverrait donc vrai pour un
 * compte ordinaire. Le `.select()` fait remonter les lignes réellement
 * effacées, seul moyen de distinguer une suppression d'un refus silencieux —
 * sans quoi le ticket disparaîtrait du cache local pour réapparaître à la
 * synchronisation suivante.
 */
export async function deleteTicketRemote(id: number): Promise<boolean> {
  return tryAuthenticated(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)
      .select('id')
    if (error) {
      console.warn('supabase deleteTicket:', error.message)
      return false
    }
    return (data?.length ?? 0) > 0
  }, false)
}

// ---------------------------------------------------------------------------
// Parties jouées
// ---------------------------------------------------------------------------

export interface GameSessionRow {
  id: number
  user_id: string
  kind: string
  score: number
  total: number
  book: string | null
  chapter: number | null
  verse: number | null
  details: Record<string, unknown> | null
  createdAt: string
}

export async function insertGameSession(
  partie: { kind: string; score: number; total: number; book?: string; chapter?: number; verse?: number; details?: Record<string, unknown>; createdAt: string },
): Promise<GameSessionRow | null> {
  return tryAuthenticated(async () => {
    const supabase = createClient()
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        kind: partie.kind,
        score: partie.score,
        total: partie.total,
        book: partie.book ?? null,
        chapter: partie.chapter ?? null,
        verse: partie.verse ?? null,
        details: partie.details ?? null,
        createdAt: partie.createdAt,
      })
      .select()
      .single()
    if (error) return null
    return data as GameSessionRow
  }, null)
}

/** Rend `null` quand le distant n'a pas répondu, pour que le cache local serve. */
export async function fetchGameSessions(kind?: string): Promise<GameSessionRow[] | null> {
  return tryAuthenticated(async () => {
    const supabase = createClient()
    let requete = supabase.from('game_sessions').select('*').order('createdAt', { ascending: false })
    if (kind) requete = requete.eq('kind', kind)
    const { data, error } = await requete
    if (error) return null
    return (data as GameSessionRow[]) ?? []
  }, null)
}

// ---------------------------------------------------------------------------
// Versets en cours d'apprentissage
// ---------------------------------------------------------------------------

export interface MemorisedRow {
  id: number
  user_id: string
  book: string
  chapter: number
  verse: number
  versionId: string
  niveau: number
  prochain: string
  createdAt: string
  updatedAt: string
}

export async function fetchMemorised(): Promise<MemorisedRow[] | null> {
  return tryAuthenticated(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('memorised_verses').select('*').order('prochain', { ascending: true })
    if (error) return null
    return (data as MemorisedRow[]) ?? []
  }, null)
}

export async function insertMemorised(
  v: { book: string; chapter: number; verse: number; versionId: string; niveau: number; prochain: string; createdAt: string; updatedAt: string },
): Promise<MemorisedRow | null> {
  return tryAuthenticated(async () => {
    const supabase = createClient()
    const userId = await getUserId()
    if (!userId) return null
    // Les colonnes sont nommées une à une, jamais étalées : l'objet local porte
    // aussi `userId` et `synced`, qui ne sont pas des colonnes. Les étaler
    // faisait rejeter l'insertion par PostgREST — en silence, puisque l'écriture
    // locale réussissait et que l'écran n'en montrait rien.
    const { data, error } = await supabase
      .from('memorised_verses')
      .insert({
        user_id: userId,
        book: v.book,
        chapter: v.chapter,
        verse: v.verse,
        versionId: v.versionId,
        niveau: v.niveau,
        prochain: v.prochain,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })
      .select()
      .single()
    if (error) return null
    return data as MemorisedRow
  }, null)
}

export async function updateMemorisedRemote(
  id: number, data: Partial<MemorisedRow>,
): Promise<boolean> {
  return tryAuthenticated(() => update<MemorisedRow>('memorised_verses', id, data), false)
}

export async function deleteMemorisedRemote(id: number): Promise<boolean> {
  return tryAuthenticated(() => remove('memorised_verses', id), false)
}
