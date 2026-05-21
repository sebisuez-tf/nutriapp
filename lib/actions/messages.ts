'use server'

import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { eq, and, or } from 'drizzle-orm'
import { requireRole } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import { MESSAGES_PER_PAGE } from '@/lib/constants'

export async function sendMessageAction(
  patientId: string,
  content: string
): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin', 'patient'])

  if (!content.trim()) {
    return { success: false, error: 'El mensaje no puede estar vacío' }
  }

  if (content.length > 2000) {
    return { success: false, error: 'El mensaje es demasiado largo (máx. 2000 caracteres)' }
  }

  try {
    // Determine nutritionist_id from context
    let nutritionistId: string | null = null
    let receiverId: string

    if (current.nutritionist) {
      // Nutritionist sending to patient
      nutritionistId = current.nutritionist.id

      // Get patient's profile_id
      const { patients } = await import('@/lib/db/schema')
      const patient = await db
        .select({ profile_id: patients.profile_id })
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1)
        .then((r) => r[0] ?? null)

      if (!patient?.profile_id) {
        return { success: false, error: 'Paciente no encontrado o sin cuenta activa' }
      }
      receiverId = patient.profile_id
    } else {
      // Patient sending to nutritionist
      const { patients, nutritionists } = await import('@/lib/db/schema')
      const patient = await db
        .select({ nutritionist_id: patients.nutritionist_id })
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1)
        .then((r) => r[0] ?? null)

      if (!patient) {
        return { success: false, error: 'Paciente no encontrado' }
      }

      nutritionistId = patient.nutritionist_id
      const nut = await db
        .select({ profile_id: nutritionists.profile_id })
        .from(nutritionists)
        .where(eq(nutritionists.id, nutritionistId))
        .limit(1)
        .then((r) => r[0] ?? null)

      if (!nut?.profile_id) {
        return { success: false, error: 'Nutricionista no encontrado' }
      }
      receiverId = nut.profile_id
    }

    const [msg] = await db
      .insert(messages)
      .values({
        nutritionist_id: nutritionistId!,
        sender_id: current.profile.id,
        receiver_id: receiverId,
        patient_id: patientId,
        content: content.trim(),
      })
      .returning()

    revalidatePath(`/nutritionist/patients/${patientId}/chat`)
    return { success: true, data: msg.id }
  } catch (err) {
    console.error('sendMessageAction error:', err)
    return { success: false, error: 'Error enviando mensaje' }
  }
}

export async function markMessagesReadAction(
  patientId: string,
  readerId: string
): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin', 'patient'])

  try {
    await db
      .update(messages)
      .set({ is_read: true, read_at: new Date() })
      .where(
        and(
          eq(messages.patient_id, patientId),
          eq(messages.receiver_id, readerId),
          eq(messages.is_read, false)
        )
      )

    return { success: true, data: null }
  } catch (err) {
    console.error('markMessagesReadAction error:', err)
    return { success: false, error: 'Error marcando mensajes como leídos' }
  }
}

export async function getMessagesAction(
  patientId: string,
  page = 1
): Promise<ActionResult<{ messages: (typeof messages.$inferSelect)[]; hasMore: boolean }>> {
  const current = await requireRole(['nutritionist', 'super_admin', 'patient'])

  try {
    const limit = MESSAGES_PER_PAGE
    const offset = (page - 1) * limit

    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.patient_id, patientId))
      .orderBy(messages.created_at)
      .limit(limit + 1)
      .offset(offset)

    const hasMore = result.length > limit
    const data = hasMore ? result.slice(0, limit) : result

    return { success: true, data: { messages: data, hasMore } }
  } catch (err) {
    console.error('getMessagesAction error:', err)
    return { success: false, error: 'Error obteniendo mensajes' }
  }
}
