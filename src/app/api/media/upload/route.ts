import { type NextRequest } from 'next/server'
import { createApiClient, requireUser, errorResponse, successResponse } from '@/lib/supabase/api-client'

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return errorResponse('Non authentifié', 401)

  const formData = await request.formData()
  const file = formData.get('file') as File
  const type = formData.get('type') as string // 'photos' or 'audio'

  if (!file || !type) {
    return errorResponse('Fichier et type requis')
  }

  if (!['photos', 'audio'].includes(type)) {
    return errorResponse('Type doit être photos ou audio')
  }

  const supabase = createApiClient(request)
  const ext = file.name.split('.').pop() || 'webm'
  const fileName = `${user.id}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from(type)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) return errorResponse(error.message)

  const { data: { publicUrl } } = supabase.storage
    .from(type)
    .getPublicUrl(fileName)

  return successResponse({ url: publicUrl, path: fileName }, 201)
}
