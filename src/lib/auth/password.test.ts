import { describe, it, expect } from 'vitest';
import { validatePassword, describePasswordProblems, PASSWORD_MIN_LENGTH } from './password';

describe('validatePassword', () => {
  it('accepte un mot de passe conforme', () => {
    expect(validatePassword('BibleOuverte2026!')).toEqual([]);
  });

  it('refuse un mot de passe trop court', () => {
    expect(validatePassword('Abc123!x')).toContain(`au moins ${PASSWORD_MIN_LENGTH} caractères`);
  });

  it('exige minuscule, majuscule et chiffre', () => {
    expect(validatePassword('MOTDEPASSE!')).toEqual(
      expect.arrayContaining(['une minuscule', 'un chiffre']),
    );
    expect(validatePassword('motdepasse!')).toEqual(
      expect.arrayContaining(['une majuscule', 'un chiffre']),
    );
    expect(validatePassword('1234567890!')).toEqual(
      expect.arrayContaining(['une minuscule', 'une majuscule']),
    );
  });

  it('exige un symbole', () => {
    // Régression : ce mot de passe passait la validation du formulaire mais
    // était refusé par le serveur, qui exige aussi un symbole.
    expect(validatePassword('BibleOuverte2026')).toEqual(['un symbole (par exemple ! ? * - .)']);
  });

  it.each(['!', '?', '*', '-', '.', '_', '#', '@', '~', '|'])(
    'reconnaît « %s » comme symbole',
    (symbole) => {
      expect(validatePassword(`BibleOuvert1${symbole}`)).toEqual([]);
    },
  );

  it('ne compte pas un accent comme symbole', () => {
    // Le serveur n'accepte que le jeu ASCII documenté : une lettre accentuée
    // n'y figure pas, l'accepter ici ferait diverger formulaire et serveur.
    expect(validatePassword('Généalogie1')).toEqual(['un symbole (par exemple ! ? * - .)']);
  });

  it('rejette la chaîne vide en listant tout ce qui manque', () => {
    expect(validatePassword('')).toHaveLength(5);
  });

  it('compte les caractères, pas les mots', () => {
    const pw = 'Abcdefgh1!';
    expect(pw).toHaveLength(PASSWORD_MIN_LENGTH);
    expect(validatePassword(pw)).toEqual([]);
  });
});

describe('describePasswordProblems', () => {
  it('ne dit rien quand tout va bien', () => {
    expect(describePasswordProblems('BibleOuverte2026!')).toBe('');
  });

  it('formule une exigence unique sans virgule', () => {
    expect(describePasswordProblems('bibleouverte2026!')).toBe(
      'Le mot de passe doit contenir une majuscule.',
    );
  });

  it('énumère plusieurs exigences avec un "et" final', () => {
    expect(describePasswordProblems('bible')).toBe(
      `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères, une majuscule, un chiffre et un symbole (par exemple ! ? * - .).`,
    );
  });
});
