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
import type { PlanRow, PlanDayRow } from '@/lib/supabase/store';

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

function safeParseArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

function rowToPlan(r: PlanRow): ReadingPlan {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    versionId: r.versionId,
    duration: r.duration as ReadingPlan['duration'],
    customDays: r.customDays ?? undefined,
    books: safeParseArray(r.books),
    startDate: r.startDate,
    totalDays: r.totalDays,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    synced: true,
  };
}

function planToRow(p: ReadingPlan, userId: string): Omit<PlanRow, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    user_id: userId,
    name: p.name,
    versionId: p.versionId,
    duration: p.duration,
    customDays: p.customDays ?? null,
    books: JSON.stringify(p.books ?? []),
    startDate: p.startDate,
    totalDays: p.totalDays,
  } as Omit<PlanRow, 'id' | 'createdAt' | 'updatedAt'>;
}

function rowToDay(r: PlanDayRow): PlanDay {
  return {
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
    synced: true,
  };
}

function dayToRow(d: PlanDay, userId: string): Omit<PlanDayRow, 'id'> {
  return {
    plan_id: d.planId,
    user_id: userId,
    day: d.day,
    date: d.date,
    book: d.book,
    chapterStart: d.chapterStart,
    chapterEnd: d.chapterEnd,
    isRead: d.isRead,
    readingId: d.readingId ?? null,
  };
}

async function getLocalDays(planId: number): Promise<PlanDay[]> {
  const db = await getDB();
  const index = db.transaction('plan_days').store.index('by-plan-day');
  const days: PlanDay[] = [];
  let cursor = await index.openCursor(IDBKeyRange.bound([planId, -1], [planId, Infinity]));
  while (cursor) {
    days.push(cursor.value);
    cursor = await cursor.continue();
  }
  return days;
}

async function deleteLocalDays(planId: number): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('plan_days', 'readwrite');
  const index = tx.objectStore('plan_days').index('by-plan-day');
  let cursor = await index.openCursor(IDBKeyRange.bound([planId, -1], [planId, Infinity]));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

/** Pousse un lot de jours vers Supabase puis réaligne le cache local sur les ids serveur. */
async function pushDaysAndRealign(planId: number, days: PlanDay[], userId: string): Promise<void> {
  if (days.length === 0) return;
  const ok = await supabaseInsertPlanDays(days.map(d => dayToRow({ ...d, planId }, userId)));
  if (!ok) return;
  const rows = await fetchPlanDays(planId);
  if (rows === null) return;
  const db = await getDB();
  for (const d of days) {
    if (d.id !== undefined) await db.delete('plan_days', d.id);
  }
  for (const r of rows) {
    await db.put('plan_days', rowToDay(r));
  }
}

/** Pousse les plans locaux jamais synchronisés (et leurs jours). */
async function pushLocalPlans(userId: string): Promise<void> {
  const db = await getDB();
  const all = await db.getAll('plans');
  const unsynced = all.filter(p => p.userId === userId && !p.synced);
  for (const p of unsynced) {
    const created = await supabaseInsertPlan(planToRow(p, userId) as any);
    if (!created || p.id === undefined) continue;
    const oldId = p.id;
    await db.delete('plans', oldId);
    await db.put('plans', rowToPlan(created));
    // Remappe les jours locaux vers le nouvel id de plan puis pousse-les
    const days = await getLocalDays(oldId);
    const remapped: PlanDay[] = [];
    for (const d of days) {
      const nd = { ...d, planId: created.id };
      await db.put('plan_days', nd);
      remapped.push(nd);
    }
    await pushDaysAndRealign(created.id, remapped.filter(d => !d.synced), userId);
  }
}

/** Récupère les plans distants, purge les plans supprimés ailleurs. */
async function pullPlans(userId: string): Promise<void> {
  const rows = await fetchPlans();
  if (rows === null) return;
  const db = await getDB();
  const remoteIds = new Set(rows.map(r => r.id));
  const all = await db.getAll('plans');
  for (const p of all) {
    if (p.userId === userId && p.synced && p.id !== undefined && !remoteIds.has(p.id)) {
      await db.delete('plans', p.id);
      await deleteLocalDays(p.id);
    }
  }
  for (const r of rows) {
    await db.put('plans', rowToPlan(r));
  }
}

