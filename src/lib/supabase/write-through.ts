function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine
}

async function getAuthedClient() {
  const { createClient } = await import('./client')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, user }
}

export async function upsertReading(reading: any) {
  if (!isOnline()) return
  const ctx = await getAuthedClient()
  if (!ctx) return
  await ctx.supabase.from('readings').upsert(
    { ...reading, user_id: ctx.user.id },
    { onConflict: 'id', ignoreDuplicates: false }
  )
}

export async function deleteReading(id: number) {
  if (!isOnline()) return
  const ctx = await getAuthedClient()
  if (!ctx) return
  await ctx.supabase.from('readings').delete().eq('id', id)
}

export async function upsertPlan(plan: any) {
  if (!isOnline()) return
  const ctx = await getAuthedClient()
  if (!ctx) return
  await ctx.supabase.from('plans').upsert(
    { ...plan, user_id: ctx.user.id },
    { onConflict: 'id', ignoreDuplicates: false }
  )
}

export async function deletePlan(id: number) {
  if (!isOnline()) return
  const ctx = await getAuthedClient()
  if (!ctx) return
  await ctx.supabase.from('plans').delete().eq('id', id)
}

export async function upsertPlanDay(day: any) {
  if (!isOnline()) return
  const ctx = await getAuthedClient()
  if (!ctx) return
  await ctx.supabase.from('plan_days').upsert(
    { ...day, user_id: ctx.user.id },
    { onConflict: 'id', ignoreDuplicates: false }
  )
}

export async function deletePlanDaysByPlan(planId: number) {
  if (!isOnline()) return
  const ctx = await getAuthedClient()
  if (!ctx) return
  await ctx.supabase.from('plan_days').delete().eq('plan_id', planId)
}

export async function upsertContext(context: any) {
  if (!isOnline()) return
  const ctx = await getAuthedClient()
  if (!ctx) return
  await ctx.supabase.from('contexts').upsert(
    { ...context, user_id: ctx.user.id },
    { onConflict: 'id', ignoreDuplicates: false }
  )
}

export async function deleteContext(id: string) {
  if (!isOnline()) return
  const ctx = await getAuthedClient()
  if (!ctx) return
  await ctx.supabase.from('contexts').delete().eq('id', id)
}
