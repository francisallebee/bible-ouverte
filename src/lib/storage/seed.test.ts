import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { seedIfNeeded } from './seed';

/**
 * Deux garde-fous sur l'amorçage, tous deux issus d'un même symptôme : un écran
 * qui restait sur « Chargement… » indéfiniment, de façon intermittente.
 */

const importAllBibleData = vi.fn(async () => ({}));
const repairNahumAbbreviation = vi.fn(async () => {});

vi.mock('@/features/bible/import', () => ({
  importAllBibleData: () => importAllBibleData(),
}));
vi.mock('./passage-store', () => ({
  repairNahumAbbreviation: () => repairNahumAbbreviation(),
}));
vi.mock('@/lib/supabase/store', () => ({
  deleteContext: vi.fn(async () => true),
}));

/** Cache en mémoire imitant IndexedDB, y compris son refus des clés en double. */
const stores: Record<string, Map<string, { id: string }>> = {};

const db = {
  get: async (store: string, key: string) => stores[store]?.get(key),
  getAll: async (store: string) => Array.from(stores[store]?.values() ?? []),
  put: async (store: string, value: { id: string }) => {
    (stores[store] ??= new Map()).set(value.id, value);
  },
  add: async (store: string, value: { id: string }) => {
    const s = (stores[store] ??= new Map());
    if (s.has(value.id)) {
      const err = new Error('Key already exists in the object store.');
      err.name = 'ConstraintError';
      throw err;
    }
    s.set(value.id, value);
  },
  delete: async (store: string, key: string) => { stores[store]?.delete(key); },
};

vi.mock('./db', () => ({ getDB: async () => db }));

beforeEach(() => {
  for (const key of Object.keys(stores)) delete stores[key];
  // Installation déjà amorcée : c'est le chemin emprunté à chaque chargement.
  stores.settings = new Map([['app', { id: 'app', firstLaunchCompleted: true } as never]]);
  stores.contexts = new Map();
  stores.bible_versions = new Map();
  stores.readings = new Map();
  importAllBibleData.mockClear();
  importAllBibleData.mockImplementation(async () => ({}));
  repairNahumAbbreviation.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('seedIfNeeded', () => {
  it("n'exécute qu'un seul amorçage pour des appels simultanés", async () => {
    // La barre latérale et l'écran affiché appellent tous deux la fonction au
    // montage. Sans verrou, chacun lisait le même état, y constatait la même
    // absence et écrivait : ConstraintError sur la seconde écriture.
    await Promise.all([seedIfNeeded(), seedIfNeeded(), seedIfNeeded()]);

    expect(importAllBibleData).toHaveBeenCalledTimes(1);
  });

  it('rend la main aux appelants suivants une fois terminé', async () => {
    await seedIfNeeded();
    await seedIfNeeded();

    expect(importAllBibleData).toHaveBeenCalledTimes(2);
  });

  it("n'échoue pas quand l'import des traductions échoue", async () => {
    // Aucun écran n'a besoin du texte biblique pour s'afficher. Un échec ici
    // laissait la page sur « Chargement… » : setLoaded(true) n'était jamais
    // atteint.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    importAllBibleData.mockRejectedValue(new Error('réseau indisponible'));

    await expect(seedIfNeeded()).resolves.toBeUndefined();
  });

  it('reste utilisable après un échec', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    importAllBibleData.mockRejectedValueOnce(new Error('réseau indisponible'));

    await seedIfNeeded();
    await expect(seedIfNeeded()).resolves.toBeUndefined();
    expect(importAllBibleData).toHaveBeenCalledTimes(2);
  });

  it('sème les contextes et les versions par défaut', async () => {
    await seedIfNeeded();

    expect(stores.contexts.get('meditation')).toMatchObject({ emoji: '🕊️' });
    expect(stores.bible_versions.size).toBe(7);
  });
});
