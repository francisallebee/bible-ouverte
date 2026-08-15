import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * La synchronisation des réglages, éprouvée en laboratoire.
 *
 * Motif : le 15 août 2026, une langue remise en français est repartie en
 * anglais quelques minutes plus tard, sur un compte comptant trois appareils.
 * Le symptôme ne se reproduit pas sur commande — il demande deux caches
 * locaux divergents — et la mesure au navigateur suppose une session que
 * l'agent n'a pas. La règle est donc éprouvée ici, comme l'a été celle de la
 * déconnexion automatique pour une raison voisine.
 *
 * Le scénario qui compte tient en trois lignes : un appareil dont la poussée a
 * échoué garde sa valeur marquée `_dirty` ; un second appareil en écrit une
 * autre, qui atteint le serveur ; le premier revient et pousse la sienne.
 */

const fetchSettings = vi.fn();
const upsertSettings = vi.fn(async (_payload: unknown) => true);

vi.mock('@/lib/supabase/store', () => ({
  fetchSettings: () => fetchSettings(),
  upsertSettings: (payload: unknown) => upsertSettings(payload),
}));

/** Cache en mémoire imitant IndexedDB — partagé par tous les onglets d'un appareil. */
const stores: Record<string, Map<string, { id: string }>> = {};

const db = {
  get: async (store: string, key: string) => stores[store]?.get(key),
  put: async (store: string, value: { id: string }) => {
    (stores[store] ??= new Map()).set(value.id, value);
  },
  transaction: () => {
    const tx = {
      objectStore: () => ({
        get: async (key: string) => stores.settings?.get(key),
        put: async (value: { id: string }) => {
          (stores.settings ??= new Map()).set(value.id, value);
        },
      }),
      done: Promise.resolve(),
    };
    return tx;
  },
};

vi.mock('./db', () => ({ getDB: async () => db }));

/** `syncedThisSession` vit au niveau du module : une session par test. */
async function nouvelleSession() {
  vi.resetModules();
  return import('./settings-store');
}

function poserLocal(settings: Record<string, unknown>) {
  stores.settings = new Map([['app', { id: 'app', ...settings } as never]]);
}

const lireLocal = () => stores.settings?.get('app') as unknown as Record<string, unknown>;

