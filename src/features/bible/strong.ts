import { bulkAddEntrees, countEntrees, getEnabledLexiques } from '@/lib/storage/strong-store';
import type { EntreeStrong } from '@/lib/storage/types';

/**
 * Le chargement des lexiques Strong depuis `public/strong/`.
 *
 * Jumeau de `features/bible/import.ts`, et pour les mêmes raisons. En
 * particulier la **règle 4** : `fetch()` sur un fichier statique, jamais
 * `import()`. Les 4,0 Mio des deux lexiques traverseraient sinon webpack, qui
 * en ferait des chunks JavaScript à produire à chaque build et à analyser au
 * chargement — pour une donnée qui n'est que de la donnée.
 */

/** Ce que `scripts/download-strong.mjs` écrit. */
interface FichierLexique {
  id: string;
  name: string;
  language: string;
  copyrightStatus: string;
  /**
   * La mention à afficher avec les définitions.
   *
   * Le dépôt source ne déclare aucune licence, mais l'en-tête de chaque
   * fichier revendique une CC BY-SA : l'œuvre de 1890 est du domaine public,
   * sa mise en forme se réclame du copyleft. Le champ est transporté jusqu'ici
   * pour que l'écran puisse la porter le jour où il affichera une définition —
   * c'est exactement ce que `spec/DROITS.md` prévoit pour `copyrightStatus`,
   * appliqué d'avance plutôt qu'après coup.
   */
  attribution?: string;
  source: string;
  entries: Omit<EntreeStrong, 'lexiqueId'>[];
}

/**
 * Le nom de fichier de chaque lexique — **le troisième chemin**.
 *
 * Ajouter un lexique demande trois gestes, et l'oubli du dernier ne se voit
 * qu'à l'usage : une entrée dans `scripts/download-strong.mjs` pour produire
 * le fichier, une ligne dans `LEXIQUES_STRONG` de `lib/storage/seed.ts` pour
 * qu'il apparaisse aux Réglages, et une ici pour que `chargerLexique` sache
 * où le chercher.
 *
 * C'est le piège de la règle 13, arrivé en production le 16 août 2026 à quatre
 * versions de la Bible : elles s'affichaient, se laissaient cocher, et
 * l'activation levait « Version inconnue ». `strong.test.ts` compare les deux
 * tables dans les deux sens, comme `import.test.ts` le fait pour les versions.
 */
export const LEXIQUES: { id: string; file: string }[] = [
  { id: 'strong-hebreu', file: 'hebreu.json' },
  { id: 'strong-grec', file: 'grec.json' },
];

async function chargerLexique(lexiqueId: string): Promise<FichierLexique> {
  const lexique = LEXIQUES.find((l) => l.id === lexiqueId);
  if (!lexique) throw new Error(`Lexique Strong inconnu : ${lexiqueId}`);

  const res = await fetch(`/strong/${lexique.file}`);
  if (!res.ok) {
    throw new Error(`Téléchargement de ${lexique.file} impossible (${res.status})`);
  }
  return (await res.json()) as FichierLexique;
}

/**
 * Lexiques dont la présence en cache a déjà été constatée dans cette session.
 *
 * Même mémoire que celle de `import.ts`, et pour le même motif : `countEntrees`
 * interroge un index, et la barre latérale comme le `useEffect` de chaque écran
 * appellent l'amorçage à chaque montage. Le module survit aux navigations côté
 * client, donc le constat n'est fait qu'une fois.
 */
const present = new Set<string>();

/** À appeler quand les entrées d'un lexique sont effacées du cache. */
export function oublierLexiqueImporte(lexiqueId: string): void {
  present.delete(lexiqueId);
}

export async function importerLexiqueStrong(lexiqueId: string): Promise<number> {
  if (present.has(lexiqueId)) return 0;

  const dejaLa = await countEntrees(lexiqueId);
  if (dejaLa > 0) {
    present.add(lexiqueId);
    return dejaLa;
  }

  const fichier = await chargerLexique(lexiqueId);

  // `lexiqueId` est ajouté ici plutôt que porté par le fichier : il sert
  // l'index du cache, pas la donnée, et le répéter 14 197 fois dans un JSON
  // servi sur le réseau coûterait sans rien apprendre.
  const entrees: EntreeStrong[] = fichier.entries.map((e) => ({ ...e, lexiqueId }));

  const ecrites = await bulkAddEntrees(lexiqueId, entrees);
  present.add(lexiqueId);
  return ecrites;
}

/**
 * Importe les seuls lexiques actifs.
 *
 * Volontairement **séparé** d'`importEnabledBibleData` : un échec de l'un ne
 * doit pas priver l'autre. Le texte biblique est le cœur du produit, le
 * lexique un supplément ; les enchaîner dans un même `try` ferait dépendre le
 * premier du second.
 */
export async function importerLexiquesActifs(): Promise<Record<string, number>> {
  const actifs = await getEnabledLexiques();
  const connus = new Set(LEXIQUES.map((l) => l.id));
  const resultats: Record<string, number> = {};
  for (const lexique of actifs) {
    if (!connus.has(lexique.id)) continue;
    resultats[lexique.id] = await importerLexiqueStrong(lexique.id);
  }
  return resultats;
}
