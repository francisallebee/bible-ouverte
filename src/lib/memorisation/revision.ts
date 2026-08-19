/**
 * La révision espacée, et le masquage progressif qui l'accompagne.
 *
 * Un verset récité une fois n'est pas su : il est reconnu. Ce qui le fait
 * tenir, c'est de le retrouver après un jour, puis trois, puis une semaine —
 * chaque rappel réussi éloignant le suivant. C'est tout ce que fait ce module,
 * et c'est ce qui distingue ce jeu d'un exercice ponctuel.
 *
 * **Le niveau sert deux fois** : il commande l'espacement du prochain rappel et
 * la difficulté de l'exercice. Un verset qu'on revoit après trois semaines ne
 * doit pas s'afficher en entier — sinon on relit au lieu de se souvenir.
 */

/**
 * Les intervalles, en jours, par niveau.
 *
 * La progression est à peu près triple à chaque palier. Plus serré, la révision
 * devient une corvée quotidienne ; plus lâche, le verset s'efface entre deux
 * rappels. Le dernier palier ne s'allonge plus : au-delà de deux mois, un
 * verset qui revient encore juste est acquis, et le repousser davantage
 * reviendrait à cesser de le réviser.
 */
export const INTERVALLES = [1, 3, 7, 21, 60] as const;

/** Le niveau le plus haut. Un verset qui l'atteint reste révisé tous les 60 jours. */
export const NIVEAU_MAX = INTERVALLES.length - 1;

/**
 * La part de mots masqués, par niveau.
 *
 * Au premier passage rien n'est caché : on lit le verset, on ne le devine pas.
 * Le dernier niveau masque tout — c'est la récitation.
 */
export const MASQUAGE = [0, 0.25, 0.5, 0.75, 1] as const;

/** Ce qu'il faut réussir pour monter d'un niveau. */
export const SEUIL_REUSSITE = 0.8;

export interface EtatVerset {
  niveau: number;
  /** Date du prochain rappel, au format `AAAA-MM-JJ`. */
  prochain: string;
}

function ajouterJours(jour: string, n: number): string {
  const [a, m, j] = jour.split('-').map(Number);
  const base = Date.UTC(a, m - 1, j);
  return new Date(base + n * 86400000).toISOString().slice(0, 10);
}

/**
 * L'état suivant d'un verset, après une séance.
 *
 * **Un échec ne remet pas à zéro, il recule d'un niveau.** Repartir de rien
 * après une hésitation décourage et fait perdre des semaines de travail ; ne
 * pas reculer du tout laisserait passer un verset qu'on ne sait plus. Le recul
 * d'un cran est le compromis que retiennent les systèmes de répétition
 * espacée, et il a la vertu de ramener aussi la difficulté d'un cran.
 *
 * Un échec est toujours revu **le lendemain**, quel que soit le niveau : c'est
 * le moment où la reprise sert le plus.
 */
export function prochainEtat(actuel: EtatVerset, reussite: number, jour: string): EtatVerset {
  const reussi = reussite >= SEUIL_REUSSITE;
  if (!reussi) {
    const niveau = Math.max(0, actuel.niveau - 1);
    return { niveau, prochain: ajouterJours(jour, 1) };
  }
  // L'intervalle est celui du niveau **qu'on vient de réussir**, non celui du
  // suivant. Un verset qu'on vient de lire pour la première fois doit revenir
  // le lendemain ; prendre l'intervalle du niveau d'arrivée le repousserait à
  // trois jours, et le palier d'un jour ne servirait jamais.
  const niveau = Math.min(NIVEAU_MAX, actuel.niveau + 1);
  return { niveau, prochain: ajouterJours(jour, INTERVALLES[actuel.niveau]) };
}

/** Un verset est à revoir dès que sa date est atteinte, ou dépassée. */
export function estDu(etat: EtatVerset, jour: string): boolean {
  return etat.prochain <= jour;
}

/** La part de mots à masquer pour un niveau donné. */
export function partMasquee(niveau: number): number {
  return MASQUAGE[Math.max(0, Math.min(NIVEAU_MAX, niveau))];
}

export interface MotMasque {
  mot: string;
  masque: boolean;
}

/**
 * Masque une part des mots d'un verset.
 *
 * **Les mots masqués sont répartis, pas tirés indépendamment.** Un tirage libre
 * cache volontiers cinq mots consécutifs et en laisse dix d'affilée : l'exercice
 * devient un trou béant suivi d'une lecture. On découpe donc le verset en
 * autant de tranches que de mots à cacher, et l'on en masque un par tranche.
 *
 * Le tirage est fourni par l'appelant, pour que l'exercice soit reproductible
 * — un verset qu'on recommence doit poser les mêmes trous.
 */
export function masquerMots(texte: string, part: number, alea: () => number): MotMasque[] {
  const mots = texte.split(/\s+/).filter(Boolean);
  const combien = Math.round(mots.length * part);
  if (combien <= 0) return mots.map((mot) => ({ mot, masque: false }));
  if (combien >= mots.length) return mots.map((mot) => ({ mot, masque: true }));

  const masques = new Set<number>();
  const taille = mots.length / combien;
  for (let i = 0; i < combien; i++) {
    const debut = Math.floor(i * taille);
    const fin = Math.max(debut + 1, Math.floor((i + 1) * taille));
    masques.add(debut + Math.floor(alea() * (fin - debut)));
  }
  return mots.map((mot, i) => ({ mot, masque: masques.has(i) }));
}

/**
 * La réussite d'une séance : ce qu'on a retrouvé sans aide.
 *
 * Un exercice sans mot masqué — le premier passage — vaut une réussite pleine :
 * on ne peut pas échouer à lire.
 */
export function reussiteDe(masques: number, indices: number): number {
  if (masques === 0) return 1;
  return Math.max(0, (masques - indices) / masques);
}
