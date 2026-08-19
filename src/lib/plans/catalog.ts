import type { PlanPassage } from '@/lib/storage/plan-passages';
import { generateStreamDays } from './streams';

/**
 * Les plans prêts à l'emploi.
 *
 * Deux familles, et la distinction n'est pas cosmétique :
 *
 * - **`streams`** : des flux de livres parcourus en parallèle, répartis sur la
 *   durée choisie. C'est la forme des grands plans de lecture intégrale — un
 *   peu d'Ancien Testament, un peu d'Évangile, un psaume, chaque jour.
 * - **`thematic`** : une liste de passages arrêtée, un par jour. La durée est
 *   celle de la liste ; on ne l'étire pas.
 *
 * **Sur les attributions.** Aucun de ces plans ne porte le nom d'un plan
 * historique, et c'est délibéré. Le calendrier de M'Cheyne (1842) est bien du
 * domaine public, mais c'est une table précise de 365 jours à quatre lectures :
 * la reconstituer de mémoire produirait des erreurs invisibles sous un nom qui
 * inspire confiance. Les plans ci-dessous sont **engendrés**, et annoncés comme
 * tels. Le jour où la table exacte sera disponible, elle pourra rejoindre le
 * catalogue sous son vrai nom.
 *
 * Les références thématiques sont volontairement au **chapitre** et non au
 * verset : un chapitre se vérifie d'un coup d'œil, une plage de versets citée
 * de mémoire se trompe sans qu'on le voie.
 *
 * Les libellés vivent dans les dictionnaires, sous `planCatalog`, par
 * identifiant — comme partout ailleurs.
 */

export interface StreamsTemplate {
  id: string;
  kind: 'streams';
  emoji: string;
  /** Chaque flux est une suite de livres, parcourue dans l'ordre. */
  streams: string[][];
  /** Durées proposées, en jours. La première est celle par défaut. */
  durations: number[];
}

export interface ThematicTemplate {
  id: string;
  kind: 'thematic';
  emoji: string;
  /** Un passage par jour. La durée du plan est la longueur de cette liste. */
  passages: PlanPassage[];
}

export type PlanTemplate = StreamsTemplate | ThematicTemplate;

/** Raccourci : un chapitre entier, la forme de toutes les références thématiques. */
const ch = (book: string, chapter: number): PlanPassage =>
  ({ book, chapterStart: chapter, chapterEnd: chapter, verseStart: 1, verseEnd: 1 });

const EVANGILES = ['MAT', 'MRK', 'LUK', 'JHN'];
const PENTATEUQUE = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'];

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'at-evangiles-psaumes',
    kind: 'streams',
    emoji: '📚',
    streams: [
      [...PENTATEUQUE, 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI'],
      EVANGILES,
      ['PSA'],
    ],
    durations: [365, 182, 91],
  },
  {
    id: 'nouveau-testament',
    kind: 'streams',
    emoji: '✝️',
    streams: [[
      ...EVANGILES, 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL',
      '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE',
      '1JN', '2JN', '3JN', 'JUD', 'REV',
    ]],
    durations: [90, 180, 30],
  },
  {
    id: 'evangiles-psaumes',
    kind: 'streams',
    emoji: '🕊️',
    streams: [EVANGILES, ['PSA']],
    durations: [60, 90, 30],
  },
  {
    id: 'sagesse',
    kind: 'thematic',
    emoji: '🦉',
    // Proverbes compte 31 chapitres : un par jour, la lecture classique du mois.
    passages: Array.from({ length: 31 }, (_, i) => ch('PRO', i + 1)),
  },
  {
    id: 'priere',
    kind: 'thematic',
    emoji: '🙏',
    passages: [
      ch('MAT', 6), ch('LUK', 11), ch('JHN', 17), ch('PSA', 5), ch('PSA', 51),
      ch('PSA', 63), ch('PSA', 86), ch('PSA', 130), ch('PSA', 143), ch('DAN', 9),
      ch('NEH', 1), ch('1KI', 8), ch('EPH', 3), ch('COL', 1), ch('JAS', 5),
    ],
  },
  {
    id: 'esperance',
    kind: 'thematic',
    emoji: '⚓',
    passages: [
      ch('ROM', 5), ch('ROM', 8), ch('ISA', 40), ch('ISA', 43), ch('LAM', 3),
      ch('PSA', 42), ch('PSA', 130), ch('JHN', 14), ch('2CO', 4), ch('1TH', 4),
      ch('HEB', 11), ch('1PE', 1), ch('REV', 21), ch('REV', 22),
    ],
  },
  {
    id: 'pardon',
    kind: 'thematic',
    emoji: '🤍',
    passages: [
      ch('PSA', 32), ch('PSA', 51), ch('PSA', 103), ch('ISA', 1), ch('MIC', 7),
      ch('MAT', 18), ch('LUK', 7), ch('LUK', 15), ch('EPH', 4), ch('COL', 3),
      ch('1JN', 1),
    ],
  },
  {
    id: 'confiance',
    kind: 'thematic',
    emoji: '🛡️',
    passages: [
      ch('PSA', 23), ch('PSA', 27), ch('PSA', 46), ch('PSA', 62), ch('PSA', 91),
      ch('PSA', 121), ch('PSA', 131), ch('PSA', 139),
    ],
  },
];

/** Le nombre de jours d'un modèle, pour une durée choisie s'il en accepte une. */
export function templateDays(template: PlanTemplate, duration?: number): number {
  if (template.kind === 'thematic') return template.passages.length;
  return duration && template.durations.includes(duration)
    ? duration
    : template.durations[0];
}

/**
 * Les passages de chaque jour, pour un modèle donné.
 *
 * Les jours vides sont conservés : un flux plus court que la durée en produit,
 * et les retirer décalerait tous les suivants par rapport au calendrier.
 * C'est à l'appelant de décider s'il les enregistre.
 */
export function templateDaysPassages(template: PlanTemplate, duration?: number): PlanPassage[][] {
  if (template.kind === 'thematic') return template.passages.map((p) => [p]);
  return generateStreamDays(template.streams, templateDays(template, duration));
}

export function findTemplate(id: string): PlanTemplate | undefined {
  return PLAN_TEMPLATES.find((t) => t.id === id);
}
