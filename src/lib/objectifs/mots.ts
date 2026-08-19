/**
 * Le poids en mots d'un chapitre et d'un verset, livre par livre.
 *
 * **Produit par `node scripts/mesure-mots.mjs`. Ne pas modifier à la main.**
 *
 * Mesuré sur Louis Segond 1910 : 722 968 mots, 31102 versets,
 * 1189 chapitres. La moyenne générale — 608 mots par chapitre — ne
 * suffisait pas : les Psaumes en font 268, les Rois 1015. Un facteur de près
 * de quatre, que l'estimation aurait porté en entier.
 *
 * Les clés sont les abréviations USFM, celles que `readings.book` stocke.
 */
export interface MotsDuLivre {
  /** Mots d'un chapitre moyen de ce livre. */
  chapitre: number
  /** Mots d'un verset moyen de ce livre. */
  verset: number
}

export const MOTS_PAR_LIVRE: Record<string, MotsDuLivre> = {
  'GEN': { chapitre: 692, verset: 23 },
  'EXO': { chapitre: 712, verset: 23 },
  'LEV': { chapitre: 785, verset: 25 },
  'NUM': { chapitre: 790, verset: 22 },
  'DEU': { chapitre: 765, verset: 27 },
  'JOS': { chapitre: 688, verset: 25 },
  'JDG': { chapitre: 807, verset: 27 },
  'RUT': { chapitre: 572, verset: 27 },
  '1SA': { chapitre: 726, verset: 28 },
  '2SA': { chapitre: 772, verset: 27 },
  '1KI': { chapitre: 1015, verset: 27 },
  '2KI': { chapitre: 837, verset: 29 },
  '1CH': { chapitre: 616, verset: 19 },
  '2CH': { chapitre: 661, verset: 29 },
  'EZR': { chapitre: 654, verset: 23 },
  'NEH': { chapitre: 728, verset: 23 },
  'EST': { chapitre: 531, verset: 32 },
  'JOB': { chapitre: 399, verset: 16 },
  'PSA': { chapitre: 268, verset: 16 },
  'PRO': { chapitre: 477, verset: 16 },
  'ECC': { chapitre: 463, verset: 25 },
  'SNG': { chapitre: 325, verset: 22 },
  'ISA': { chapitre: 507, verset: 26 },
  'JER': { chapitre: 737, verset: 28 },
  'LAM': { chapitre: 646, verset: 21 },
  'EZK': { chapitre: 727, verset: 27 },
  'DAN': { chapitre: 907, verset: 30 },
  'HOS': { chapitre: 332, verset: 24 },
  'JOL': { chapitre: 594, verset: 24 },
  'AMO': { chapitre: 416, verset: 26 },
  'OBA': { chapitre: 564, verset: 27 },
  'JON': { chapitre: 299, verset: 25 },
  'MIC': { chapitre: 394, verset: 26 },
  'NAM': { chapitre: 363, verset: 23 },
  'HAB': { chapitre: 470, verset: 25 },
  'ZEP': { chapitre: 482, verset: 27 },
  'HAG': { chapitre: 497, verset: 26 },
  'ZEC': { chapitre: 393, verset: 26 },
  'MAL': { chapitre: 411, verset: 30 },
  'MAT': { chapitre: 791, verset: 21 },
  'MRK': { chapitre: 867, verset: 20 },
  'LUK': { chapitre: 997, verset: 21 },
  'JHN': { chapitre: 871, verset: 21 },
  'ACT': { chapitre: 807, verset: 22 },
  'ROM': { chapitre: 599, verset: 22 },
  '1CO': { chapitre: 590, verset: 22 },
  '2CO': { chapitre: 487, verset: 25 },
  'GAL': { chapitre: 526, verset: 21 },
  'EPH': { chapitre: 511, verset: 20 },
  'PHP': { chapitre: 561, verset: 22 },
  'COL': { chapitre: 520, verset: 22 },
  '1TH': { chapitre: 389, verset: 22 },
  '2TH': { chapitre: 356, verset: 23 },
  '1TI': { chapitre: 395, verset: 21 },
  '2TI': { chapitre: 413, verset: 20 },
  'TIT': { chapitre: 317, verset: 21 },
  'PHM': { chapitre: 446, verset: 18 },
  'HEB': { chapitre: 533, verset: 23 },
  'JAS': { chapitre: 473, verset: 22 },
  '1PE': { chapitre: 491, verset: 23 },
  '2PE': { chapitre: 523, verset: 26 },
  '1JN': { chapitre: 507, verset: 24 },
  '2JN': { chapitre: 316, verset: 24 },
  '3JN': { chapitre: 308, verset: 22 },
  'JUD': { chapitre: 612, verset: 24 },
  'REV': { chapitre: 524, verset: 29 },
}

/** Pour un livre inconnu de la table — aucun aujourd'hui, mais rien ne l'interdit. */
export const MOTS_DEFAUT: MotsDuLivre = { chapitre: 608, verset: 23 }
