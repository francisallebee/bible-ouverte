import type { AppSettings, BibleVersion, ReadingContext } from './types';
import { getDB } from './db';
import { importEnabledBibleData } from '@/features/bible/import';
import { deleteContext as deleteContextRemote } from '@/lib/supabase/store';
import { repairNahumAbbreviation } from './passage-store';

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
/**
 * Contexte attribué aux lectures cochées depuis un plan.
 *
 * Un seul pour tous les plans : le nom du plan figure déjà dans les notes de
 * chaque lecture, un contexte par plan ferait gonfler le menu et laisserait
 * des orphelins à la suppression d'un plan.
 */
export const PLAN_CONTEXT_ID = 'plan-lecture';

const DEFAULT_CONTEXTS: ReadingContext[] = [
  { id: PLAN_CONTEXT_ID, name: 'Plan de lecture', slug: 'plan-lecture', color: '#3498db', icon: 'tag', emoji: '📅', isSystemDefault: true },
  { id: 'meditation', name: 'Méditation', slug: 'meditation', color: '#2ecc71', icon: 'tag', emoji: '🕊️', isSystemDefault: true },
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

/**
 * Seule la version par défaut est active à l'installation.
 *
 * Les sept étaient importées d'emblée : 47 Mo à télécharger et 42 Mo en cache
 * avant même la première lecture. Les six autres s'importent maintenant quand
 * l'utilisateur les coche dans les réglages.
 *
 * Les installations existantes ne sont pas touchées : `ensureVersionsExist`
 * n'ajoute que les versions absentes et ne réécrit jamais une ligne présente.
 * Un appareil déjà utilisé conserve donc ses sept versions actives.
 */
const TEXT_VERSIONS: BibleVersion[] = [
  { id: 'ls1910', name: 'Louis Segond 1910', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: true },
  { id: 'darby', name: 'Bible Darby 1885', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: false },
  { id: 'martin1744', name: 'Bible David Martin 1744', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: false },
  { id: 'ostervald', name: 'Bible Ostervald 1996', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: false },
  { id: 'cramp23', name: 'Augustin Crampon 1923', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: false },
  { id: 'sacc', name: 'Lemaître de Sacy 1667', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: false },
  { id: 'perret', name: 'Perret-Gentil et Rilliet 1861', language: 'fr', copyrightStatus: 'public-domain', source: 'bundled', isEnabled: false },
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

/**
 * Amorçage en cours, partagé par tous les appelants simultanés.
 *
 * `seedIfNeeded` est appelé à la fois par la barre latérale et par le
 * `useEffect` de chaque écran : les deux s'exécutent donc systématiquement en
 * parallèle au montage. Sans ce verrou, ils lisaient le même état, y
 * constataient tous les deux la même absence et écrivaient tous les deux —
 * `ConstraintError`, puis `AbortError` sur la transaction. La promesse rejetée
 * remontait dans le `await seedIfNeeded()` de la page, dont le `setLoaded(true)`
 * n'était jamais atteint : l'écran restait sur « Chargement… » indéfiniment.
 */
let seeding: Promise<void> | null = null;

export function seedIfNeeded(): Promise<void> {
  seeding ??= runSeed().finally(() => { seeding = null; });
  return seeding;
}

async function runSeed(): Promise<void> {
  const db = await getDB();
  const existingSettings = await db.get('settings', 'app');

  if (existingSettings?.firstLaunchCompleted) {
    await ensureVersionsExist(db);
    await ensureContextsExist(db);
    await repairNahumAbbreviation();
    await importTexts();
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
  await importTexts();
}

/**
 * Télécharge les traductions manquantes, sans jamais faire échouer l'amorçage.
 *
 * C'est 40 Mo à récupérer et environ 220 000 versets à écrire : l'opération la
 * plus fragile du démarrage, en particulier sur une connexion mobile. Aucun
 * écran n'a besoin du texte biblique pour s'afficher — l'Historique, les
 * Statistiques ou la Progression ne lisent que les lectures enregistrées. Un
 * échec ici ne doit donc pas les priver de contenu ; la tentative sera reprise
 * au chargement suivant.
 */
async function importTexts(): Promise<void> {
  try {
    await importEnabledBibleData();
  } catch (err) {
    console.warn('Import des traductions incomplet, reprise au prochain chargement :', err);
  }
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

  // `put` et non `add` : la lecture ci-dessus et cette écriture sont deux
  // transactions distinctes. Un autre onglet peut avoir inséré le contexte
  // entre les deux, et un `add` échouerait alors sur une clé déjà prise.
  for (const ctx of DEFAULT_CONTEXTS) {
    if (!byId.has(ctx.id)) await db.put('contexts', ctx);
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
  // `put` et non `add`, pour la même raison que dans `ensureContextsExist`.
  for (const v of TEXT_VERSIONS) {
    const existing = await db.get('bible_versions', v.id);
    if (!existing) await db.put('bible_versions', v);
  }
  const textIds = new Set(TEXT_VERSIONS.map(v => v.id));
  const allVersions = await db.getAll('bible_versions');
  for (const v of allVersions) {
    if (!textIds.has(v.id)) {
      await db.delete('bible_versions', v.id);
    }
  }
}
