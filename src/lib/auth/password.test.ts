import { describe, it, expect } from 'vitest';
import { validatePassword, describePasswordProblems, PASSWORD_MIN_LENGTH } from './password';

describe('validatePassword', () => {
  it('accepte un mot de passe conforme', () => {
    expect(validatePassword('Bible2026ok')).toEqual([]);
  });

  it('refuse un mot de passe trop court', () => {
    expect(validatePassword('Abc12345')).toContain(`au moins ${PASSWORD_MIN_LENGTH} caractères`);
  });

  it('exige minuscule, majuscule et chiffre', () => {
    expect(validatePassword('MOTDEPASSE')).toEqual(
      expect.arrayContaining(['une minuscule', 'un chiffre']),
    );
    expect(validatePassword('motdepasse')).toEqual(
      expect.arrayContaining(['une majuscule', 'un chiffre']),
    );
    expect(validatePassword('1234567890')).toEqual(
      expect.arrayContaining(['une minuscule', 'une majuscule']),
    );
  });

  it('accepte les accents et les symboles sans les exiger', () => {
    expect(validatePassword('Généalogie1')).toEqual([]);
    expect(validatePassword('Genese!2026')).toEqual([]);
  });

  it('rejette la chaîne vide en listant tout ce qui manque', () => {
    expect(validatePassword('')).toHaveLength(4);
  });

  it('compte les caractères, pas les mots', () => {
    // Exactement la longueur minimale : accepté.
    const pw = 'Abcdefghi1';
    expect(pw).toHaveLength(PASSWORD_MIN_LENGTH);
    expect(validatePassword(pw)).toEqual([]);
  });
});

describe('describePasswordProblems', () => {
  it('ne dit rien quand tout va bien', () => {
    expect(describePasswordProblems('Bible2026ok')).toBe('');
  });

  it('formule une exigence unique sans virgule', () => {
    expect(describePasswordProblems('bible2026ok')).toBe(
      'Le mot de passe doit contenir une majuscule.',
    );
  });

  it('énumère plusieurs exigences avec un "et" final', () => {
    expect(describePasswordProblems('bible')).toBe(
      `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères, une majuscule et un chiffre.`,
    );
  });
});
