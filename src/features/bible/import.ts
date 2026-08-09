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
const VERSIONS: { id: string; file: string }[] = [
  { id: 'ls1910', file: 'ls1910.json' },
  { id: 'darby', file: 'darby.json' },
  { id: 'martin1744', file: 'martin.json' },
  { id: 'ostervald', file: 'ostervald.json' },
  { id: 'cramp23', file: 'cramp23.json' },
  { id: 'sacc', file: 'sacc.json' },
  { id: 'perret', file: 'perret.json' },
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

  await bulkAddPassages(passages);
  present.add(versionId);
  return passages.length;
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
