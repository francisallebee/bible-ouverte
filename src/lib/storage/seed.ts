import type { AppSettings, BibleVersion, ReadingContext } from './types';
import { getDB } from './db';
import { importAllBibleData } from '@/features/bible/import';

const DEFAULT_CONTEXTS: ReadingContext[] = [
  { id: 'medias', name: 'Médias', slug: 'medias', color: '#e74c3c', icon: 'folder', isSystemDefault: true },
  { id: 'medias/youtube', name: 'YouTube', slug: 'youtube', color: '#e74c3c', icon: 'tag', emoji: '📺', parentId: 'medias', isSystemDefault: true },
  { id: 'medias/podcast', name: 'Podcast', slug: 'podcast', color: '#e74c3c', icon: 'tag', emoji: '🎙️', parentId: 'medias', isSystemDefault: true },
  { id: 'medias/livre-audio', name: 'Livre audio', slug: 'livre-audio', color: '#e74c3c', icon: 'tag', emoji: '🎧', parentId: 'medias', isSystemDefault: true },
  { id: 'transports', name: 'Transports', slug: 'transports', color: '#3498db', icon: 'folder', isSystemDefault: true },
  { id: 'transports/voiture', name: 'Voiture', slug: 'voiture', color: '#3498db', icon: 'tag', emoji: '🚗', parentId: 'transports', isSystemDefault: true },
  { id: 'transports/avion', name: 'Avion', slug: 'avion', color: '#3498db', icon: 'tag', emoji: '✈️', parentId: 'transports', isSystemDefault: true },
  { id: 'transports/train', name: 'Train', slug: 'train', color: '#3498db', icon: 'tag', emoji: '🚆', parentId: 'transports', isSystemDefault: true },
  { id: 'transports/velo', name: 'Vélo', slug: 'velo', color: '#3498db', icon: 'tag', emoji: '🚲', parentId: 'transports', isSystemDefault: true },
  { id: 'transports/marche', name: 'Marche', slug: 'marche', color: '#3498db', icon: 'tag', emoji: '🚶', parentId: 'transports', isSystemDefault: true },
  { id: 'lecture-personnelle', name: 'Lecture personnelle', slug: 'lecture-personnelle', color: '#2ecc71', icon: 'folder', isSystemDefault: true },
  { id: 'lecture-personnelle/calendrier', name: 'Calendrier', slug: 'calendrier', color: '#2ecc71', icon: 'tag', emoji: '📅', parentId: 'lecture-personnelle', isSystemDefault: true },
  { id: 'lecture-personnelle/plan', name: 'Plan', slug: 'plan', color: '#2ecc71', icon: 'tag', emoji: '📋', parentId: 'lecture-personnelle', isSystemDefault: true },
  { id: 'lecture-personnelle/revue', name: 'Revue', slug: 'revue', color: '#2ecc71', icon: 'tag', emoji: '📖', parentId: 'lecture-personnelle', isSystemDefault: true },
  { id: 'lecture-personnelle/ebook', name: 'Ebook', slug: 'ebook', color: '#2ecc71', icon: 'tag', emoji: '📱', parentId: 'lecture-personnelle', isSystemDefault: true },
  { id: 'eglise', name: 'Église', slug: 'eglise', color: '#7b68ee', icon: 'folder', isSystemDefault: true },
  { id: 'eglise/predication', name: 'Prédication', slug: 'predication', color: '#7b68ee', icon: 'tag', emoji: '🎯', parentId: 'eglise', isSystemDefault: true },
  { id: 'eglise/cours-bibliques', name: 'Cours bibliques', slug: 'cours-bibliques', color: '#7b68ee', icon: 'tag', emoji: '📚', parentId: 'eglise', isSystemDefault: true },
  { id: 'autres', name: 'Autres', slug: 'autres', color: '#95a5a6', icon: 'more-horizontal', emoji: '📌', isSystemDefault: true },
];

