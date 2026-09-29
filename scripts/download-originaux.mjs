import fs from 'fs';
import path from 'path';

/**
 * Conversion des textes originaux — hébreu (OSHB) et grec (SBLGNT/MorphGNT).
 *
 * Le relevé de forme des deux sources est dans `spec/DICTIONNAIRE-STRONG.md`,
 * et il n'était pas devinable. Ce qui en découle ici :
 *
 * **L'hébreu porte ses numéros Strong, le grec non.** C'est l'asymétrie de
 * fond. Côté hébreu, `lemma` n'est pas un numéro mais un assemblage —
 * `c/6735 a` vaut « préfixe conjonction + Strong 6735 + lettre d'homonyme » —,
 * qu'il faut découper en trois gestes. Côté grec, il n'y a aucun numéro : le
 * raccord se fait du lemme vers le lexique, et c'est tout l'objet de
 * `resoudreStrongGrec()`.
 *
 * **La ponctuation hébraïque est hors des mots.** Maqqef et sof-pasuq sont des
 * `<seg>` entre les `<w>`, jamais dedans : 42 577 et 23 192 d'entre eux. Un
 * rendu qui ne ramasserait que les `<w>` rendrait un texte faux — mots
 * recollés sans trait d'union, versets sans point final. Ils sont donc portés
 * par le champ `a` du mot précédent.
 *
 * **Les notes sont dans le verset, entre deux mots**, et en anglais : 2 472
 * d'entre elles. Une extraction naïve des descendants injecterait de la prose
 * anglaise au milieu de l'hébreu. Elles sont sautées explicitement.
 *
 * Forme de sortie — mesurée le 29 septembre 2026, pas supposée :
 *
 * | | hébreu | grec |
 * |---|---|---|
 * | clés lisibles, indenté | 29,7 Mio | 13,1 Mio |
 * | clés courtes, compact  | **17,8 Mio** | **8,0 Mio** |
 *
 * D'où le choix des **clés d'une lettre et du JSON compact**, qui s'écarte de
 * `public/bibles/` — indenté et lisible. L'écart est assumé parce que l'échelle
 * l'est aussi : 306 785 mots portent chacun leurs clés, là où un verset de
 * traduction n'en porte que deux. L'indentation coûterait ici 12 Mio.
 *
 * La morphologie est **gardée** : 4,6 Mio pour ce qui fait l'intérêt de l'OSHB,
 * et la retirer obligerait à retélécharger 28 Mo de XML le jour où un écran
 * voudra gloser la grammaire.
 *
 * Usage :
 *   node scripts/download-originaux.mjs           # les deux
 *   node scripts/download-originaux.mjs grec      # un seul
 *
 * Depuis un bac à sable dont la sortie réseau passe par un proxy, préfixer par
 * `NODE_USE_ENV_PROXY=1` — même piège que `download-strong.mjs`.
 */

/** Les 39 livres de l'OSHB : nom OSIS du fichier → abréviation USFM du dépôt. */
const LIVRES_OSHB = [
  ['Gen', 'GEN'], ['Exod', 'EXO'], ['Lev', 'LEV'], ['Num', 'NUM'], ['Deut', 'DEU'],
  ['Josh', 'JOS'], ['Judg', 'JDG'], ['Ruth', 'RUT'], ['1Sam', '1SA'], ['2Sam', '2SA'],
  ['1Kgs', '1KI'], ['2Kgs', '2KI'], ['1Chr', '1CH'], ['2Chr', '2CH'], ['Ezra', 'EZR'],
  ['Neh', 'NEH'], ['Esth', 'EST'], ['Job', 'JOB'], ['Ps', 'PSA'], ['Prov', 'PRO'],
  ['Eccl', 'ECC'], ['Song', 'SNG'], ['Isa', 'ISA'], ['Jer', 'JER'], ['Lam', 'LAM'],
  ['Ezek', 'EZK'], ['Dan', 'DAN'], ['Hos', 'HOS'], ['Joel', 'JOL'], ['Amos', 'AMO'],
  ['Obad', 'OBA'], ['Jonah', 'JON'], ['Mic', 'MIC'], ['Nah', 'NAM'], ['Hab', 'HAB'],
  ['Zeph', 'ZEP'], ['Hag', 'HAG'], ['Zech', 'ZEC'], ['Mal', 'MAL'],
];

