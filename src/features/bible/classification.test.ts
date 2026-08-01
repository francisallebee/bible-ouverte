import { describe, it, expect } from 'vitest';
import { BOOKS } from './books';
import {
  BIBLE_CATEGORIES,
  OLD_TESTAMENT,
  NEW_TESTAMENT,
  getBookCategory,
  isOldTestament,
  isNewTestament,
  getCategoryChapters,
} from './classification';

describe('BOOKS', () => {
  it('contient les 66 livres du canon protestant', () => {
    expect(BOOKS).toHaveLength(66);
  });

  it('totalise 1189 chapitres', () => {
    expect(BOOKS.reduce((sum, b) => sum + b.chapters, 0)).toBe(1189);
  });

  it('n\'a ni abréviation dupliquée ni livre sans chapitre', () => {
    expect(new Set(BOOKS.map((b) => b.abbreviation)).size).toBe(BOOKS.length);
    for (const b of BOOKS) {
      expect(b.chapters, b.abbreviation).toBeGreaterThan(0);
    }
  });
});

describe('catégories', () => {
  it('classe chaque livre dans exactement une catégorie', () => {
    for (const book of BOOKS) {
      const matches = BIBLE_CATEGORIES.filter((c) => c.books.includes(book.abbreviation));
      expect(matches, book.abbreviation).toHaveLength(1);
    }
  });

  it('ne référence aucun livre inconnu', () => {
    const known = new Set(BOOKS.map((b) => b.abbreviation));
    for (const category of BIBLE_CATEGORIES) {
      for (const abbr of category.books) {
        expect(known.has(abbr), `${category.id} → ${abbr}`).toBe(true);
      }
    }
  });

  it('retrouve la catégorie d\'un livre', () => {
    expect(getBookCategory('GEN')?.id).toBe('pentateuch');
    expect(getBookCategory('REV')?.id).toBe('revelation');
    expect(getBookCategory('INCONNU')).toBeUndefined();
  });
});

describe('testaments', () => {
  it('répartit 39 livres puis 27', () => {
    expect(OLD_TESTAMENT).toHaveLength(39);
    expect(NEW_TESTAMENT).toHaveLength(27);
  });

  it('place la charnière entre Malachie et Matthieu', () => {
    expect(isOldTestament('MAL')).toBe(true);
    expect(isNewTestament('MAL')).toBe(false);
    expect(isNewTestament('MAT')).toBe(true);
    expect(isOldTestament('MAT')).toBe(false);
  });

  it('ne classe aucun livre dans les deux testaments', () => {
    for (const book of BOOKS) {
      expect(isOldTestament(book.abbreviation)).not.toBe(isNewTestament(book.abbreviation));
    }
  });
});

describe('getCategoryChapters', () => {
  it('additionne les chapitres d\'une liste de livres', () => {
    // Genèse 50 + Exode 40
    expect(getCategoryChapters(['GEN', 'EXO'])).toBe(90);
  });

  it('ignore les livres inconnus au lieu de renvoyer NaN', () => {
    expect(getCategoryChapters(['GEN', 'INCONNU'])).toBe(50);
  });

  it('rend 0 sur une liste vide', () => {
    expect(getCategoryChapters([])).toBe(0);
  });
});