const TEXT_VERSIONS: BibleVersion[] = [
  { id: 'ls1910', name: 'Louis Segond 1910', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'darby', name: 'Bible Darby 1885', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'martin1744', name: 'Bible David Martin 1744', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'ostervald', name: 'Bible Ostervald 1996', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'cramp23', name: 'Augustin Crampon 1923', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'sacc', name: 'Lemaître de Sacy 1667', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
];

const REAL_AUDIO_VERSIONS: BibleVersion[] = [
  { id: 'audio-ls1910', name: 'Audio : Louis Segond 1910', language: 'fr', copyrightStatus: 'public-domain', source: 'audio', isEnabled: true },
  { id: 'audio-darby', name: 'Audio : Bible Darby 1885', language: 'fr', copyrightStatus: 'public-domain', source: 'audio', isEnabled: true },
  { id: 'audio-martin1744', name: 'Audio : Bible David Martin 1744', language: 'fr', copyrightStatus: 'public-domain', source: 'audio', isEnabled: true },
  { id: 'audio-ostervald', name: 'Audio : Bible Ostervald 1996', language: 'fr', copyrightStatus: 'public-domain', source: 'audio', isEnabled: true },
  { id: 'audio-cramp23', name: 'Audio : Augustin Crampon 1923', language: 'fr', copyrightStatus: 'public-domain', source: 'audio', isEnabled: true },
  { id: 'audio-sacc', name: 'Audio : Lemaître de Sacy 1667', language: 'fr', copyrightStatus: 'public-domain', source: 'audio', isEnabled: true },
];

const AI_VERSIONS: BibleVersion[] = [
  { id: 'ai-ls1910', name: 'IA : Louis Segond 1910', language: 'fr', copyrightStatus: 'public-domain', source: 'ai', isEnabled: true },
  { id: 'ai-darby', name: 'IA : Bible Darby 1885', language: 'fr', copyrightStatus: 'public-domain', source: 'ai', isEnabled: true },
  { id: 'ai-martin1744', name: 'IA : Bible David Martin 1744', language: 'fr', copyrightStatus: 'public-domain', source: 'ai', isEnabled: true },
  { id: 'ai-ostervald', name: 'IA : Bible Ostervald 1996', language: 'fr', copyrightStatus: 'public-domain', source: 'ai', isEnabled: true },
  { id: 'ai-cramp23', name: 'IA : Augustin Crampon 1923', language: 'fr', copyrightStatus: 'public-domain', source: 'ai', isEnabled: true },
  { id: 'ai-sacc', name: 'IA : Lemaître de Sacy 1667', language: 'fr', copyrightStatus: 'public-domain', source: 'ai', isEnabled: true },
];

const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  defaultVersionId: 'ls1910',
  theme: 'light',
  displayPreset: 'desktop',
  offlineModeEnabled: true,
  firstLaunchCompleted: false,
};

export async function seedIfNeeded(): Promise<void> {
  const db = await getDB();
  const existingSettings = await db.get('settings', 'app');

  if (existingSettings?.firstLaunchCompleted) {
    await ensureVersionsExist(db);
    await importAllBibleData();
    return;
  }

  const tx = db.transaction(['contexts', 'bible_versions', 'settings'], 'readwrite');

  for (const ctx of DEFAULT_CONTEXTS) {
    const existing = await tx.objectStore('contexts').get(ctx.id);
    if (!existing) await tx.objectStore('contexts').add(ctx);
  }

  for (const v of [...TEXT_VERSIONS, ...REAL_AUDIO_VERSIONS, ...AI_VERSIONS]) {
    const existing = await tx.objectStore('bible_versions').get(v.id);
    if (!existing) await tx.objectStore('bible_versions').add(v);
  }

  if (!existingSettings) {
    await tx.objectStore('settings').add({
      ...DEFAULT_SETTINGS,
      firstLaunchCompleted: true,
    });
  } else {
    await tx.objectStore('settings').put({
      ...existingSettings,
      firstLaunchCompleted: true,
    });
  }

  await tx.done;
  await importAllBibleData();
}

async function ensureVersionsExist(db: Awaited<ReturnType<typeof getDB>>): Promise<void> {
  for (const v of [...TEXT_VERSIONS, ...REAL_AUDIO_VERSIONS, ...AI_VERSIONS]) {
    const existing = await db.get('bible_versions', v.id);
    if (!existing) await db.add('bible_versions', v);
  }
}
