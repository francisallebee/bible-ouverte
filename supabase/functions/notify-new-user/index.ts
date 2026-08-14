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
import { comptesASignaler, composeNewUserEmail } from './message.ts'
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

  const cle = Deno.env.get('BREVO_API_KEY')
  const expediteur = Deno.env.get('NEW_USER_ALERT_FROM')
  const destinataire = Deno.env.get('NEW_USER_ALERT_TO')
  if (!cle || !expediteur || !destinataire) {
    return new Response(
      'BREVO_API_KEY, NEW_USER_ALERT_FROM ou NEW_USER_ALERT_TO manquant',
      { status: 500 },
    )
  }

  // La clé service_role est nécessaire : `new_user_alerts` n'a aucune policy,
  // et les adresses vivent dans `auth.users`, hors de portée du client.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profils, error: erreurProfils } = await supabase
    .from('profiles')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(PROFILS_EXAMINES)

  if (erreurProfils) {
    return new Response(`profils : ${erreurProfils.message}`, { status: 500 })
  }

  const ids = (profils ?? []).map((p) => p.id as string)
  if (ids.length === 0) return Response.json({ nouveaux: 0, envoye: false })

  const { data: traces, error: erreurTraces } = await supabase
    .from('new_user_alerts')
    .select('user_id')
    .in('user_id', ids)

  if (erreurTraces) {
    return new Response(`traces : ${erreurTraces.message}`, { status: 500 })
  }

  const candidats: NouveauCompte[] = (profils ?? []).map((p) => ({
    id: p.id as string,
    name: (p.name as string | null) ?? null,
    email: null,
    createdAt: (p.created_at as string) ?? new Date().toISOString(),
  }))

  const nouveaux = comptesASignaler(
    candidats,
    (traces ?? []).map((t) => t.user_id as string),
  )
  if (nouveaux.length === 0) return Response.json({ nouveaux: 0, envoye: false })

  // L'adresse n'est pas dans `profiles` : elle se lit compte par compte, ce qui
  // reste peu coûteux sur un lot de nouvelles inscriptions. Un échec de lecture
  // ne doit pas empêcher l'alerte — `designer` sait s'en passer.
  for (const compte of nouveaux) {
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
  const courriel = composeNewUserEmail(aAnnoncer)
  if (!courriel) return Response.json({ nouveaux: 0, envoye: false })

  const reponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': cle,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: expediteur, name: 'Bible Ouverte' },
      to: [{ email: destinataire }],
      subject: courriel.subject,
      textContent: courriel.text,
      htmlContent: courriel.html,
    }),
  })

  if (!reponse.ok) {
    // Les traces sont déjà écrites : ces comptes ne seront pas réannoncés au
    // passage suivant. C'est le choix assumé partout ici — un manque plutôt
    // qu'un doublon — mais il mérite d'être visible dans les journaux.
    const detail = await reponse.text()
    console.error('brevo a refusé l\'envoi', reponse.status, detail)
    return new Response(`brevo : ${reponse.status}`, { status: 502 })
  }

  return Response.json({
    nouveaux: aAnnoncer.length,
    envoye: true,
    comptes: aAnnoncer.map((c) => c.id.slice(0, 8)),
  })
})
