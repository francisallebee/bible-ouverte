import fs from 'fs';
import path from 'path';

/**
 * Conversion des deux lexiques Strong vers `public/strong/`.
 *
 * Le relevé de forme qui a rendu ce script possible est dans
 * `spec/DICTIONNAIRE-STRONG.md`. Trois choses en découlent directement, et
 * aucune ne se devine en lisant un seul exemple :
 *
 * 1. **Ce ne sont pas des fichiers JSON**, mais du CommonJS —
 *    `var strongsHebrewDictionary = {…}; module.exports = …`. On découpe donc
 *    entre la première et la dernière accolade. On ne fait **jamais**
 *    `require()` : ce serait exécuter du code tiers pour lire des données, et
 *    la règle 4 veut de toute façon un fichier servi depuis `public/`, pas un
 *    module empaqueté par webpack.
 *
 * 2. **Les champs ne portent pas les mêmes noms d'une langue à l'autre.** Le
 *    grec dit `translit`, l'hébreu dit `xlit` et ajoute `pron`. Un
 *    convertisseur écrit sur l'exemple grec perdrait les 8 674
 *    translittérations hébraïques **sans lever la moindre erreur**. C'est tout
 *    l'objet de `normaliser()`.
 *
 * 3. **Le grec n'est pas trié** — le fichier s'ouvre sur `G1615`, puis `G2274`.
 *    Le tri se fait sur la partie numérique, jamais sur la chaîne : `G10` se
 *    range avant `G2` dans un tri lexical.
 *
 * Licence — et ce n'est pas un détail de confort. Le dépôt `openscriptures/strongs`
 * ne déclare aucune licence (pas de `LICENSE`, l'API GitHub rend `None`), mais
 * **l'en-tête de chaque fichier revendique une CC BY-SA**. L'œuvre de 1890 est
 * du domaine public ; la mise en forme JSON, elle, se réclame du copyleft. Le
 * point de droit n'est pas tranché — une transcription ouvre-t-elle un droit
 * d'auteur ? —, mais la prudence est la même dans les deux lectures : le
 * fichier produit **porte son attribution**, et l'écran qui le servira devra
 * l'afficher.
 *
 * Usage :
 *   node scripts/download-strong.mjs            # les deux lexiques
 *   node scripts/download-strong.mjs grec       # un seul
 *
 * Depuis un bac à sable dont la sortie réseau passe par un proxy, préfixer par
 * `NODE_USE_ENV_PROXY=1` : le `fetch` de Node 22 ignore `HTTPS_PROXY` là où
 * `curl` l'honore, et échoue sur un `ENOTFOUND` trompeur. Même famille de
 * piège que le `--cache "$TMPDIR/npm-cache"` d'`AGENTS.md`.
 *
 * Produit (mesuré le 29 septembre 2026) : 2,53 Mio pour l'hébreu, 1,47 Mio
 * pour le grec, soit **4,0 Mio indentés** — 3,1 Mio minifiés, 853 Kio une fois
 * compressés sur le réseau. L'indentation est gardée par cohérence avec
 * `public/bibles/` : elle ne coûte presque rien sur le fil, et rien du tout en
 * cache, IndexedDB stockant des objets et non du texte.
 */

const LEXIQUES = [
  {
    id: 'strong-hebreu',
    name: 'Lexique Strong hébreu',
    language: 'he',
    output: 'hebreu.json',
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js',
    prefixe: 'H',
    /** Mesuré le 29 septembre 2026. Un écart signale que la source a bougé. */
    attendu: 8674,
  },
  {
    id: 'strong-grec',
    name: 'Lexique Strong grec',
    language: 'el',
    output: 'grec.json',
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js',
    prefixe: 'G',
    attendu: 5523,
  },
];

/**
 * La formule d'attribution, portée par le fichier produit.
 *
 * Elle n'est pas imposée mot pour mot comme celle de l'OSHB — le dépôt ne
 * déclare rien —, mais elle nomme ce que l'en-tête revendique. La citer coûte
 * une ligne et vaut que la revendication tienne ou non.
 */
