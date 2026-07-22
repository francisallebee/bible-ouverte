import { createClient } from './client'
import { getDB } from '../storage/db'

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine
}

async function upsertReadings(readings: any[]) {
  const db = await getDB()
  const tx = db.transaction('readings', 'readwrite')
  for (const r of readings) {
    await tx.objectStore('readings').put(r)
  }
  await tx.done
}

async function upsertPlans(plans: any[]) {
  const db = await getDB()
  const tx = db.transaction('plans', 'readwrite')
  for (const p of plans) {
    await tx.objectStore('plans').put(p)
  }
  await tx.done
}

async function upsertPlanDays(days: any[]) {
  const db = await getDB()
  const tx = db.transaction('plan_days', 'readwrite')
  for (const d of days) {
    await tx.objectStore('plan_days').put(d)
  }
  await tx.done
}

async function upsertContexts(contexts: any[]) {
  const db = await getDB()
  const tx = db.transaction('contexts', 'readwrite')
  for (const c of contexts) {
    await tx.objectStore('contexts').put(c)
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
    const { error } = await supabase
      .from('readings')
      .upsert({ ...reading, user_id: user.id }, { onConflict: 'id', ignoreDuplicates: false })

    if (!error) pushed++
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
    const { error } = await supabase
      .from('plans')
      .upsert({ ...plan, user_id: user.id }, { onConflict: 'id', ignoreDuplicates: false })

    if (!error) pushed++
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
    const { error } = await supabase
      .from('plan_days')
      .upsert({ ...day, user_id: user.id }, { onConflict: 'id', ignoreDuplicates: false })

    if (!error) pushed++
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
    const { error } = await supabase
      .from('contexts')
      .upsert({ ...context, user_id: user.id }, { onConflict: 'id', ignoreDuplicates: false })

    if (!error) pushed++
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

  if (error || !data) return { pulled: 0 }

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

  if (error || !data) return { pulled: 0 }

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

  if (error || !data) return { pulled: 0 }

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

  if (error || !data) return { pulled: 0 }

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