/**
 * Les 27 fichiers du MorphGNT : nom de fichier → abréviation USFM.
 *
 * **Piège relevé le 29 septembre** : les fichiers vont de `61-Mt` à `87-Re`,
 * mais la référence *à l'intérieur* commence à `01` pour Matthieu. Deux
 * numérotations pour la même Bible, dans le même dépôt. La correspondance se
 * fait donc par cette table et jamais par le numéro lu dans la colonne.
 */
const LIVRES_GNT = [
  ['61-Mt', 'MAT'], ['62-Mk', 'MRK'], ['63-Lk', 'LUK'], ['64-Jn', 'JHN'], ['65-Ac', 'ACT'],
  ['66-Ro', 'ROM'], ['67-1Co', '1CO'], ['68-2Co', '2CO'], ['69-Ga', 'GAL'], ['70-Eph', 'EPH'],
  ['71-Php', 'PHP'], ['72-Col', 'COL'], ['73-1Th', '1TH'], ['74-2Th', '2TH'], ['75-1Ti', '1TI'],
  ['76-2Ti', '2TI'], ['77-Tit', 'TIT'], ['78-Phm', 'PHM'], ['79-Heb', 'HEB'], ['80-Jas', 'JAS'],
  ['81-1Pe', '1PE'], ['82-2Pe', '2PE'], ['83-1Jn', '1JN'], ['84-2Jn', '2JN'], ['85-3Jn', '3JN'],
  ['86-Jud', 'JUD'], ['87-Re', 'REV'],
];

/**
 * Les attributions, imposées par les licences et non décoratives.
 *
 * L'OSHB impose **la formule exacte**, relevée dans son `LICENSE.md`. Le
 * SBLGNT est en CC BY 4.0, et sa morphologie en CC BY-**SA** 3.0 — copyleft,
 * à ne pas confondre. Les deux voyagent dans le fichier produit pour que
 * l'écran puisse les porter.
 */
const ATTRIBUTIONS = {
  oshb:
    'Original work of the Open Scriptures Hebrew Bible available at '
    + 'https://github.com/openscriptures/morphhb — CC BY 4.0. '
    + 'Texte : Westminster Leningrad Codex, domaine public.',
  sblgnt:
    'SBL Greek New Testament, Faithlife/Logos — CC BY 4.0. '
    + 'Analyse morphologique : MorphGNT (J. K. Tauber) — CC BY-SA 3.0. '
    + 'https://github.com/morphgnt/sblgnt',
};

const SOURCES = {
  oshb: {
    id: 'oshb', name: 'Ancien Testament hébreu (OSHB)', language: 'he',
    output: 'oshb.json', attendu: { versets: 23213, mots: 306785 },
  },
  sblgnt: {
    id: 'sblgnt', name: 'Nouveau Testament grec (SBLGNT)', language: 'el',
    output: 'sblgnt.json', attendu: { versets: 7927, mots: 137554 },
  },
};

async function texte(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
  return res.text();
}

// ---------------------------------------------------------------- hébreu

const RE_VERSET = /<verse osisID="([^"]+)">([\s\S]*?)<\/verse>/g;
const RE_JETON = /<w\s([^>]*?)>([\s\S]*?)<\/w>|<seg type="([^"]+)">([^<]*)<\/seg>/g;
const RE_ATTR = /(\w+)="([^"]*)"/g;

/** Ce qui se colle au mot précédent. Le reste des `<seg>` est ignoré. */
const SUIVANTS = { 'x-maqqef': '־', 'x-sof-pasuq': '׃', 'x-paseq': '׀' };

