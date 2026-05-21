'use server'

import { db } from '@/lib/db'
import {
  documents,
  patients,
  measurements,
  mealPlans,
  mealSlots,
  mealItems,
  nutritionists,
} from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { requireRole, getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import { sendDocumentEmail } from '@/lib/services/resend'
import { uploadPDFBuffer, getSignedUrl } from '@/lib/services/storage'

const BUCKET = 'patient-pdfs'

// Returns a 60-minute signed URL for a document owned by the calling user's nutritionist.
export async function getSignedDocumentUrlAction(
  documentId: string
): Promise<ActionResult<string>> {
  const current = await getCurrentUser()
  if (!current) return { success: false, error: 'No autenticado' }

  const nutritionistId = current.nutritionist?.id

  const doc = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        nutritionistId
          ? eq(documents.nutritionist_id, nutritionistId)
          : eq(documents.patient_id, '') // patients access via profile_id guard below
      )
    )
    .limit(1)
    .then((r) => r[0] ?? null)

  // If not found as nutritionist, try as patient
  if (!doc && current.profile.role === 'patient') {
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.profile_id, current.profile.id))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!patient) return { success: false, error: 'Paciente no encontrado' }

    const patientDoc = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.patient_id, patient.id)))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!patientDoc) return { success: false, error: 'Documento no encontrado' }

    try {
      const signedUrl = await getSignedUrl(BUCKET, patientDoc.file_url, 3600)
      return { success: true, data: signedUrl }
    } catch {
      return { success: false, error: 'Error generando URL de descarga' }
    }
  }

  if (!doc) return { success: false, error: 'Documento no encontrado' }

  try {
    const signedUrl = await getSignedUrl(BUCKET, doc.file_url, 3600)
    return { success: true, data: signedUrl }
  } catch {
    return { success: false, error: 'Error generando URL de descarga' }
  }
}

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

    if (!patient) return { success: false, error: 'Paciente no encontrado' }

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

    if (!nutritionist) return { success: false, error: 'Nutricionista no encontrado' }

    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { createElement } = await import('react')
    const { AnthropometricReportTemplate } = await import('@/lib/pdf/AnthropometricReportTemplate')

    const mappedMeasurements = measurementList.map((m) => ({
      measured_at: m.measured_at,
      weight_kg: m.weight_kg ? parseFloat(m.weight_kg) : null,
      height_cm: m.height_cm ? parseFloat(m.height_cm) : null,
      bmi: m.bmi ? parseFloat(m.bmi) : null,
      body_fat_percentage: m.body_fat_percentage ? parseFloat(m.body_fat_percentage) : null,
      muscle_mass_kg: m.muscle_mass_kg ? parseFloat(m.muscle_mass_kg) : null,
    }))

    // DECISIÓN: cast necesario — createElement devuelve FunctionComponentElement<Props>
    // pero renderToBuffer espera ReactElement<DocumentProps>. El componente es válido ya que
    // su root element es <Document> de @react-pdf/renderer.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        measurements: mappedMeasurements,
      }) as any
    )

    const timestamp = Date.now()
    const storagePath = `${nutritionistId}/${patientId}/anthropometric-${timestamp}.pdf`
    await uploadPDFBuffer(BUCKET, storagePath, Buffer.from(pdfBuffer))

    const title = `Informe Antropométrico - ${patient.first_name} ${patient.last_name}`
    await db.insert(documents).values({
      nutritionist_id: nutritionistId,
      patient_id: patientId,
      type: 'anthropometric_report',
      title,
      file_url: storagePath,
    })

    revalidatePath(`/nutritionist/patients/${patientId}`)
    return { success: true, data: storagePath }
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

    // DECISIÓN: use sql ANY pattern (same as plans.ts) to fetch all items across multiple slots
    const slotIds = slots.map((s) => s.id)
    const allItems =
      slotIds.length > 0
        ? await db
            .select()
            .from(mealItems)
            .where(
              slotIds.length === 1
                ? eq(mealItems.meal_slot_id, slotIds[0])
                : sql`${mealItems.meal_slot_id} = ANY(ARRAY[${sql.join(
                    slotIds.map((id) => sql`${id}::uuid`),
                    sql`, `
                  )}])`
            )
            .orderBy(mealItems.sort_order)
        : []

    const itemsBySlot: Record<string, typeof allItems> = {}
    for (const item of allItems) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          total_protein_g: plan.total_protein_g ? parseFloat(plan.total_protein_g) : null,
          total_carbs_g: plan.total_carbs_g ? parseFloat(plan.total_carbs_g) : null,
          total_fat_g: plan.total_fat_g ? parseFloat(plan.total_fat_g) : null,
          valid_from: plan.valid_from,
          valid_until: plan.valid_until,
        },
        slots,
        items: itemsBySlot,
      }) as any
    )

    const timestamp = Date.now()
    const storagePath = `${nutritionistId}/${patientId}/mealplan-${timestamp}.pdf`
    await uploadPDFBuffer(BUCKET, storagePath, Buffer.from(pdfBuffer))

    await db.insert(documents).values({
      nutritionist_id: nutritionistId,
      patient_id: patientId,
      type: 'meal_plan_pdf',
      title: `Plan Alimentario - ${plan.title}`,
      file_url: storagePath,
    })

    revalidatePath(`/nutritionist/patients/${patientId}`)
    return { success: true, data: storagePath }
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

    // Generate a 60-minute signed URL for secure delivery
    const signedUrl = await getSignedUrl(BUCKET, doc.file_url, 3600)

    await sendDocumentEmail({
      patientEmail: patient.email,
      patientName: `${patient.first_name} ${patient.last_name}`,
      documentTitle: doc.title,
      documentUrl: signedUrl,
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
