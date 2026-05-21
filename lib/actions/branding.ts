'use server'

import { db } from '@/lib/db'
import { nutritionists } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { updateBrandingSchema } from '@/lib/validations/branding'
import { requireRole } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import { uploadFile } from '@/lib/services/storage'
import { MAX_FILE_SIZES, SUPPORTED_IMAGE_TYPES } from '@/lib/constants'

export async function updateBrandingAction(formData: FormData): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const raw = {
    business_name: formData.get('business_name') as string,
    bio: (formData.get('bio') as string) || undefined,
    primary_color: formData.get('primary_color') as string,
    secondary_color: formData.get('secondary_color') as string,
    accent_color: formData.get('accent_color') as string,
    contact_email: (formData.get('contact_email') as string) || undefined,
    contact_phone: (formData.get('contact_phone') as string) || undefined,
    website_url: (formData.get('website_url') as string) || undefined,
    instagram_handle: (formData.get('instagram_handle') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
    country: (formData.get('country') as string) || undefined,
  }

  const parsed = updateBrandingSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await db
      .update(nutritionists)
      .set({ ...parsed.data, updated_at: new Date() })
      .where(eq(nutritionists.id, nutritionistId))

    revalidatePath('/nutritionist/settings/branding')
    revalidatePath('/nutritionist')
    return { success: true, data: null }
  } catch (err) {
    console.error('updateBrandingAction error:', err)
    return { success: false, error: 'Error actualizando branding' }
  }
}

export async function uploadLogoAction(formData: FormData): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const file = formData.get('logo') as File | null

  if (!file) {
    return { success: false, error: 'No se recibió ningún archivo' }
  }

  if (file.size > MAX_FILE_SIZES.logo) {
    return { success: false, error: 'El archivo es demasiado grande (máx. 2MB)' }
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
    return { success: false, error: 'Tipo de archivo no soportado. Use JPG, PNG o WebP.' }
  }

  try {
    const extension = file.name.split('.').pop() ?? 'png'
    const path = `${nutritionistId}/logo.${extension}`

    const publicUrl = await uploadFile('logos', path, file)

    await db
      .update(nutritionists)
      .set({ logo_url: publicUrl, updated_at: new Date() })
      .where(eq(nutritionists.id, nutritionistId))

    revalidatePath('/nutritionist/settings/branding')
    revalidatePath('/nutritionist')
    return { success: true, data: publicUrl }
  } catch (err) {
    console.error('uploadLogoAction error:', err)
    return { success: false, error: 'Error subiendo logo' }
  }
}
