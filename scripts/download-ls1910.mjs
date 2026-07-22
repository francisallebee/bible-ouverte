import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://raw.githubusercontent.com/midvash/bible-data/main/versions/fr/lsg/books';

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

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  const outputPath = path.resolve('src/data/bibles/ls1910.json');
  const books = [];

  for (const bookMeta of OSIS_BOOKS) {
    const url = `${BASE_URL}/${bookMeta.osis}.json`;
    const raw = await fetchJson(url);

    const chapters = raw.chapters.map((ch) => ({
      chapter: ch.chapter,
      verses: ch.verses.map((v) => ({
        verse: v.number,
        text: v.text,
      })),
    }));

    books.push({
      abbreviation: bookMeta.abbr,
      name: bookMeta.name,
      chapters,
    });

    console.log(`  ✓ ${bookMeta.abbr} (${bookMeta.name}) — ${chapters.length} chapitres`);
  }

  const bible = {
    id: 'ls1910',
    name: 'Louis Segond 1910',
    language: 'fr',
    copyrightStatus: 'public-domain',
    source: 'bundled',
    books,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(bible, null, 2), 'utf-8');

  const totalVerses = books.reduce(
    (sum, b) => sum + b.chapters.reduce((s, c) => s + c.verses.length, 0),
    0,
  );

  console.log(`\n✓ Fichier écrit: ${outputPath}`);
  console.log(`✓ Livres: ${books.length}`);
  console.log(`✓ Versets: ${totalVerses}`);
}

main().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
