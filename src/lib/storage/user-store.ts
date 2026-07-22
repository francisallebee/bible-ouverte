import type { UserProfile } from './types';
import { getDB } from './db';

export async function getCurrentUserId(): Promise<string> {
  const db = await getDB();
  const settings = await db.get('settings', 'app');
  return settings?.currentUserId ?? "default";
}

export async function getCurrentUser(): Promise<UserProfile | undefined> {
  const db = await getDB();
  const id = await getCurrentUserId();
  return db.get('users', id);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const db = await getDB();
  return db.getAll('users');
}

export async function getUser(id: string): Promise<UserProfile | undefined> {
  const db = await getDB();
  return db.get('users', id);
}

export async function addUser(user: UserProfile): Promise<void> {
  const db = await getDB();
  await db.add('users', user);
}

export async function updateUser(user: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put('users', user);
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('users', id);
}

export async function switchUser(userId: string): Promise<void> {
  const db = await getDB();
  const settings = await db.get('settings', 'app');
  if (settings) {
    await db.put('settings', { ...settings, currentUserId: userId });
  }
}
