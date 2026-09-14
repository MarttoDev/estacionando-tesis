import crypto from 'node:crypto'
import { STORAGE_BUCKET, supabaseAdmin } from './supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type UploadResult = { url: string } | { error: string }

export async function uploadImage(file: File, folder: string): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Solo se permiten imágenes JPG, PNG o WEBP' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'La imagen no puede pesar más de 5 MB' }
  }

  const extension = file.type.split('/')[1]
  const path = `${folder}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type })
  if (error) {
    return { error: 'No se pudo subir la imagen. Intenta nuevamente.' }
  }

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}
