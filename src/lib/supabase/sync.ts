import { createClient } from './client'
import { getDB } from '../storage/db'
import {
  toSnake, toCamel,
  READING_MAP, PLAN_MAP, PLAN_DAY_MAP, CONTEXT_MAP,
} from './sync-mapping'

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine
}

async function upsertReadings(readings: any[]) {
  const db = await getDB()
  const tx = db.transaction('readings', 'readwrite')
  for (const r of readings) {
    const camel = toCamel(r, READING_MAP)
    await tx.objectStore('readings').put(camel)
  }
  await tx.done
}

async function upsertPlans(plans: any[]) {
  const db = await getDB()
  const tx = db.transaction('plans', 'readwrite')
  for (const p of plans) {
    const camel = toCamel(p, PLAN_MAP)
    await tx.objectStore('plans').put(camel)
  }
  await tx.done
}

async function upsertPlanDays(days: any[]) {
  const db = await getDB()
  const tx = db.transaction('plan_days', 'readwrite')
  for (const d of days) {
    const camel = toCamel(d, PLAN_DAY_MAP)
    await tx.objectStore('plan_days').put(camel)
  }
  await tx.done
}

async function upsertContexts(contexts: any[]) {
  const db = await getDB()
  const tx = db.transaction('contexts', 'readwrite')
  for (const c of contexts) {
    const camel = toCamel(c, CONTEXT_MAP)
    await tx.objectStore('contexts').put(camel)
  }
  await tx.done
}

export async function pushReadings() {
  if (!isOnline()) return { pushed: 0 }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { pushed: 0 }

  const db = await getDB()
  const local = await db.getAll('readings')
  let pushed = 0

  for (const reading of local) {
    const snake = toSnake(reading, READING_MAP)
    snake.id = String(snake.id ?? reading.id ?? '')
    const { error } = await supabase
      .from('readings')
      .upsert({ ...snake, user_id: user.id }, { onConflict: 'id', ignoreDuplicates: false })

    if (error) console.warn('sync push reading error:', error.message)
    else pushed++
  }

  return { pushed }
}

export async function pushPlans() {
  if (!isOnline()) return { pushed: 0 }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { pushed: 0 }

  const db = await getDB()
  const local = await db.getAll('plans')
  let pushed = 0

  for (const plan of local) {
    const snake = toSnake(plan, PLAN_MAP)
    snake.id = String(snake.id ?? plan.id ?? '')
    const { error } = await supabase
      .from('plans')
      .upsert({ ...snake, user_id: user.id }, { onConflict: 'id', ignoreDuplicates: false })

    if (error) console.warn('sync push plan error:', error.message)
    else pushed++
  }

  return { pushed }
}

export async function pushPlanDays() {
  if (!isOnline()) return { pushed: 0 }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { pushed: 0 }

  const db = await getDB()
  const local = await db.getAll('plan_days')
  let pushed = 0

  for (const day of local) {
    const snake = toSnake(day, PLAN_DAY_MAP)
    if (snake.isRead !== undefined) snake.done = snake.isRead
    delete snake.isRead
    const { error } = await supabase
      .from('plan_days')
      .upsert({ ...snake, user_id: user.id }, { onConflict: 'id', ignoreDuplicates: false })

    if (error) console.warn('sync push planDay error:', error.message)
    else pushed++
  }

  return { pushed }
}

export async function pushContexts() {
  if (!isOnline()) return { pushed: 0 }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { pushed: 0 }

  const db = await getDB()
  const local = await db.getAll('contexts')
  let pushed = 0

  for (const context of local) {
    const snake = toSnake(context, CONTEXT_MAP)
    snake.id = String(snake.id ?? context.id ?? '')
    const { error } = await supabase
      .from('contexts')
      .upsert({ ...snake, user_id: user.id }, { onConflict: 'id', ignoreDuplicates: false })

    if (error) console.warn('sync push context error:', error.message)
    else pushed++
  }

  return { pushed }
}

export async function pushAll() {
  const readings = await pushReadings()
  const plans = await pushPlans()
  const planDays = await pushPlanDays()
  const contexts = await pushContexts()
  return {
    readings: readings.pushed,
    plans: plans.pushed,
    planDays: planDays.pushed,
    contexts: contexts.pushed,
  }
}

export async function pullReadings() {
  if (!isOnline()) return { pulled: 0 }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { pulled: 0 }

  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('user_id', user.id)

  if (error || !data) {
    if (error) console.warn('sync pull readings error:', error.message)
    return { pulled: 0 }
  }

  await upsertReadings(data)
  return { pulled: data.length }
}

export async function pullPlans() {
  if (!isOnline()) return { pulled: 0 }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { pulled: 0 }

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', user.id)

  if (error || !data) {
    if (error) console.warn('sync pull plans error:', error.message)
    return { pulled: 0 }
  }

  await upsertPlans(data)
  return { pulled: data.length }
}

export async function pullPlanDays() {
  if (!isOnline()) return { pulled: 0 }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { pulled: 0 }

  const { data, error } = await supabase
    .from('plan_days')
    .select('*')
    .eq('user_id', user.id)

  if (error || !data) {
    if (error) console.warn('sync pull planDays error:', error.message)
    return { pulled: 0 }
  }

  await upsertPlanDays(data)
  return { pulled: data.length }
}

export async function pullContexts() {
  if (!isOnline()) return { pulled: 0 }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { pulled: 0 }

  const { data, error } = await supabase
    .from('contexts')
    .select('*')
    .eq('user_id', user.id)

  if (error || !data) {
    if (error) console.warn('sync pull contexts error:', error.message)
    return { pulled: 0 }
  }

  await upsertContexts(data)
  return { pulled: data.length }
}

export async function pullAll() {
  const readings = await pullReadings()
  const plans = await pullPlans()
  const planDays = await pullPlanDays()
  const contexts = await pullContexts()
  return {
    readings: readings.pulled,
    plans: plans.pulled,
    planDays: planDays.pulled,
    contexts: contexts.pulled,
  }
}

export async function fullSync() {
  const pushed = await pushAll()
  const pulled = await pullAll()
  return { pushed, pulled }
}
