/**
 * L'identité d'un compte : prénom, nom, et provenance.
 *
 * Trois règles vivent ici plutôt que dans les écrans, parce qu'elles sont
 * employées à quatre endroits — le formulaire d'inscription, l'écran Profil,
 * le passage obligé de complétion, et l'administration — et qu'une règle
 * recopiée quatre fois diverge trois fois.
 */

/**
 * Comment la personne a connu l'application.
 *
 * Ce sont des **identifiants**, pas des libellés : ils partent en base, où une
 * contrainte les fige (`profiles_discovery_source_check`), et se traduisent à
 * l'affichage. Même partage que les statuts de ticket et les contextes système
 * — voir la section « Ce qui est libellé et ce qui est logique » d'AGENTS.md.
 */
export const PROVENANCES = ['internet', 'reseaux', 'connaissance', 'autre'] as const

export type Provenance = (typeof PROVENANCES)[number]

export function estProvenance(valeur: unknown): valeur is Provenance {
  return typeof valeur === 'string' && (PROVENANCES as readonly string[]).includes(valeur)
}

export interface Identite {
  firstName?: string | null
  lastName?: string | null
  /** Le nom d'affichage déjà en base. Les comptes d'avant le 20 août 2026 n'ont que lui. */
  name?: string | null
}

function propre(valeur: string | null | undefined): string {
  return (valeur ?? '').trim()
}

/**
 * Le nom d'affichage, et **la même règle qu'au trigger d'inscription**.
 *
 * `profiles.name` ne disparaît pas : le tableau d'administration, l'avatar par
 * initiale, `tickets.userName` et l'alerte d'inscription le lisent tous. Il
 * devient un nom composé, que cette fonction sait recomposer quand le prénom
 * ou le nom change — sans quoi modifier son prénom dans Profil laisserait
 * l'ancien nom partout ailleurs. C'est le piège des trois chemins, appliqué à
 * une colonne dérivée.
 *
 * L'ordre est celui de `handle_new_user()` dans
 * `20260820090000_profile_identity.sql`. Si l'un des deux change, l'autre doit
 * suivre.
 */
export function nomAffiche(identite: Identite, repli = ''): string {
  const compose = [propre(identite.firstName), propre(identite.lastName)]
    .filter(Boolean)
    .join(' ')
  return compose || propre(identite.name) || repli
}

/**
 * Comment s'adresser à la personne dans un message.
 *
 * Le prénom seul quand il existe — un courriel qui commence par « Bonjour
 * Dupont » sonne comme une facture. Le nom d'affichage sinon, et le repli en
 * dernier recours : le message part quand même, ce n'est pas une adresse qui
 * doit dépendre d'un champ facultatif.
 */
export function pourSAdresser(identite: Identite, repli: string): string {
  return propre(identite.firstName) || propre(identite.name) || repli
}

/**
 * Une identité est complète quand le prénom **et** le nom sont là.
 *
 * Ce sont les deux seuls champs exigés : la ville, le portable et la
 * provenance restent facultatifs, et un profil sans eux n'est pas incomplet.
 * Exiger six champs à l'inscription fait abandonner ; c'est la décision du
 * propriétaire du dépôt, le 20 août 2026.
 */
export function identiteComplete(identite: Identite | null | undefined): boolean {
  if (!identite) return false
  return propre(identite.firstName).length > 0 && propre(identite.lastName).length > 0
}
