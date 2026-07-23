import type { AppSettings, BibleVersion, ReadingContext } from './types';
import { getDB } from './db';
import { importAllBibleData } from '@/features/bible/import';

export interface FlatTag { id: string; name: string; emoji: string; color: string }

export const FLAT_TAGS: FlatTag[] = [
  { id: 'medias/youtube', name: 'YouTube', emoji: '📺', color: '#e74c3c' },
  { id: 'medias/podcast', name: 'Podcast', emoji: '🎙️', color: '#e74c3c' },
  { id: 'medias/livre-audio', name: 'Livre audio', emoji: '🎧', color: '#e74c3c' },
  { id: 'transports/voiture', name: 'Voiture', emoji: '🚗', color: '#3498db' },
  { id: 'transports/avion', name: 'Avion', emoji: '✈️', color: '#3498db' },
  { id: 'transports/train', name: 'Train', emoji: '🚆', color: '#3498db' },
  { id: 'transports/velo', name: 'Vélo', emoji: '🚲', color: '#3498db' },
  { id: 'transports/marche', name: 'Marche', emoji: '🚶', color: '#3498db' },
  { id: 'lecture-personnelle/calendrier', name: 'Calendrier', emoji: '📅', color: '#2ecc71' },
  { id: 'lecture-personnelle/plan', name: 'Plan', emoji: '📋', color: '#2ecc71' },
  { id: 'lecture-personnelle/revue', name: 'Revue', emoji: '📖', color: '#2ecc71' },
  { id: 'lecture-personnelle/ebook', name: 'Ebook', emoji: '📱', color: '#2ecc71' },
  { id: 'eglise/predication', name: 'Prédication', emoji: '🎯', color: '#7b68ee' },
  { id: 'eglise/cours-bibliques', name: 'Cours bibliques', emoji: '📚', color: '#7b68ee' },
  { id: 'autres', name: 'Autres', emoji: '📌', color: '#95a5a6' },
];

export const TAG_CATEGORIES = [
  {
    id: 'medias', name: 'Médias', color: '#e74c3c',
    children: [
      { id: 'medias/youtube', name: 'YouTube' },
      { id: 'medias/podcast', name: 'Podcast' },
      { id: 'medias/livre-audio', name: 'Livre audio' },
    ],
  },
  {
    id: 'transports', name: 'Transports', color: '#3498db',
    children: [
      { id: 'transports/voiture', name: 'Voiture' },
      { id: 'transports/avion', name: 'Avion' },
      { id: 'transports/train', name: 'Train' },
      { id: 'transports/velo', name: 'Vélo' },
      { id: 'transports/marche', name: 'Marche' },
    ],
  },
  {
    id: 'lecture-personnelle', name: 'Lecture personnelle', color: '#2ecc71',
    children: [
      { id: 'lecture-personnelle/calendrier', name: 'Calendrier' },
      { id: 'lecture-personnelle/plan', name: 'Plan' },
      { id: 'lecture-personnelle/revue', name: 'Revue' },
      { id: 'lecture-personnelle/ebook', name: 'Ebook' },
    ],
  },
  {
    id: 'eglise', name: 'Église', color: '#7b68ee',
    children: [
      { id: 'eglise/predication', name: 'Prédication' },
      { id: 'eglise/cours-bibliques', name: 'Cours bibliques' },
    ],
  },
  { id: 'autres', name: 'Autres', color: '#95a5a6', children: [] },
];

const DEFAULT_CONTEXTS: ReadingContext[] = TAG_CATEGORIES.flatMap(cat =>
  cat.children.length > 0
    ? [{ id: cat.id, name: cat.name, slug: cat.id, color: cat.color, icon: 'folder', isSystemDefault: true },
       ...cat.children.map(ch => ({ id: ch.id, name: ch.name, slug: ch.id, color: cat.color, icon: 'tag', isSystemDefault: true }))]
    : [{ id: cat.id, name: cat.name, slug: cat.id, color: cat.color, icon: 'more-horizontal', isSystemDefault: true }]
);

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
