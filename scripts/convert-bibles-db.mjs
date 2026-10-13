import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Conversion de `bibles_fr.db` vers `public/bibles/`.
 *
 * La base déposée le 13 octobre 2026 porte **33 traductions françaises**. Ce
 * script n'en convertit que **deux**, et le filtre est le cœur du fichier :
 *
 * **Une quinzaine de ces versions sont sous droits**, et `spec/DROITS.md` l'a
 * établi le 2 septembre 2026 avec ses sources. Segond 21 et Nouvelle Édition de
 * Genève (Société biblique de Genève) ; Nouvelle Bible Segond, Parole de Vie,
 * Français courant, Nouvelle Français courant, Bible expliquée (Alliance
 * biblique française) ; Bible du Semeur (Biblica) ; Bible de Jérusalem
 * (Cerf) ; Bible des Peuples, Pirot-Clamer, King James Française, Machaira, et
 * les trois révisions Darby modernes.
 *
 * L'application ne **cite** pas, elle **redistribue** : 31 000 versets et 66
 * livres entiers par version, soit **62 fois** le seuil de citation que trois
 * ayants droit indépendants posent à 500 versets. Aucune autorisation n'a été
 * obtenue — `DROITS.md` décrit les démarches comme à faire. Les convertir
 * mettrait en ligne des textes sans licence.
 *
 * **Ajouter une version ici ne suffit donc pas** : il faut d'abord qu'elle soit
 * du domaine public, ou qu'une autorisation écrite existe et soit consignée
 * dans `DROITS.md`. Le tableau `RETENUES` porte la raison de chaque entrée.
 *
 * La base elle-même pèse 498 Mo et n'est pas versionnée (`.gitignore`) : GitHub
 * refuse les fichiers de plus de 100 Mo, et un commit l'emporterait dans
 * l'historique pour toujours.
 *
 * **La table `book` ne vaut pas pour toutes les versions**, et c'est le piège
 * de ce fichier. Elle décrit le canon chrétien en 66 livres, et les versions
 * chrétiennes la suivent — vérifié sur Sacy : son livre 8 est bien Ruth. Mais
 * **Zadoc Kahn suit l'ordre du Tanakh**, où le livre 8 est 1 Samuel. S'y fier
 * donnait un fichier d'apparence normale avec Ruth à 31 chapitres, Daniel à
 * 150 et Malachie à 36 — produit puis jeté le 13 octobre 2026. Chaque version
 * déclare donc son ordre, et le script le **contrôle par le nombre de
 * chapitres**, livre par livre, avant d'écrire quoi que ce soit.
 *
 * Usage :
 *   node scripts/convert-bibles-db.mjs           # les deux
 *   node scripts/convert-bibles-db.mjs sacc      # une seule
 */

const BASE = 'bibles_fr.db';
const SORTIE = 'public/bibles';

/**
 * Ce qu'on convertit, et pourquoi on a le droit.
 *
 * `code` est celui de la table `version` de la base ; `id` celui du dépôt —
 * le même que dans `TEXT_VERSIONS` et `VERSIONS`, règle 13.
 */
/**
 * L'ordre du Tanakh, tel que la base le numérote pour Zadoc Kahn.
 *
 * Déduit des mesures du 13 octobre 2026 — nombre de chapitres et premier
 * verset de chaque livre —, jamais supposé : le livre 8 commence par « A
 * Ramataïm-Çophim, sur la montagne d'Ephraïm », qui est 1 Samuel 1,1, et porte
 * 31 chapitres comme 1 Samuel. Les 39 concordent ainsi avec le canon, aux deux
 * écarts de versification hébraïque près que `ECARTS_HEBREUX` nomme.
 *
 * Les trois sections s'y lisent : la Torah (1-5), les Prophètes (6-26,
 * premiers puis les Douze), les Écrits (27-39).
 */
const ORDRE_TANAKH = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU',
  'JOS', 'JDG', '1SA', '2SA', '1KI', '2KI',
  'ISA', 'JER', 'EZK',
  'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
  'PSA', 'JOB', 'PRO', 'RUT', 'SNG', 'ECC', 'LAM', 'EST', 'DAN', 'EZR', 'NEH', '1CH', '2CH',
];

