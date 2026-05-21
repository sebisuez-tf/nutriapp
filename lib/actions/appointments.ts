'use server'

import { db } from '@/lib/db'
import { appointments, patients, nutritionists, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createAppointmentSchema, updateAppointmentSchema } from '@/lib/validations/appointment'
import { requireRole } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import { sendAppointmentConfirmation } from '@/lib/services/resend'

export async function createAppointmentAction(formData: FormData): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const raw = {
    patient_id: formData.get('patient_id') as string,
    scheduled_at: formData.get('scheduled_at') as string,
    duration_minutes: formData.get('duration_minutes')
      ? parseInt(formData.get('duration_minutes') as string)
      : 60,
    type: (formData.get('type') as string) || 'followup',
    notes: (formData.get('notes') as string) || undefined,
  }

  const parsed = createAppointmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const [appt] = await db
      .insert(appointments)
      .values({
        nutritionist_id: nutritionistId,
        patient_id: parsed.data.patient_id,
        scheduled_at: new Date(parsed.data.scheduled_at),
        duration_minutes: parsed.data.duration_minutes ?? 60,
        type: parsed.data.type ?? 'followup',
        notes: parsed.data.notes,
      })
      .returning()

    // Send confirmation email if patient has email
    try {
      const patient = await db
        .select({ email: patients.email, first_name: patients.first_name, last_name: patients.last_name })
        .from(patients)
        .where(eq(patients.id, parsed.data.patient_id))
        .limit(1)
        .then((r) => r[0] ?? null)

      const nutritionist = await db
        .select({
          business_name: nutritionists.business_name,
          contact_phone: nutritionists.contact_phone,
          primary_color: nutritionists.primary_color,
          secondary_color: nutritionists.secondary_color,
          accent_color: nutritionists.accent_color,
          logo_url: nutritionists.logo_url,
        })
        .from(nutritionists)
        .where(eq(nutritionists.id, nutritionistId))
        .limit(1)
        .then((r) => r[0] ?? null)

      if (patient?.email && nutritionist) {
        await sendAppointmentConfirmation({
          patientEmail: patient.email,
          patientName: `${patient.first_name} ${patient.last_name}`,
          scheduledAt: new Date(parsed.data.scheduled_at),
          durationMinutes: parsed.data.duration_minutes ?? 60,
          nutritionistName: nutritionist.business_name || current.profile.full_name,
          nutritionistPhone: nutritionist.contact_phone ?? undefined,
          branding: {
            logo_url: nutritionist.logo_url,
            primary_color: nutritionist.primary_color,
            secondary_color: nutritionist.secondary_color,
            accent_color: nutritionist.accent_color,
            business_name: nutritionist.business_name,
          },
        })
      }
    } catch (emailErr) {
      console.warn('Failed to send appointment confirmation:', emailErr)
      // Non-fatal
    }

    revalidatePath('/nutritionist/appointments')
    return { success: true, data: appt.id }
  } catch (err) {
    console.error('createAppointmentAction error:', err)
    return { success: false, error: 'Error creando turno' }
  }
}

export async function updateAppointmentAction(
  appointmentId: string,
  formData: FormData
): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin'])

  const raw: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (value !== '') raw[key] = value
  }

  const parsed = updateAppointmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.scheduled_at) {
      updateData.scheduled_at = new Date(parsed.data.scheduled_at)
    }

    await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentId))

    revalidatePath('/nutritionist/appointments')
    return { success: true, data: null }
  } catch (err) {
    console.error('updateAppointmentAction error:', err)
    return { success: false, error: 'Error actualizando turno' }
  }
}

export async function cancelAppointmentAction(appointmentId: string): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin'])

  try {
    await db
      .update(appointments)
      .set({ status: 'cancelled' })
      .where(eq(appointments.id, appointmentId))

    revalidatePath('/nutritionist/appointments')
    return { success: true, data: null }
  } catch (err) {
    console.error('cancelAppointmentAction error:', err)
    return { success: false, error: 'Error cancelando turno' }
  }
}

export async function completeAppointmentAction(
  appointmentId: string
): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin'])

  try {
    await db
      .update(appointments)
      .set({ status: 'completed' })
      .where(eq(appointments.id, appointmentId))

    revalidatePath('/nutritionist/appointments')
    return { success: true, data: null }
  } catch (err) {
    console.error('completeAppointmentAction error:', err)
    return { success: false, error: 'Error completando turno' }
  }
}
