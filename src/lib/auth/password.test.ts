import { describe, it, expect } from 'vitest';
import { validatePassword, describePasswordProblems, PASSWORD_MIN_LENGTH } from './password';
import { fr } from '@/lib/i18n/ui/fr';
import { en } from '@/lib/i18n/ui/en';

/** Les mêmes arguments que ceux passés par les écrans, en français. */
const FR = [
  fr.auth.passwordRules.labels,
  fr.auth.passwordRules.sentence,
  fr.auth.passwordRules.and,
] as const;

describe('validatePassword', () => {
  it('accepte un mot de passe conforme', () => {
    expect(validatePassword('BibleOuverte2026!')).toEqual([]);
  });

  it('refuse un mot de passe trop court', () => {
    expect(validatePassword('Abc123!x')).toContain('length');
  });

  it('exige minuscule, majuscule et chiffre', () => {
    expect(validatePassword('MOTDEPASSE!')).toEqual(
      expect.arrayContaining(['lowercase', 'digit']),
    );
    expect(validatePassword('motdepasse!')).toEqual(
      expect.arrayContaining(['uppercase', 'digit']),
    );
    expect(validatePassword('1234567890!')).toEqual(
      expect.arrayContaining(['lowercase', 'uppercase']),
    );
  });

  it('exige un symbole', () => {
    // Régression : ce mot de passe passait la validation du formulaire mais
    // était refusé par le serveur, qui exige aussi un symbole.
    expect(validatePassword('BibleOuverte2026')).toEqual(['symbol']);
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
    expect(validatePassword('Généalogie1')).toEqual(['symbol']);
  });

  it('rejette la chaîne vide en listant tout ce qui manque', () => {
    expect(validatePassword('')).toHaveLength(5);
  });

  it('compte les caractères, pas les mots', () => {
    const pw = 'Abcdefgh1!';
    expect(pw).toHaveLength(PASSWORD_MIN_LENGTH);
    expect(validatePassword(pw)).toEqual([]);
  });

  it('rend des codes et non des phrases', () => {
    // C'est ce qui permet de traduire le message sans toucher à la règle.
    for (const code of validatePassword('')) {
      expect(code).toMatch(/^[a-z]+$/);
    }
  });
});

describe('describePasswordProblems', () => {
  it('ne dit rien quand tout va bien', () => {
    expect(describePasswordProblems('BibleOuverte2026!', ...FR)).toBe('');
  });

  it('formule une exigence unique sans virgule', () => {
    expect(describePasswordProblems('bibleouverte2026!', ...FR)).toBe(
      'Le mot de passe doit contenir une majuscule.',
    );
  });

  it('énumère plusieurs exigences avec un « et » final', () => {
    expect(describePasswordProblems('bible', ...FR)).toBe(
      `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères, une majuscule, un chiffre et un symbole (par exemple ! ? * - .).`,
    );
  });

  it('énumère en anglais avec la même mécanique', () => {
    expect(
      describePasswordProblems(
        'bible',
        en.auth.passwordRules.labels,
        en.auth.passwordRules.sentence,
        en.auth.passwordRules.and,
      ),
    ).toBe(
      `The password must contain at least ${PASSWORD_MIN_LENGTH} characters, an uppercase letter, a digit and a symbol (for example ! ? * - .).`,
    );
  });
});
