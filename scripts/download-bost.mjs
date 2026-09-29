import fs from 'fs';
import path from 'path';

/**
 * Le *Dictionnaire de la Bible* de Jean-Augustin Bost, en données.
 *
 * Écrit le 29 septembre 2026, premier des trois travaux du dictionnaire.
 *
 * ## La source, et pourquoi celle-là
 *
 * Édition de 1865, numérisée par Google et déposée à l'Internet Archive sous
 * `bub_gb_6v4UAAAAYAAJ`. Elle a été retenue sur **un critère de droits et un
 * de service** :
 *
 * - elle porte une licence **explicite** — Public Domain Mark 1.0, lue dans
 *   ses métadonnées, et non déduite de l'âge de l'ouvrage. Bost est mort en
 *   1881 : le domaine public est acquis de toute façon, mais `spec/DROITS.md`
 *   demande de le **lire à la source**, pas de le supposer ;
 * - elle se sert à un script. Les transcriptions en ligne de ce dictionnaire
 *   (levigilant.com notamment) sont d'une bien meilleure qualité de texte,
 *   mais répondent **403 à tout ce qui n'est pas un navigateur**. Un script du
 *   dépôt ne doit pas dépendre d'un déguisement : c'est fragile, et c'est
 *   passer outre un refus explicite.
 *
 * Le téléchargement **suit les redirections** : `archive.org/download/…`
 * renvoie vers un nœud de diffusion dont le nom change (`dn760002.eu`,
 * `ia902302.us`…). Sans `redirect: follow`, on récupère zéro octet sans
 * erreur — c'est arrivé au premier essai.
 *
 * ## Ce que l'OCR coûte, mesuré et non supposé
 *
 * Le texte brut est une reconnaissance de caractères sur un fac-similé de
 * 1865, et il porte les défauts de son âge. Relevé sur les 6,2 Mo :
 *
 * | Défaut | Compte | Traitement |
 * |---|---|---|
 * | Césures en fin de ligne | 24 087 | recollées |
 * | « Digitized by Google » | 940 | retirées |
 * | Doubles espaces | 764 080 | réduits |
 * | Entrées abîmées par un chiffre | 5,9 % | corrigées, voir ci-dessous |
 *
 * **La faute est systématique, et c'est ce qui la rend réparable** : le `1`
 * est lu pour un `I`, le `0` pour un `O`. ABILÈNE devient AB1LÈNE, ARCHIPPE
 * ARCH1PPE, BABYLONIE BABYLON1E. Dans un mot **tout en capitales**, un
 * chiffre entouré de lettres n'est jamais un chiffre : la correction est donc
 * sûre, et elle est bornée à ce cas précis — on ne touche pas au corps du
 * texte, où « 1 » peut être un vrai nombre (« Ex. 6, 20 »).
 *
 * Ce qui **reste** après nettoyage est signalé par le script lui-même, et ne
 * doit pas être caché : des fautes de corps de texte comme « 61s » pour
 * « fils » (la ligature `fi` mal lue) ne se corrigent pas mécaniquement. Le
 * compte est affiché à chaque exécution pour que la décision de publier — ou
 * de corriger à la main — se prenne sur un chiffre.
 *
 * ## Le verdict du premier passage, et pourquoi rien n'est publié
 *
 * Exécuté le 29 septembre 2026 sur les 5,78 Mo de la source : **1 015 entrées
 * détectées**, quand la page de titre de l'ouvrage annonce « PLUS DE 4 000
 * ARTICLES ». Un quart. Les entrées manquées ne disparaissent pas : elles se
 * collent à la précédente, dont la plus longue atteint **74 363 caractères**
 * là où la médiane est de 2 195. AARON manque quand ABEL est là.
 *
 * Le repérage du terme est donc trop étroit — la forme « TERME, » de cette
 * édition n'est pas constante —, et c'est réparable. **Ce qui ne l'est pas,
 * c'est le texte lui-même** : « ennanéenne » pour cananéenne, « tixès » pour
 * fixés, « .los. » pour Jos., « DE8 » pour DES. Un meilleur analyseur
 * relèverait la couverture sans toucher à une seule de ces fautes, et la
 * valeur d'un dictionnaire est précisément dans son texte.
 *
 * **Rien n'est donc écrit dans `public/`.** Le script reste au dépôt parce
 * qu'il porte la mesure et qu'il resservira si la décision est prise de
 * reprendre cette source ; mais publier un dictionnaire au quart complet et
 * fautif serait livrer une fonction qui déçoit à la première consultation.
 * L'arbitrage appartient au propriétaire : relire, ou trouver une source déjà
 * corrigée et en éclaircir les droits.
 */

const SOURCE = 'https://archive.org/download/bub_gb_6v4UAAAAYAAJ/bub_gb_6v4UAAAAYAAJ_djvu.txt';
const SORTIE = path.join('public', 'dictionnaires', 'bost.json');

