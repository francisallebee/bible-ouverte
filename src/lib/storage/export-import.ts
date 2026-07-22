import { getDB } from './db';
import type { ReadingEntry, ReadingContext, BibleVersion, AppSettings } from './types';

export interface ExportData {
  version: number;
  exportedAt: string;
  data: {
    readings: ReadingEntry[];
    contexts: ReadingContext[];
    bible_versions: BibleVersion[];
    settings: AppSettings | null;
  };
}

export interface ImportResult {
  ok: boolean;
  count: number;
  errors: string[];
}

export async function exportData(): Promise<string> {
  const db = await getDB();

  const [readings, contexts, bible_versions, settings] = await Promise.all([
    db.getAll('readings'),
    db.getAll('contexts'),
    db.getAll('bible_versions'),
    db.get('settings', 'app').then((s) => s ?? null),
  ]);

  const payload: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { readings, contexts, bible_versions, settings },
  };

  return JSON.stringify(payload, null, 2);
}

export async function importData(jsonString: string): Promise<ImportResult> {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object' || !parsed.data) {
      return { ok: false, count: 0, errors: ['Structure JSON invalide : propriété "data" manquante.'] };
    }

    const { data } = parsed;
    const errors: string[] = [];
    let count = 0;

    const db = await getDB();

    if (Array.isArray(data.contexts)) {
      const tx = db.transaction('contexts', 'readwrite');
      for (const ctx of data.contexts) {
        await tx.objectStore('contexts').put(ctx);
        count++;
      }
      await tx.done;
    }

    if (Array.isArray(data.bible_versions)) {
      const tx = db.transaction('bible_versions', 'readwrite');
      for (const v of data.bible_versions) {
        await tx.objectStore('bible_versions').put(v);
        count++;
      }
      await tx.done;
    }

    if (data.settings && typeof data.settings === 'object') {
      const tx = db.transaction('settings', 'readwrite');
      await tx.objectStore('settings').put({ ...data.settings, id: 'app' });
      await tx.done;
      count++;
    }

    if (Array.isArray(data.readings)) {
      const tx = db.transaction('readings', 'readwrite');
      for (const r of data.readings) {
        await tx.objectStore('readings').put(r);
        count++;
      }
      await tx.done;
    }

    return { ok: true, count, errors };
  } catch (e) {
    return { ok: false, count: 0, errors: [`Erreur de parsing : ${e instanceof Error ? e.message : 'fichier invalide'}`] };
  }
}
