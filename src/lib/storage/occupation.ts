import { VERSIONS } from '@/features/bible/import'
import { LEXIQUES } from '@/features/bible/strong'
import { ORIGINAUX } from '@/features/bible/originaux'
import type { Locale } from '@/lib/i18n/locales'

/**
 * Ce que le cache occupe, et quand le dire au lecteur.
 *
 * L'application laisse choisir douze traductions, deux lexiques et deux textes
 * originaux, soit **115,7 Mio** si tout est coché. Jusqu'au 30 septembre 2026
 * rien ne l'avertissait du volume : les Réglages annonçaient « environ 6 Mo
 * chacune », ce qui sous-estimait la Van Dyck de 4 Mo et ignorait les 25,6 Mio
 * des originaux. Le plafond avait grandi de moitié depuis la seule mesure du
 * 9 août 2026 (sept versions, 42 Mo) sans être remesuré.
 *
 * **Deux signaux, et non un, parce que les deux risques sont différents.**
 *
 * | Signal | Le risque | Où il se voit |
 * |---|---|---|
 * | `utilise / quota` | l'éviction par le navigateur | Safari, iOS — quota de l'ordre du gigaoctet |
 * | volume absolu | la lenteur des imports, le disque | partout, y compris Chrome |
 *
 * Garder le seul ratio serait une erreur : Chrome accorde une part du disque
 * libre, souvent des dizaines de gigaoctets, si bien que 116 Mio y font moins
 * d'un pour cent et que l'alerte ne se déclencherait **jamais** là où la
 * lenteur, elle, existe. Garder le seul volume absolu serait l'erreur inverse :
 * sur un iPhone presque plein, le quota tombe et 60 Mio suffisent à faire
 * évincer la base sans prévenir.
 *
 * Les seuils sont un **choix**, et il faut le dire plutôt que de le maquiller
 * en mesure. Le ratio alerte à la moitié et non à 95 % parce qu'un navigateur
 * sous pression évince **avant** d'atteindre le quota, et que celui de Safari
 * rétrécit avec le disque libre : une boîte à moitié pleine est déjà le moment
 * d'avertir. Le volume absolu est ancré sur le catalogue lui-même — 60 Mio
 * valent environ neuf traductions, 100 Mio en valent quatorze, c'est-à-dire
 * plus que ce qu'un lecteur peut lire.
 */

/** Ce qu'une ressource pèse au téléchargement, par identifiant de réglage. */
export function poidsRessource(id: string): number {
  const version = VERSIONS.find((v) => v.id === id)
  if (version) return version.octets

  const lexique = LEXIQUES.find((l) => l.id === id)
  if (!lexique) return 0

  /*
    Un lexique et son texte original ne font qu'une case : cocher l'hébreu
    descend le lexique ET l'OSHB. Annoncer les 2,53 Mio du seul lexique
    tromperait de 15,7 Mio — c'est le poids du texte qui domine, et de loin.
    Le troisième chemin de la règle 17 se paie ici aussi.
  */
  const original = ORIGINAUX.find((o) => o.lexiqueId === id)
  return lexique.octets + (original?.octets ?? 0)
}

/** Le total de ce qui est coché. */
export function poidsActif(ids: string[]): number {
  return ids.reduce((somme, id) => somme + poidsRessource(id), 0)
}

/** Le total si tout était coché — le plafond du catalogue. */
export function poidsCatalogue(): number {
  return poidsActif([...VERSIONS.map((v) => v.id), ...LEXIQUES.map((l) => l.id)])
}

export type Occupation = {
  /** Octets réellement occupés par l'origine, tout compris. */
  utilise: number
  /** Ce que le navigateur accorde, s'il le dit. */
  quota: number | null
}

/**
 * L'occupation réelle, demandée au navigateur.
 *
 * `estimate()` compte **toute** l'origine — IndexedDB, Cache API, service
 * worker —, pas seulement nos traductions. C'est le bon chiffre à montrer :
 * c'est celui qui décide de l'éviction. Mais c'est pourquoi il dépasse
 * toujours un peu la somme des poids annoncés, et pourquoi les deux se
 * présentent séparément à l'écran plutôt qu'additionnés.
 *
 * Rend `null` quand l'API manque — Safari ne l'a qu'à partir de la 17 — ou
 * quand elle refuse : en navigation privée, elle jette. Un écran qui suppose
 * un chiffre montrerait « 0 o occupé » à quelqu'un qui a douze traductions.
 */
export async function mesurerOccupation(): Promise<Occupation | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null
  try {
    const { usage, quota } = await navigator.storage.estimate()
    if (typeof usage !== 'number') return null
    return { utilise: usage, quota: typeof quota === 'number' && quota > 0 ? quota : null }
  } catch {
    return null
  }
}

export type Niveau = 'ok' | 'attention' | 'critique'

/** La moitié du quota, et les trois quarts. Voir l'en-tête pour le pourquoi. */
const PART_ATTENTION = 0.5
const PART_CRITIQUE = 0.75
/** Environ neuf traductions, et environ quatorze. */
const VOLUME_ATTENTION = 60 * 1024 * 1024
const VOLUME_CRITIQUE = 100 * 1024 * 1024

/**
 * Le plus alarmant des deux signaux gagne.
 *
 * Et non le plus récent ni une moyenne : les deux disent des choses vraies et
 * indépendantes, donc en taire une pour l'autre reviendrait à choisir quel
 * risque cacher.
 */
export function niveauOccupation(o: Occupation | null): Niveau {
  if (!o) return 'ok'

  const parVolume: Niveau =
    o.utilise >= VOLUME_CRITIQUE ? 'critique' : o.utilise >= VOLUME_ATTENTION ? 'attention' : 'ok'

  if (o.quota === null) return parVolume

  const part = o.utilise / o.quota
  const parPart: Niveau =
    part >= PART_CRITIQUE ? 'critique' : part >= PART_ATTENTION ? 'attention' : 'ok'

  const rang = { ok: 0, attention: 1, critique: 2 }
  return rang[parPart] >= rang[parVolume] ? parPart : parVolume
}

/**
 * Des octets en texte lisible, dans la langue de l'interface.
 *
 * **Le symbole d'unité vient du dictionnaire**, et ce n'est pas un excès de
 * zèle : « Mio » est français, « MiB » anglais, « ميغابايت » arabe. Une table
 * figée ici aurait mis du français dans les quatre autres langues, ce que la
 * règle 10 interdit — et le commentaire de ce module l'avait promis en anglais
 * pendant que le code rendait « Mio » partout. C'est un test qui l'a trouvé,
 * pas une relecture.
 *
 * Les valeurs, elles, restent **binaires** : `estimate()` compte en puissances
 * de 1024, et le disque aussi.
 */
export function formaterOctets(locale: Locale, octets: number, unites: readonly string[]): string {
  let valeur = octets
  let rang = 0
  while (valeur >= 1024 && rang < unites.length - 1) {
    valeur /= 1024
    rang += 1
  }
  // Un chiffre après la virgule à partir du Mio : « 115,7 Mio » se lit, pas
  // « 115,712 Mio ». En deçà, les décimales n'apprennent rien.
  const decimales = rang >= 2 ? 1 : 0
  const nombre = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valeur)
  return `${nombre} ${unites[rang]}`
}