/**
 * Les deux livres dont la Bible hébraïque ne compte pas les chapitres comme la
 * chrétienne. Ce ne sont pas des manques : Joël y tient en 4 chapitres et non
 * 3, Malachie en 3 et non 4. Le dépôt connaît déjà le second — Crampon et
 * Darby l'écrivent ainsi.
 */
const ECARTS_HEBREUX = { JOL: 4, MAL: 3 };

const RETENUES = [
  {
    id: 'sacc',
    code: 'SAC',
    name: 'Lemaître de Sacy 1667',
    droits: 'Isaac Lemaître de Sacy, 1613-1684 — domaine public depuis trois siècles',
    /*
      Remplace un fichier **amputé de 13 chapitres**, mesuré le 13 octobre
      2026 : GEN 49/50, EXO 39/40, PSA 149/150, SNG 6/8, JER 50/52, LAM 1/5,
      EZK 47/48, ZEC 13/14. `AGENTS.md` en nommait quatre et disait « et
      d'autres » ; les Lamentations à **un chapitre sur cinq** n'y figuraient
      pas. Celui-ci n'en manque qu'un, EZK 48.
    */
    remplace: true,
    // Suit la table `book`, vérifié : livre 8 = Ruth, 40 = Matthieu.
    ordre: null,
    // Sacy est une traduction de Port-Royal : elle porte les additions
    // grecques à Esther (11-16) et à Daniel (13-14). Voir plus bas.
    tolereEnTrop: ['EST', 'DAN'],
  },
  {
    id: 'zadoc',
    code: 'BZKH',
    name: 'Zadoc Kahn 1899',
    droits: 'Zadoc Kahn, 1839-1905 — domaine public',
    /*
      **39 livres et pas 66, et ce n'est pas un manque.** C'est le Tanakh
      traduit sous la direction du grand rabbin de France : il n'y a pas de
      Nouveau Testament à y chercher. Aucune des douze versions du dépôt
      n'apporte cela.
    */
    remplace: false,
    ordre: ORDRE_TANAKH,
    ecarts: ECARTS_HEBREUX,
  },
];

/** Les 66 abréviations USFM, dans l'ordre canonique de `features/bible/books.ts`. */
function canonDuDepot() {
  const src = fs.readFileSync('src/features/bible/books.ts', 'utf8');
  const livres = [...src.matchAll(
    /abbreviation:\s*"(\w+)",\s*name:\s*"([^"]+)",\s*chapters:\s*(\d+)/g,
  )].map((m) => ({ abbreviation: m[1], name: m[2], chapitres: Number(m[3]) }));
  if (livres.length !== 66) {
    throw new Error(`66 livres attendus dans books.ts, ${livres.length} lus`);
  }
  return livres;
}

/** Sans accents ni casse : les deux listes écrivent « Ésaïe » et « Esaïe ». */
const plier = (s) => s.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().trim();

/**
 * Le raccord des livres se fait **par position**, et se vérifie.
 *
 * C'est l'idiome déjà employé pour la Reina-Valera, dont les livres portent des
 * noms anglais : les deux listes suivent l'ordre canonique, et le script le
 * **contrôle** plutôt que de le supposer. Ici les noms concordent à l'accent
 * près — « Ésaïe » contre « Esaïe », « Nahum » contre « Nahoum » —, ce qui
 * confirme l'alignement sans rendre le script dépendant de l'orthographe.
 */
/** Distance d'édition, bornée : on ne cherche qu'à savoir si elle dépasse 2. */
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return d[a.length][b.length];
}

