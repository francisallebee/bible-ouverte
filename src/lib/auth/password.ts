/**
 * Règles de mot de passe à l'inscription.
 *
 * La protection contre les mots de passe compromis (Supabase Auth ↔
 * HaveIBeenPwned) n'est disponible qu'à partir du plan Pro. Sur le plan Free,
 * le seul levier est la robustesse intrinsèque du mot de passe.
 *
 * Ces règles doivent rester le miroir exact de celles configurées dans le
 * dashboard Supabase (Authentication → Sign In / Providers → Email), qui fait
 * autorité. Toute divergence produit le pire des cas : un formulaire qui valide
 * et un serveur qui refuse ensuite, avec un message brut en anglais.
 *
 * Vérifié contre le serveur le 1er août 2026 : longueur minimale 10, minuscule,
 * majuscule, chiffre et symbole exigés.
 *
 * `validatePassword` rend des **codes** et non des phrases : la règle est de la
 * logique, sa formulation appartient à la langue. Les libellés vivent dans les
 * dictionnaires, sous `auth.passwordRules`.
 */

export const PASSWORD_MIN_LENGTH = 10;

/** Ce qui manque à un mot de passe. */
export type PasswordProblem =
  | 'length'
  | 'lowercase'
  | 'uppercase'
  | 'digit'
  | 'symbol';

/**
 * Jeu de symboles accepté par Supabase Auth. Reproduit tel quel : un caractère
 * hors de cette liste — une lettre accentuée, une espace, un emoji — ne compte
 * pas comme symbole côté serveur, et le refuser ici évite un formulaire qui
 * valide puis un serveur qui refuse.
 */
const SYMBOLS = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/;

/**
 * Ces règles reproduisent celles configurées côté serveur : dix caractères au
 * minimum, avec une minuscule, une majuscule, un chiffre et un symbole.
 */
export function validatePassword(password: string): PasswordProblem[] {
  const problems: PasswordProblem[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) problems.push('length');
  if (!/[a-z]/.test(password)) problems.push('lowercase');
  if (!/[A-Z]/.test(password)) problems.push('uppercase');
  if (!/[0-9]/.test(password)) problems.push('digit');
  if (!SYMBOLS.test(password)) problems.push('symbol');

  return problems;
}

/**
 * Assemble la phrase à afficher à partir des codes.
 *
 * `labels` et `sentence` viennent du dictionnaire de la langue : l'énumération
 * — virgules puis « et » final — n'a pas la même forme partout, c'est donc à
 * chaque langue de la produire.
 */
export function describePasswordProblems(
  password: string,
  labels: Record<PasswordProblem, string>,
  sentence: (list: string) => string,
  and: string,
): string {
  const problems = validatePassword(password);
  if (problems.length === 0) return '';

  const parts = problems.map((p) => labels[p]);
  if (parts.length === 1) return sentence(parts[0]);

  const last = parts[parts.length - 1];
  return sentence(`${parts.slice(0, -1).join(', ')} ${and} ${last}`);
}