const ATTRIBUTION =
  "Strong's Exhaustive Concordance (James Strong, 1890), domaine public. " +
  'Mise en forme JSON : Open Scriptures, CC BY-SA — ' +
  'https://github.com/openscriptures/strongs';

/**
 * Extrait l'objet JavaScript du fichier CommonJS, sans l'exécuter.
 *
 * Le découpage entre la première et la dernière accolade est sûr ici parce que
 * le fichier est *entièrement* une affectation d'objet littéral : ce qui
 * précède est un commentaire de bloc, ce qui suit est `module.exports`. Ni
 * l'un ni l'autre ne porte d'accolade. Vérifié sur les deux fichiers le
 * 29 septembre 2026.
 */
function extraireObjet(source, url) {
  const debut = source.indexOf('{');
  const fin = source.lastIndexOf('}');
  if (debut === -1 || fin === -1 || fin < debut) {
    throw new Error(`Aucun objet trouvé dans ${url} — la source a changé de forme.`);
  }
  return JSON.parse(source.slice(debut, fin + 1));
}

/**
 * Ramène une entrée à une forme unique, quelle que soit la langue.
 *
 * `xlit` (hébreu) et `translit` (grec) deviennent tous deux `translit`. Les
 * champs absents restent absents plutôt que de valoir la chaîne vide : la
 * distinction entre « pas de prononciation en grec » et « prononciation vide »
 * mérite d'être gardée, et `undefined` disparaît de lui-même à la
 * sérialisation JSON.
 *
 * Les définitions de Strong commencent par une espace dans la source
 * (`" to complete fully"`). On la retire ici, une fois, plutôt qu'à chaque
 * affichage.
 */
function normaliser(numero, entree) {
  const texte = (v) => (typeof v === 'string' ? v.trim() : undefined);
  return {
    number: numero,
    word: texte(entree.lemma),
    translit: texte(entree.xlit ?? entree.translit),
    pron: texte(entree.pron),
    definition: texte(entree.strongs_def),
    derivation: texte(entree.derivation),
    kjvDef: texte(entree.kjv_def),
  };
}

/**
 * Le sort des entrées sans définition — **la seule décision de ce script**.
 *
 * `definition` est ce que le lecteur vient chercher en cliquant un mot. Elle
 * manque dans 19 des 5 523 entrées grecques et dans 0 des 8 674 hébraïques
 * (mesuré le 29 septembre 2026).
 *
 * Choix retenu : **les garder**, et la mesure le tranche plutôt que le goût.
 * Ces 19 entrées couvrent **3 072 occurrences du texte grec**, et la première
 * d'entre elles est `G1473` — `ἐγώ`, « je », **2 572 occurrences**, le
 * pronom le plus courant du Nouveau Testament. Viennent ensuite `G302` (`ἄν`,
 * 171) et `G2570` (`καλός`, 101). Les écarter ne retirerait pas des cas
 * marginaux : cela ferait d'un mot sur cinquante un lien mort.
 *
 * Une entrée sans définition garde son mot, sa translittération, son
 * étymologie et ses rendus — c'est peu, mais ce n'est pas rien. C'est l'écran
 * qui décidera quoi montrer d'une entrée incomplète ; le convertisseur n'a pas
 * à trancher à sa place.
 *
 * Conséquence assumée, et elle doit remonter au typage : `definition` est
 * **optionnelle**. Un type qui la déclarerait obligatoire ferait mentir `tsc`
 * sur 19 entrées.
 */
function estPubliable(entree) {
  return Boolean(entree.word);
}

/** Tri sur la partie numérique. `G10` doit suivre `G2`, pas le précéder. */
function parNumero(a, b) {
  return Number(a.number.slice(1)) - Number(b.number.slice(1));
}