function verifierOrdre(livresBase, canon) {
  const ecarts = [];
  for (let i = 0; i < livresBase.length; i++) {
    const a = plier(livresBase[i].name);
    const b = plier(canon[i].name);
    /*
      Préfixe **ou** distance d'édition d'au plus 2 : il s'agit de confirmer
      l'alignement, pas l'orthographe. « Cantique des cantiques » contre
      « Cantique » passe par le préfixe ; « Nahoum » contre « Nahum » et
      « Ézéchiel » contre « Ezéchiel » par la distance. Deux livres différents,
      eux, sont à des lieues l'un de l'autre — « Genèse » et « Exode » sont à 6.
      Le seuil est volontairement serré : trop large, ce contrôle cesserait de
      contrôler quoi que ce soit, et c'est précisément lui qui empêche de
      décaler 66 livres sans s'en apercevoir.
    */
    if (!a.startsWith(b) && !b.startsWith(a) && distance(a, b) > 2) {
      ecarts.push(`position ${i + 1} : « ${livresBase[i].name} » ≠ « ${canon[i].name} »`);
    }
  }
  if (ecarts.length) {
    throw new Error(`L'ordre des livres ne correspond pas :\n  ${ecarts.join('\n  ')}`);
  }
}

/**
 * Le contrôle qui remplace la confiance : chaque livre doit porter le nombre de
 * chapitres que le canon lui donne.
 *
 * C'est ce qui a manqué au premier essai. Vérifier que la table `book` suit le
 * canon du dépôt était vrai **et sans rapport** : la question n'est pas de
 * savoir comment la table est ordonnée, mais si **cette version-là** la suit.
 * Un décalage d'un seul rang se voit immédiatement ici — Ruth n'a pas 31
 * chapitres —, là où il ne se voyait pas du tout dans le fichier produit.
 */
function verifierLivres(books, canon, ecarts = {}) {
  const parAbbr = new Map(canon.map((c) => [c.abbreviation, c.chapitres]));
  const faux = [];
  for (const b of books) {
    const attendu = ecarts[b.abbreviation] ?? parAbbr.get(b.abbreviation);
    const reel = b.chapters.length;
    // Moins de chapitres que prévu est un manque de la source, pas un
    // décalage : il est signalé plus bas, sans faire échouer la conversion.
    // Plus, en revanche, ne s'explique que par un mauvais raccord — ou par les
    // additions deutérocanoniques, que `tolereEnTrop` autorise nommément.
    if (reel > attendu) faux.push({ abbr: b.abbreviation, reel, attendu });
  }
  return faux;
}

