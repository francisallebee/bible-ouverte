/**
 * Le doublon par courriel des messages de l'administration.
 *
 * Une fonction distincte de `notify-new-user` plutôt qu'un ajout : celle-ci
 * annonce les inscriptions au propriétaire et souhaite la bienvenue aux
 * arrivants ; celle-là écrit à qui l'administration a écrit. Les mêler aurait
 * donné une fonction dont le nom ment.
 *
 * Elle partage tout le reste : le SMTP d'o2switch, les cinq secrets, le
 * contrôle par `x-cron-secret`, et la règle du compteur incrémenté **avant**
 * l'envoi — une fonction Edge peut être coupée en plein vol.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import {
  aEnvoyer, composeMessageEmail, MAX_TENTATIVES,
  ENVOIS_PAR_CONNEXION, estPanneDeConnexion,
} from './message.ts'
import type { MessageAEnvoyer } from './message.ts'

/** Borne du lot par passage. Large au regard du rythme réel. */
const LOT = 50

Deno.serve(async (req) => {
  const attendu = Deno.env.get('NOTIFY_CRON_SECRET')
  if (!attendu || req.headers.get('x-cron-secret') !== attendu) {
    return new Response('unauthorized', { status: 401 })
  }

  const smtpHote = Deno.env.get('SMTP_HOST')
  const smtpUtilisateur = Deno.env.get('SMTP_USER')
  const smtpMotDePasse = Deno.env.get('SMTP_PASSWORD')
  const expediteur = Deno.env.get('NEW_USER_ALERT_FROM')

  const manquants = [
    ['SMTP_HOST', smtpHote],
    ['SMTP_USER', smtpUtilisateur],
    ['SMTP_PASSWORD', smtpMotDePasse],
    ['NEW_USER_ALERT_FROM', expediteur],
  ].filter(([, v]) => !v).map(([n]) => n)
  if (manquants.length > 0) {
    return new Response(`secret manquant : ${manquants.join(', ')}`, { status: 500 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: lignes, error: erreurLecture } = await supabase
    .from('messages')
    .select('id, user_id, subject, body, sent_by_name, kind')
    .eq('from_admin', true)
    .is('emailed_at', null)
    .lt('email_attempts', MAX_TENTATIVES)
    .order('id', { ascending: true })
    .limit(LOT)

  if (erreurLecture) {
    return new Response(`messages : ${erreurLecture.message}`, { status: 500 })
  }
  if (!lignes || lignes.length === 0) {
    return Response.json({ candidats: 0, envoyes: 0 })
  }

  // L'adresse n'est pas dans `messages`, et le prénom pas davantage : les deux
  // se lisent par destinataire. Un lot est borné à LOT, donc ce parcours l'est
  // aussi — ce n'est pas le comptage dans une boucle du 18 août, qui portait
  // sur toute une table.
  const destinataires: string[] = [...new Set(lignes.map((l) => l.user_id as string))]
  const profils = new Map<string, { firstName: string | null; name: string | null; email: string | null }>()

  const { data: lignesProfil } = await supabase
    .from('profiles').select('id, first_name, name').in('id', destinataires)
  for (const p of lignesProfil ?? []) {
    profils.set(p.id as string, {
      firstName: (p.first_name as string | null) ?? null,
      name: (p.name as string | null) ?? null,
      email: null,
    })
  }
  for (const id of destinataires) {
    try {
      const { data } = await supabase.auth.admin.getUserById(id)
      const courant = profils.get(id) ?? { firstName: null, name: null, email: null }
      courant.email = data?.user?.email ?? null
      profils.set(id, courant)
    } catch { /* le message reste lisible dans l'application */ }
  }

  const candidats: MessageAEnvoyer[] = lignes.map((l) => {
    const p = profils.get(l.user_id as string)
    return {
      id: l.id as number,
      userId: l.user_id as string,
      subject: (l.subject as string) ?? '',
      body: (l.body as string) ?? '',
      sentByName: (l.sent_by_name as string) ?? '',
      kind: (l.kind as string | null) ?? null,
      email: p?.email ?? null,
      firstName: p?.firstName ?? null,
      name: p?.name ?? null,
    }
  })

  const retenus = aEnvoyer(candidats)
  if (retenus.length === 0) {
    return Response.json({ candidats: candidats.length, envoyes: 0, sansAdresse: candidats.length })
  }

  /**
   * **Une connexion ne sert que trois messages**, et c'est mesuré.
   *
   * Le 28 août 2026, l'envoi de 114 messages a été écoulé par le
   * planificateur en 39 passages de trois courriels, sur 9 h 34 : le serveur
   * mutualisé d'o2switch ferme la connexion après le troisième, et le
   * quatrième `send` levait `UnexpectedEof`. Une seule connexion partagée par
   * tout le lot condamnait donc 47 messages sur 50 à chaque passage.
   */
  const ouvrirConnexion = () => new SMTPClient({
    connection: {
      hostname: smtpHote!,
      port: 465,
      tls: true,
      auth: { username: smtpUtilisateur!, password: smtpMotDePasse! },
    },
  })

  let client: InstanceType<typeof SMTPClient> | null = null
  let surCetteConnexion = 0

  const fermerConnexion = async () => {
    if (!client) return
    try { await client.close() } catch { /* connexion déjà tombée */ }
    client = null
  }

  let envoyes = 0
  let echoues = 0
  /** Vrai si la connexion est morte et qu'on a rendu la main au planificateur. */
  let interrompu = false

  try {
    for (const message of retenus) {
      const courriel = composeMessageEmail(message)
      if (!courriel) continue

      if (!client || surCetteConnexion >= ENVOIS_PAR_CONNEXION) {
        await fermerConnexion()
        client = ouvrirConnexion()
        surCetteConnexion = 0
      }

      // Le compteur d'abord : une coupure entre l'envoi et l'écriture ferait
      // sinon réessayer indéfiniment.
      const { error: erreurCompteur } = await supabase.rpc('increment_message_attempt', {
        message_id: message.id,
      })
      if (erreurCompteur) {
        console.error('compteur', message.id, erreurCompteur.message)
        continue
      }

      try {
        await client.send({
          from: `Bible Ouverte <${expediteur}>`,
          to: message.email!,
          subject: courriel.subject,
          content: courriel.text,
          html: courriel.html,
        })
        await supabase
          .from('messages')
          .update({ emailed_at: new Date().toISOString() })
          .eq('id', message.id)
        envoyes++
        surCetteConnexion++
      } catch (err) {
        echoues++
        console.error('message non envoyé', message.id, err)

        /**
         * **Une connexion morte fait rendre la main, elle ne fait pas
         * continuer.** Le compteur de tentatives est incrémenté avant l'envoi ;
         * poursuivre la boucle en brûlerait une par message sans en expédier
         * aucun, et trois passages suffiraient à condamner un message jamais
         * parti. 37 tentatives ont été perdues ainsi le 28 août 2026.
         *
         * Une erreur qui ne vise qu'un destinataire — adresse refusée, quota —
         * laisse au contraire le lot se poursuivre.
         */
        if (estPanneDeConnexion(err)) {
          interrompu = true
          break
        }
      }
    }
  } finally {
    await fermerConnexion()
  }

  return Response.json({
    candidats: candidats.length,
    envoyes,
    echoues,
    interrompu,
    sansAdresse: candidats.length - retenus.length,
  })
})