async function main() {
  const outputDir = path.resolve('public/strong');
  fs.mkdirSync(outputDir, { recursive: true });

  const demandes = process.argv.slice(2);
  const alias = { hebreu: 'strong-hebreu', grec: 'strong-grec' };
  const voulus = demandes.map((d) => alias[d] ?? d);
  const inconnus = voulus.filter((v) => !LEXIQUES.some((l) => l.id === v));
  if (inconnus.length) {
    console.error(`Lexique inconnu : ${inconnus.join(', ')}`);
    console.error(`Attendu : hebreu, grec (ou ${LEXIQUES.map((l) => l.id).join(', ')})`);
    process.exit(1);
  }
  const aTraiter = voulus.length ? LEXIQUES.filter((l) => voulus.includes(l.id)) : LEXIQUES;

  for (const lexique of aTraiter) {
    console.log(`\n--- ${lexique.name} ---`);

    const res = await fetch(lexique.url);
    if (!res.ok) throw new Error(`HTTP ${res.status} pour ${lexique.url}`);
    const brut = extraireObjet(await res.text(), lexique.url);

    const clesInattendues = Object.keys(brut).filter((k) => !k.startsWith(lexique.prefixe));
    if (clesInattendues.length) {
      throw new Error(
        `${clesInattendues.length} clés ne commencent pas par « ${lexique.prefixe} » ` +
          `(${clesInattendues.slice(0, 3).join(', ')}…) — la source a changé de forme.`,
      );
    }

    const toutes = Object.entries(brut).map(([numero, e]) => normaliser(numero, e));
    const entries = toutes.filter(estPubliable).sort(parNumero);
    const ecartees = toutes.length - entries.length;

    /**
     * Le compte rendu, et c'est lui qui fait d'un script une mesure. Un champ
     * qui se met à manquer dans 3 000 entrées plutôt que 19 se verrait ici, et
     * nulle part ailleurs : ni `tsc`, ni `eslint`, ni les tests ne lisent ce
     * fichier.
     */
    const manquants = {};
    const absents = [];
    for (const champ of ['word', 'translit', 'pron', 'definition', 'derivation', 'kjvDef']) {
      const n = entries.filter((e) => e[champ] === undefined).length;
      if (!n) continue;
      // Un champ absent de *toutes* les entrées n'est pas un trou : c'est que
      // ce lexique ne le porte pas — `pron` n'existe qu'en hébreu. Le dire
      // autrement éviterait de lire « manque dans 5 523 » comme une panne.
      if (n === entries.length) absents.push(champ);
      else manquants[champ] = n;
    }

    const lexiqueJson = {
      id: lexique.id,
      name: lexique.name,
      language: lexique.language,
      copyrightStatus: 'public-domain',
      attribution: ATTRIBUTION,
      source: 'bundled',
      entries,
    };

    const outputPath = path.join(outputDir, lexique.output);
    fs.writeFileSync(outputPath, JSON.stringify(lexiqueJson, null, 2), 'utf-8');

    const poids = fs.statSync(outputPath).size;
    console.log(`  → ${outputPath}`);
    console.log(`     ${entries.length} entrées (${lexique.attendu} attendues), ${(poids / 1048576).toFixed(2)} Mio`);
    console.log(`     ${entries[0].number} … ${entries[entries.length - 1].number}`);
    if (ecartees) console.log(`     ⚠ ${ecartees} entrées écartées faute de mot`);
    if (absents.length) console.log(`     champs absents de ce lexique : ${absents.join(', ')}`);
    console.log(
      Object.keys(manquants).length
        ? `     champs incomplets : ${Object.entries(manquants)
            .map(([c, n]) => `${c} manque dans ${n}`)
            .join(', ')}`
        : '     tous les autres champs remplis',
    );
    if (entries.length !== lexique.attendu) {
      console.log(
        `     ⚠ ${entries.length} entrées au lieu de ${lexique.attendu} : la source a bougé depuis le relevé du 29 septembre 2026.`,
      );
    }
  }

  console.log('\n✓ Terminé.');
}

main().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
