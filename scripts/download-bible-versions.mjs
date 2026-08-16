import fs from 'fs';
import path from 'path';

const OSIS_BOOKS = [
  { osis: 'Gen', abbr: 'GEN', name: 'Genèse' },
  { osis: 'Exod', abbr: 'EXO', name: 'Exode' },
  { osis: 'Lev', abbr: 'LEV', name: 'Lévitique' },
  { osis: 'Num', abbr: 'NUM', name: 'Nombres' },
  { osis: 'Deut', abbr: 'DEU', name: 'Deutéronome' },
  { osis: 'Josh', abbr: 'JOS', name: 'Josué' },
  { osis: 'Judg', abbr: 'JDG', name: 'Juges' },
  { osis: 'Ruth', abbr: 'RUT', name: 'Ruth' },
  { osis: '1Sam', abbr: '1SA', name: '1 Samuel' },
  { osis: '2Sam', abbr: '2SA', name: '2 Samuel' },
  { osis: '1Kgs', abbr: '1KI', name: '1 Rois' },
  { osis: '2Kgs', abbr: '2KI', name: '2 Rois' },
  { osis: '1Chr', abbr: '1CH', name: '1 Chroniques' },
  { osis: '2Chr', abbr: '2CH', name: '2 Chroniques' },
  { osis: 'Ezra', abbr: 'EZR', name: 'Esdras' },
  { osis: 'Neh', abbr: 'NEH', name: 'Néhémie' },
  { osis: 'Esth', abbr: 'EST', name: 'Esther' },
  { osis: 'Job', abbr: 'JOB', name: 'Job' },
  { osis: 'Ps', abbr: 'PSA', name: 'Psaumes' },
  { osis: 'Prov', abbr: 'PRO', name: 'Proverbes' },
  { osis: 'Eccl', abbr: 'ECC', name: 'Ecclésiaste' },
  { osis: 'Song', abbr: 'SNG', name: 'Cantique des Cantiques' },
  { osis: 'Isa', abbr: 'ISA', name: 'Ésaïe' },
  { osis: 'Jer', abbr: 'JER', name: 'Jérémie' },
  { osis: 'Lam', abbr: 'LAM', name: 'Lamentations' },
  { osis: 'Ezek', abbr: 'EZK', name: 'Ézékiel' },
  { osis: 'Dan', abbr: 'DAN', name: 'Daniel' },
  { osis: 'Hos', abbr: 'HOS', name: 'Osée' },
  { osis: 'Joel', abbr: 'JOL', name: 'Joël' },
  { osis: 'Amos', abbr: 'AMO', name: 'Amos' },
  { osis: 'Obad', abbr: 'OBA', name: 'Abdias' },
  { osis: 'Jonah', abbr: 'JON', name: 'Jonas' },
  { osis: 'Mic', abbr: 'MIC', name: 'Michée' },
  { osis: 'Nah', abbr: 'NAM', name: 'Nahum' },
  { osis: 'Hab', abbr: 'HAB', name: 'Habacuc' },
  { osis: 'Zeph', abbr: 'ZEP', name: 'Sophonie' },
  { osis: 'Hag', abbr: 'HAG', name: 'Aggée' },
  { osis: 'Zech', abbr: 'ZEC', name: 'Zacharie' },
  { osis: 'Mal', abbr: 'MAL', name: 'Malachie' },
  { osis: 'Matt', abbr: 'MAT', name: 'Matthieu' },
  { osis: 'Mark', abbr: 'MRK', name: 'Marc' },
  { osis: 'Luke', abbr: 'LUK', name: 'Luc' },
  { osis: 'John', abbr: 'JHN', name: 'Jean' },
  { osis: 'Acts', abbr: 'ACT', name: 'Actes' },
  { osis: 'Rom', abbr: 'ROM', name: 'Romains' },
  { osis: '1Cor', abbr: '1CO', name: '1 Corinthiens' },
  { osis: '2Cor', abbr: '2CO', name: '2 Corinthiens' },
  { osis: 'Gal', abbr: 'GAL', name: 'Galates' },
  { osis: 'Eph', abbr: 'EPH', name: 'Éphésiens' },
  { osis: 'Phil', abbr: 'PHP', name: 'Philippiens' },
  { osis: 'Col', abbr: 'COL', name: 'Colossiens' },
  { osis: '1Thess', abbr: '1TH', name: '1 Thessaloniciens' },
  { osis: '2Thess', abbr: '2TH', name: '2 Thessaloniciens' },
  { osis: '1Tim', abbr: '1TI', name: '1 Timothée' },
  { osis: '2Tim', abbr: '2TI', name: '2 Timothée' },
  { osis: 'Titus', abbr: 'TIT', name: 'Tite' },
  { osis: 'Phlm', abbr: 'PHM', name: 'Philémon' },
  { osis: 'Heb', abbr: 'HEB', name: 'Hébreux' },
  { osis: 'Jas', abbr: 'JAS', name: 'Jacques' },
  { osis: '1Pet', abbr: '1PE', name: '1 Pierre' },
  { osis: '2Pet', abbr: '2PE', name: '2 Pierre' },
  { osis: '1John', abbr: '1JN', name: '1 Jean' },
  { osis: '2John', abbr: '2JN', name: '2 Jean' },
  { osis: '3John', abbr: '3JN', name: '3 Jean' },
  { osis: 'Jude', abbr: 'JUD', name: 'Jude' },
  { osis: 'Rev', abbr: 'REV', name: 'Apocalypse' },
];

