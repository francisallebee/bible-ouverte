import type { AppSettings, BibleVersion, ReadingContext } from './types';
import { getDB } from './db';
import { importAllBibleData } from '@/features/bible/import';
import { deleteContext as deleteContextRemote } from '@/lib/supabase/store';

/**
 * Contextes de lecture proposés par défaut.
 *
 * Liste à plat : le menu déroulant du formulaire les trie par nom à
 * l'affichage, ce qui range aussi les contextes ajoutés par l'utilisateur.
 * L'ordre de ce tableau n'a donc aucune importance.
 *
 * Remplace l'arborescence à deux niveaux d'origine (Médias → YouTube,
 * Transports → Voiture…), qui n'a jamais été reliée à l'interface : le
 * formulaire enregistrait `tags: []` et aucune lecture n'y faisait référence.
 */
const DEFAULT_CONTEXTS: ReadingContext[] = [
  { id: 'meditation', name: 'Méditation', slug: 'meditation', color: '#2ecc71', icon: 'tag', emoji: '🧘', isSystemDefault: true },
  { id: 'eglise', name: 'Église', slug: 'eglise', color: '#7b68ee', icon: 'tag', emoji: '⛪', isSystemDefault: true },
  { id: 'predication', name: 'Prédication', slug: 'predication', color: '#9b59b6', icon: 'tag', emoji: '🎤', isSystemDefault: true },
  { id: 'livre', name: 'Livre', slug: 'livre', color: '#e67e22', icon: 'tag', emoji: '📕', isSystemDefault: true },
  { id: 'livre-audio', name: 'Livre audio', slug: 'livre-audio', color: '#d35400', icon: 'tag', emoji: '🎧', isSystemDefault: true },
  { id: 'revue', name: 'Revue', slug: 'revue', color: '#16a085', icon: 'tag', emoji: '📰', isSystemDefault: true },
  { id: 'podcast', name: 'Podcast', slug: 'podcast', color: '#c0392b', icon: 'tag', emoji: '🎙️', isSystemDefault: true },
  { id: 'radio', name: 'Radio', slug: 'radio', color: '#f39c12', icon: 'tag', emoji: '📻', isSystemDefault: true },
  { id: 'youtube', name: 'YouTube', slug: 'youtube', color: '#e74c3c', icon: 'tag', emoji: '📺', isSystemDefault: true },
  { id: 'autre', name: 'Autre', slug: 'autre', color: '#95a5a6', icon: 'tag', emoji: '📌', isSystemDefault: true },
];

const DEFAULT_CONTEXT_IDS = new Set(DEFAULT_CONTEXTS.map(c => c.id));

const TEXT_VERSIONS: BibleVersion[] = [
  { id: 'ls1910', name: 'Louis Segond 1910', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'darby', name: 'Bible Darby 1885', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'martin1744', name: 'Bible David Martin 1744', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'ostervald', name: 'Bible Ostervald 1996', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'cramp23', name: 'Augustin Crampon 1923', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'sacc', name: 'Lemaître de Sacy 1667', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
];

const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  defaultVersionId: 'ls1910',
  theme: 'light',
  colorTheme: 'marine',
  displayPreset: 'desktop',
  offlineModeEnabled: true,
  firstLaunchCompleted: false,
};

export async function seedIfNeeded(): Promise<void> {
  const db = await getDB();
  const existingSettings = await db.get('settings', 'app');

  if (existingSettings?.firstLaunchCompleted) {
    await ensureVersionsExist(db);
    await ensureContextsExist(db);
    await importAllBibleData();
    return;
  }

  const tx = db.transaction(['contexts', 'bible_versions', 'settings'], 'readwrite');

  for (const ctx of DEFAULT_CONTEXTS) {
    const existing = await tx.objectStore('contexts').get(ctx.id);
    if (!existing) await tx.objectStore('contexts').add(ctx);
  }

  for (const v of TEXT_VERSIONS) {
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

/**
 * Aligne les contextes d'une installation existante sur la liste par défaut.
 *
 * Les appareils déjà utilisés portent l'ancienne arborescence, que
 * `seedIfNeeded` ne rejouerait jamais puisqu'elle ne s'exécute qu'au premier
 * lancement. Les anciens contextes système sont donc retirés et les nouveaux
 * ajoutés.
 *
 * Les contextes créés par l'utilisateur (`isSystemDefault` faux) ne sont jamais
 * touchés, et un contexte système déjà utilisé par une lecture est conservé —
 * mieux vaut une entrée en trop dans le menu qu'une statistique qui perd sa
 * catégorie.
 */
async function ensureContextsExist(db: Awaited<ReturnType<typeof getDB>>): Promise<void> {
  const existing = await db.getAll('contexts');
  const byId = new Map(existing.map(c => [c.id, c]));

  for (const ctx of DEFAULT_CONTEXTS) {
    if (!byId.has(ctx.id)) await db.add('contexts', ctx);
  }

  const obsolete = existing.filter(c => c.isSystemDefault && !DEFAULT_CONTEXT_IDS.has(c.id));
  if (obsolete.length === 0) return;

  const readings = await db.getAll('readings');
  const used = new Set(readings.map(r => r.contextId).filter(Boolean));

  for (const ctx of obsolete) {
    if (used.has(ctx.id)) continue;
    await db.delete('contexts', ctx.id);
    // Le distant n'est purgé que si la ligne y avait été poussée ; sinon la
    // prochaine synchronisation la ferait réapparaître.
    if (ctx.synced && typeof navigator !== 'undefined' && navigator.onLine) {
      deleteContextRemote(ctx.id).catch(() => {});
    }
  }
}

async function ensureVersionsExist(db: Awaited<ReturnType<typeof getDB>>): Promise<void> {
  for (const v of TEXT_VERSIONS) {
    const existing = await db.get('bible_versions', v.id);
    if (!existing) await db.add('bible_versions', v);
  }
  const textIds = new Set(TEXT_VERSIONS.map(v => v.id));
  const allVersions = await db.getAll('bible_versions');
  for (const v of allVersions) {
    if (!textIds.has(v.id)) {
      await db.delete('bible_versions', v.id);
    }
  }
}
