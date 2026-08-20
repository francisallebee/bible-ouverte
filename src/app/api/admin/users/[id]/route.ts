import { type NextRequest } from 'next/server'
import { requireAdmin, errorResponse, successResponse } from '@/lib/supabase/api-client'
import { createAdminClient } from '@/lib/supabase/admin'

// Voir src/app/api/admin/users/route.ts : cette route lit la session de
// l'appelant, elle ne doit jamais être évaluée au moment du build.
export const dynamic = 'force-dynamic'

/**
 * La fiche d'un utilisateur.
 *
 * Elle ne passe **pas** par `/api/admin/users`, qui rend les 112 comptes et
 * leurs comptages : sept requêtes et environ cinq secondes pour une seule
 * ligne qu'on veut lire. Ici tout est borné à un identifiant.
 *
 * Les comptages emploient `head: true` — PostgREST rend alors l'en-tête
 * `Content-Range` sans le corps. C'est l'inverse exact du défaut du 18 août
 * 2026, où un comptage dans une boucle faisait une requête par ligne : ici,
 * une requête par table, aucune ligne transportée.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const adminUser = await requireAdmin(request)
  if (!adminUser) return errorResponse('Accès refusé', 403)

  const cible = params.id
  const supabaseAdmin = createAdminClient()

  const { data: profil, error: erreurProfil } = await supabaseAdmin
    .from('profiles').select('*').eq('id', cible).single()
  if (erreurProfil || !profil) return errorResponse('Compte introuvable', 404)

  // L'identité d'authentification : adresse, confirmation, dernière connexion.
  // Un échec ici ne doit pas faire échouer la fiche — le profil suffit à
  // afficher quelque chose d'utile.
  let auth: { email: string | null; lastSignIn: string | null; createdAt: string | null; confirmedAt: string | null } = {
    email: null, lastSignIn: null, createdAt: null, confirmedAt: null,
  }
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(cible)
    if (data?.user) {
      auth = {
        email: data.user.email ?? null,
        lastSignIn: data.user.last_sign_in_at ?? null,
        createdAt: data.user.created_at ?? null,
        confirmedAt: data.user.email_confirmed_at ?? null,
      }
    }
  } catch { /* la fiche s'affiche sans */ }

  const compter = async (table: string, colonne = 'user_id') => {
    const { count } = await supabaseAdmin
      .from(table).select('*', { count: 'exact', head: true }).eq(colonne, cible)
    return count ?? 0
  }

  const [
    readings, plans, contexts, planDays, memorised, sessions, abonnements,
    dernieresLectures, sesPlans, sesTickets, reglages,
  ] = await Promise.all([
    compter('readings'),
    compter('plans'),
    compter('contexts'),
    compter('plan_days'),
    compter('memorised_verses'),
    compter('game_sessions'),
    compter('push_subscriptions'),
    supabaseAdmin.from('readings')
      .select('id, date, book, chapterStart, chapterEnd, contextId')
      .eq('user_id', cible).order('date', { ascending: false }).limit(10),
    supabaseAdmin.from('plans')
      .select('id, name, kind, duration, totalDays, startDate')
      .eq('user_id', cible).order('createdAt', { ascending: false }).limit(10),
    supabaseAdmin.from('tickets')
      .select('id, type, status, message, createdAt')
      .eq('user_id', cible).order('createdAt', { ascending: false }).limit(10),
    supabaseAdmin.from('settings').select('data, updatedAt').eq('user_id', cible).maybeSingle(),
  ])

  return successResponse({
    profil,
    auth,
    compteurs: {
      readings, plans, contexts, planDays, memorised, sessions,
      abonnementsPush: abonnements,
    },
    dernieresLectures: dernieresLectures.data ?? [],
    plans: sesPlans.data ?? [],
    tickets: sesTickets.data ?? [],
    // La langue et l'objectif vivent dans la colonne jsonb : on rend le bloc
    // tel quel plutôt que d'en extraire des champs qui bougeront.
    reglages: reglages.data?.data ?? null,
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request)
  if (!admin) return errorResponse('Accès refusé', 403)

  const targetId = params.id
  if (targetId === admin.id) return errorResponse('Tu ne peux pas te supprimer toi-même depuis ici')

  const supabaseAdmin = createAdminClient()

  try {
    const { data: photos } = await supabaseAdmin.storage.from('photos').list(targetId)
    if (photos?.length) {
      await supabaseAdmin.storage.from('photos').remove(photos.map(p => `${targetId}/${p.name}`))
    }
    const { data: audio } = await supabaseAdmin.storage.from('audio').list(targetId)
    if (audio?.length) {
      await supabaseAdmin.storage.from('audio').remove(audio.map(a => `${targetId}/${a.name}`))
    }

    await supabaseAdmin.from('plan_days').delete().eq('user_id', targetId)
    await supabaseAdmin.from('plans').delete().eq('user_id', targetId)
    await supabaseAdmin.from('contexts').delete().eq('user_id', targetId)
    await supabaseAdmin.from('readings').delete().eq('user_id', targetId)
    await supabaseAdmin.from('profiles').delete().eq('id', targetId)

    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId)
    if (error) return errorResponse(error.message)

    return successResponse({ deleted: true })
  } catch (e: any) {
    return errorResponse(e?.message || 'Erreur')
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const adminUser = await requireAdmin(request)
  if (!adminUser) return errorResponse('Accès refusé', 403)

  const targetId = params.id
  const supabaseAdmin = createAdminClient()
  const body = await request.json()
  const updates: Record<string, any> = {}

  if (body.is_admin !== undefined) {
    updates.is_admin = body.is_admin
  }

  if (body.suspended !== undefined) {
    updates.suspended = body.suspended
    // Ban or unban the auth user
    if (body.suspended) {
      await supabaseAdmin.auth.admin.updateUserById(targetId, { ban_duration: '876000h' })
    } else {
      await supabaseAdmin.auth.admin.updateUserById(targetId, { ban_duration: 'none' })
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', targetId)

    if (error) return errorResponse(error.message)
  }

  return successResponse({ updated: true })
}
