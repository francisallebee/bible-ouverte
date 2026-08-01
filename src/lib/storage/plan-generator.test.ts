import { describe, it, expect } from 'vitest';
import { BOOKS } from '@/features/bible';
import { generatePlanDays } from './plan-generator';
import type { PlanDuration } from './types';

const TOTAL_CHAPTERS = BOOKS.reduce((sum, b) => sum + b.chapters, 0);

/** Liste tous les chapitres couverts par un plan, doublons compris. */
function coveredChapters(days: ReturnType<typeof generatePlanDays>): string[] {
  const out: string[] = [];
  for (const d of days) {
    for (let c = d.chapterStart; c <= d.chapterEnd; c++) {
      out.push(`${d.book} ${c}`);
    }
  }
  return out;
}

describe('generatePlanDays — couverture', () => {
  const durations: PlanDuration[] = ['1-year', '6-months', '3-months', '1-month'];

  it.each(durations)('couvre les 1189 chapitres exactement une fois (%s)', (duration) => {
    const covered = coveredChapters(generatePlanDays(duration, '2026-01-01'));

    // Régression : un plan « 1 an » perdait 153 chapitres, dont Genèse 50 et
    // Exode 1 — un jour à cheval sur deux livres n'en retenait qu'un chapitre
    // tout en avançant l'index d'une journée entière.
    expect(covered).toHaveLength(TOTAL_CHAPTERS);
    expect(new Set(covered).size).toBe(TOTAL_CHAPTERS);
  });

  it('ne saute pas les chapitres de fin et de début de livre', () => {
    const covered = new Set(coveredChapters(generatePlanDays('1-year', '2026-01-01')));

    expect(covered.has('GEN 50')).toBe(true);
    expect(covered.has('EXO 1')).toBe(true);
    expect(covered.has('EXO 40')).toBe(true);
    expect(covered.has('REV 22')).toBe(true);
  });

  it('respecte la sélection de livres', () => {
    const days = generatePlanDays('custom', '2026-01-01', 20, ['JHN', 'ROM']);
    const jhn = BOOKS.find((b) => b.abbreviation === 'JHN')!;
    const rom = BOOKS.find((b) => b.abbreviation === 'ROM')!;

    expect(new Set(days.map((d) => d.book))).toEqual(new Set(['JHN', 'ROM']));
    expect(coveredChapters(days)).toHaveLength(jhn.chapters + rom.chapters);
  });
});

describe('generatePlanDays — durée', () => {
  it.each([
    ['1-year', 365],
    ['6-months', 182],
    ['3-months', 91],
  ] as [PlanDuration, number][])('produit exactement %s jours', (duration, expected) => {
    // Régression : « 1 an » s'arrêtait au 298e jour, la boucle sortant dès que
    // l'index dépassait la liste des chapitres.
    expect(generatePlanDays(duration, '2026-01-01')).toHaveLength(expected);
  });

  it('ne peut pas descendre sous un jour par livre', () => {
    // 66 livres et un seul livre par jour : un plan « 1 mois » sur toute la
    // Bible est arithmétiquement impossible. Mieux vaut 66 jours honnêtes que
    // 30 jours amputés.
    const days = generatePlanDays('1-month', '2026-01-01');

    expect(days).toHaveLength(BOOKS.length);
    expect(coveredChapters(days)).toHaveLength(TOTAL_CHAPTERS);
  });

  it('numérote les jours de 1 à N sans trou', () => {
    const days = generatePlanDays('3-months', '2026-01-01');
    expect(days.map((d) => d.day)).toEqual(days.map((_, i) => i + 1));
  });
});

describe('generatePlanDays — dates', () => {
  it('fait démarrer le plan à la date demandée', () => {
    expect(generatePlanDays('1-year', '2026-03-15')[0].date).toBe('2026-03-15');
  });

  it('avance d\'un jour civil par jour de plan', () => {
    const days = generatePlanDays('1-year', '2026-01-01');
    expect(days[1].date).toBe('2026-01-02');
    expect(days[31].date).toBe('2026-02-01');
  });

  it('franchit correctement une fin d\'année', () => {
    const days = generatePlanDays('1-year', '2026-12-30');
    expect(days[0].date).toBe('2026-12-30');
    expect(days[2].date).toBe('2027-01-01');
  });

  it('franchit correctement un 29 février', () => {
    const days = generatePlanDays('1-year', '2028-02-28');
    expect(days[1].date).toBe('2028-02-29');
    expect(days[2].date).toBe('2028-03-01');
  });
});

describe('generatePlanDays — cas limites', () => {
  it('rend un plan vide si aucun livre ne correspond', () => {
    expect(generatePlanDays('1-year', '2026-01-01', undefined, ['INCONNU'])).toEqual([]);
  });

  it('rend un plan vide pour une durée nulle ou négative', () => {
    expect(generatePlanDays('custom', '2026-01-01', 0)).toEqual([]);
    expect(generatePlanDays('custom', '2026-01-01', -5)).toEqual([]);
  });

  it('ne donne jamais une plage de chapitres inversée', () => {
    for (const d of generatePlanDays('1-year', '2026-01-01')) {
      expect(d.chapterEnd).toBeGreaterThanOrEqual(d.chapterStart);
      expect(d.chapterStart).toBeGreaterThanOrEqual(1);
    }
  });

  it('enchaîne les chapitres sans trou à l\'intérieur d\'un livre', () => {
    const days = generatePlanDays('6-months', '2026-01-01');
    const perBook: Record<string, typeof days> = {};
    for (const d of days) {
      (perBook[d.book] ??= []).push(d);
    }

    for (const [book, bookDays] of Object.entries(perBook)) {
      expect(bookDays[0].chapterStart, book).toBe(1);
      for (let i = 1; i < bookDays.length; i++) {
        expect(bookDays[i].chapterStart, book).toBe(bookDays[i - 1].chapterEnd + 1);
      }
      const expectedLast = BOOKS.find((b) => b.abbreviation === book)!.chapters;
      expect(bookDays[bookDays.length - 1].chapterEnd, book).toBe(expectedLast);
    }
  });
});
