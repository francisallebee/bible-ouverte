import { getDB } from './db';
import type { ReadingPlan, PlanDay } from './types';
import { getCurrentUserId } from './user-store';

export async function getAllPlans(): Promise<ReadingPlan[]> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const all = await db.getAll('plans');
  return all.filter((p) => p.userId === userId);
}

export async function getPlan(id: number): Promise<ReadingPlan | undefined> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const plan = await db.get('plans', id);
  if (plan && plan.userId !== userId) return undefined;
  return plan;
}

export async function addPlan(plan: Omit<ReadingPlan, 'id'>): Promise<number> {
  const db = await getDB();
  return db.add('plans', plan as ReadingPlan) as Promise<number>;
}

export async function updatePlan(plan: ReadingPlan): Promise<void> {
  const db = await getDB();
  await db.put('plans', plan);
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
}

export async function updatePlanDay(day: PlanDay): Promise<void> {
  const db = await getDB();
  await db.put('plan_days', day);
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
}