/**
 * `lang` est le segment de langue de `midvash/bible-data`, et vaut `fr` par
 * défaut — c'est ce que le script supposait quand il ne servait qu'au français.
 *
 * Le `name` français des livres, lui, reste tel quel dans les fichiers produits :
 * `features/bible/import.ts` ne lit que `abbreviation`, et l'affichage passe par
 * `i18n/books.ts`. Le champ est décoratif, le traduire ne changerait rien.
 */
const VERSIONS = [
  {
    id: 'darby',
    name: 'Bible Darby 1885',
    slug: 'darby-fr',
    output: 'darby.json',
    source: 'midvash',
  },
  {
    id: 'martin1744',
    name: 'Bible David Martin 1744',
    slug: 'martin1744',
    output: 'martin.json',
    source: 'midvash',
  },
  {
    id: 'ostervald',
    name: 'Bible Ostervald 1996',
    slug: null,
    output: 'ostervald.json',
    source: 'sourceforge',
    sourceforgeFile: 'oster.json',
  },

  // Les langues de l'interface, ajoutées le 16 août 2026. Chacune est du
  // domaine public et complète : Genèse 50, Exode 40, Psaumes 150, Cantique 8,
  // Malachie 4 et Apocalypse 22 ont été comptés avant téléchargement.
  {
    id: 'kjv',
    name: 'King James Version 1611',
    lang: 'en',
    slug: 'kjv',
    output: 'kjv.json',
    source: 'midvash',
  },
  {
    id: 'diodati',
    name: 'Giovanni Diodati 1649',
    lang: 'it',
    slug: 'diodati',
    output: 'diodati.json',
    source: 'midvash',
  },
  {
    id: 'svd',
    name: 'Smith & Van Dyck 1865',
    lang: 'ar',
    slug: 'svd',
    output: 'svd.json',
    source: 'midvash',
  },
  {
    id: 'rv1909',
    name: 'Reina-Valera 1909',
    lang: 'es',
    output: 'rv1909.json',
    source: 'scrollmapper',
    scrollmapperFile: 'SpaRV.json',
  },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function countVerses(books) {
  return books.reduce((sum, b) => sum + b.chapters.reduce((s, c) => s + c.verses.length, 0), 0);
}

async function downloadFromMidvash(slug, lang = 'fr') {
  const base = `https://raw.githubusercontent.com/midvash/bible-data/main/versions/${lang}/${slug}/books`;
  const books = [];
  for (const bookMeta of OSIS_BOOKS) {
    const url = `${base}/${bookMeta.osis}.json`;
    const raw = await fetchJson(url);
    const chapters = raw.chapters.map((ch) => ({
      chapter: ch.chapter,
      verses: ch.verses.map((v) => ({ verse: v.number, text: v.text })),
    }));
    books.push({ abbreviation: bookMeta.abbr, name: bookMeta.name, chapters });
    console.log(`  ✓ ${bookMeta.abbr}`);
  }
  return books;
}

/**
 * `scrollmapper/bible_databases` — 140 versions, et la seule source trouvée
 * pour l'espagnol : `midvash` porte 22 langues, mais pas la sienne.
 *
 * Le fichier est d'un seul tenant, et ses livres portent des noms anglais
 * (« Revelation of John » et non « Rev »). La correspondance se fait donc par
 * **position** : les deux listes suivent l'ordre canonique et comptent 66
 * entrées, ce que la garde ci-dessous vérifie plutôt que de le supposer.
 */
async function downloadFromScrollmapper(fichier) {
  const url = `https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/${fichier}`;
  const raw = await fetchJson(url);

  if (raw.books.length !== OSIS_BOOKS.length) {
    throw new Error(
      `${fichier} : ${raw.books.length} livres au lieu de ${OSIS_BOOKS.length}`,
    );
  }

  return raw.books.map((livre, i) => {
    const meta = OSIS_BOOKS[i];
    console.log(`  ✓ ${meta.abbr}`);
    return {
      abbreviation: meta.abbr,
      name: meta.name,
      chapters: livre.chapters.map((ch) => ({
        chapter: ch.chapter,
        verses: ch.verses.map((v) => ({ verse: v.verse, text: v.text })),
      })),
    };
  });
}

async function downloadFromSourceforge(sourceforgeFile) {
  const url = `https://sourceforge.net/projects/biblesuper/files/All%20Bibles%20-%20JSON/FR-French/${sourceforgeFile}/download`;
  const raw = await fetchJson(url);

  const nameMap = {
    'Psaume': 'Psaumes',
    'Cantique Des Cantiqu': 'Cantique des Cantiques',
    'Ézéchiel': 'Ézékiel',
  };

  const books = [];
  const bookMap = {};
  for (const bookMeta of OSIS_BOOKS) {
    bookMap[bookMeta.name] = bookMeta;
    const alt = Object.entries(nameMap).find(([, v]) => v === bookMeta.name)?.[0];
    if (alt) bookMap[alt] = bookMeta;
  }

  const byBook = {};
  for (const v of raw.verses) {
    if (!byBook[v.book_name]) {
      byBook[v.book_name] = [];
    }
    byBook[v.book_name].push(v);
  }

  for (const [bookName, verses] of Object.entries(byBook)) {
    const meta = bookMap[bookName];
    if (!meta) {
      console.warn(`  ⚠ Livre inconnu: "${bookName}"`);
      continue;
    }
    const chapters = [];
    const byChapter = {};
    for (const v of verses) {
      if (!byChapter[v.chapter]) byChapter[v.chapter] = [];
      byChapter[v.chapter].push({ verse: v.verse, text: v.text });
    }
    for (const [chNum, chVerses] of Object.entries(byChapter)) {
      chapters.push({ chapter: Number(chNum), verses: chVerses });
    }
    chapters.sort((a, b) => a.chapter - b.chapter);
    books.push({ abbreviation: meta.abbr, name: meta.name, chapters });
    console.log(`  ✓ ${meta.abbr}`);
  }

  return books;
}

async function main() {
  const outputDir = path.resolve('public/bibles');
  fs.mkdirSync(outputDir, { recursive: true });

  /**
   * Sans argument, tout est retéléchargé — 47 Mo et sept versions, ce qui n'a
   * de sens qu'au premier remplissage. Avec des identifiants en argument, seules
   * ces versions-là sont reprises :
   *
   *   node scripts/download-bible-versions.mjs kjv diodati svd
   */
  const demandees = process.argv.slice(2);
  const aTraiter = demandees.length
    ? VERSIONS.filter((v) => demandees.includes(v.id))
    : VERSIONS;

  const inconnues = demandees.filter((d) => !VERSIONS.some((v) => v.id === d));
  if (inconnues.length) {
    console.error(`Version inconnue : ${inconnues.join(', ')}`);
    process.exit(1);
  }

  for (const version of aTraiter) {
    console.log(`\n--- ${version.name} ---`);
    const outputPath = path.join(outputDir, version.output);

    let books;
    if (version.source === 'midvash') {
      books = await downloadFromMidvash(version.slug, version.lang ?? 'fr');
    } else if (version.source === 'sourceforge') {
      books = await downloadFromSourceforge(version.sourceforgeFile);
    } else if (version.source === 'scrollmapper') {
      books = await downloadFromScrollmapper(version.scrollmapperFile);
    }

    const bible = {
      id: version.id,
      name: version.name,
      language: version.lang ?? 'fr',
      copyrightStatus: 'public-domain',
      source: 'bundled',
      books,
    };

    fs.writeFileSync(outputPath, JSON.stringify(bible, null, 2), 'utf-8');
    const total = countVerses(books);
    console.log(`  → ${outputPath} — ${books.length} livres, ${total} versets`);
  }

  console.log('\n✓ Toutes les versions téléchargées avec succès.');
}

main().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
