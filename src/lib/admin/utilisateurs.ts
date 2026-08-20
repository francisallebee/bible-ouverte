/**
 * La gestion des utilisateurs : chercher, segmenter, trier, paginer, exporter.
 *
 * Tout est ici et rien dans l'écran. Ce sont des règles qu'un tableau rend
 * invisibles — un segment qui compte mal, un tri qui place les « jamais
 * connectés » du mauvais côté, un export qui casse sur une virgule dans un nom
 * — et qu'aucune capture d'écran ne démentirait.
 */

export interface LigneUtilisateur {
  id: string
  name: string
  first_name?: string | null
  last_name?: string | null
  city?: string | null
  phone?: string | null
  discovery_source?: string | null
  email: string | null
  is_admin: boolean
  suspended: boolean
  created_at: string
  lastSignIn: string | null
  readings: number
  plans: number
  contexts: number
}

/**
 * Les segments proposés.
 *
 * `incomplets` n'existait pas avant le 20 août 2026 : c'est la conséquence
 * directe des champs d'identité, et le moyen de voir combien de comptes n'ont
 * pas encore été rattrapés par la complétion de profil.
 */
export const SEGMENTS = [
  'tous', 'actifs', 'inactifs', 'jamais', 'suspendus', 'admins', 'incomplets',
] as const

export type Segment = (typeof SEGMENTS)[number]

const JOUR = 86400000

/**
 * Le découpage du temps, en jours.
 *
 * Sept pour « actif », trente pour « inactif », et **un intervalle laissé
 * vide entre les deux**. Quelqu'un vu il y a dix jours n'est ni l'un ni
 * l'autre : le déclarer inactif serait faux, le déclarer actif aussi. Deux
 * segments qui se touchent donneraient une somme égale au total, ce qui rend
 * bien en tableau de bord et ment sur les gens.
 */
export const JOURS_ACTIF = 7
export const JOURS_INACTIF = 30

export function filtrerParSegment(
  lignes: LigneUtilisateur[], segment: Segment, maintenant: Date = new Date(),
): LigneUtilisateur[] {
  const t = maintenant.getTime()
  switch (segment) {
    case 'tous':
      return lignes
    case 'actifs':
      return lignes.filter((l) => l.lastSignIn && Date.parse(l.lastSignIn) > t - JOURS_ACTIF * JOUR)
    case 'inactifs':
      return lignes.filter((l) => l.lastSignIn && Date.parse(l.lastSignIn) < t - JOURS_INACTIF * JOUR)
    case 'jamais':
      return lignes.filter((l) => !l.lastSignIn)
    case 'suspendus':
      return lignes.filter((l) => l.suspended)
    case 'admins':
      return lignes.filter((l) => l.is_admin)
    case 'incomplets':
      return lignes.filter((l) => !l.first_name?.trim() || !l.last_name?.trim())
  }
}

/**
 * Compare sans se soucier des accents ni de la casse.
 *
 * Chercher « eglise » doit trouver « Église ». `normalize('NFD')` sépare la
 * lettre de son accent, qu'on retire ensuite.
 *
 * L'intervalle `\u0300-\u036f` plutôt que `\p{Diacritic}` : la classe Unicode
 * nommée exige le drapeau `u`, et `tsconfig.json` ne fixe aucune cible — Next
 * la choisit, et `tsc` refuse le drapeau. Cet intervalle est celui des
 * diacritiques combinants, qui couvre le latin, c'est-à-dire les quatre
 * langues cherchables par un nom : l'arabe ne se cherche pas latinisé.
 */
