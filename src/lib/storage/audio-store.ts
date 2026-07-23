import type { AudioSession } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-id';

export async function getAudioSessions(): Promise<AudioSession[]> {
  const db = await getDB();
  const all = await db.getAll('audio_sessions');
  const userId = await getCurrentUserId();
  return all.filter(s => (s as any).userId === userId).reverse();
}

export async function addAudioSession(session: Omit<AudioSession, 'id'>): Promise<number> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  return db.add('audio_sessions', { ...session, userId } as any);
}

export async function updateAudioSession(id: number, data: Partial<AudioSession>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('audio_sessions', id);
  if (existing) await db.put('audio_sessions', { ...existing, ...data });
}

export async function deleteAudioSession(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('audio_sessions', id);
}
