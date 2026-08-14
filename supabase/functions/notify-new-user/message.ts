/**
 * Le courriel d'alerte d'inscription — sa rédaction, hors de tout appel réseau.
 *
 * Module sans dépendance : la fonction Deno l'importe, et vitest le teste tel
 * quel. C'est la partie qu'on ne pourrait sinon vérifier qu'en créant un compte
 * de plus à chaque essai, et en attendant le passage du planificateur.
 */

export interface NouveauCompte {
  id: string
  /** Le nom choisi à l'inscription. Peut manquer : le formulaire ne l'impose pas. */
  name: string | null
  /** L'adresse du compte, lue dans `auth.users`. Peut manquer si la lecture échoue. */
  email: string | null
  /** Horodatage ISO de la création du profil. */
  createdAt: string
}

export interface Courriel {
  subject: string
  text: string
  html: string
}

/** Échappe ce qui partirait autrement comme balise dans le corps HTML. */
export function escapeHtml(valeur: string): string {
  return valeur
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Comment désigner un compte quand son nom manque.
 *
 * Le nom n'est pas obligatoire à l'inscription : afficher « null » ou une ligne
 * vide dans l'alerte ferait douter d'un défaut d'envoi. L'adresse prend alors
 * le relais, et l'identifiant en dernier recours.
 */
export function designer(compte: NouveauCompte): string {
  const nom = compte.name?.trim()
  if (nom) return nom
  const adresse = compte.email?.trim()
  if (adresse) return adresse
  return `compte ${compte.id.slice(0, 8)}`
}

/** Date lisible en français, en heure de Paris. */
export function dateLisible(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Rédige l'alerte, ou rend `null` s'il n'y a rien à signaler.
 *
 * Un seul courriel pour tout le lot : le balayage passe au quart d'heure et
 * peut trouver plusieurs inscriptions à la fois. En envoyer un par compte
 * reproduirait le défaut corrigé sur la feuille de route — un afflux de
 * messages qu'on finit par filtrer, donc par ne plus lire.
 */
export function composeNewUserEmail(comptes: NouveauCompte[]): Courriel | null {
  if (comptes.length === 0) return null

  const pluriel = comptes.length > 1
  const subject = pluriel
    ? `Bible Ouverte — ${comptes.length} nouvelles inscriptions`
    : `Bible Ouverte — nouvelle inscription : ${designer(comptes[0])}`

  const lignes = comptes.map((c) => {
    const qui = designer(c)
    const adresse = c.email?.trim()
    const detail = adresse && adresse !== qui ? ` (${adresse})` : ''
    return { texte: `• ${qui}${detail} — ${dateLisible(c.createdAt)}`, qui, detail, quand: dateLisible(c.createdAt) }
  })

  const entete = pluriel
    ? `${comptes.length} personnes viennent de créer un compte sur Bible Ouverte.`
    : 'Une personne vient de créer un compte sur Bible Ouverte.'

  const text = [entete, '', ...lignes.map((l) => l.texte), '', 'https://bible-ouverte.vercel.app'].join('\n')

  const html = [
    `<p>${escapeHtml(entete)}</p>`,
    '<ul>',
    ...lignes.map((l) =>
      `<li><strong>${escapeHtml(l.qui)}</strong>${escapeHtml(l.detail)} — ${escapeHtml(l.quand)}</li>`),
    '</ul>',
    '<p><a href="https://bible-ouverte.vercel.app">Ouvrir Bible Ouverte</a></p>',
  ].join('\n')

  return { subject, text, html }
}

/**
 * Les comptes à signaler : ceux dont l'identifiant n'a pas encore de trace.
 *
 * La comparaison se fait ici, et non en SQL, parce que PostgREST n'exprime pas
 * une jointure externe. Le lot est borné côté appelant.
 */
export function comptesASignaler(
  profils: NouveauCompte[],
  dejaSignales: string[],
): NouveauCompte[] {
  const connus = new Set(dejaSignales)
  return profils
    .filter((p) => !connus.has(p.id))
    // Du plus ancien au plus récent : l'alerte se lit dans l'ordre où les gens
    // sont arrivés.
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