/**
 * Le numéro Strong d'un `lemma` hébreu — **trois gestes, pas un**.
 *
 * `c/6735 a` → on garde le dernier segment après `/` (les précédents sont des
 * préfixes agglutinés), on retire un `+` final (il marque le premier mot d'un
 * nom propre composé), puis la lettre d'homonyme.
 *
 * Rend `null` pour environ 2 % des mots — 5 977 sur 306 785, mesurés : ce sont
 * les formes préposition + suffixe, dont le noyau vaut `l`, `b`, `m`, `k` ou
 * `i`. **Ce n'est pas une anomalie, c'est la nature de la donnée**, et
 * l'affichage devra prévoir le mot sans numéro.
 *
 * La lettre d'homonyme est perdue à dessein : `6965 a` et `6965 b` sont deux
 * mots pour l'OSHB, mais Strong n'a qu'une entrée `H6965`. La distinction est
 * portée par la source et le lexique ne sait pas la recevoir.
 */
function strongHebreu(lemma) {
  const noyau = (lemma ?? '').split('/').pop().replace(/\+$/, '');
  const m = /^(\d+)(?:\s+[a-z])?$/.exec(noyau);
  return m ? `H${m[1]}` : null;
}

function convertirHebreu(xml, abbr) {
  const chapitres = new Map();
  let mots = 0;
  for (const [, osisID, corps] of xml.matchAll(RE_VERSET)) {
    const [, ch, v] = osisID.split('.');
    const jetons = [];
    for (const [, attrs, brut, segType] of corps.matchAll(RE_JETON)) {
      if (segType) {
        // La ponctuation se colle au mot précédent ; en tête de verset elle
        // n'aurait personne à qui se coller, et il n'y en a pas.
        if (jetons.length && SUIVANTS[segType]) jetons[jetons.length - 1].a = SUIVANTS[segType];
        continue;
      }
      const a = {};
      for (const [, k, val] of attrs.matchAll(RE_ATTR)) a[k] = val;
      // `<note>` et autres balises internes retirées, puis le `/` qui marque la
      // frontière de morphème : il structure le lemme, pas l'affichage.
      const mot = brut.replace(/<[^>]+>/g, '').replace(/\//g, '');
      const jeton = { t: mot };
      const s = strongHebreu(a.lemma);
      if (s) jeton.s = s;
      if (a.morph) jeton.m = a.morph;
      jetons.push(jeton);
      mots++;
    }
    const n = Number(ch);
    if (!chapitres.has(n)) chapitres.set(n, []);
    chapitres.get(n).push({ v: Number(v), w: jetons });
  }
  const versets = [...chapitres.values()].reduce((s, c) => s + c.length, 0);
  return {
    livre: { abbreviation: abbr, chapters: [...chapitres.entries()].sort((a, b) => a[0] - b[0]).map(([c, verses]) => ({ c, verses })) },
    versets, mots,
  };
}

// ------------------------------------------------------------------ grec

function plier(s) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ς/g, 'σ');
}

/**
 * Les transformations **sûres** : celles qui ne peuvent pas changer de mot.
 *
 * La distinction est mesurée et non théorique. Un contrôle du 29 septembre
 * 2026, sur échantillon tiré au hasard, a donné :
 *
 * - raccord par **distance d'édition 1** : **20 % de faux**. `Βόες` (Booz)
 *   devenait « bœuf », `Καῦδα` (l'île) devenait « chaleur ». Abandonné comme
 *   acceptation automatique.
 * - substitution de lettre (α↔ε, β↔υ, φ↔π) : **4 % de faux** — `γαμίζω`
 *   (« donner en mariage ») raccordé à `γεμίζω` (« remplir »). Ces règles
 *   peuvent produire **un autre mot réel**, donc écartées elles aussi.
 * - ce qui reste ci-dessous : **25 sur 25 corrects** au même contrôle.
 *
 * Ce sont des transformations de voix, de gémination ou d'itacisme : elles
 * réécrivent l'orthographe d'un mot, elles n'en désignent pas un autre.
 */
