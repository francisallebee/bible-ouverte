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
 */

export const PASSWORD_MIN_LENGTH = 10;

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
export function validatePassword(password: string): string[] {
  const problems: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    problems.push(`au moins ${PASSWORD_MIN_LENGTH} caractères`);
  }
  if (!/[a-z]/.test(password)) {
    problems.push('une minuscule');
  }
  if (!/[A-Z]/.test(password)) {
    problems.push('une majuscule');
  }
  if (!/[0-9]/.test(password)) {
    problems.push('un chiffre');
  }
  if (!SYMBOLS.test(password)) {
    problems.push('un symbole (par exemple ! ? * - .)');
  }

  return problems;
}

/** Message prêt à afficher, ou chaîne vide si le mot de passe convient. */
export function describePasswordProblems(password: string): string {
  const problems = validatePassword(password);
  if (problems.length === 0) return '';
  if (problems.length === 1) return `Le mot de passe doit contenir ${problems[0]}.`;

  const last = problems[problems.length - 1];
  return `Le mot de passe doit contenir ${problems.slice(0, -1).join(', ')} et ${last}.`;
}
