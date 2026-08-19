import type { BiblePassage } from '@/lib/storage/types';

/**
 * Le verset du jour : son choix et son décor, tous deux déterministes.
 *
 * **Le même verset toute la journée**, et le même pour un jour donné quel que
 * soit l'appareil. Un tirage au hasard changerait le verset à chaque
 * rafraîchissement, et deux appareils du même compte n'afficheraient pas la
 * même chose — un « verset du jour » qui varie n'en est pas un.
 *
 * Le décor suit la même règle : le dégradé se déduit de la référence, donc il
 * ne bouge pas non plus. **Aucun fichier n'est téléchargé** — pas d'image, pas
 * de musique. C'est un choix : une banque d'images pèserait sur un dépôt qui
 * fait déjà 82 Mo, poserait la question de la licence, et aucun navigateur ne
 * lance une musique sans un geste de l'utilisateur.
 */

/**
 * Un condensé stable d'une chaîne.
 *
 * FNV-1a, pour une raison précise : il tient en cinq lignes, ne dépend d'aucune
 * bibliothèque, et distribue assez bien pour que deux références voisines —
 * « Jean 3:16 » et « Jean 3:17 » — ne donnent pas la même teinte.
 */
export function condense(texte: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    // Le décalage plutôt que la multiplication : en JavaScript, `h * 16777619`
    // dépasse la précision entière et perd des bits de poids faible.
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/**
 * Le verset du jour, tiré des lectures de l'utilisateur.
 *
 * L'indice vient du **jour**, pas du hasard : le même jour rend toujours le
 * même verset. Deux jours consécutifs en donnent deux différents tant que la
 * matière compte plus d'un verset, le condensé changeant à chaque date.
 *
 * Rend `null` sans matière : c'est à l'écran de proposer d'enregistrer une
 * lecture, pas à cette fonction d'inventer un verset.
 */
export function versetDuJour(versets: BiblePassage[], jour: string): BiblePassage | null {
  if (versets.length === 0) return null;
  // Le tri rend le choix indépendant de l'ordre d'arrivée des versets, qui
  // dépend du cache et n'a aucune raison d'être le même d'un appareil à l'autre.
  const ordonnes = [...versets].sort((a, b) =>
    a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse);
  return ordonnes[condense(jour) % ordonnes.length];
}

export interface Degrade {
  /** La valeur CSS complète, prête pour `background-image`. */
  css: string;
  /** Vrai si le fond est sombre, pour choisir la couleur du texte. */
  sombre: boolean;
}

/**
 * Le décor d'un verset : un dégradé à trois teintes, déduit de sa référence.
 *
 * Les trois teintes sont espacées sur le cercle chromatique plutôt que tirées
 * séparément : trois teintes indépendantes donnent souvent trois voisines, et
 * le dégradé paraît alors plat.
 *
 * La luminosité est bornée : au-dessus, le texte blanc devient illisible ; en
 * dessous, le dégradé vire au noir et perd son intérêt. C'est aussi ce qui
 * permet d'affirmer que le fond est toujours assez sombre pour du texte clair.
 */
export function degradeDe(reference: string): Degrade {
  const h = condense(reference);
  const teinte = h % 360;
  const ecart = 30 + (h >> 9) % 40;
  const angle = 100 + (h >> 17) % 80;

  const couleur = (t: number, l: number) => `hsl(${(t + 360) % 360} 70% ${l}%)`;
  return {
    css: `linear-gradient(${angle}deg, ${couleur(teinte, 32)}, ${couleur(teinte + ecart, 44)}, ${couleur(teinte + 2 * ecart, 38)})`,
    sombre: true,
  };
}

/** La date locale au format `AAAA-MM-JJ`, qui sert de graine au jour. */
export function jourLocal(date: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
