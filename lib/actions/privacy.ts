'use server'

import { db } from '@/lib/db'
import {
  patients,
  clinicalRecords,
  measurements,
  mealPlans,
  appointments,
  messages,
  documents,
  nutritionists,
  patientGroupMembers,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole, getCurrentUser } from '@/lib/actions/auth'
import type { ActionResult } from '@/types'

export async function exportPatientDataAction(
  patientId: string
): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin', 'patient'])

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

    // For patient role, verify they're exporting their own data
    if (current.profile.role === 'patient') {
      if (patient.profile_id !== current.profile.id) {
        return { success: false, error: 'No autorizado' }
      }
    }

    const [
      clinicalRecord,
      measurementList,
      mealPlanList,
      appointmentList,
      messageList,
      documentList,
    ] = await Promise.all([
      db
        .select()
        .from(clinicalRecords)
        .where(eq(clinicalRecords.patient_id, patientId))
        .limit(1)
        .then((r) => r[0] ?? null),
      db.select().from(measurements).where(eq(measurements.patient_id, patientId)),
      db.select().from(mealPlans).where(eq(mealPlans.patient_id, patientId)),
      db.select().from(appointments).where(eq(appointments.patient_id, patientId)),
      db
        .select()
        .from(messages)
        .where(eq(messages.patient_id, patientId))
        .limit(500),
      db.select().from(documents).where(eq(documents.patient_id, patientId)),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      patient: {
        id: patient.id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        date_of_birth: patient.date_of_birth,
        sex: patient.sex,
        occupation: patient.occupation,
        city: patient.city,
        created_at: patient.created_at,
      },
      clinical_record: clinicalRecord,
      measurements: measurementList,
      meal_plans: mealPlanList,
      appointments: appointmentList,
      messages: messageList.map((m) => ({
        id: m.id,
        content: m.content,
        is_read: m.is_read,
        created_at: m.created_at,
      })),
      documents: documentList.map((d) => ({
        id: d.id,
        title: d.title,
        type: d.type,
        generated_at: d.generated_at,
      })),
    }

    return { success: true, data: JSON.stringify(exportData, null, 2) }
  } catch (err) {
    console.error('exportPatientDataAction error:', err)
    return { success: false, error: 'Error exportando datos' }
  }
}

export async function exportNutritionistDataAction(): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    const nutritionist = await db
      .select()
      .from(nutritionists)
      .where(eq(nutritionists.id, nutritionistId))
      .limit(1)
      .then((r) => r[0] ?? null)

    const patientList = await db
      .select({
        id: patients.id,
        first_name: patients.first_name,
        last_name: patients.last_name,
        email: patients.email,
        created_at: patients.created_at,
      })
      .from(patients)
      .where(eq(patients.nutritionist_id, nutritionistId))

    const exportData = {
      exported_at: new Date().toISOString(),
      nutritionist: {
        id: nutritionist?.id,
        business_name: nutritionist?.business_name,
        contact_email: nutritionist?.contact_email,
        city: nutritionist?.city,
        plan_type: nutritionist?.plan_type,
        created_at: nutritionist?.created_at,
      },
      patients_count: patientList.length,
      patients: patientList,
    }

    return { success: true, data: JSON.stringify(exportData, null, 2) }
  } catch (err) {
    console.error('exportNutritionistDataAction error:', err)
    return { success: false, error: 'Error exportando datos' }
  }
}
