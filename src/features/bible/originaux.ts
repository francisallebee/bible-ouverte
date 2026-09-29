import { bulkAddOriginaux, countOriginaux, refOriginale } from '@/lib/storage/originaux-store';
import type { MotOriginal, VersetOriginal } from '@/lib/storage/types';

/**
 * Le chargement des textes originaux depuis `public/originaux/`.
 *
 * **Un texte original n'est pas une version de la Bible**, et ne passe donc
 * pas par `features/bible/import.ts` : il n'a pas de `passageText`, ne peut
 * pas être choisi comme version de lecture, et n'a rien à faire dans
 * l'Historique. Il accompagne un lexique, et se coche avec lui.
 *
 * Règle 4 comme ailleurs : `fetch()` sur un fichier statique, jamais
 * `import()` — 25 Mo traverseraient webpack pour une donnée qui n'est que de
 * la donnée.
 */

/** Ce que `scripts/download-originaux.mjs` écrit. */
interface FichierOriginal {
  id: string;
  name: string;
  language: string;
  copyrightStatus: string;
  /**
   * La mention imposée par la licence.
   *
   * L'OSHB impose **sa formule exacte** ; la morphologie MorphGNT est en
   * CC BY-**SA** 3.0. Le champ voyage jusqu'ici pour que l'écran puisse la
   * porter, et `MotStrong` l'affiche avec la définition.
   */
  attribution?: string;
  source: string;
  books: {
    abbreviation: string;
    chapters: { c: number; verses: { v: number; w: MotOriginal[] }[] }[];
  }[];
}

/**
 * Le fichier de chaque texte original — **le troisième chemin**, comme pour
 * les versions et les lexiques.
 *
 * La clé est la **langue** et non un identifiant propre : c'est elle qui relie
 * le texte à son lexique (`he` → `strong-hebreu`), et c'est par elle que le
 * cache s'efface. Un texte déclaré ici sans entrée correspondante dans
 * `LEXIQUES_STRONG` ne serait jamais téléchargé, faute de case pour le
 * demander — `originaux.test.ts` croise les deux tables.
 */
export const ORIGINAUX: { langue: string; file: string; lexiqueId: string }[] = [
  { langue: 'he', file: 'oshb.json', lexiqueId: 'strong-hebreu' },
  { langue: 'el', file: 'sblgnt.json', lexiqueId: 'strong-grec' },
];

/** Le texte original attaché à un lexique, s'il y en a un. */
export function originalPourLexique(lexiqueId: string) {
  return ORIGINAUX.find((o) => o.lexiqueId === lexiqueId);
}

async function chargerOriginal(langue: string): Promise<FichierOriginal> {
  const source = ORIGINAUX.find((o) => o.langue === langue);
  if (!source) throw new Error(`Texte original inconnu : ${langue}`);

  const res = await fetch(`/originaux/${source.file}`);
  if (!res.ok) {
    throw new Error(`Téléchargement de ${source.file} impossible (${res.status})`);
  }
  return (await res.json()) as FichierOriginal;
}

/** Langues dont la présence en cache a déjà été constatée dans cette session. */
const present = new Set<string>();

export function oublierOriginalImporte(langue: string): void {
  present.delete(langue);
}

export async function importerTexteOriginal(langue: string): Promise<number> {
  if (present.has(langue)) return 0;

  const dejaLa = await countOriginaux(langue);
  if (dejaLa > 0) {
    present.add(langue);
    return dejaLa;
  }

  const fichier = await chargerOriginal(langue);

  // Le fichier est arborescent — livre, chapitre, verset — parce que c'est
  // ainsi qu'il se lit ; le cache est plat, parce que c'est ainsi qu'il
  // s'interroge. L'aplatissement se fait ici, une fois.
  const versets: VersetOriginal[] = [];
  for (const livre of fichier.books) {
    for (const chapitre of livre.chapters) {
      for (const verset of chapitre.verses) {
        versets.push({
          ref: refOriginale(livre.abbreviation, chapitre.c, verset.v),
          langue,
          book: livre.abbreviation,
          chapter: chapitre.c,
          verse: verset.v,
          mots: verset.w,
        });
      }
    }
  }

  const ecrits = await bulkAddOriginaux(langue, versets);
  present.add(langue);
  return ecrits;
}
