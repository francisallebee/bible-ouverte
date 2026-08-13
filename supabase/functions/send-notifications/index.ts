// Envoi des notifications push — item 17 de la feuille de route.
//
// Cinq déclencheurs : rappel quotidien, plan de lecture en retard, réponse à
// un ticket de support, item de la feuille de route passé à « Terminé », et
// relance après une longue absence. La règle qui décide de chacun vit dans
// `schedule.ts`, sans dépendance et couverte par les tests de `npm test` :
// c'est la partie qu'on ne pourrait sinon vérifier qu'en attendant le
// lendemain.
//
// Appelée par `pg_cron` toutes les quinze minutes. Cette cadence n'est pas
// arbitraire : un rappel « à 7 h » doit tomber à l'heure dite dans tous les
// fuseaux, et certains sont décalés d'une demi-heure ou d'un quart d'heure —
// l'Inde, le Népal. Un passage horaire les servirait tous à côté.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { collectAll } from './schedule.ts'
import type { CollectInput } from './schedule.ts'

/**
 * Clé publique VAPID, la même que celle du navigateur. La privée ne vit que
 * dans les secrets de cette fonction — voir `supabase/README.md`.
 */
const VAPID_PUBLIC_KEY =
  'BBGF1rFwRWmV0kUgIogT9fMBH9YRYvn-mLtSgieywW2KpOL_zi6rjH7cEjtM_03iJGFr86gtLMaUURfqtNCi9sE'

/**
 * Fenêtre de fraîcheur des événements. Large au regard de la cadence : un
 * passage de cron manqué ne doit pas faire perdre une notification, et
 * l'unicité de `notification_log` empêche de toute façon le doublon.
 */
const EVENT_WINDOW_HOURS = 24

interface Subscription {
  endpoint: string
  p256dh: string
  auth: string
}

/** La date UTC de demain : borne haute des jours de plan potentiellement en retard. */
function tomorrowUtc(now: Date): string {
  return new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10)
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

  const now = new Date()
  const since = new Date(now.getTime() - EVENT_WINDOW_HOURS * 3_600_000).toISOString()

  const [settingsResult, dataResult] = await Promise.all([
    supabase.from('settings').select('user_id, data').eq('data->>notificationsEnabled', 'true'),
    // Les agrégations — plus ancien jour non coché, dernière lecture — ne
    // s'expriment pas en PostgREST. Les faire ici supposerait de rapatrier
    // toutes les lectures de tous les comptes toutes les quinze minutes.
    supabase.rpc('notification_data', { cutoff_date: tomorrowUtc(now), since }),
  ])

  if (settingsResult.error) {
    return new Response(`réglages : ${settingsResult.error.message}`, { status: 500 })
  }
  if (dataResult.error) {
    return new Response(`données : ${dataResult.error.message}`, { status: 500 })
  }

  const aggregated = dataResult.data as Omit<CollectInput, 'settings'>
  const recipients = collectAll({ settings: settingsResult.data ?? [], ...aggregated }, now)

  let sent = 0
  let skipped = 0
  let pruned = 0

  for (const recipient of recipients) {
    // La trace est écrite AVANT l'envoi. Un doublon est pire qu'un manque :
    // recevoir deux fois le même rappel donne envie de tout couper, alors
    // qu'un rappel manqué passe inaperçu. Un conflit sur l'unicité
    // (user_id, kind, ref) vaut donc « déjà envoyé ».
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

  return Response.json({
    candidats: recipients.length,
    envoyes: sent,
    deja: skipped,
    purges: pruned,
    parMotif: recipients.reduce<Record<string, number>>((acc, r) => {
      acc[r.kind] = (acc[r.kind] ?? 0) + 1
      return acc
    }, {}),
  })
})
