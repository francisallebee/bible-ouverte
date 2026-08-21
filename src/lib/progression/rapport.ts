/**
 * Lire une progression en nombres, ou en pourcentage.
 *
 * L'écran Progression affiche partout des rapports — « 49 / 929 chapitres »,
 * « 27 / 187 » — et l'item 32 de la feuille de route demande de pouvoir les
 * lire en pourcentage. Les deux formes répondent à deux questions : le nombre
 * dit *ce qui a été fait*, le pourcentage dit *où l'on en est*. Aucune ne
 * remplace l'autre, d'où un interrupteur et non un choix définitif.
 *
 * La règle vit ici plutôt que dans l'écran parce qu'elle a des cas limites qui
 * se trompent en silence : un dénominateur nul, un ratio si petit qu'il
 * s'arrondit à zéro, et un « 100 % » qui s'afficherait avant la fin.
 */

/**
 * La part, en pourcentage, ou `null` s'il n'y a rien à rapporter.
 *
 * `null` et non `0` : un livre dont on ignore le nombre de chapitres n'est pas
 * un livre lu à 0 %, et les deux ne s'affichent pas pareil.
 */
export function part(lu: number, total: number): number | null {
  if (!Number.isFinite(lu) || !Number.isFinite(total) || total <= 0) return null;
  return (lu / total) * 100;
}

/**
 * Le nombre de décimales à montrer.
 *
 * **Sous 10 %, une décimale.** Un chapitre sur les 1 189 de la Bible vaut
 * 0,08 % : arrondi à l'entier, il s'affiche « 0 % », ce qui est faux au sens
 * où l'on a bel et bien lu quelque chose — et décourageant pour rien. Au-delà,
 * la décimale n'apporte plus qu'un chiffre à lire.
 */
function decimales(valeur: number): number {
  return valeur > 0 && valeur < 10 ? 1 : 0;
}

/**
 * Le pourcentage tel qu'il s'affiche, dans la langue donnée.
 *
 * **Deux arrondis sont bridés, aux deux bouts.** Une part non nulle ne doit
 * jamais s'afficher « 0 % » — on montre « < 1 % » —, et une part incomplète ne
 * doit jamais s'afficher « 100 % » : lire 1 188 chapitres sur 1 189 arrondit à
 * 100 % et ferait croire la Bible finie. On plafonne alors à « > 99 % ».
 */
export function formatPart(
  tag: string, lu: number, total: number,
): string | null {
  const valeur = part(lu, total);
  if (valeur === null) return null;

  const pourcent = (v: number, max: number) =>
    new Intl.NumberFormat(tag, {
      style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: max,
    }).format(v / 100);

  const d = decimales(valeur);
  // **L'arrondi, et non la valeur brute.** 1 188 chapitres sur 1 189 valent
  // 99,92 % — donc `valeur >= 100` est faux —, et c'est pourtant « 100 % » qui
  // s'afficherait : c'est le formatage qui crée le mensonge, pas le calcul.
  // Trouvé en voyant le test échouer.
  const arrondi = Math.round(valeur * 10 ** d) / 10 ** d;

  if (valeur > 0 && valeur < 0.1) return `< ${pourcent(0.1, 1)}`;
  if (arrondi >= 100 && lu < total) return `> ${pourcent(99, 0)}`;
  return pourcent(valeur, d);
}
