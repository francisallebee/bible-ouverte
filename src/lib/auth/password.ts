/**
 * Règles de mot de passe à l'inscription.
 *
 * La protection contre les mots de passe compromis (Supabase Auth ↔
 * HaveIBeenPwned) n'est disponible qu'à partir du plan Pro. Sur le plan Free,
 * le seul levier est la robustesse intrinsèque du mot de passe.
 *
 * Ces règles doublent celles configurées dans supabase/config.toml. Le serveur
 * reste l'autorité — la validation côté formulaire ne sert qu'à expliquer le
 * refus avant l'aller-retour réseau, avec un message en français plutôt que
 * l'erreur brute de l'API.
 */

export const PASSWORD_MIN_LENGTH = 10;

/**
 * Dix caractères mêlant minuscules, majuscules et chiffres demandent plus de
 * tentatives qu'un mot de passe de huit caractères avec symboles (~2^59 contre
 * ~2^52), tout en restant saisissable sur un clavier de téléphone.
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
