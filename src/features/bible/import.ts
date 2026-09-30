import { bulkAddPassages, countPassages } from '@/lib/storage/passage-store';
import { getEnabledVersions } from '@/lib/storage/version-store';
import type { BiblePassage } from '@/lib/storage/types';

interface SourceVerse {
  verse: number;
  text: string;
}

interface SourceChapter {
  chapter: number;
  verses: SourceVerse[];
}

interface SourceBook {
  abbreviation: string;
  name: string;
  chapters: SourceChapter[];
}

interface SourceBible {
  id: string;
  name: string;
  language: string;
  copyrightStatus: string;
  source: string;
  books: SourceBook[];
}

/**
 * Les six traductions pèsent 40 Mo. Elles étaient chargées par `import()`, ce
 * qui les faisait traverser webpack : autant de chunks JavaScript à produire à
 * chaque build et à parser au chargement. Servies depuis public/, ce sont de
 * simples fichiers statiques que le navigateur récupère et met en cache.
 */
/**
 * Le nom de fichier de chaque version — **le troisième chemin**.
 *
 * Ajouter une version demande trois gestes, et l'oubli du dernier ne se voit
 * qu'à l'usage : une entrée dans `scripts/download-bible-versions.mjs`, une
 * ligne dans `TEXT_VERSIONS` de `lib/storage/seed.ts`, et une ici. Sans cette
 * dernière, la version apparaît dans les Réglages, se laisse cocher, et
 * `loadData` lève « Version inconnue » — l'utilisateur ne voit qu'un échec de
 * téléchargement.
 *
 * C'est arrivé le 16 août 2026 aux quatre versions non françaises, déjà
 * déployées quand le manque a été trouvé. `import.test.ts` compare désormais
 * cette table à `TEXT_VERSIONS` : un oubli ne compile plus jusqu'aux tests.
 */
/**
 * Le troisième geste de la règle 13 — et depuis le 30 septembre 2026, le poids.
 *
 * `octets` est la taille **du fichier servi**, relevée sur le disque et non
 * estimée. Elle sert à dire au lecteur ce qu'une case va lui coûter avant
 * qu'il ne la coche, ce que « environ 6 Mo chacune » sous-estimait de 4 Mo
 * pour la Van Dyck.
 *
 * Ce n'est **pas** la place prise en cache : IndexedDB range des lignes, pas
 * un fichier. Les deux se sont trouvées du même ordre à la mesure du 9 août
 * 2026 (sept versions, 42 Mo pour 43 Mo de fichiers), mais le chiffre honnête
 * pour l'occupation réelle vient de `navigator.storage.estimate()` — voir
 * `lib/storage/occupation.ts`.
 *
 * `import.test.ts` croise ces valeurs avec la taille réelle des fichiers : un
 * retéléchargement qui changerait un poids sans toucher cette table le
 * périmerait en silence, et le lecteur lirait un chiffre faux.
 */
export const VERSIONS: { id: string; file: string; octets: number }[] = [
  { id: 'ls1910', file: 'ls1910.json', octets: 6786199 },
  { id: 'darby', file: 'darby.json', octets: 7083903 },
  { id: 'martin1744', file: 'martin.json', octets: 7261437 },
  { id: 'ostervald', file: 'ostervald.json', octets: 6879550 },
  { id: 'cramp23', file: 'cramp23.json', octets: 6841729 },
  { id: 'sacc', file: 'sacc.json', octets: 7034956 },
  { id: 'perret', file: 'perret.json', octets: 6911011 },
  { id: 'kjv', file: 'kjv.json', octets: 6715375 },
  { id: 'diodati', file: 'diodati.json', octets: 6902927 },
  { id: 'svd', file: 'svd.json', octets: 10028474 },
  { id: 'rv1909', file: 'rv1909.json', octets: 6516751 },
  { id: 'annotee', file: 'annotee.json', octets: 6825983 },
];

async function loadData(versionId: string): Promise<SourceBible> {
  const version = VERSIONS.find((v) => v.id === versionId);
  if (!version) throw new Error(`Version inconnue: ${versionId}`);

  const res = await fetch(`/bibles/${version.file}`);
  if (!res.ok) {
    throw new Error(`Téléchargement de ${version.file} impossible (${res.status})`);
  }
  return (await res.json()) as SourceBible;
}

/**
 * Versions dont la présence en cache a déjà été constatée dans cette session.
 *
 * `countPassages` parcourt un index de plus de 200 000 entrées : compter les
 * sept versions coûtait près d'une seconde, et `seedIfNeeded` le refaisait à
 * chaque chargement de page pour aboutir invariablement à « rien à importer ».
 * Le module survit aux navigations côté client, donc ce constat n'est fait
 * qu'une fois.
 */
const present = new Set<string>();

/** À appeler quand les versets d'une version sont effacés du cache. */
export function forgetImportedVersion(versionId: string): void {
  present.delete(versionId);
}

export async function importBibleVersion(versionId: string): Promise<number> {
  if (present.has(versionId)) return 0;

  const existingCount = await countPassages(versionId);
  if (existingCount > 0) {
    present.add(versionId);
    return existingCount;
  }

  const data = await loadData(versionId);
  const passages: BiblePassage[] = [];

  for (const book of data.books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        passages.push({
          versionId,
          book: book.abbreviation,
          chapter: chapter.chapter,
          verse: verse.verse,
          text: verse.text,
        });
      }
    }
  }

  // `bulkAddPassages` recompte dans sa propre transaction et renonce si la
  // version est arrivée entre-temps : le comptage ci-dessus ne protège que
  // d'un travail inutile, pas d'un doublon.
  const ecrits = await bulkAddPassages(versionId, passages);
  present.add(versionId);
  return ecrits;
}

/**
 * Importe les seules versions actives.
 *
 * Auparavant les sept étaient importées sans condition : 47 Mo à télécharger
 * et 42 Mo en cache par appareil, quel que soit l'usage réel. La case à cocher
 * des réglages, elle, ne servait à rien — aucun code ne lisait `isEnabled`.
 * C'est désormais elle qui commande ce qui est téléchargé.
 */
export async function importEnabledBibleData(): Promise<Record<string, number>> {
  const enabled = await getEnabledVersions();
  const known = new Set(VERSIONS.map(v => v.id));
  const results: Record<string, number> = {};
  for (const version of enabled) {
    if (!known.has(version.id)) continue;
    results[version.id] = await importBibleVersion(version.id);
  }
  return results;
}
