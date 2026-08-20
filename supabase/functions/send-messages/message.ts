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