beforeEach(() => {
  for (const key of Object.keys(stores)) delete stores[key];
  fetchSettings.mockReset();
  fetchSettings.mockResolvedValue(null);
  upsertSettings.mockReset();
  upsertSettings.mockResolvedValue(true);
  vi.stubGlobal('navigator', { onLine: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getSettings — arbitrage entre le cache local et le cloud', () => {
  it('laisse le cloud faire foi quand rien n\'est en attente localement', async () => {
    poserLocal({ language: 'en', theme: 'dark' });
    fetchSettings.mockResolvedValue({
      data: { language: 'fr' },
      updatedAt: '2026-08-15T14:07:26.899Z',
    });

    const { getSettings } = await nouvelleSession();
    const settings = await getSettings();

    expect(settings?.language).toBe('fr');
    expect(upsertSettings).not.toHaveBeenCalled();
  });

  it('ne consulte le réseau qu\'une fois par session', async () => {
    poserLocal({ language: 'fr' });
    fetchSettings.mockResolvedValue({ data: { language: 'fr' }, updatedAt: '2026-08-15T14:07:26.899Z' });

    const { getSettings } = await nouvelleSession();
    await getSettings();
    await getSettings();
    await getSettings();

    expect(fetchSettings).toHaveBeenCalledTimes(1);
  });

  it('sert le cache local sans rien écrire quand l\'appareil est hors ligne', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    poserLocal({ language: 'fr', _dirty: true });

    const { getSettings } = await nouvelleSession();
    const settings = await getSettings();

    expect(settings?.language).toBe('fr');
    expect(fetchSettings).not.toHaveBeenCalled();
    expect(upsertSettings).not.toHaveBeenCalled();
  });

  it('pousse la modification locale restée en attente', async () => {
    // Le cas normal du rattrapage : le cloud n'a rien de plus récent.
    poserLocal({ language: 'fr', _dirty: true });
    fetchSettings.mockResolvedValue(null);

    const { getSettings } = await nouvelleSession();
    const settings = await getSettings();

    expect(upsertSettings).toHaveBeenCalledWith(expect.objectContaining({ language: 'fr' }));
    expect(settings?.language).toBe('fr');
    expect(lireLocal()._dirty).toBeUndefined();
  });

  it("n'écrase pas une valeur distante plus récente par une modification locale plus ancienne", async () => {
    // C'est le scénario de la réversion du 15 août.
    //
    // Appareil 1 : passé en anglais, mais la poussée a échoué — la ligne reste
    // marquée `_dirty`, horodatée du matin.
    poserLocal({ language: 'en', _dirty: true, updatedAt: '2026-08-15T09:00:00.000Z' });
    // Appareil 2 : repassé en français dans l'après-midi, et le serveur l'a reçu.
    fetchSettings.mockResolvedValue({
      data: { language: 'fr' },
      updatedAt: '2026-08-15T14:07:26.899Z',
    });

    const { getSettings } = await nouvelleSession();
    const settings = await getSettings();

    // Le français est plus récent : il doit tenir, des deux côtés.
    expect(settings?.language).toBe('fr');
    expect(upsertSettings).not.toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en' }),
    );
    expect(lireLocal().language).toBe('fr');
  });

  it('fait gagner le local quand c\'est lui le plus récent', async () => {
    poserLocal({ language: 'fr', _dirty: true, updatedAt: '2026-08-15T18:00:00.000Z' });
    fetchSettings.mockResolvedValue({
      data: { language: 'en' },
      updatedAt: '2026-08-15T14:07:26.899Z',
    });

    const { getSettings } = await nouvelleSession();
    const settings = await getSettings();

    expect(settings?.language).toBe('fr');
    expect(upsertSettings).toHaveBeenCalledWith(expect.objectContaining({ language: 'fr' }));
  });

  it('laisse le cloud gagner quand la ligne locale en attente n\'est pas datée', async () => {
    // Les lignes écrites avant l'ajout de l'horodatage : on ne peut pas les
    // comparer, et une valeur parvenue au serveur a au moins été vue sur un
    // appareil en ligne. Le doute profite au distant.
    poserLocal({ language: 'en', _dirty: true });
    fetchSettings.mockResolvedValue({
      data: { language: 'fr' },
      updatedAt: '2026-08-15T14:07:26.899Z',
    });

    const { getSettings } = await nouvelleSession();
    const settings = await getSettings();

    expect(settings?.language).toBe('fr');
  });
});

describe('updateSettings', () => {
  it('date chaque écriture, pour que le prochain arbitrage soit possible', async () => {
    poserLocal({ language: 'en' });

    const { updateSettings } = await nouvelleSession();
    await updateSettings({ language: 'fr' });

    expect(lireLocal().updatedAt).toEqual(expect.any(String));
    expect(lireLocal().language).toBe('fr');
  });

  it('marque la ligne en attente quand la poussée échoue', async () => {
    poserLocal({ language: 'en' });
    upsertSettings.mockResolvedValue(false);

    const { updateSettings } = await nouvelleSession();
    await updateSettings({ language: 'fr' });

    expect(lireLocal()._dirty).toBe(true);
    expect(lireLocal().language).toBe('fr');
  });

  it('ne touche pas aux champs absents du correctif', async () => {
    poserLocal({ language: 'fr', theme: 'dark', autoLogoutMinutes: 30 });

    const { updateSettings } = await nouvelleSession();
    await updateSettings({ theme: 'light' });

    expect(lireLocal().language).toBe('fr');
    expect(lireLocal().autoLogoutMinutes).toBe(30);
  });
});
