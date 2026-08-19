#!/usr/bin/env node
/**
 * Mesure le poids en mots d'un chapitre et d'un verset, livre par livre.
 *
 * Un objectif « en minutes » n'a rien à chronométrer : il estime le temps à
 * partir de ce qui a été lu. Encore faut-il savoir ce que « un chapitre »
 * représente, et une moyenne unique ne suffit pas — mesuré sur Louis Segond
 * 1910, un chapitre des Psaumes fait 268 mots quand un chapitre des Rois en
 * fait 1015. Un facteur de près de quatre, que personne ne remarquerait sur
 * l'écran mais que l'estimation porterait entièrement.
 *
 * La référence est **Louis Segond 1910**, version par défaut de l'application.
 * Les autres traductions comptent un peu autrement — l'arabe surtout, dont les
 * mots agglutinent ce que le français sépare. L'estimation ne s'en trouve pas
 * fausse, seulement approchée d'un cran de plus, et un objectif en minutes est
 * de toute façon un ordre de grandeur.
 *
 * Usage : node scripts/mesure-mots.mjs
 * Écrit src/lib/objectifs/mots.ts. Ne pas modifier ce fichier à la main.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'public/bibles/ls1910.json'
const CIBLE = 'src/lib/objectifs/mots.ts'

const bible = JSON.parse(readFileSync(SOURCE, 'utf8'))

let motsTotal = 0
let versetsTotal = 0
let chapitresTotal = 0
const lignes = []

for (const livre of bible.books) {
  let mots = 0
  let versets = 0
  for (const chapitre of livre.chapters) {
    for (const verset of chapitre.verses) {
      // Un découpage sur les blancs : ni la ponctuation ni les nombres de
      // versets n'entrent dans le texte, qui est déjà nettoyé à l'import.
      mots += verset.text.split(/\s+/).filter(Boolean).length
      versets++
    }
  }
  const chapitres = livre.chapters.length
  if (versets === 0 || chapitres === 0) {
    throw new Error(`${livre.abbreviation} est vide : la source ne convient pas`)
  }
  motsTotal += mots
  versetsTotal += versets
  chapitresTotal += chapitres
  // Les abréviations sont entre guillemets : `1SA` et `2CH` ne sont pas des
  // identifiants valides, et un littéral d'objet les refuserait nus.
  lignes.push(
    `  '${livre.abbreviation}': { chapitre: ${Math.round(mots / chapitres)}, ` +
    `verset: ${Math.round(mots / versets)} },`,
  )
}

const parChapitre = Math.round(motsTotal / chapitresTotal)
const parVerset = Math.round(motsTotal / versetsTotal)

const sortie = `/**
 * Le poids en mots d'un chapitre et d'un verset, livre par livre.
 *
 * **Produit par \`node scripts/mesure-mots.mjs\`. Ne pas modifier à la main.**
 *
 * Mesuré sur Louis Segond 1910 : ${motsTotal.toLocaleString('fr-FR').replace(/\\u202f|\\u00a0/g, ' ')} mots, ${versetsTotal} versets,
 * ${chapitresTotal} chapitres. La moyenne générale — ${parChapitre} mots par chapitre — ne
 * suffisait pas : les Psaumes en font 268, les Rois 1015. Un facteur de près
 * de quatre, que l'estimation aurait porté en entier.
 *
 * Les clés sont les abréviations USFM, celles que \`readings.book\` stocke.
 */
export interface MotsDuLivre {
  /** Mots d'un chapitre moyen de ce livre. */
  chapitre: number
  /** Mots d'un verset moyen de ce livre. */
  verset: number
}

export const MOTS_PAR_LIVRE: Record<string, MotsDuLivre> = {
${lignes.join('\n')}
}

/** Pour un livre inconnu de la table — aucun aujourd'hui, mais rien ne l'interdit. */
export const MOTS_DEFAUT: MotsDuLivre = { chapitre: ${parChapitre}, verset: ${parVerset} }
`

writeFileSync(CIBLE, sortie)
console.log(`${CIBLE} écrit : ${lignes.length} livres, ${motsTotal} mots.`)
