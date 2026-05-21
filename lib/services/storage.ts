import { createClient } from '@/lib/supabase/server'

export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })

  if (error) {
    throw new Error(`Error uploading file: ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function uploadBuffer(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
    upsert: true,
    contentType,
  })

  if (error) {
    throw new Error(`Error uploading buffer: ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error || !data) {
    throw new Error(`Error generating signed URL: ${error?.message}`)
  }

  return data.signedUrl
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Error deleting file: ${error.message}`)
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}
