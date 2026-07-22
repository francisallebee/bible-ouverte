import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const admin = createAdminClient()
  const userId = user.id

  try {
    // 1. Delete storage files
    const { data: photos } = await admin.storage.from('photos').list(userId)
    if (photos?.length) {
      await admin.storage.from('photos').remove(photos.map(p => `${userId}/${p.name}`))
    }
    const { data: audio } = await admin.storage.from('audio').list(userId)
    if (audio?.length) {
      await admin.storage.from('audio').remove(audio.map(a => `${userId}/${a.name}`))
    }

    // 2. Delete all user data
    await admin.from('plan_days').delete().eq('user_id', userId)
    await admin.from('plans').delete().eq('user_id', userId)
    await admin.from('contexts').delete().eq('user_id', userId)
    await admin.from('readings').delete().eq('user_id', userId)

    // 3. Delete profile
    await admin.from('profiles').delete().eq('id', userId)

    // 4. Delete auth user
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return errorResponse(error.message)

    return successResponse({ deleted: true })
  } catch (e: any) {
    return errorResponse(e?.message || 'Erreur lors de la suppression')
  }
}
