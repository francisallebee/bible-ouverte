import type { AppSettings, BibleVersion, ReadingContext } from './types';
import { getDB } from './db';
import { importAllBibleData } from '@/features/bible/import';

const DEFAULT_CONTEXTS: ReadingContext[] = [
  { id: 'lecture-personnelle', name: 'Lecture personnelle', slug: 'lecture-personnelle', color: '#4a90d9', icon: 'book', isSystemDefault: true },
  { id: 'eglise', name: 'Église', slug: 'eglise', color: '#7b68ee', icon: 'church', isSystemDefault: true },
  { id: 'youtube', name: 'YouTube', slug: 'youtube', color: '#ff0000', icon: 'video', isSystemDefault: true },
  { id: 'logiciel-biblique', name: 'Logiciel biblique', slug: 'logiciel-biblique', color: '#2ecc71', icon: 'monitor', isSystemDefault: true },
  { id: 'autres', name: 'Autres', slug: 'autres', color: '#95a5a6', icon: 'more-horizontal', isSystemDefault: true },
];

const BIBLE_VERSIONS: BibleVersion[] = [
  { id: 'ls1910', name: 'Louis Segond 1910', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'darby', name: 'Bible Darby 1885', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'martin1744', name: 'Bible David Martin 1744', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'ostervald', name: 'Bible Ostervald 1996', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
];

const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  defaultVersionId: 'ls1910',
  theme: 'light',
  displayPreset: 'desktop',
  offlineModeEnabled: true,
  firstLaunchCompleted: false,
  currentUserId: 'default',
};

export async function seedIfNeeded(): Promise<void> {
  const db = await getDB();

  const existingSettings = await db.get('settings', 'app');

  if (existingSettings?.firstLaunchCompleted) {
    await ensureDefaultUser(db);
    await ensureVersionsExist(db);
    await importAllBibleData();
    return;
  }

  const tx = db.transaction(['contexts', 'bible_versions', 'settings', 'users'], 'readwrite');

  for (const ctx of DEFAULT_CONTEXTS) {
    const existing = await tx.objectStore('contexts').get(ctx.id);
    if (!existing) await tx.objectStore('contexts').add(ctx);
  }

  for (const v of BIBLE_VERSIONS) {
    const existing = await tx.objectStore('bible_versions').get(v.id);
    if (!existing) await tx.objectStore('bible_versions').add(v);
  }

  const existingUser = await tx.objectStore('users').get('default');
  if (!existingUser) {
    await tx.objectStore('users').add({
      id: 'default',
      name: 'Utilisateur',
      color: '#4a90d9',
      createdAt: new Date().toISOString(),
    });
  }

  if (!existingSettings) {
    await tx.objectStore('settings').add(DEFAULT_SETTINGS);
  }

  await tx.objectStore('settings').put({
    ...(existingSettings ?? DEFAULT_SETTINGS),
    currentUserId: 'default',
    firstLaunchCompleted: true,
  });

  await tx.done;

  await importAllBibleData();
}

async function ensureDefaultUser(db: Awaited<ReturnType<typeof getDB>>): Promise<void> {
  const existing = await db.get('users', 'default');
  if (!existing) {
    await db.add('users', {
      id: 'default',
      name: 'Utilisateur',
      color: '#4a90d9',
      createdAt: new Date().toISOString(),
    });
  }
  const settings = await db.get('settings', 'app');
  if (settings && !settings.currentUserId) {
    await db.put('settings', { ...settings, currentUserId: 'default' });
  }
}

async function ensureVersionsExist(db: Awaited<ReturnType<typeof getDB>>): Promise<void> {
  for (const v of BIBLE_VERSIONS) {
    const existing = await db.get('bible_versions', v.id);
    if (!existing) {
      await db.add('bible_versions', v);
    }
  }
}
