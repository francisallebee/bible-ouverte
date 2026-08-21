import { describe, it, expect } from 'vitest';
import { part, formatPart } from './rapport';

/** Le français met une espace insécable avant le %. On compare sans elle. */
const nu = (s: string | null) => s?.replace(/ | /g, ' ') ?? null;

describe('part', () => {
  it('rend la part en pourcentage', () => {
    expect(part(49, 929)).toBeCloseTo(5.27, 2);
    expect(part(1, 2)).toBe(50);
  });

  it('rend 100 quand tout est lu', () => {
    expect(part(66, 66)).toBe(100);
  });

  /** Un dénominateur inconnu n'est pas un zéro : les deux s'affichent autrement. */
  it('rend null plutôt que zéro quand il n’y a rien à rapporter', () => {
    expect(part(0, 0)).toBeNull();
    expect(part(5, -1)).toBeNull();
    expect(part(5, Number.NaN)).toBeNull();
  });

  it('rend zéro quand rien n’est lu mais que le total existe', () => {
    expect(part(0, 50)).toBe(0);
  });
});

describe('formatPart', () => {
  it('arrondit à l’entier au-dessus de dix pour cent', () => {
    expect(nu(formatPart('fr-FR', 1, 2))).toBe('50 %');
  });

  /**
   * Sous dix pour cent, une décimale : 49 chapitres sur 929 valent 5,3 %, et
   * « 5 % » perdrait une information qui compte à cette échelle.
   */
  it('garde une décimale sous dix pour cent', () => {
    expect(nu(formatPart('fr-FR', 49, 929))).toBe('5,3 %');
  });

  /**
   * Le premier bridage : un chapitre sur 1 189 vaut 0,08 %. « 0 % » serait faux
   * — quelque chose a bien été lu — et décourageant pour rien.
   */
  it('n’affiche jamais zéro pour une part non nulle', () => {
    expect(nu(formatPart('fr-FR', 1, 1189))).toBe('< 0,1 %');
  });

  /**
   * Le second : 1 188 chapitres sur 1 189 arrondissent à 100 % et feraient
   * croire la Bible achevée à un chapitre près.
   */
  it('n’affiche jamais cent pour cent avant la fin', () => {
    expect(nu(formatPart('fr-FR', 1188, 1189))).toBe('> 99 %');
  });

  it('affiche cent pour cent quand c’est vrai', () => {
    expect(nu(formatPart('fr-FR', 1189, 1189))).toBe('100 %');
  });

  it('affiche zéro quand rien n’est lu', () => {
    expect(nu(formatPart('fr-FR', 0, 50))).toBe('0 %');
  });

  it('rend null quand il n’y a rien à rapporter', () => {
    expect(formatPart('fr-FR', 3, 0)).toBeNull();
  });

  /** La langue décide du séparateur décimal et de la place du signe. */
  it('suit la langue', () => {
    expect(nu(formatPart('en-US', 49, 929))).toBe('5.3%');
  });
});
