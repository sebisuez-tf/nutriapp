'use server'

import { db } from '@/lib/db'
import { documents, patients, measurements, mealPlans, mealSlots, mealItems, nutritionists, profiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireRole, getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import { sendDocumentEmail } from '@/lib/services/resend'

export async function generateAnthropometricPDFAction(
  patientId: string
): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!patient) {
      return { success: false, error: 'Paciente no encontrado' }
    }

    const measurementList = await db
      .select()
      .from(measurements)
      .where(eq(measurements.patient_id, patientId))
      .orderBy(measurements.measured_at)

    const nutritionist = await db
      .select()
      .from(nutritionists)
      .where(eq(nutritionists.id, nutritionistId))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!nutritionist) {
      return { success: false, error: 'Nutricionista no encontrado' }
    }

    // Dynamic import to avoid SSR issues with react-pdf
    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { createElement } = await import('react')
    const { AnthropometricReportTemplate } = await import('@/lib/pdf/AnthropometricReportTemplate')

    const pdfBuffer = await renderToBuffer(
      createElement(AnthropometricReportTemplate, {
        nutritionist: {
          business_name: nutritionist.business_name,
          logo_url: nutritionist.logo_url,
          primary_color: nutritionist.primary_color,
          contact_email: nutritionist.contact_email,
          contact_phone: nutritionist.contact_phone,
        },
        patient: {
          first_name: patient.first_name,
          last_name: patient.last_name,
          date_of_birth: patient.date_of_birth,
        },
        measurements: measurementList.map((m) => ({
          measured_at: m.measured_at,
          weight_kg: m.weight_kg ? parseFloat(m.weight_kg) : null,
          height_cm: m.height_cm ? parseFloat(m.height_cm) : null,
          bmi: m.bmi ? parseFloat(m.bmi) : null,
          body_fat_percentage: m.body_fat_percentage ? parseFloat(m.body_fat_percentage) : null,
          muscle_mass_kg: m.muscle_mass_kg ? parseFloat(m.muscle_mass_kg) : null,
        })),
      })
    )

    const { uploadBuffer } = await import('@/lib/services/storage')
    const fileName = `anthropometric_${patientId}_${Date.now()}.pdf`
    const fileUrl = await uploadBuffer(
      'patient-pdfs',
      `${nutritionistId}/${patientId}/${fileName}`,
      Buffer.from(pdfBuffer),
      'application/pdf'
    )

    const title = `Informe Antropométrico - ${patient.first_name} ${patient.last_name}`
    const [doc] = await db
      .insert(documents)
      .values({
        nutritionist_id: nutritionistId,
        patient_id: patientId,
        type: 'anthropometric_report',
        title,
        file_url: fileUrl,
      })
      .returning()

    revalidatePath(`/nutritionist/patients/${patientId}`)
    return { success: true, data: fileUrl }
  } catch (err) {
    console.error('generateAnthropometricPDFAction error:', err)
    return { success: false, error: 'Error generando PDF' }
  }
}

export async function generateMealPlanPDFAction(
  planId: string,
  patientId: string
): Promise<ActionResult<string>> {
  const current = await getCurrentUser()
  if (!current) return { success: false, error: 'No autenticado' }

  const nutritionistId =
    current.nutritionist?.id ??
    (await db
      .select({ nutritionist_id: patients.nutritionist_id })
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1)
      .then((r) => r[0]?.nutritionist_id ?? null))

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    const plan = await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.id, planId))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!plan) return { success: false, error: 'Plan no encontrado' }

    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!patient) return { success: false, error: 'Paciente no encontrado' }

    const slots = await db
      .select()
      .from(mealSlots)
      .where(eq(mealSlots.meal_plan_id, planId))
      .orderBy(mealSlots.sort_order)

    const slotIds = slots.map((s) => s.id)
    const items = slotIds.length > 0
      ? await db.select().from(mealItems).where(
          slotIds.length === 1
            ? eq(mealItems.meal_slot_id, slotIds[0])
            : eq(mealItems.meal_slot_id, slotIds[0]) // simplified for now
        )
      : []

    const itemsBySlot: Record<string, typeof items> = {}
    for (const item of items) {
      if (!itemsBySlot[item.meal_slot_id]) itemsBySlot[item.meal_slot_id] = []
      itemsBySlot[item.meal_slot_id].push(item)
    }

    const nutritionist = await db
      .select()
      .from(nutritionists)
      .where(eq(nutritionists.id, nutritionistId))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!nutritionist) return { success: false, error: 'Nutricionista no encontrado' }

    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { createElement } = await import('react')
    const { MealPlanTemplate } = await import('@/lib/pdf/MealPlanTemplate')

    const pdfBuffer = await renderToBuffer(
      createElement(MealPlanTemplate, {
        nutritionist: {
          business_name: nutritionist.business_name,
          logo_url: nutritionist.logo_url,
          primary_color: nutritionist.primary_color,
          contact_email: nutritionist.contact_email,
          contact_phone: nutritionist.contact_phone,
        },
        patient: {
          first_name: patient.first_name,
          last_name: patient.last_name,
        },
        plan: {
          title: plan.title,
          description: plan.description,
          total_calories: plan.total_calories,
          valid_from: plan.valid_from,
          valid_until: plan.valid_until,
        },
        slots,
        items: itemsBySlot,
      })
    )

    const { uploadBuffer } = await import('@/lib/services/storage')
    const fileName = `mealplan_${planId}_${Date.now()}.pdf`
    const fileUrl = await uploadBuffer(
      'patient-pdfs',
      `${nutritionistId}/${patientId}/${fileName}`,
      Buffer.from(pdfBuffer),
      'application/pdf'
    )

    const [doc] = await db
      .insert(documents)
      .values({
        nutritionist_id: nutritionistId,
        patient_id: patientId,
        type: 'meal_plan_pdf',
        title: `Plan Alimentario - ${plan.title}`,
        file_url: fileUrl,
      })
      .returning()

    revalidatePath(`/nutritionist/patients/${patientId}`)
    return { success: true, data: fileUrl }
  } catch (err) {
    console.error('generateMealPlanPDFAction error:', err)
    return { success: false, error: 'Error generando PDF del plan' }
  }
}

export async function sendDocumentToPatientAction(
  documentId: string
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    const doc = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.nutritionist_id, nutritionistId)))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!doc) return { success: false, error: 'Documento no encontrado' }

    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, doc.patient_id))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!patient?.email) {
      return { success: false, error: 'El paciente no tiene email registrado' }
    }

    const nutritionist = await db
      .select()
      .from(nutritionists)
      .where(eq(nutritionists.id, nutritionistId))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!nutritionist) return { success: false, error: 'Nutricionista no encontrado' }

    await sendDocumentEmail({
      patientEmail: patient.email,
      patientName: `${patient.first_name} ${patient.last_name}`,
      documentTitle: doc.title,
      documentUrl: doc.file_url,
      nutritionistName: nutritionist.business_name || current.profile.full_name,
      branding: {
        logo_url: nutritionist.logo_url,
        primary_color: nutritionist.primary_color,
        secondary_color: nutritionist.secondary_color,
        accent_color: nutritionist.accent_color,
        business_name: nutritionist.business_name,
      },
    })

    await db
      .update(documents)
      .set({ is_sent_to_patient: true })
      .where(eq(documents.id, documentId))

    revalidatePath(`/nutritionist/patients/${doc.patient_id}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('sendDocumentToPatientAction error:', err)
    return { success: false, error: 'Error enviando documento' }
  }
}
