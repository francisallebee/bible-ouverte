import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { AppSettings, BiblePassage, BibleVersion, EntreeStrong, GameSession, LexiqueStrong, MemorisedVerse, PlanDay, ReadingContext, ReadingEntry, ReadingPlan, RoadmapItem, SupportTicket, ThemeUtilisateur, VersetOriginal } from './types';

interface BibleOuverteDB extends DBSchema {
  readings: {
    key: number;
    value: ReadingEntry;
    indexes: {
      'by-date': string;
      'by-book': string;
    };
  };
  contexts: {
    key: string;
    value: ReadingContext;
  };
  user_themes: {
    key: string;
    value: ThemeUtilisateur;
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
  roadmap: {
    key: number;
    value: RoadmapItem;
    autoIncrement: true;
  };
  support_tickets: {
    key: number;
    value: SupportTicket;
    autoIncrement: true;
  };
  game_sessions: {
    key: number;
    value: GameSession;
    indexes: {
      'by-kind-date': [string, string];
    };
  };
  memorised_verses: {
    key: number;
    value: MemorisedVerse;
    indexes: {
      'by-prochain': string;
    };
  };
  /**
   * Le registre des lexiques Strong : deux lignes, et le drapeau de chacune.
   * Séparé de `bible_versions` à dessein — voir `LexiqueStrong` dans `types`.
   */
  strong_lexicons: {
    key: string;
    value: LexiqueStrong;
  };
  /**
   * Les entrées des lexiques. Clé = le numéro (`H1`, `G1473`), qui est déjà
   * unique entre les deux langues grâce à son préfixe : pas de clé composée
   * ni d'auto-incrément, et le clic sur un mot lira donc par clé primaire.
   *
   * L'index sur `lexiqueId` sert la désactivation et le comptage. Il serait
   * possible de s'en passer en bornant la clé (`H` … `H\uffff`), mais un
   * index dit l'intention et suit ce que `bible_passages` fait déjà.
   */
  strong_entries: {
    key: string;
    value: EntreeStrong;
    indexes: {
      'by-lexique': string;
    };
  };
  /**
   * Le texte original, **un enregistrement par verset et non par mot**.
   *
   * 444 339 mots feraient autant de lignes ; 31 140 versets suffisent, et
   * c'est exactement la maille que l'écran demande — « donne-moi Genèse 1:1 ».
   * Clé `GEN.1.1`, index sur la langue pour n'effacer qu'un testament.
   */
  originaux: {
    key: string;
    value: VersetOriginal;
    indexes: {
      'by-langue': string;
    };
  };
  /** Les PDF des plans, par chemin dans le seau : lus une fois, relus hors ligne. */
  documents: {
    key: string;
    value: { chemin: string; octets: ArrayBuffer; taille: number; lu: string };
  };
}

let dbPromise: Promise<IDBPDatabase<BibleOuverteDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BibleOuverteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BibleOuverteDB>('bible-ouverte', 13, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const readingsStore = db.createObjectStore('readings', {
            keyPath: 'id',
            autoIncrement: true,
          });
          readingsStore.createIndex('by-date', 'date');
          readingsStore.createIndex('by-book', 'book');

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

        if (oldVersion < 6) {
          db.createObjectStore('roadmap', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        if (oldVersion < 7) {
          db.createObjectStore('support_tickets', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        if (oldVersion < 8) {
          // Les parties jouées : quizz, mémorisation, verset du jour. L'index
          // porte le genre et la date, qui est exactement ce que lit l'écran
          // des statistiques — par jeu, du plus récent au plus ancien.
          const parties = db.createObjectStore('game_sessions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          parties.createIndex('by-kind-date', ['kind', 'createdAt']);
        }

        if (oldVersion < 9) {
          // Les versets en cours d'apprentissage. L'index porte l'échéance,
          // qui est ce que l'écran interroge : « qu'est-ce qui est dû ? ».
          const memorises = db.createObjectStore('memorised_verses', {
            keyPath: 'id',
            autoIncrement: true,
          });
          memorises.createIndex('by-prochain', 'prochain');
        }

        if (oldVersion < 10) {
          // Le PDF d'un plan, tel que le seau l'a rendu : le lecteur de pages
          // le dessine depuis ici, et le plan se lit hors ligne comme les
          // autres. Clé = chemin dans le seau, unique par document.
          db.createObjectStore('documents', { keyPath: 'chemin' });
        }

        if (oldVersion < 11) {
          // Les thèmes du lecteur, à côté des quinze du code. Clé `text`
          // engendrée par le client, comme `contexts` : on doit pouvoir en
          // créer un hors ligne et le pousser ensuite.
          db.createObjectStore('user_themes', { keyPath: 'id' });
        }

        if (oldVersion < 12) {
          // Les lexiques Strong : le registre d'un côté, les entrées de
          // l'autre. Deux magasins et non un, pour la même raison que
          // `bible_versions` et `bible_passages` : on coche une ligne, on
          // efface des dizaines de milliers.
          db.createObjectStore('strong_lexicons', { keyPath: 'id' });

          const entrees = db.createObjectStore('strong_entries', { keyPath: 'number' });
          entrees.createIndex('by-lexique', 'lexiqueId');
        }

        if (oldVersion < 13) {
          // Le texte hébreu et grec, par verset. Même raison que
          // `strong_entries` d'être à part du registre : on coche une ligne,
          // on écrit 31 140 versets.
          const originaux = db.createObjectStore('originaux', { keyPath: 'ref' });
          originaux.createIndex('by-langue', 'langue');
        }
      },
    });
  }
  return dbPromise;
}