function variantesSures(s) {
  const out = new Set();
  for (const [re, rep] of [
    [/ομαι$/, 'ω'], [/εομαι$/, 'εω'], [/αομαι$/, 'αω'], [/ω$/, 'ομαι'],
    [/εω$/, 'ευω'], [/ευω$/, 'εω'],
  ]) {
    const v = s.replace(re, rep);
    if (v !== s) out.add(v);
  }
  for (const c of 'βνρλστμκπ') {
    for (let i = s.indexOf(c); i !== -1; i = s.indexOf(c, i + 1)) out.add(s.slice(0, i) + c + c + s.slice(i + 1));
    const v = s.replace(c + c, c);
    if (v !== s) out.add(v);
  }
  for (const [a, b] of [['η', 'ε'], ['ε', 'η'], ['ι', 'ει'], ['ει', 'ι']]) {
    for (let i = s.indexOf(a); i !== -1; i = s.indexOf(a, i + 1)) out.add(s.slice(0, i) + b + s.slice(i + a.length));
  }
  const sansPar = s.replace(/\([^)]*\)/g, '');
  if (sansPar !== s) out.add(sansPar);
  return out;
}

/**
 * Le numéro Strong d'un lemme grec, en quatre passes de sûreté décroissante.
 *
 * 1. **Exact, accents compris** — 97,45 % des occurrences.
 * 2. **Table écrite à la main**, confirmée entrée par entrée contre la glose
 *    anglaise du lexique — +885 occurrences.
 * 3. **Exact après pliage** des accents — +1 381 occurrences.
 * 4. **Règles sûres**, candidat unique exigé — +871 occurrences.
 *
 * **L'ordre des passes 1 et 3 n'est pas un détail de style, et l'inverser
 * coûte cher.** Le pliage retire accents et esprits, qui sont distinctifs en
 * grec : `εἰς` (« vers », G1519) et `εἷς` (« un », G1520) ne diffèrent que par
 * l'esprit, `οὐ` (« ne pas ») et `οὗ` (« où ») de même, `τίς` (« qui ? ») et
 * `τις` (« quelqu'un ») par l'accent seul. Plier d'abord rend 42 lemmes
 * ambigus et perd **6 010 occurrences**, dont `εἰς` qui paraît 1 754 fois.
 * Mesuré le 29 septembre 2026, sur le fichier produit — l'erreur avait été
 * commise, pas seulement imaginée.
 *
 * Au-delà, `null`, et ce sont **deux choses différentes** — mesurées sur le
 * fichier produit, non estimées :
 *
 * - **278 lemmes, 916 occurrences (0,67 %)** attendent une confirmation
 *   humaine dans `strong-grec-manuel.json`.
 * - **6 lemmes, 36 occurrences** sont de vrais **homographes** que seul le
 *   contexte départagerait : `ὦ` (l'interjection ou le subjonctif d'εἰμί),
 *   `ἄπειμι` (« être absent » ou « s'en aller »), `βάτος`… Les laisser sans
 *   numéro est le comportement **juste**, et non un manque à combler.
 *
 * Couverture : **99,31 %** du texte grec. **Mieux vaut aucun numéro qu'un
 * faux** — c'est la leçon des 20 % d'erreur du raccord par ressemblance.
 */
function resoudreStrongGrec(lemme, index, manuel) {
  const exact = index.get(lemme.normalize('NFC'));
  if (exact && exact.size === 1) return [...exact][0];
  if (manuel[lemme]) return manuel[lemme];
  const plie = indexPlie.get(plier(lemme));
  if (plie && plie.size === 1) return [...plie][0];
  const trouves = new Set();
  for (const v of variantesSures(plier(lemme))) for (const k of indexPlie.get(v) ?? []) trouves.add(k);
  return trouves.size === 1 ? [...trouves][0] : null;
}

/** L'index plié, bâti une fois à côté de l'index exact. */
let indexPlie = new Map();

function convertirGrec(brut, abbr, index, manuel, compte) {
  const chapitres = new Map();
  for (const ligne of brut.split('\n')) {
    if (!ligne.trim()) continue;
    const p = ligne.split(' ');
    if (p.length !== 7) throw new Error(`${abbr} : ligne à ${p.length} colonnes, la source a changé de forme`);
    const [bcv, pos, parse, texte, , , lemme] = p;
    const ch = Number(bcv.slice(2, 4));
    const v = Number(bcv.slice(4, 6));
    const jeton = { t: texte, l: lemme, m: pos + parse };
    const s = resoudreStrongGrec(lemme, index, manuel);
    if (s) jeton.s = s; else compte.sansStrong++;
    compte.mots++;
    if (!chapitres.has(ch)) chapitres.set(ch, new Map());
    const versets = chapitres.get(ch);
    if (!versets.has(v)) { versets.set(v, []); compte.versets++; }
    versets.get(v).push(jeton);
  }
  return {
    abbreviation: abbr,
    chapters: [...chapitres.entries()].sort((a, b) => a[0] - b[0])
      .map(([c, versets]) => ({ c, verses: [...versets.entries()].sort((a, b) => a[0] - b[0]).map(([v, w]) => ({ v, w })) })),
  };
}

