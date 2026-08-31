#!/usr/bin/env node
/**
 * Relève le dernier verset de chacun des 1189 chapitres de la Bible.
 *
 * Le sélecteur de passage proposait 200 versets pour tout chapitre dont le
 * texte n'était pas encore dans le cache — une valeur de repli qui n'existe
 * dans aucune version : le plus grand chapitre de la Bible, le Psaume 119, en
 * compte 176. Un utilisateur a ouvert un ticket le 30 août 2026 : Proverbes 18
 * en annonçait 200, quand il en a 24. Une table remplace donc la constante.
 *
 * La référence est **Louis Segond 1910**, version par défaut de l'application,
 * comme pour `mesure-mots.mjs`. Ce n'est pas un choix indifférent : la
 * versification diffère d'une tradition à l'autre, et le script mesure cet
 * écart plutôt que de le supposer — il le reporte dans l'en-tête du fichier
 * produit. La table ne sert que lorsque le texte n'est pas téléchargé ; dès
 * que le cache répond, c'est lui qui fait foi, puisqu'il porte la version
 * réellement lue.
 *
 * Usage : node scripts/mesure-versets.mjs
 * Écrit src/features/bible/versification.ts. Ne pas modifier ce fichier à la main.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { writeFileSync } from 'node:fs'

const DOSSIER = 'public/bibles'
const REFERENCE = 'ls1910'
const CIBLE = 'src/features/bible/versification.ts'

/** Le dernier verset de chaque chapitre d'une version, par abréviation. */
function releverVersion(fichier) {
  const bible = JSON.parse(readFileSync(`${DOSSIER}/${fichier}`, 'utf8'))
  const parLivre = {}
  for (const livre of bible.books) {
    // Le dernier numéro de verset, et non le nombre de lignes : Sacy porte des
    // chapitres amputés dont la numérotation reste juste, et une version dont
    // l'import aurait sauté une ligne ne doit pas perdre sa fin de chapitre.
    parLivre[livre.abbreviation] = livre.chapters.map((ch) =>
      ch.verses.reduce((max, v) => Math.max(max, v.verse), 0),
    )
  }
  return { id: bible.id, name: bible.name, parLivre }
}

const fichiers = readdirSync(DOSSIER).filter((f) => f.endsWith('.json')).sort()
const versions = fichiers.map(releverVersion)

const reference = versions.find((v) => v.id === REFERENCE)
if (!reference) throw new Error(`${REFERENCE} est absente de ${DOSSIER}`)

let chapitres = 0
let plusGrand = { livre: '', chapitre: 0, versets: 0 }
for (const [abbr, comptes] of Object.entries(reference.parLivre)) {
  comptes.forEach((n, i) => {
    if (n === 0) throw new Error(`${abbr} ${i + 1} est vide : la source ne convient pas`)
    chapitres++
    if (n > plusGrand.versets) plusGrand = { livre: abbr, chapitre: i + 1, versets: n }
  })
}

// Ce que les onze autres versions disent de la même table. Une divergence
// n'est pas un défaut — les traditions ne découpent pas les versets de la même
// façon —, mais elle borne ce que la table peut promettre quand le texte lu
// n'est pas celui de la référence.
const ecarts = []
for (const v of versions) {
  if (v.id === REFERENCE) continue
  let differents = 0
  let ecartMax = 0
  for (const [abbr, comptes] of Object.entries(reference.parLivre)) {
    const autres = v.parLivre[abbr]
    if (!autres) { differents += comptes.length; ecartMax = Math.max(ecartMax, ...comptes); continue }
    comptes.forEach((n, i) => {
      const m = autres[i]
      if (m === undefined) { differents++; ecartMax = Math.max(ecartMax, n); return }
      if (m !== n) { differents++; ecartMax = Math.max(ecartMax, Math.abs(m - n)) }
    })
  }
  ecarts.push({ id: v.id, name: v.name, differents, ecartMax })
}
ecarts.sort((a, b) => a.differents - b.differents)