function convertir(db, retenue, canon) {
  const version = db.prepare('select id, name from version where code = ?').get(retenue.code);
  if (!version) throw new Error(`version ${retenue.code} absente de la base`);

  const lignes = db.prepare(`
    select ve.book_id, ve.chapter, ve.verse, ve.text
    from verse ve
    where ve.version_id = ?
    order by ve.book_id, ve.chapter, ve.verse
  `).all(version.id);

  const parLivre = new Map();
  for (const l of lignes) {
    // Les livres au-delà de 66 sont deutérocanoniques et n'ont **aucun nom**
    // dans la base — la table `book` s'arrête à 66. Les convertir sans savoir
    // de quel livre il s'agit produirait des références fausses ; ils sont
    // donc écartés, et le compte est annoncé plus bas.
    if (l.book_id > 66) continue;
    const livre = parLivre.get(l.book_id) ?? new Map();
    const chapitre = livre.get(l.chapter) ?? [];
    chapitre.push({ verse: l.verse, text: l.text });
    livre.set(l.chapter, chapitre);
    parLivre.set(l.book_id, livre);
  }

  const ordre = retenue.ordre;
  const nomDe = (bookId) => {
    const abbr = ordre ? ordre[bookId - 1] : canon[bookId - 1].abbreviation;
    const dansLeCanon = canon.find((c) => c.abbreviation === abbr);
    if (!dansLeCanon) throw new Error(`livre ${bookId} : « ${abbr} » hors du canon du dépôt`);
    return dansLeCanon;
  };

  const books = [...parLivre.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bookId, chapitres]) => ({
      abbreviation: nomDe(bookId).abbreviation,
      name: nomDe(bookId).name,
      chapters: [...chapitres.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([chapter, verses]) => ({ chapter, verses })),
    }));

  /*
    Le contrôle a lieu **avant** l'écriture : un fichier faux déjà posé dans
    `public/bibles/` serait servi au premier lecteur qui coche la case.
    `tolereEnTrop` nomme les seuls dépassements admis — les additions grecques
    à Esther et Daniel que porte toute traduction de Port-Royal.
  */
  const faux = verifierLivres(books, canon, retenue.ecarts)
    .filter((f) => !(retenue.tolereEnTrop ?? []).includes(f.abbr));
  if (faux.length) {
    throw new Error(
      `${retenue.id} : raccord des livres faux — `
      + faux.map((f) => `${f.abbr} a ${f.reel} chapitres pour ${f.attendu} attendus`).join(', '),
    );
  }

  const fichier = path.join(SORTIE, `${retenue.id}.json`);
  fs.writeFileSync(fichier, JSON.stringify({
    id: retenue.id,
    name: retenue.name,
    language: 'fr',
    copyrightStatus: 'public-domain',
    source: 'bundled',
    books,
  }, null, 2));

  const versets = books.reduce((n, b) => n + b.chapters.reduce((m, c) => m + c.verses.length, 0), 0);
  const horsCanon = lignes.length - versets;
  const octets = fs.statSync(fichier).size;

  /*
    Les chapitres en trop ne sont pas une erreur : Sacy est une traduction de
    Port-Royal, qui porte les additions grecques à Esther (11-16) et à Daniel
    (13-14). Elles sont **gardées** — retrancher du texte à une traduction
    serait une mutilation silencieuse —, stockées, cherchables, et simplement
    non proposées par le sélecteur de chapitre, qui suit le canon à 66 livres.
    Elles ne faussent aucune progression : on ne peut enregistrer une lecture
    que par ce sélecteur.
  */
  const attenduDe = (abbr) =>
    (retenue.ecarts ?? {})[abbr] ?? canon.find((c) => c.abbreviation === abbr).chapitres;
  const enTrop = books
    .filter((b) => b.chapters.length > attenduDe(b.abbreviation))
    .map((b) => `${b.abbreviation} ${b.chapters.length}`);
  const manquants = books
    .filter((b) => b.chapters.length < attenduDe(b.abbreviation))
    .map((b) => `${b.abbreviation} ${b.chapters.length}/${attenduDe(b.abbreviation)}`);

  console.log(`  ✓ ${retenue.id.padEnd(6)} ${books.length} livres, ${versets} versets, ${(octets / 1024 / 1024).toFixed(1)} Mio`);
  console.log(`      octets : ${octets}  (à reporter dans VERSIONS — règle 19)`);
  if (horsCanon > 0) console.log(`      ${horsCanon} versets deutérocanoniques écartés, faute de nom dans la base`);
  if (enTrop.length) console.log(`      chapitres au-delà du canon, gardés : ${enTrop.join(', ')}`);
  if (manquants.length) console.log(`      chapitres manquants : ${manquants.join(', ')}`);
}

function main() {
  if (!fs.existsSync(BASE)) {
    console.error(`${BASE} est absent. Il n'est pas versionné — 498 Mo — et doit être déposé à la racine.`);
    process.exit(1);
  }

  const demandes = process.argv.slice(2);
  const aFaire = demandes.length
    ? RETENUES.filter((r) => demandes.includes(r.id))
    : RETENUES;
  if (!aFaire.length) {
    console.error(`Rien à convertir. Connus : ${RETENUES.map((r) => r.id).join(', ')}`);
    process.exit(1);
  }

  const db = new DatabaseSync(BASE, { readOnly: true });
  const canon = canonDuDepot();
  const livresBase = db.prepare('select id, name from book order by id').all();
  verifierOrdre(livresBase, canon);
  console.log(`Ordre des 66 livres vérifié contre books.ts.\n`);

  for (const retenue of aFaire) {
    console.log(`${retenue.name} — ${retenue.droits}`);
    convertir(db, retenue, canon);
  }
  db.close();
  console.log('\n✓ Terminé. Reporter les octets dans VERSIONS (features/bible/import.ts).');
}

main();
