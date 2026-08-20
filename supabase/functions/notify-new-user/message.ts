/**
 * Le courriel d'alerte d'inscription — sa rédaction, hors de tout appel réseau.
 *
 * Module sans dépendance : la fonction Deno l'importe, et vitest le teste tel
 * quel. C'est la partie qu'on ne pourrait sinon vérifier qu'en créant un compte
 * de plus à chaque essai, et en attendant le passage du planificateur.
 */

export interface NouveauCompte {
  id: string
  /** Le nom d'affichage. Composé du prénom et du nom depuis le 20 août 2026. */
  name: string | null
  /** Le prénom, demandé à l'inscription depuis le 20 août 2026. Null avant. */
  firstName?: string | null
  /** Le nom de famille, même date. */
  lastName?: string | null
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

/**
 * Le message de bienvenue, adressé à la personne qui vient de s'inscrire.
 *
 * Rédigé par le propriétaire du dépôt, le 20 août 2026, et repris **mot pour
 * mot** à trois corrections près qu'il a validées : « N'hésites » prenait un
 * `s` de trop, et la dernière ligne portait `<$Person.firstName$>` — un
 * marqueur d'un autre outil de messagerie, resté collé au texte, qui serait
 * parti tel quel dans le courriel.
 *
 * **Il est en français, quelle que soit la langue du compte.** C'est la même
 * limite que les notifications push et les gabarits de Supabase Auth, décrite
 * dans AGENTS.md : la traduction s'arrête au navigateur. La faire descendre
 * ici supposerait de remonter `settings.language` jusqu'à cette fonction et
 * d'y porter cinq dictionnaires.
 *
 * Rend `null` quand il n'y a pas d'adresse où écrire — un compte sans courriel
 * n'est pas une erreur ici, seulement quelqu'un à qui on ne peut rien envoyer.
 */
export function composeWelcomeEmail(compte: NouveauCompte): Courriel | null {
  if (!compte.email?.trim()) return null

  const complet = designer(compte)
  // Le prénom seul pour la formule finale : « Bien à Dupont » sonnerait faux.
  const prenom = compte.firstName?.trim() || complet
  const patreon =
    'https://www.patreon.com/Oappliday/posts/165644244?utm_campaign=postshare_fan'

  const text = [
    `Bonjour ${complet},`,
    '',
    'Merci pour ton inscription sur « Bible Ouverte »',
    '',
    'J’espère que cette application te sera utile et je compte sur toi pour ' +
      'faire remonter tes appréciations dans le menu « support ». N’hésite pas ' +
      'aussi à regarder dans le menu « Feuille de route » qui te donne les ' +
      'perspectives d’amélioration de l’application.',
    '',
    'Tu pourras nous suivre et soutenir aussi le projet au sein de la ' +
      'communauté « Ôappliday », voici le lien ici :',
    patreon,
    '',
    `Bien à ${prenom}, à bientôt ! 👋`,
  ].join('\n')

  const html = [
    `<p>Bonjour ${escapeHtml(complet)},</p>`,
    '<p>Merci pour ton inscription sur «&nbsp;Bible Ouverte&nbsp;»</p>',
    '<p>J’espère que cette application te sera utile et je compte sur toi pour ' +
      'faire remonter tes appréciations dans le menu «&nbsp;support&nbsp;». ' +
      'N’hésite pas aussi à regarder dans le menu ' +
      '«&nbsp;Feuille de route&nbsp;» qui te donne les perspectives ' +
      'd’amélioration de l’application.</p>',
    '<p>Tu pourras nous suivre et soutenir aussi le projet au sein de la ' +
      'communauté «&nbsp;Ôappliday&nbsp;», voici le lien ici&nbsp;:<br>' +
      `<a href="${patreon}">${patreon}</a></p>`,
    `<p>Bien à ${escapeHtml(prenom)}, à bientôt&nbsp;! 👋</p>`,
  ].join('\n')

  return { subject: 'Bienvenue sur Bible Ouverte', text, html }
}

/**
 * Les comptes à qui écrire, et ceux qu'on laisse tranquilles.
 *
 * Trois conditions, et chacune a coûté une réflexion :
 *
 * - une adresse, sans quoi il n'y a nulle part où écrire ;
 * - pas de `welcomedAt`, faute de quoi on écrirait deux fois ;
 * - moins de `MAX_TENTATIVES` essais. La trace d'alerte est écrite **avant**
 *   l'envoi, ce qui protège des doublons mais ferait disparaître en silence un
 *   message que le SMTP a refusé une fois. Le compteur permet de réessayer
 *   sans tourner en boucle tous les quarts d'heure jusqu'à la fin des temps.
 */
export const MAX_TENTATIVES_BIENVENUE = 3

export interface EtatBienvenue {
  userId: string
  welcomedAt: string | null
  welcomeAttempts: number
}

export function comptesAAccueillir(
  comptes: NouveauCompte[],
  etats: EtatBienvenue[],
): NouveauCompte[] {
  const parId = new Map(etats.map((e) => [e.userId, e]))
  return comptes.filter((c) => {
    if (!c.email?.trim()) return false
    const etat = parId.get(c.id)
    // Aucune ligne d'état : le compte vient d'être inséré dans le même passage.
    if (!etat) return true
    if (etat.welcomedAt) return false
    return etat.welcomeAttempts < MAX_TENTATIVES_BIENVENUE
  })
}
