// Envoi des notifications push — quatrième des cinq morceaux de l'item 17.
//
// Cette fonction ne traite qu'un seul déclencheur, le rappel quotidien. Les
// quatre autres — plan en retard, réponse support, feuille de route, longue
// absence — viendront s'ajouter dans `schedule.ts`, le reste étant commun.
//
// Elle est appelée par `pg_cron` toutes les quinze minutes. Cette cadence
// n'est pas arbitraire : un rappel « à 7 h » doit tomber à l'heure dite dans
// tous les fuseaux, et certains sont décalés d'une demi-heure ou d'un quart
// d'heure — l'Inde, le Népal. Un passage horaire les servirait tous à côté.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { collectDaily } from './schedule.ts'

/**
 * Clé publique VAPID, la même que celle du navigateur. La privée ne vit que
 * dans les secrets de cette fonction — `supabase secrets set`.
 */
const VAPID_PUBLIC_KEY =
  'BBGF1rFwRWmV0kUgIogT9fMBH9YRYvn-mLtSgieywW2KpOL_zi6rjH7cEjtM_03iJGFr86gtLMaUURfqtNCi9sE'

interface Subscription {
  endpoint: string
  p256dh: string
  auth: string
}

Deno.serve(async (req) => {
  // La fonction est appelée par la base, jamais par un navigateur. Un secret
  // partagé suffit et évite d'exposer la clé service_role au planificateur.
  const expected = Deno.env.get('NOTIFY_CRON_SECRET')
  if (!expected || req.headers.get('x-cron-secret') !== expected) {
    return new Response('unauthorized', { status: 401 })
  }

  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT')
  if (!vapidPrivate || !vapidSubject) {
    return new Response('VAPID_PRIVATE_KEY ou VAPID_SUBJECT manquant', { status: 500 })
  }
  webpush.setVapidDetails(vapidSubject, VAPID_PUBLIC_KEY, vapidPrivate)

  // La clé service_role est nécessaire : `notification_log` n'a aucune policy
  // d'écriture, et lire les réglages des autres comptes est interdit sous RLS.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: settings, error } = await supabase
    .from('settings')
    .select('user_id, data')
    .eq('data->>notificationsEnabled', 'true')

  if (error) return new Response(`lecture des réglages : ${error.message}`, { status: 500 })

  const recipients = collectDaily(settings ?? [], new Date())
  let sent = 0
  let skipped = 0
  let pruned = 0

  for (const recipient of recipients) {
    // La trace est écrite AVANT l'envoi. Un doublon est pire qu'un manque :
    // recevoir deux fois le même rappel donne envie de tout couper, alors
    // qu'un rappel manqué passe inaperçu. Un conflit sur l'unicité vaut donc
    // « déjà envoyé », et l'on passe au suivant.
    const { error: logError } = await supabase
      .from('notification_log')
      .insert({ user_id: recipient.userId, kind: recipient.kind, ref: recipient.ref })

    if (logError) {
      skipped++
      continue
    }

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', recipient.userId)

    for (const sub of (subs ?? []) as Subscription[]) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: recipient.title,
            body: recipient.body,
            url: recipient.url,
            kind: recipient.kind,
          }),
        )
        sent++
      } catch (e) {
        // 404 et 410 signifient que l'abonnement n'existe plus côté service de
        // push — désinstallation, cache vidé. Le garder ferait échouer chaque
        // envoi à jamais : on retire la ligne.
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          pruned++
        } else {
          console.error('envoi échoué', status, (e as Error).message)
        }
      }
    }
  }

  return Response.json({ candidats: recipients.length, envoyes: sent, deja: skipped, purges: pruned })
})
