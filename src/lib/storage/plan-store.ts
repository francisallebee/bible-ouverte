import { getDB } from './db';
import type { ReadingPlan, PlanDay } from './types';
import { getCurrentUserId } from './user-id';
import {
  fetchPlans,
  insertPlan as supabaseInsertPlan,
  updatePlan as supabaseUpdatePlan,
  deletePlan as supabaseDeletePlan,
  fetchPlanDays,
  insertPlanDays as supabaseInsertPlanDays,
  updatePlanDay as supabaseUpdatePlanDay,
  deletePlanDaysByPlan as supabaseDeletePlanDays,
} from '@/lib/supabase/store';

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

async function cachePlans(userId: string): Promise<void> {
  const rows = await fetchPlans();
  const db = await getDB();
  const tx = db.transaction('plans', 'readwrite');
  for (const r of rows) {
    await tx.objectStore('plans').put({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      versionId: r.versionId,
      duration: r.duration,
      customDays: r.customDays ?? undefined,
      books: safeParseArray(r.books),
      startDate: r.startDate,
      totalDays: r.totalDays,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    } as ReadingPlan);
  }
  await tx.done;
}

function safeParseArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

export async function getAllPlans(): Promise<ReadingPlan[]> {
  const userId = await getCurrentUserId();
  const db = await getDB();
  const all = await db.getAll('plans');
  const local = all.filter(p => p.userId === userId);
  if (local.length === 0 && isOnline()) {
    await cachePlans(userId);
    const all2 = await db.getAll('plans');
    return all2.filter(p => p.userId === userId).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }
  if (isOnline()) {
    cachePlans(userId).catch(() => {});
  }
  return local.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function getPlan(id: number): Promise<ReadingPlan | undefined> {
  const db = await getDB();
  return db.get('plans', id);
}

export async function addPlan(plan: Omit<ReadingPlan, 'id'>): Promise<number> {
  const db = await getDB();
  const localId = await db.add('plans', plan as ReadingPlan);

  if (isOnline()) {
    const created = await supabaseInsertPlan({
      user_id: plan.userId,
      name: plan.name,
      versionId: plan.versionId,
      duration: plan.duration,
      customDays: plan.customDays ?? null,
      books: JSON.stringify(plan.books ?? []),
      startDate: plan.startDate,
      totalDays: plan.totalDays,
    } as any);
    if (created) {
      const updated = { ...plan, id: created.id } as ReadingPlan;
      await db.put('plans', updated);
      return created.id;
    }
  }
  return localId;
}

export async function updatePlan(plan: ReadingPlan): Promise<void> {
  const db = await getDB();
  await db.put('plans', plan);
  if (isOnline() && plan.id) {
    supabaseUpdatePlan(plan.id, {
      name: plan.name,
      versionId: plan.versionId,
      duration: plan.duration,
      customDays: plan.customDays ?? null,
      books: JSON.stringify(plan.books ?? []),
      startDate: plan.startDate,
      totalDays: plan.totalDays,
      updatedAt: new Date().toISOString(),
    }).catch(() => {});
  }
}

export async function deletePlan(id: number): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['plans', 'plan_days'], 'readwrite');
  await tx.objectStore('plans').delete(id);
  const dayIndex = tx.objectStore('plan_days').index('by-plan-day');
  let cursor = await dayIndex.openCursor(IDBKeyRange.bound([id, -1], [id, Infinity]));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;

  if (isOnline()) {
    supabaseDeletePlan(id).catch(() => {});
    supabaseDeletePlanDays(id).catch(() => {});
  }
}

async function cachePlanDays(planId: number): Promise<void> {
  const rows = await fetchPlanDays(planId);
  const db = await getDB();
  const tx = db.transaction('plan_days', 'readwrite');
  for (const r of rows) {
    await tx.objectStore('plan_days').put({
      id: r.id,
      planId: r.plan_id,
      userId: r.user_id,
      day: r.day,
      date: r.date,
      book: r.book,
      chapterStart: r.chapterStart,
      chapterEnd: r.chapterEnd,
      isRead: r.isRead,
      readingId: r.readingId ?? undefined,
    } as PlanDay);
  }
  await tx.done;
}

export async function getPlanDays(planId: number): Promise<PlanDay[]> {
  const db = await getDB();
  const index = db.transaction('plan_days').store.index('by-plan-day');
  const days: PlanDay[] = [];
  let cursor = await index.openCursor(IDBKeyRange.bound([planId, -1], [planId, Infinity]));
  while (cursor) {
    days.push(cursor.value);
    cursor = await cursor.continue();
  }
  if (isOnline()) {
    cachePlanDays(planId).catch(() => {});
  }
  return days.sort((a, b) => a.day - b.day);
}

export async function getPlanDayByDate(planId: number, date: string): Promise<PlanDay | undefined> {
  const db = await getDB();
  const index = db.transaction('plan_days').store.index('by-plan-date');
  const range = IDBKeyRange.only([planId, date]);
  const results = await index.getAll(range);
  return results[0];
}

export async function addPlanDays(days: Omit<PlanDay, 'id'>[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('plan_days', 'readwrite');
  for (const day of days) {
    await tx.store.add(day as PlanDay);
  }
  await tx.done;

  if (isOnline()) {
    supabaseInsertPlanDays(days.map(d => ({
      plan_id: d.planId,
      user_id: d.userId,
      day: d.day,
      date: d.date,
      book: d.book,
      chapterStart: d.chapterStart,
      chapterEnd: d.chapterEnd,
      isRead: d.isRead,
      readingId: d.readingId ?? null,
    }))).catch(() => {});
  }
}

export async function updatePlanDay(day: PlanDay): Promise<void> {
  const db = await getDB();
  await db.put('plan_days', day);
  if (isOnline() && day.id) {
    supabaseUpdatePlanDay(day.id, {
      isRead: day.isRead,
      readingId: day.readingId ?? null,
    }).catch(() => {});
  }
}

export async function deletePlanDaysByPlan(planId: number): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('plan_days', 'readwrite');
  const index = tx.objectStore('plan_days').index('by-plan-day');
  let cursor = await index.openCursor(IDBKeyRange.bound([planId, -1], [planId, Infinity]));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
  if (isOnline()) {
    supabaseDeletePlanDays(planId).catch(() => {});
  }
}