const identiques = ecarts.filter((e) => e.differents === 0)
const lignesEcart = ecarts.map((e) =>
  ` * | \`${e.id}\` | ${e.differents} | ${e.differents === 0 ? '—' : e.ecartMax} |`,
)

// Les abréviations sont entre guillemets : `1SA` et `2CH` ne sont pas des
// identifiants valides, et un littéral d'objet les refuserait nus.
const lignesTable = Object.entries(reference.parLivre).map(([abbr, comptes]) => {
  const nombres = comptes.join(', ')
  if (nombres.length <= 66) return `  '${abbr}': [${nombres}],`
  // Les Psaumes tiennent 150 nombres : repliés par dizaines pour rester lisibles.
  const paquets = []
  for (let i = 0; i < comptes.length; i += 10) {
    paquets.push('    ' + comptes.slice(i, i + 10).join(', ') + ',')
  }
  return `  '${abbr}': [\n${paquets.join('\n')}\n  ],`
})

const sortie = `/**
 * Le dernier verset de chacun des ${chapitres} chapitres de la Bible.
 *
 * **Produit par \`node scripts/mesure-versets.mjs\`. Ne pas modifier à la main.**
 *
 * Le sélecteur de passage proposait \`200\` versets tant que le texte du
 * chapitre n'était pas dans le cache. Cette valeur n'existe nulle part : le
 * plus grand chapitre de la Bible est ${plusGrand.livre} ${plusGrand.chapitre}, et il en compte
 * **${plusGrand.versets}**. Le ticket 25, ouvert le 30 août 2026, l'a rencontrée sur
 * Proverbes 18 — annoncé à 200 versets quand il en a ${reference.parLivre['PRO'][17]}.
 *
 * Mesuré sur **Louis Segond 1910**, la version par défaut, comme la table des
 * mots de \`lib/objectifs/mots.ts\`. La versification n'est pas universelle, et
 * l'écart est mesuré plutôt que supposé — voici ce que les onze autres
 * versions livrées disent des mêmes chapitres :
 *
 * | Version | Chapitres différents | Écart maximal |
 * |---|---|---|
${lignesEcart.join('\n')}
 *
 * ${identiques.length === 0 ? 'Aucune version ne concorde exactement.' : `Concordent exactement : ${identiques.map((e) => `\`${e.id}\``).join(', ')}.`}
 * Sacy diverge le plus, mais c'est la dette connue de son texte amputé.
 *
 * **Cette table est un repli, jamais une autorité.** Dès que le cache répond
 * pour la version réellement lue, c'est lui qui fait foi : il porte le texte
 * que l'utilisateur a devant les yeux, quand la table ne porte que celui de la
 * référence.
 *
 * Les clés sont les abréviations USFM, celles que \`readings.book\` stocke, et
 * l'index du tableau est le numéro de chapitre moins un.
 */
export const VERSETS_PAR_CHAPITRE: Record<string, readonly number[]> = {
${lignesTable.join('\n')}
}

/**
 * Pour un chapitre que la table ne connaît pas — un livre hors des 66, ou un
 * numéro de chapitre au-delà. C'est ${plusGrand.livre} ${plusGrand.chapitre}, le plus grand chapitre
 * réel : proposer davantage serait proposer des versets qui n'existent nulle
 * part, ce que faisait la constante qu'il remplace.
 */
export const VERSETS_MAXIMUM = ${plusGrand.versets}
`

writeFileSync(CIBLE, sortie)
console.log(`${CIBLE} écrit : ${Object.keys(reference.parLivre).length} livres, ${chapitres} chapitres.`)
console.log(`Plus grand chapitre : ${plusGrand.livre} ${plusGrand.chapitre}, ${plusGrand.versets} versets.`)
for (const e of ecarts) {
  console.log(`  ${e.id.padEnd(11)} ${String(e.differents).padStart(4)} chapitres différents, écart max ${e.ecartMax}`)
}
