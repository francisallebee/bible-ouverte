/**
 * Le doublon par courriel d'un message de l'administration.
 *
 * Module sans dépendance, testé par vitest comme celui de `notify-new-user` :
 * c'est la partie qu'on ne pourrait sinon vérifier qu'en écrivant à quelqu'un.
 */

export interface MessageAEnvoyer {
  id: number
  userId: string
  subject: string
  body: string
  sentByName: string
  /** L'adresse du destinataire, lue dans `auth.users`. Peut manquer. */
  email: string | null
  /** Le prénom du destinataire, pour la salutation. Peut manquer. */
  firstName: string | null
  /** Le nom d'affichage, en repli. */
  name: string | null
  /**
   * La nature du message. `'birthday'` pour les vœux, `null` pour un message
   * écrit à la main depuis l'administration.
   */
  kind?: string | null
}

export interface Courriel {
  subject: string
  text: string
  html: string
}

export function escapeHtml(valeur: string): string {
  return valeur
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Trois tentatives, puis on renonce — comme pour le message de bienvenue. */
export const MAX_TENTATIVES = 3

/**
 * Combien de messages une connexion SMTP supporte avant d'être refermée.
 *
 * **Mesuré, pas choisi.** L'envoi groupé du 28 août 2026 — 114 messages — a
 * été écoulé par le planificateur en **39 passages de trois courriels**, de
 * 12:26 à 22:00 UTC. À chaque passage, le quatrième `send` levait
 * `UnexpectedEof: peer closed connection without sending TLS close_notify`,
 * puis la fonction mourait sur un `BadResource`. Le serveur mutualisé
 * d'o2switch ferme donc la connexion après trois messages, et le chiffre est
 * remarquablement stable.
 *
 * On rouvre par conséquent une connexion tous les trois envois plutôt que d'en
 * partager une pour tout le lot. Le coût est une poignée de connexions TLS ;
 * le gain est un envoi qui tient en un passage au lieu de neuf heures et
 * demie.
 */
export const ENVOIS_PAR_CONNEXION = 3

/**
 * Cette erreur dit-elle que la **connexion** est morte, et non ce message-ci ?
 *
 * La distinction commande la suite : une adresse invalide ne concerne qu'un
 * destinataire et le lot continue, tandis qu'une connexion tombée fera échouer
 * tout ce qui suit. Or `increment_message_attempt` s'exécute **avant** l'envoi
 * — à dessein, pour qu'une coupure en plein vol ne fasse pas réessayer sans
 * fin. Poursuivre la boucle sur une connexion morte brûle donc une tentative
 * par message sans en envoyer aucun, et trois passages suffisent alors à
 * condamner définitivement un message qui n'est jamais parti.
 *
 * Le 28 août 2026, 37 messages ont perdu une tentative de cette façon. Aucun
 * n'a atteint la limite, mais c'est l'envoi qui était petit, pas la garde qui
 * était bonne.
 */
export function estPanneDeConnexion(erreur: unknown): boolean {
  const nom = (erreur as { name?: unknown })?.name
  const texte = [
    typeof nom === 'string' ? nom : '',
    erreur instanceof Error ? erreur.message : String(erreur ?? ''),
  ].join(' ').toLowerCase()

  return [
    'unexpectedeof',      // le pair a fermé sans close_notify — le cas mesuré
    'badresource',        // la ressource Deno est déjà refermée
    'connectionreset',
    'econnreset',
    'brokenpipe',
    'epipe',
    'connectionaborted',
    'connectionrefused',
    'econnrefused',
    'closed',             // « stream closed », « connection closed »
  ].some((marqueur) => texte.includes(marqueur))
}

/**
 * Ceux à qui écrire vraiment.
 *
 * Un message sans adresse n'est pas une erreur : il reste lisible dans
 * l'application, ce qui est son canal principal. Le courriel est un doublon,
 * pas le contraire.
 */
export function aEnvoyer(messages: MessageAEnvoyer[]): MessageAEnvoyer[] {
  return messages.filter((m) => !!m.email?.trim() && !!m.body.trim())
}

/**
 * Rédige le courriel.
 *
 * **Il ne recopie pas le message et s'arrête là.** Un message qui tombe dans
 * une boîte sans dire d'où il vient ni où répondre ressemble à du courrier
 * indésirable. Le pied de page renvoie donc vers la boîte de réception de
 * l'application, qui est le lieu de la réponse — répondre au courriel
 * n'aboutirait nulle part, l'expéditeur étant une adresse de service.
 *
 * En français quelle que soit la langue du compte, comme le message de
 * bienvenue et les notifications push. Voir AGENTS.md.
 */
export function composeMessageEmail(m: MessageAEnvoyer): Courriel | null {
  if (!m.email?.trim() || !m.body.trim()) return null

  const qui = m.firstName?.trim() || m.name?.trim() || ''
  const titre = m.subject.trim()
  const lien = 'https://bible-ouverte.vercel.app/messages'
  const auteur = m.sentByName.trim() || 'Bible Ouverte'

  /**
   * Les vœux d'anniversaire portent **déjà** leur salutation et leur
   * signature : le texte commence par « Joyeux anniversaire Prénom, » et finit
   * par le nom de son auteur. Y ajouter « Bonjour Prénom, » en tête et
   * « — Prénom » en pied donnerait un courriel qui salue deux fois et signe
   * deux fois.
   *
   * Le drapeau est une **colonne**, `messages.kind`, et non une devinette sur
   * le contenu : reconnaître un vœu à ses premiers mots tiendrait jusqu'au
   * jour où le texte changerait.
   */
  const enrobe = m.kind !== 'birthday'
  const salutation = qui ? `Bonjour ${qui},` : 'Bonjour,'

  const subject = titre ? `Bible Ouverte — ${titre}` : 'Bible Ouverte — un message pour toi'

  const text = [
    ...(enrobe ? [salutation, ''] : []),
    ...(titre && enrobe ? [titre, ''] : []),
    m.body.trim(),
    '',
    ...(enrobe ? [`— ${auteur}`, ''] : []),
    'Pour répondre, ouvre tes messages dans l’application :',
    lien,
  ].join('\n')

  const html = [
    ...(enrobe ? [`<p>${escapeHtml(salutation)}</p>`] : []),
    ...(titre && enrobe ? [`<p><strong>${escapeHtml(titre)}</strong></p>`] : []),
    // Les sauts de ligne tapés deviennent des `<br>`, et le corps est échappé :
    // un message n'est jamais du HTML, même écrit par un administrateur.
    `<p>${escapeHtml(m.body.trim()).replace(/\n/g, '<br>')}</p>`,
    ...(enrobe ? [`<p>— ${escapeHtml(auteur)}</p>`] : []),
    `<p>Pour répondre, ouvre tes messages dans l’application&nbsp;:<br>`
      + `<a href="${lien}">${lien}</a></p>`,
  ].join('\n')

  return { subject, text, html }
}
