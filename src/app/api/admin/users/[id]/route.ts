import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return null
  const supabase = createApiClient(request)
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return null
  return user
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin(request)
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
  const adminUser = await checkAdmin(request)
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
