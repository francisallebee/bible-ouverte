import { FENETRE_PRESENCE_MS } from '@/lib/presence'

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
  /** Dernière saisie de mot de passe. Ne dit **rien** de la présence. */
  lastSignIn: string | null
  /** Dernier signe de vie de l'application. Voir `lib/presence.ts`. */
  lastSeen?: string | null
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
export function normaliser(valeur: string): string {
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

/**
 * Le statut affiché d'un compte, en trois états exclusifs.
 *
 * **La suspension prime sur tout le reste.** Un compte suspendu dont le jeton
 * a été rafraîchi il y a deux minutes n'est pas « en ligne » : il est
 * suspendu, et c'est la seule chose qui importe à qui regarde la liste.
 *
 * « En ligne » repose sur `last_sign_in_at`, que GoTrue met à jour au
 * rafraîchissement du jeton. C'est un indice de présence, pas une preuve — d'où
 * une fenêtre courte : au-delà de cinq minutes, on ne prétend plus rien.
 *
 * Cette fonction existe parce que la logique avait **disparu** en extrayant la
 * gestion des utilisateurs dans son propre écran, le 20 août 2026 : la colonne
 * affichait « Hors ligne » pour tout le monde, suspendus compris. Elle est ici
 * pour être testée, plutôt qu'écrite en ternaire au milieu d'un tableau.
 */
export type Statut = 'suspendu' | 'en-ligne' | 'hors-ligne'

/**
 * **Ce n'est pas `lastSignIn` qui dit la présence, et c'est mesuré.**
 *
 * `auth.users.last_sign_in_at` ne bouge qu'à une vraie saisie de mot de passe.
 * Le 20 août 2026 à 13:26 UTC, le compte administrateur portait une « dernière
 * connexion » à 11:29 alors que sa dernière action datait de 13:21 : 117
 * minutes d'écart, en pleine utilisation. L'indicateur « En ligne » reposait
 * dessus depuis l'origine, et ne s'allumait donc que dans les minutes suivant
 * une connexion — jamais pour quelqu'un qui reste connecté.
 *
 * `lastSeen` vient de `profiles.last_seen_at`, écrit par le navigateur toutes
 * les trois minutes. La fenêtre en vaut cinq : assez pour couvrir un envoi
 * manqué, assez court pour ne pas mentir sur quelqu'un qui vient de fermer.
 */
export function statutDe(
  ligne: Pick<LigneUtilisateur, 'suspended' | 'lastSeen'>,
  maintenant: Date = new Date(),
): Statut {
  if (ligne.suspended) return 'suspendu'
  if (!ligne.lastSeen) return 'hors-ligne'
  const vu = Date.parse(ligne.lastSeen)
  // Une date illisible ne vaut pas une présence.
  if (Number.isNaN(vu)) return 'hors-ligne'
  return vu > maintenant.getTime() - FENETRE_PRESENCE_MS ? 'en-ligne' : 'hors-ligne'
}

/**
 * Le bannissement est-il encore actif ?
 *
 * `profiles.suspended` est un **miroir** : c'est `auth.users.banned_until` qui
 * empêche réellement de se connecter. Les deux sont écrits ensemble par la
 * route d'administration, mais un miroir peut dériver — une écriture partielle,
 * une reprise de données, une main dans la console.
 *
 * La liste croise donc les deux : un compte est donné pour suspendu si l'un ou
 * l'autre le dit. Mieux vaut annoncer une suspension qui n'a plus d'effet que
 * de laisser passer pour libre quelqu'un qui ne peut plus entrer.
 */
export function banActif(bannedUntil: string | null | undefined, maintenant: Date = new Date()): boolean {
  if (!bannedUntil) return false
  const fin = Date.parse(bannedUntil)
  if (Number.isNaN(fin)) return false
  return fin > maintenant.getTime()
}
