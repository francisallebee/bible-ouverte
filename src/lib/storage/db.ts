import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { AppSettings, BiblePassage, BibleVersion, PlanDay, ReadingContext, ReadingEntry, ReadingPlan } from './types';

interface BibleOuverteDB extends DBSchema {
  readings: {
    key: number;
    value: ReadingEntry;
    indexes: {
      'by-date': string;
      'by-book': string;
      'by-context': string;
    };
  };
  contexts: {
    key: string;
    value: ReadingContext;
  };
  bible_versions: {
    key: string;
    value: BibleVersion;
  };
  bible_passages: {
    key: number;
    value: BiblePassage;
    indexes: {
      'by-version-book-chapter-verse': [string, string, number, number];
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  plans: {
    key: number;
    value: ReadingPlan;
    indexes: {
      'by-start-date': string;
    };
  };
  plan_days: {
    key: number;
    value: PlanDay;
    indexes: {
      'by-plan-date': [number, string];
      'by-plan-day': [number, number];
    };
  };
}

let dbPromise: Promise<IDBPDatabase<BibleOuverteDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BibleOuverteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BibleOuverteDB>('bible-ouverte', 4, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const readingsStore = db.createObjectStore('readings', {
            keyPath: 'id',
            autoIncrement: true,
          });
          readingsStore.createIndex('by-date', 'date');
          readingsStore.createIndex('by-book', 'book');
          readingsStore.createIndex('by-context', 'contextId');

          db.createObjectStore('contexts', { keyPath: 'id' });
          db.createObjectStore('bible_versions', { keyPath: 'id' });

          const passagesStore = db.createObjectStore('bible_passages', {
            keyPath: 'id',
            autoIncrement: true,
          });
          passagesStore.createIndex('by-version-book-chapter-verse', [
            'versionId', 'book', 'chapter', 'verse',
          ]);

          db.createObjectStore('settings', { keyPath: 'id' });
        }

        if (oldVersion < 2) {
          const plans = db.createObjectStore('plans', {
            keyPath: 'id',
            autoIncrement: true,
          });
          plans.createIndex('by-start-date', 'startDate');

          const planDays = db.createObjectStore('plan_days', {
            keyPath: 'id',
            autoIncrement: true,
          });
          planDays.createIndex('by-plan-date', ['planId', 'date']);
          planDays.createIndex('by-plan-day', ['planId', 'day']);
        }
      },
    });
  }
  return dbPromise;
}