async function syncPlans(userId: string): Promise<void> {
  await pushLocalPlans(userId);
  await pullPlans(userId);
}

export async function getAllPlans(): Promise<ReadingPlan[]> {
  const userId = await getCurrentUserId();
  if (isOnline() && userId !== 'local') {
    try { await syncPlans(userId); } catch { /* cache local en secours */ }
  }
  const db = await getDB();
  const all = await db.getAll('plans');
  return all
    .filter(p => p.userId === userId)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function getPlan(id: number): Promise<ReadingPlan | undefined> {
  const db = await getDB();
  return db.get('plans', id);
}

export async function addPlan(plan: Omit<ReadingPlan, 'id'>): Promise<number> {
  const db = await getDB();
  const localId = await db.add('plans', plan as ReadingPlan);

  if (isOnline() && plan.userId && plan.userId !== 'local') {
    const created = await supabaseInsertPlan(planToRow(plan as ReadingPlan, plan.userId) as any);
    if (created) {
      await db.delete('plans', localId);
      await db.put('plans', rowToPlan(created));
      return created.id;
    }
  }
  return localId;
}

export async function updatePlan(plan: ReadingPlan): Promise<void> {
  const db = await getDB();
  await db.put('plans', plan);
  if (isOnline() && plan.id && plan.synced) {
    supabaseUpdatePlan(plan.id, {
      name: plan.name,
      versionId: plan.versionId,
      duration: plan.duration,
      customDays: plan.customDays ?? null,
      books: JSON.stringify(plan.books ?? []),
      startDate: plan.startDate,
      totalDays: plan.totalDays,
      updatedAt: new Date().toISOString(),
    } as any).catch(() => {});
  }
}

export async function deletePlan(id: number): Promise<void> {
  const db = await getDB();
  const existing = await db.get('plans', id);
  await db.delete('plans', id);
  await deleteLocalDays(id);

  if (isOnline() && existing?.synced) {
    supabaseDeletePlan(id).catch(() => {});
    supabaseDeletePlanDays(id).catch(() => {});
  }
}

/** Récupère les jours distants d'un plan, purge ceux supprimés ailleurs. */
async function pullPlanDays(planId: number): Promise<void> {
  const rows = await fetchPlanDays(planId);
  if (rows === null) return;
  const db = await getDB();
  const remoteIds = new Set(rows.map(r => r.id));
  const local = await getLocalDays(planId);
  for (const d of local) {
    if (d.synced && d.id !== undefined && !remoteIds.has(d.id)) {
      await db.delete('plan_days', d.id);
    }
  }
  for (const r of rows) {
    await db.put('plan_days', rowToDay(r));
  }
}

export async function getPlanDays(planId: number): Promise<PlanDay[]> {
  const userId = await getCurrentUserId();
  if (isOnline() && userId !== 'local') {
    try {
      const db = await getDB();
      const plan = await db.get('plans', planId);
      if (plan?.synced) {
        const local = await getLocalDays(planId);
        await pushDaysAndRealign(planId, local.filter(d => !d.synced), userId);
        await pullPlanDays(planId);
      }
    } catch { /* cache local en secours */ }
  }
  const days = await getLocalDays(planId);
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
  if (days.length === 0) return;
  const db = await getDB();
  const localIds: number[] = [];
  const tx = db.transaction('plan_days', 'readwrite');
  for (const day of days) {
    const id = await tx.store.add(day as PlanDay);
    localIds.push(id as number);
  }
  await tx.done;

  const planId = days[0].planId;
  const userId = days[0].userId;
  if (isOnline() && userId && userId !== 'local') {
    const plan = await db.get('plans', planId);
    if (plan?.synced) {
      const localDays = localIds.map((id, i) => ({ ...days[i], id } as PlanDay));
      await pushDaysAndRealign(planId, localDays, userId);
    }
  }
}

export async function updatePlanDay(day: PlanDay): Promise<void> {
  const db = await getDB();
  await db.put('plan_days', day);
  if (isOnline() && day.id && day.synced) {
    supabaseUpdatePlanDay(day.id, {
      isRead: day.isRead,
      readingId: day.readingId ?? null,
    }).catch(() => {});
  }
}

export async function deletePlanDaysByPlan(planId: number): Promise<void> {
  await deleteLocalDays(planId);
  if (isOnline()) {
    supabaseDeletePlanDays(planId).catch(() => {});
  }
}
