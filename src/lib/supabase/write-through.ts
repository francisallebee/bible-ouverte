import { toSnake, READING_MAP, PLAN_MAP, PLAN_DAY_MAP, CONTEXT_MAP } from './sync-mapping'

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine
}

async function getAuthedUserId(): Promise<string | null> {
  const { createClient } = await import('./client')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

async function safeUpsert(table: string, record: any, userId: string) {
  const { createClient } = await import('./client')
  const supabase = createClient()
  const { error } = await supabase
    .from(table)
    .upsert({ ...record, user_id: userId }, { onConflict: 'id', ignoreDuplicates: false })
  if (error) console.error(`sync error upsert ${table}:`, error.message, record)
}

async function safeDelete(table: string, column: string, value: number | string) {
  const { createClient } = await import('./client')
  const supabase = createClient()
  const { error } = await supabase.from(table).delete().eq(column, value)
  if (error) console.error(`sync error delete ${table}:`, error.message)
}

export async function upsertReading(reading: any) {
  if (!isOnline()) return
  const userId = await getAuthedUserId()
  if (!userId) return
  const snake = toSnake(reading, READING_MAP)
  snake.id = String(snake.id ?? reading.id ?? '')
  await safeUpsert('readings', snake, userId)
}

export async function deleteReading(id: number) {
  if (!isOnline()) return
  const userId = await getAuthedUserId()
  if (!userId) return
  await safeDelete('readings', 'id', String(id))
}

export async function upsertPlan(plan: any) {
  if (!isOnline()) return
  const userId = await getAuthedUserId()
  if (!userId) return
  const snake = toSnake(plan, PLAN_MAP)
  snake.id = String(snake.id ?? plan.id ?? '')
  await safeUpsert('plans', snake, userId)
}

export async function deletePlan(id: number) {
  if (!isOnline()) return
  const userId = await getAuthedUserId()
  if (!userId) return
  await safeDelete('plans', 'id', String(id))
}

export async function upsertPlanDay(day: any) {
  if (!isOnline()) return
  const userId = await getAuthedUserId()
  if (!userId) return
  const snake = toSnake(day, PLAN_DAY_MAP)
  if (!snake.id) delete snake.id
  await safeUpsert('plan_days', snake, userId)
}

export async function deletePlanDaysByPlan(planId: number) {
  if (!isOnline()) return
  const userId = await getAuthedUserId()
  if (!userId) return
  await safeDelete('plan_days', 'plan_id', String(planId))
}

export async function upsertContext(context: any) {
  if (!isOnline()) return
  const userId = await getAuthedUserId()
  if (!userId) return
  const snake = toSnake(context, CONTEXT_MAP)
  snake.id = String(snake.id ?? context.id ?? '')
  await safeUpsert('contexts', snake, userId)
}

export async function deleteContext(id: string) {
  if (!isOnline()) return
  const userId = await getAuthedUserId()
  if (!userId) return
  await safeDelete('contexts', 'id', id)
}