/** Ce que le fichier produit déclare de lui-même — la mention suit la donnée. */
const IDENTITE = {
  id: 'bost',
  nom: 'Dictionnaire de la Bible',
  auteur: 'Jean-Augustin Bost (1815-1881)',
  edition: '1865',
  langue: 'fr',
  licence: 'Public Domain Mark 1.0',
  licenceUrl: 'http://creativecommons.org/publicdomain/mark/1.0/',
  source: 'https://archive.org/details/bub_gb_6v4UAAAAYAAJ',
};

/** Le mobilier de page que la numérisation a laissé. */
const MOBILIER = [
  /Digitized\s+by\s+Googl[e]?/gi,
  /^\s*\d+\s*$/gm,
];

/**
 * Un mot tout en capitales dont un chiffre a pris la place d'une lettre.
 * Borné aux capitales : dans le corps du texte, « 6, 20 » est une référence.
 */
function reparerCapitales(mot) {
  return mot.replace(/1/g, 'I').replace(/0/g, 'O');
}

function nettoyer(brut) {
  let t = brut;
  for (const motif of MOBILIER) t = t.replace(motif, ' ');
  // Les césures : « Ham- \n ram » → « Hamram ». Le tiret peut être suivi
  // d'espaces avant le saut de ligne, ce que le premier relevé avait manqué.
  t = t.replace(/(\w)-\s*\n\s*(\w)/g, '$1$2');
  // Le reste des sauts de ligne devient une espace : la mise en colonnes du
  // fac-similé n'a pas de sens dans une entrée de dictionnaire.
  t = t.replace(/\s*\n\s*/g, ' ');
  t = t.replace(/ {2,}/g, ' ');
  return t.trim();
}

/**
 * Découpe le texte en entrées. Une entrée commence par son terme en
 * capitales, en début de ligne, suivi d'une virgule — la forme de cette
 * édition (« AARON, lévite, … »).
 */
function decouper(texteNettoye) {
  const motif = /(^|\s)([A-ZÀ-ÞÉÈÊÎÔÛÇ][A-ZÀ-ÞÉÈÊÎÔÛÇ0-9'’\- ]{2,40}),\s/g;
  const entrees = [];
  let precedent = null;
  let m;
  while ((m = motif.exec(texteNettoye)) !== null) {
    const terme = reparerCapitales(m[2].trim().replace(/\s{2,}/g, ' '));
    if (precedent) {
      precedent.texte = texteNettoye.slice(precedent.debut, m.index).trim();
      entrees.push(precedent);
    }
    precedent = { terme, debut: motif.lastIndex };
  }
  if (precedent) {
    precedent.texte = texteNettoye.slice(precedent.debut).trim();
    entrees.push(precedent);
  }
  return entrees
    .map(({ terme, texte }) => ({ terme, texte }))
    .filter((e) => e.texte.length > 40);
}

/**
 * Le texte brut, du réseau ou d'un fichier déjà récupéré.
 *
 * `--fichier <chemin>` sert deux fois : reconvertir sans retélécharger 6 Mo
 * quand on ajuste le nettoyage, et travailler depuis un bac à sable dont le
 * `fetch` de Node ne résout pas les noms — `curl` y passe par le proxy, pas
 * `undici`.
 */
async function lireSource() {
  const i = process.argv.indexOf('--fichier');
  if (i !== -1 && process.argv[i + 1]) {
    const chemin = process.argv[i + 1];
    console.log('Lecture de', chemin);
    return fs.readFileSync(chemin, 'utf-8');
  }
  console.log('Téléchargement de', SOURCE);
  // `redirect: follow` est le défaut de fetch, mais on le dit : c'est la
  // condition sans laquelle on récupère zéro octet sans erreur.
  const reponse = await fetch(SOURCE, { redirect: 'follow' });
  if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
  return reponse.text();
}

async function main() {
  const brut = await lireSource();
  console.log(`  ${(brut.length / 1024 / 1024).toFixed(2)} Mo lus`);

  const nettoye = nettoyer(brut);
  const entrees = decouper(nettoye);

  // Ce qui reste et qu'aucune règle ne rattrape : on le compte et on le dit.
  const restants = entrees.filter((e) => /[A-Za-zÀ-ÿ]\d|\d[A-Za-zÀ-ÿ]/.test(e.texte)).length;
  const termesAbimes = entrees.filter((e) => /\d/.test(e.terme)).length;

  fs.mkdirSync(path.dirname(SORTIE), { recursive: true });
  fs.writeFileSync(SORTIE, JSON.stringify({ ...IDENTITE, entrees }, null, 0), 'utf-8');
  const taille = fs.statSync(SORTIE).size;

  console.log(`\n${entrees.length} entrées écrites dans ${SORTIE}`);
  console.log(`  poids : ${(taille / 1024 / 1024).toFixed(2)} Mo`);
  console.log(`  termes portant encore un chiffre : ${termesAbimes}`);
  console.log(`  entrées dont le corps mêle lettres et chiffres : ${restants}`);
  console.log('\nCes deux derniers chiffres sont le coût de l’OCR. Ils ne se');
  console.log('corrigent pas mécaniquement : c’est sur eux que se décide');
  console.log('la publication en l’état, ou une relecture.');
}

main().catch((e) => { console.error(e); process.exit(1); });
