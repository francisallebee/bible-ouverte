// Alerte d'inscription — un courriel à l'administrateur quand quelqu'un
// crée un compte.
//
// Appelée par `pg_cron` au même rythme que `send-notifications`, et protégée
// par le même secret partagé. Un balayage plutôt qu'un déclencheur sur la
// table : le chemin d'inscription n'a pas à porter une pièce de plus, et un
// quart d'heure de délai est sans conséquence pour un avertissement
// d'administration.
//
// La rédaction du message vit dans `message.ts`, sans dépendance et couverte
// par les tests de `npm test`.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import {
  comptesASignaler, composeNewUserEmail,
  comptesAAccueillir, composeWelcomeEmail,
} from './message.ts'
import type { NouveauCompte } from './message.ts'

/** Borne du lot examiné à chaque passage. Large au regard du rythme réel. */
const PROFILS_EXAMINES = 100

Deno.serve(async (req) => {
  // Même contrôle que `send-notifications` : la fonction est appelée par la
  // base, jamais par un navigateur.
  const attendu = Deno.env.get('NOTIFY_CRON_SECRET')
  if (!attendu || req.headers.get('x-cron-secret') !== attendu) {
    return new Response('unauthorized', { status: 401 })
  }

  /**
   * Envoi par SMTP, chez l'hébergeur du domaine — et non par une API tierce.
   *
   * Brevo a été abandonné le 18 août 2026 après trois jours d'échecs : son
   * compte n'accepte les appels que depuis des adresses IP autorisées, et les
   * fonctions Edge en changent à chaque exécution. Sept refus, sept adresses ;
   * ni les autoriser une à une ni vider la liste n'y a rien fait.
   *
   * Le SMTP d'o2switch n'a pas cette contrainte, et l'adresse d'expédition
   * appartient enfin au domaine du projet.
   *
   * **Le port 465 est un pari mesuré.** La documentation de Supabase annonce
   * les ports 25, 465 et 587 fermés en sortie ; leur propre exemple
   * `send-email-smtp` s'en sert pourtant, et des déploiements réels le
   * confirment sur 465 avec TLS. Si la connexion est refusée, le journal le
   * dira sans ambiguïté et il faudra revenir à une API HTTP.
   */
  const smtpHote = Deno.env.get('SMTP_HOST')
  const smtpUtilisateur = Deno.env.get('SMTP_USER')
  const smtpMotDePasse = Deno.env.get('SMTP_PASSWORD')
  const expediteur = Deno.env.get('NEW_USER_ALERT_FROM')
  const destinataire = Deno.env.get('NEW_USER_ALERT_TO')

  // Nommer précisément ce qui manque, et non tout d'un bloc : ces secrets se
  // déposent en plusieurs fois, et un message groupé laisse chercher lequel
  // n'est pas passé.
  const manquants = [
    ['SMTP_HOST', smtpHote],
    ['SMTP_USER', smtpUtilisateur],
    ['SMTP_PASSWORD', smtpMotDePasse],
    ['NEW_USER_ALERT_FROM', expediteur],
    ['NEW_USER_ALERT_TO', destinataire],
  ].filter(([, valeur]) => !valeur).map(([nom]) => nom)

  if (manquants.length > 0) {
    return new Response(`secret manquant : ${manquants.join(', ')}`, { status: 500 })
  }

  // La clé service_role est nécessaire : `new_user_alerts` n'a aucune policy,
  // et les adresses vivent dans `auth.users`, hors de portée du client.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profils, error: erreurProfils } = await supabase
    .from('profiles')
    .select('id, name, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(PROFILS_EXAMINES)

  if (erreurProfils) {
    return new Response(`profils : ${erreurProfils.message}`, { status: 500 })
  }

  const ids = (profils ?? []).map((p) => p.id as string)
  if (ids.length === 0) return Response.json({ nouveaux: 0, envoye: false })

  const { data: traces, error: erreurTraces } = await supabase
    .from('new_user_alerts')
    .select('user_id, welcomed_at, welcome_attempts')
    .in('user_id', ids)

  if (erreurTraces) {
    return new Response(`traces : ${erreurTraces.message}`, { status: 500 })
  }

  const candidats: NouveauCompte[] = (profils ?? []).map((p) => ({
    id: p.id as string,
    name: (p.name as string | null) ?? null,
    firstName: (p.first_name as string | null) ?? null,
    lastName: (p.last_name as string | null) ?? null,
    email: null,
    createdAt: (p.created_at as string) ?? new Date().toISOString(),
  }))

  /**
   * L'état de bienvenue, tel qu'il est en base avant ce passage.
   *
   * Les 112 lignes d'avant le 20 août 2026 portent toutes un `welcomed_at`
   * rempli rétroactivement par `20260820100000_welcome_email.sql` : sans lui,
   * ce passage aurait écrit à des gens inscrits depuis des semaines.
   */
  const etats = (traces ?? []).map((t) => ({
    userId: t.user_id as string,
    welcomedAt: (t.welcomed_at as string | null) ?? null,
    welcomeAttempts: (t.welcome_attempts as number | null) ?? 0,
  }))
  const dejaTrace = new Set(etats.map((e) => e.userId))
  const dejaAccueilli = new Set(etats.filter((e) => e.welcomedAt).map((e) => e.userId))
  const epuise = new Set(etats.filter((e) => e.welcomeAttempts >= 3).map((e) => e.userId))

  const nouveaux = comptesASignaler(
    candidats,
    (traces ?? []).map((t) => t.user_id as string),
  )

  /**
   * Les deux passes sont **indépendantes**, et il a fallu s'en apercevoir.
   *
   * `comptesASignaler` écarte tout compte déjà tracé : un message de bienvenue
   * refusé une fois par le SMTP n'aurait donc jamais été repris, le compte
   * étant désormais « connu ». Les candidats à la bienvenue se calculent donc
   * sur la liste complète des profils récents, et non sur les nouveaux.
   */
  const aTenter = candidats.filter(
    (c) => !dejaAccueilli.has(c.id) && !epuise.has(c.id),
  )
  if (nouveaux.length === 0 && aTenter.length === 0) {
    return Response.json({ nouveaux: 0, envoye: false, bienvenues: 0 })
  }

  // L'adresse n'est pas dans `profiles` : elle se lit compte par compte, ce qui
  // reste peu coûteux sur un lot de nouvelles inscriptions. Un échec de lecture
  // ne doit pas empêcher l'alerte — `designer` sait s'en passer.
  const aAdresser = new Map<string, NouveauCompte>()
  for (const compte of [...nouveaux, ...aTenter]) aAdresser.set(compte.id, compte)
  for (const compte of aAdresser.values()) {
    try {
      const { data } = await supabase.auth.admin.getUserById(compte.id)
      compte.email = data?.user?.email ?? null
    } catch {
      compte.email = null
    }
  }

  // La trace est écrite AVANT l'envoi, comme pour les notifications push.
  // Recevoir dix fois la même inscription ferait poser une règle de filtrage,
  // et l'alerte ne servirait plus à rien.
  const { data: ecrites, error: erreurEcriture } = await supabase
    .from('new_user_alerts')
    .upsert(nouveaux.map((c) => ({ user_id: c.id })), {
      onConflict: 'user_id',
      ignoreDuplicates: true,
    })
    .select('user_id')

  if (erreurEcriture) {
    return new Response(`trace : ${erreurEcriture.message}`, { status: 500 })
  }

  // Seuls les comptes réellement écrits sont annoncés : un passage concurrent
  // a pu en prendre une partie entre-temps.
  const retenus = new Set((ecrites ?? []).map((l) => l.user_id as string))
  const aAnnoncer = nouveaux.filter((c) => retenus.has(c.id))
  // `null` quand il n'y a aucune inscription neuve : ce passage ne sert alors
  // qu'aux messages de bienvenue restés en souffrance, et il ne s'arrête pas là.
  const courriel = composeNewUserEmail(aAnnoncer)

  /**
   * Retire les traces que ce passage vient d'écrire.
   *
   * L'écriture précède l'envoi pour empêcher les doublons, et cela ne change
   * pas. Mais rien ne la défaisait quand l'envoi échouait : le compte restait
   * réputé annoncé sans l'avoir été, et le passage suivant rendait
   * `{"nouveaux":0}` — un succès franc qui ne prouvait rien. Onze inscriptions
   * ont été perdues ainsi entre le 16 et le 18 août 2026, pendant que Brevo
   * refusait pour une raison sans rapport.
   *
   * Ne sont retirées que les lignes de ce passage — `retenus` vient du
   * `.select()` de l'upsert — jamais celles d'un passage concurrent ni
   * l'amorçage.
   */
  async function oublierLesTraces(): Promise<void> {
    const ids = [...retenus]
    if (ids.length === 0) return
    const { error } = await supabase
      .from('new_user_alerts')
      .delete()
      .in('user_id', ids)
    if (error) {
      // Le pire cas : l'envoi a échoué ET la trace reste. Le dire, faute de
      // pouvoir mieux — c'est ce silence-là qui a coûté onze comptes.
      console.error('traces non retirées après échec', error.message, ids)
    }
  }

  /**
   * L'envoi lui-même.
   *
   * `denomailer` ouvre une connexion TCP chiffrée, l'authentifie, transmet le
   * message et referme. Tout y est enveloppé dans un `try` : une connexion
   * refusée, un mot de passe rejeté ou un expéditeur inconnu du serveur lèvent
   * tous, et chacun doit rendre les traces plutôt que de perdre les comptes.
   */
  const client = new SMTPClient({
    connection: {
      hostname: smtpHote!,
      // 465 impose TLS dès la connexion, sans négociation préalable — c'est ce
      // que sert o2switch, et le seul port qui ait des chances de sortir.
      port: 465,
      tls: true,
      auth: {
        username: smtpUtilisateur!,
        password: smtpMotDePasse!,
      },
    },
  })

  let bienvenues = 0
  let bienvenuesEchouees = 0

  try {
    if (courriel) {
      try {
        await client.send({
          from: `Bible Ouverte <${expediteur}>`,
          to: destinataire!,
          subject: courriel.subject,
          content: courriel.text,
          html: courriel.html,
        })
      } catch (err) {
        await oublierLesTraces()
        console.error('envoi smtp impossible', err)
        return new Response(`smtp : ${err instanceof Error ? err.message : err}`, { status: 502 })
      }
    }

    /**
     * Les messages de bienvenue, un par personne, après l'alerte.
     *
     * Deux différences avec l'alerte, et elles se répondent :
     *
     * - **Le compteur est incrémenté avant l'envoi**, jamais après. Une
     *   fonction Edge peut être coupée en plein vol ; un compteur incrémenté
     *   ensuite laisserait réessayer sans fin.
     * - **Un échec ne fait pas échouer le passage.** L'alerte est un service
     *   rendu au propriétaire, elle mérite un 502 ; une bienvenue qui n'est pas
     *   partie sera reprise au passage suivant, trois fois au plus.
     */
    const aAccueillir = comptesAAccueillir([...aAdresser.values()], etats)
      .filter((c) => retenus.has(c.id) || dejaTrace.has(c.id))

    for (const compte of aAccueillir) {
      const message = composeWelcomeEmail(compte)
      if (!message) continue

      const etat = etats.find((e) => e.userId === compte.id)
      const { error: erreurCompteur } = await supabase
        .from('new_user_alerts')
        .update({ welcome_attempts: (etat?.welcomeAttempts ?? 0) + 1 })
        .eq('user_id', compte.id)
      if (erreurCompteur) {
        console.error('compteur de bienvenue', compte.id.slice(0, 8), erreurCompteur.message)
        continue
      }

      try {
        await client.send({
          from: `Bible Ouverte <${expediteur}>`,
          to: compte.email!,
          subject: message.subject,
          content: message.text,
          html: message.html,
        })
        await supabase
          .from('new_user_alerts')
          .update({ welcomed_at: new Date().toISOString() })
          .eq('user_id', compte.id)
        bienvenues++
      } catch (err) {
        bienvenuesEchouees++
        console.error('bienvenue non envoyée', compte.id.slice(0, 8), err)
      }
    }
  } finally {
    // La fermeture peut lever à son tour sans que l'envoi ait échoué : ne pas
    // la laisser masquer un succès.
    try { await client.close() } catch { /* connexion déjà tombée */ }
  }

  return Response.json({
    nouveaux: aAnnoncer.length,
    envoye: courriel !== null,
    comptes: aAnnoncer.map((c) => c.id.slice(0, 8)),
    bienvenues,
    bienvenuesEchouees,
  })
})