// ------------------------------------------------------------------ main

async function main() {
  const outputDir = path.resolve('public/originaux');
  fs.mkdirSync(outputDir, { recursive: true });

  const demandes = process.argv.slice(2);
  const alias = { hebreu: 'oshb', grec: 'sblgnt' };
  const voulus = demandes.map((d) => alias[d] ?? d);
  const inconnus = voulus.filter((v) => !SOURCES[v]);
  if (inconnus.length) {
    console.error(`Source inconnue : ${inconnus.join(', ')}`);
    console.error('Attendu : hebreu, grec');
    process.exit(1);
  }
  const aTraiter = voulus.length ? voulus : Object.keys(SOURCES);

  for (const cle of aTraiter) {
    const src = SOURCES[cle];
    console.log(`\n--- ${src.name} ---`);
    let books = [];
    const compte = { versets: 0, mots: 0, sansStrong: 0 };

    if (cle === 'oshb') {
      for (const [osis, abbr] of LIVRES_OSHB) {
        const xml = await texte(`https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc/${osis}.xml`);
        const r = convertirHebreu(xml, abbr);
        books.push(r.livre); compte.versets += r.versets; compte.mots += r.mots;
        process.stdout.write(`  ✓ ${abbr}`);
      }
      compte.sansStrong = books.reduce((s, b) => s + b.chapters.reduce((s2, c) =>
        s2 + c.verses.reduce((s3, v) => s3 + v.w.filter((w) => !w.s).length, 0), 0), 0);
    } else {
      const lexique = JSON.parse(fs.readFileSync('public/strong/grec.json', 'utf-8'));
      const index = new Map();
      indexPlie = new Map();
      for (const e of lexique.entries) {
        const exact = e.word.normalize('NFC');
        if (!index.has(exact)) index.set(exact, new Set());
        index.get(exact).add(e.number);
        const f = plier(e.word);
        if (!indexPlie.has(f)) indexPlie.set(f, new Set());
        indexPlie.get(f).add(e.number);
      }
      const manuel = JSON.parse(fs.readFileSync('scripts/strong-grec-manuel.json', 'utf-8')).faites;
      for (const [fichier, abbr] of LIVRES_GNT) {
        const brut = await texte(`https://raw.githubusercontent.com/morphgnt/sblgnt/master/${fichier}-morphgnt.txt`);
        books.push(convertirGrec(brut, abbr, index, manuel, compte));
        process.stdout.write(`  ✓ ${abbr}`);
      }
    }
    console.log();

    const sortie = {
      id: src.id, name: src.name, language: src.language,
      copyrightStatus: 'public-domain',
      attribution: ATTRIBUTIONS[cle],
      source: 'bundled',
      books,
    };
    const chemin = path.join(outputDir, src.output);
    fs.writeFileSync(chemin, JSON.stringify(sortie), 'utf-8');

    const poids = fs.statSync(chemin).size;
    console.log(`  → ${chemin}`);
    console.log(`     ${books.length} livres, ${compte.versets} versets, ${compte.mots} mots, ${(poids / 1048576).toFixed(1)} Mio`);
    console.log(`     sans numéro Strong : ${compte.sansStrong} (${(100 * compte.sansStrong / compte.mots).toFixed(2)} %)`);
    for (const [quoi, attendu] of Object.entries(src.attendu)) {
      if (compte[quoi] !== attendu) {
        console.log(`     ⚠ ${quoi} : ${compte[quoi]} au lieu de ${attendu} — la source a bougé depuis le relevé du 29 septembre 2026.`);
      }
    }
  }
  console.log('\n✓ Terminé.');
}

main().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