function normaliser(valeur: string): string {
  return valeur.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Recherche sur le nom, l'adresse et la ville. Une requête vide ne filtre rien. */
export function chercher(lignes: LigneUtilisateur[], requete: string): LigneUtilisateur[] {
  const q = normaliser(requete.trim())
  if (!q) return lignes
  return lignes.filter((l) => {
    const champs = [l.name, l.first_name, l.last_name, l.email, l.city]
    return champs.some((c) => c && normaliser(c).includes(q))
  })
}

export const TRIS = ['nom', 'inscription', 'connexion', 'lectures'] as const
export type Tri = (typeof TRIS)[number]
export type Ordre = 'asc' | 'desc'

/**
 * Le tri, et le sort des valeurs absentes.
 *
 * **Une date de connexion absente n'est pas une date ancienne.** Traiter
 * `null` comme l'époque zéro placerait les comptes jamais connectés au milieu
 * des plus anciens, où ils se confondraient avec eux. Ils vont donc toujours
 * en fin de liste, quel que soit l'ordre — c'est la seule place qui ne raconte
 * rien de faux.
 */
export function trier(
  lignes: LigneUtilisateur[], tri: Tri, ordre: Ordre = 'desc',
): LigneUtilisateur[] {
  const sens = ordre === 'asc' ? 1 : -1
  const copie = [...lignes]
  copie.sort((a, b) => {
    if (tri === 'nom') return sens * a.name.localeCompare(b.name, 'fr')
    if (tri === 'lectures') return sens * (a.readings - b.readings)
    if (tri === 'inscription') return sens * a.created_at.localeCompare(b.created_at)
    // connexion
    if (!a.lastSignIn && !b.lastSignIn) return 0
    if (!a.lastSignIn) return 1
    if (!b.lastSignIn) return -1
    return sens * a.lastSignIn.localeCompare(b.lastSignIn)
  })
  return copie
}

export interface Pagination {
  page: number
  pages: number
  debut: number
  fin: number
  total: number
}

/**
 * Les bornes d'une page, **corrigées plutôt que refusées**.
 *
 * Une page hors limites arrive tout le temps : on filtre alors qu'on est en
 * page 4, et il ne reste qu'une page. Rendre une liste vide donnerait un
 * tableau blanc qu'aucun message n'explique ; on ramène donc à la dernière
 * page existante.
 */
export function paginer(total: number, parPage: number, page: number): Pagination {
  const taille = Math.max(1, parPage)
  const pages = Math.max(1, Math.ceil(total / taille))
  const courante = Math.min(Math.max(1, Math.floor(page) || 1), pages)
  const debut = (courante - 1) * taille
  return { page: courante, pages, debut, fin: Math.min(debut + taille, total), total }
}

/**
 * L'export, au format que le tableur de l'utilisateur ouvrira sans broncher.
 *
 * **Point-virgule et non virgule** : Excel en français découpe sur le
 * point-virgule, et un fichier séparé par des virgules s'y ouvre en une seule
 * colonne. **Marque d'ordre d'octets en tête** : sans elle, Excel lit le
 * fichier en ANSI et « Prénom » devient « PrÃ©nom » — le même défaut
 * d'encodage que ce dépôt a déjà payé ailleurs.
 *
 * Chaque valeur est entre guillemets et ses guillemets doublés : un nom qui
 * contient un point-virgule, un saut de ligne ou une apostrophe typographique
 * ne doit pas décaler les colonnes.
 */
export const COLONNES_CSV = [
  'Nom affiché', 'Prénom', 'Nom', 'Email', 'Ville', 'Portable', 'Provenance',
  'Rôle', 'Statut', 'Inscription', 'Dernière connexion', 'Lectures', 'Plans', 'Contextes',
] as const

function champ(valeur: unknown): string {
  const texte = valeur === null || valeur === undefined ? '' : String(valeur)
  return `"${texte.replace(/"/g, '""')}"`
}

export function versCSV(lignes: LigneUtilisateur[]): string {
  const entete = COLONNES_CSV.map(champ).join(';')
  const corps = lignes.map((l) => [
    l.name, l.first_name ?? '', l.last_name ?? '', l.email ?? '', l.city ?? '',
    l.phone ?? '', l.discovery_source ?? '',
    l.is_admin ? 'admin' : 'utilisateur',
    l.suspended ? 'suspendu' : 'actif',
    l.created_at, l.lastSignIn ?? '',
    l.readings, l.plans, l.contexts,
  ].map(champ).join(';'))
  return '﻿' + [entete, ...corps].join('\r\n')
}
