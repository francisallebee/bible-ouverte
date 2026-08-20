import { normaliser } from './utilisateurs'
import type { LigneUtilisateur } from './utilisateurs'
import { PROVENANCES } from '@/lib/profil/identite'

/**
 * D'où viennent les gens, et quand ils sont arrivés.
 *
 * Tout se calcule sur les lignes que `/api/admin/users` rend déjà : aucune
 * route neuve, aucune requête de plus. C'est la seule raison pour laquelle
 * cette page existe à si bon compte.
 */

export interface Part {
  cle: string
  nombre: number
  /** Entier de 0 à 100. La somme peut faire 99 ou 101 : voir plus bas. */
  pourcent: number
}

/** La clé des comptes dont la provenance n'a pas été renseignée. */
export const PROVENANCE_INCONNUE = 'inconnu'

/**
 * La répartition par provenance.
 *
 * **Les comptes sans réponse ont leur propre part, ils ne sont pas écartés.**
 * Les 112 comptes d'avant le 20 août 2026 n'ont pas été interrogés, et une
 * page qui les ferait disparaître annoncerait « 60 % par Internet » sur une
 * poignée de réponses. La part inconnue est la première chose à lire ici.
 *
 * Les pourcentages sont arrondis indépendamment : leur somme peut faire 99 ou
 * 101. Les redresser pour tomber juste déplacerait l'erreur sur une catégorie
 * choisie arbitrairement, ce qui est pire qu'un total qui ne fait pas cent.
 */
export function parProvenance(lignes: readonly LigneUtilisateur[]): Part[] {
  const total = lignes.length
  const compte = new Map<string, number>()
  for (const cle of PROVENANCES) compte.set(cle, 0)
  compte.set(PROVENANCE_INCONNUE, 0)
  for (const l of lignes) {
    const cle = l.discovery_source?.trim() || PROVENANCE_INCONNUE
    compte.set(cle, (compte.get(cle) ?? 0) + 1)
  }
  return Array.from(compte.entries()).map(([cle, nombre]) => ({
    cle,
    nombre,
    pourcent: total === 0 ? 0 : Math.round((nombre / total) * 100),
  }))
}

/** Le mois civil **local** d'un horodatage, au format `AAAA-MM`. */
export function moisDe(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export interface Mois {
  mois: string
  nombre: number
}

/**
 * Les inscriptions par mois, **mois vides compris**.
 *
 * Un mois sans inscription doit apparaître à zéro. Une série qui saute les
 * mois creux dessine une courbe régulière là où il y a eu un trou : c'est le
 * genre de graphique qui rassure à tort.
 *
 * Les dates sont lues en **local**, jamais en UTC — un compte créé le 1er du
 * mois à 00 h 30 à Paris appartient à ce mois-là, pas au précédent.
 */
export function parMois(
  lignes: readonly LigneUtilisateur[], nombreDeMois = 12, maintenant: Date = new Date(),
): Mois[] {
  const compte = new Map<string, number>()
  for (const l of lignes) {
    const m = moisDe(l.created_at)
    if (!m) continue
    compte.set(m, (compte.get(m) ?? 0) + 1)
  }

  const serie: Mois[] = []
  const curseur = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
  for (let i = nombreDeMois - 1; i >= 0; i--) {
    const d = new Date(curseur.getFullYear(), curseur.getMonth() - i, 1)
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    serie.push({ mois: cle, nombre: compte.get(cle) ?? 0 })
  }
  return serie
}

/**
 * Les villes les plus représentées.
 *
 * **« nimes » et « Nîmes » sont la même ville.** Le regroupement se fait sur
 * une forme normalisée, et l'affichage garde l'orthographe la plus fréquente —
 * pas la première rencontrée, qui n'aurait aucune raison d'être la bonne.
 */
export function parVille(lignes: readonly LigneUtilisateur[], maximum = 10): Part[] {
  const total = lignes.filter((l) => l.city?.trim()).length
  const groupes = new Map<string, { total: number; graphies: Map<string, number> }>()

  for (const l of lignes) {
    const brute = l.city?.trim()
    if (!brute) continue
    const cle = normaliser(brute)
    const groupe = groupes.get(cle) ?? { total: 0, graphies: new Map() }
    groupe.total++
    groupe.graphies.set(brute, (groupe.graphies.get(brute) ?? 0) + 1)
    groupes.set(cle, groupe)
  }

  return Array.from(groupes.values())
    .map((g) => {
      const graphie = Array.from(g.graphies.entries()).sort((a, b) => b[1] - a[1])[0][0]
      return {
        cle: graphie,
        nombre: g.total,
        pourcent: total === 0 ? 0 : Math.round((g.total / total) * 100),
      }
    })
    .sort((a, b) => b.nombre - a.nombre || a.cle.localeCompare(b.cle, 'fr'))
    .slice(0, maximum)
}
