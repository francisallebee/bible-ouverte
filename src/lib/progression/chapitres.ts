import { VERSETS_PAR_CHAPITRE } from '@/features/bible/versification'

/**
 * Distinguer un chapitre **entamé** d'un chapitre **lu en entier**.
 *
 * L'écran Progression comptait un chapitre dès qu'une lecture le touchait, sans
 * jamais regarder les versets : cocher Jean 3:16-18 — trois versets sur
 * trente-six — marquait tout Jean 3 comme lu. Mesuré le 9 septembre 2026 sur le
 * compte du propriétaire : **129 de ses 169 chapitres, soit 76 %, étaient
 * partiels**, et beaucoup ne portaient qu'un seul verset.
 *
 * Ce défaut n'était pas corrigeable avant le 31 août : il faut connaître la
 * longueur réelle de chaque chapitre, et cette table est née du correctif du
 * ticket 25. `versification.ts` est importée **par son chemin** et non par le
 * baril `@/features/bible` — le baril entre dans le chunk partagé de toutes les
 * routes, page d'accueil comprise, ce qui avait déjà coûté 3,8 kB à `/`.
 *
 * **Ce module ne décide pas du niveau ni des badges.** Ils continuent de
 * s'appuyer sur les chapitres entamés : retirer une récompense acquise est la
 * pire chose qu'une application de suivi puisse faire, et le comptage strict en
 * aurait repris deux au propriétaire comme aux trente-trois autres comptes.
 */

/** Ce dont le comptage a besoin d'une lecture, et rien de plus. */
export interface EtendueLue {
  book: string
  chapterStart: number
  chapterEnd: number
  verseStart: number
  verseEnd: number
}

export interface ComptageChapitres {
  /** Les chapitres touchés, ne serait-ce que par un verset. */
  entames: number
  /** Ceux dont tous les versets ont été lus. */
  entiers: number
}

/** Un intervalle de versets, bornes comprises. */
type Intervalle = [number, number]

/** Le nombre de versets d'un chapitre, ou `null` s'il est inconnu. */
export function versetsDuChapitre(livre: string, chapitre: number): number | null {
  const livreEntier = VERSETS_PAR_CHAPITRE[livre]
  if (!livreEntier) return null
  const n = livreEntier[chapitre - 1]
  return typeof n === 'number' && n > 0 ? n : null
}

/**
 * Les intervalles de versets qu'une lecture couvre, chapitre par chapitre.
 *
 * Une lecture qui va de 1:5 à 3:8 couvre la fin du chapitre 1, **tout** le
 * chapitre 2, et le début du chapitre 3. C'est le même découpage que celui de
 * la requête de mesure du 9 septembre, pour que les deux chiffres se comparent.
 */
function couvertureDe(lecture: EtendueLue): Map<string, Intervalle> {
  const parChapitre = new Map<string, Intervalle>()
  const dernier = Math.max(lecture.chapterStart, lecture.chapterEnd)

  for (let ch = lecture.chapterStart; ch <= dernier; ch++) {
    const debut = ch === lecture.chapterStart ? lecture.verseStart : 1
    // Un chapitre traversé est lu de bout en bout ; seul le dernier s'arrête
    // au verset choisi. `Infinity` sera borné par la longueur réelle.
    const fin = ch === dernier ? lecture.verseEnd : Infinity
    parChapitre.set(`${lecture.book}:${ch}`, [Math.max(1, debut), fin])
  }
  return parChapitre
}

/** Fusionne des intervalles qui se touchent ou se chevauchent. */
function fusionner(intervalles: Intervalle[]): Intervalle[] {
  if (intervalles.length === 0) return []
  const tries = [...intervalles].sort((a, b) => a[0] - b[0])
  const fusion: Intervalle[] = [tries[0]]

  for (const [debut, fin] of tries.slice(1)) {
    const courant = fusion[fusion.length - 1]
    // `debut <= courant[1] + 1` : 1-3 et 4-6 se rejoignent, il n'y a pas de
    // trou entre eux. Sans le `+ 1`, deux lectures contiguës laisseraient le
    // chapitre éternellement incomplet.
    if (debut <= courant[1] + 1) courant[1] = Math.max(courant[1], fin)
    else fusion.push([debut, fin])
  }
  return fusion
}

/**
 * Compte les chapitres entamés et ceux lus en entier.
 *
 * Un chapitre est **entier** quand la réunion de ses intervalles couvre du
 * verset 1 au dernier. Un chapitre dont la longueur est inconnue — un livre
 * absent de la table — est compté comme entamé et jamais comme entier : mieux
 * vaut sous-estimer que d'annoncer une lecture complète qu'on ne peut pas
 * vérifier.
 */
export function compterChapitres(lectures: readonly EtendueLue[]): ComptageChapitres {
  const parChapitre = new Map<string, Intervalle[]>()

  for (const lecture of lectures) {
    // `Array.from` et non l'itérateur direct : c'est le piège 10 du dépôt,
    // rencontré ici pour la troisième fois après un `Set` et un `matchAll`.
    // Vitest étale volontiers un itérateur, `tsc` le refuse sans
    // `--downlevelIteration` — les quatorze tests passaient déjà.
    for (const [cle, intervalle] of Array.from(couvertureDe(lecture))) {
      const deja = parChapitre.get(cle)
      if (deja) deja.push(intervalle)
      else parChapitre.set(cle, [intervalle])
    }
  }

  let entiers = 0
  for (const [cle, intervalles] of Array.from(parChapitre)) {
    const separateur = cle.lastIndexOf(':')
    const livre = cle.slice(0, separateur)
    const chapitre = Number(cle.slice(separateur + 1))
    const longueur = versetsDuChapitre(livre, chapitre)
    if (longueur === null) continue

    const fusion = fusionner(intervalles)
    // Entier si le premier intervalle part de 1 et atteint la fin. Les
    // lectures hors bornes — `PSA 1:1-200`, héritées des anciennes listes —
    // sont donc traitées comme complètes, ce qui est le comportement voulu :
    // leur auteur a bien lu tout le chapitre.
    if (fusion.length > 0 && fusion[0][0] === 1 && fusion[0][1] >= longueur) entiers++
  }

  return { entames: parChapitre.size, entiers }
}
