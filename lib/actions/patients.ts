'use server'

import { db } from '@/lib/db'
import { patients, clinicalRecords, auditLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import {
  createPatientSchema,
  updatePatientSchema,
  clinicalRecordSchema,
  updatePatientAccessSchema,
} from '@/lib/validations/patient'
import { requireRole } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import { addDays } from '@/lib/utils'

export async function createPatientAction(formData: FormData): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const raw = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: (formData.get('email') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    date_of_birth: (formData.get('date_of_birth') as string) || undefined,
    sex: (formData.get('sex') as string) || undefined,
    occupation: (formData.get('occupation') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  }

  const parsed = createPatientSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const [newPatient] = await db
      .insert(patients)
      .values({
        nutritionist_id: nutritionistId,
        ...parsed.data,
        email: parsed.data.email || null,
      })
      .returning()

    await db.insert(auditLogs).values({
      actor_id: current.profile.id,
      nutritionist_id: nutritionistId,
      action: 'CREATE',
      entity_type: 'patient',
      entity_id: newPatient.id,
      new_values: parsed.data,
    })

    revalidatePath('/nutritionist/patients')
    return { success: true, data: newPatient.id }
  } catch (err) {
    console.error('createPatientAction error:', err)
    return { success: false, error: 'Error creando paciente' }
  }
}

export async function updatePatientAction(
  patientId: string,
  formData: FormData
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const raw = {
    first_name: (formData.get('first_name') as string) || undefined,
    last_name: (formData.get('last_name') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    date_of_birth: (formData.get('date_of_birth') as string) || undefined,
    sex: (formData.get('sex') as string) || undefined,
    occupation: (formData.get('occupation') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  }

  const parsed = updatePatientSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await db
      .update(patients)
      .set({ ...parsed.data, updated_at: new Date() })
      .where(
        and(eq(patients.id, patientId), eq(patients.nutritionist_id, nutritionistId))
      )

    await db.insert(auditLogs).values({
      actor_id: current.profile.id,
      nutritionist_id: nutritionistId,
      action: 'UPDATE',
      entity_type: 'patient',
      entity_id: patientId,
      new_values: parsed.data,
    })

    revalidatePath(`/nutritionist/patients/${patientId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('updatePatientAction error:', err)
    return { success: false, error: 'Error actualizando paciente' }
  }
}

export async function togglePatientAccessAction(
  patientId: string,
  isActive: boolean
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    await db
      .update(patients)
      .set({ is_active: isActive, updated_at: new Date() })
      .where(
        and(eq(patients.id, patientId), eq(patients.nutritionist_id, nutritionistId))
      )

    await db.insert(auditLogs).values({
      actor_id: current.profile.id,
      nutritionist_id: nutritionistId,
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entity_type: 'patient',
      entity_id: patientId,
    })

    revalidatePath(`/nutritionist/patients/${patientId}`)
    revalidatePath('/nutritionist/patients')
    return { success: true, data: null }
  } catch (err) {
    console.error('togglePatientAccessAction error:', err)
    return { success: false, error: 'Error actualizando acceso' }
  }
}

export async function renewPatientAccessAction(
  patientId: string,
  days = 30
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    const expiresAt = addDays(new Date(), days)

    await db
      .update(patients)
      .set({ access_expires_at: expiresAt, is_active: true, updated_at: new Date() })
      .where(
        and(eq(patients.id, patientId), eq(patients.nutritionist_id, nutritionistId))
      )

    await db.insert(auditLogs).values({
      actor_id: current.profile.id,
      nutritionist_id: nutritionistId,
      action: 'RENEW_ACCESS',
      entity_type: 'patient',
      entity_id: patientId,
      new_values: { access_expires_at: expiresAt.toISOString(), days_renewed: days },
    })

    revalidatePath(`/nutritionist/patients/${patientId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('renewPatientAccessAction error:', err)
    return { success: false, error: 'Error renovando acceso' }
  }
}

export async function setPatientAccessExpiryAction(
  patientId: string,
  expiresAt: string
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const parsed = updatePatientAccessSchema.safeParse({
    is_active: true,
    access_expires_at: expiresAt,
  })

  if (!parsed.success) {
    return { success: false, error: 'Fecha inválida' }
  }

  try {
    await db
      .update(patients)
      .set({
        access_expires_at: new Date(expiresAt),
        updated_at: new Date(),
      })
      .where(
        and(eq(patients.id, patientId), eq(patients.nutritionist_id, nutritionistId))
      )

    revalidatePath(`/nutritionist/patients/${patientId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('setPatientAccessExpiryAction error:', err)
    return { success: false, error: 'Error actualizando fecha de vencimiento' }
  }
}

export async function saveClinicalRecordAction(
  patientId: string,
  formData: FormData
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const pathologiesRaw = formData.get('pathologies') as string
  const allergiesRaw = formData.get('allergies') as string
  const intolerancesRaw = formData.get('intolerances') as string
  const secondaryObjectivesRaw = formData.get('secondary_objectives') as string

  const raw = {
    patient_id: patientId,
    personal_history: (formData.get('personal_history') as string) || undefined,
    family_history: (formData.get('family_history') as string) || undefined,
    pathologies: pathologiesRaw
      ? pathologiesRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
    medications: (formData.get('medications') as string) || undefined,
    allergies: allergiesRaw
      ? allergiesRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
    intolerances: intolerancesRaw
      ? intolerancesRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
    eating_habits: (formData.get('eating_habits') as string) || undefined,
    meal_frequency: formData.get('meal_frequency')
      ? parseInt(formData.get('meal_frequency') as string)
      : undefined,
    water_intake_liters: formData.get('water_intake_liters')
      ? parseFloat(formData.get('water_intake_liters') as string)
      : undefined,
    alcohol_consumption: (formData.get('alcohol_consumption') as string) || undefined,
    smoking_status: (formData.get('smoking_status') as string) || undefined,
    sleep_hours: formData.get('sleep_hours')
      ? parseFloat(formData.get('sleep_hours') as string)
      : undefined,
    stress_level: formData.get('stress_level')
      ? parseInt(formData.get('stress_level') as string)
      : undefined,
    physical_activity: (formData.get('physical_activity') as string) || undefined,
    main_objective: (formData.get('main_objective') as string) || undefined,
    secondary_objectives: secondaryObjectivesRaw
      ? secondaryObjectivesRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
    food_preferences: (formData.get('food_preferences') as string) || undefined,
    food_dislikes: (formData.get('food_dislikes') as string) || undefined,
    dietary_pattern: (formData.get('dietary_pattern') as string) || undefined,
    sport_history: (formData.get('sport_history') as string) || undefined,
    current_sport: (formData.get('current_sport') as string) || undefined,
    training_frequency: (formData.get('training_frequency') as string) || undefined,
    competition_level: (formData.get('competition_level') as string) || undefined,
  }

  const parsed = clinicalRecordSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const existing = await db
      .select({ id: clinicalRecords.id })
      .from(clinicalRecords)
      .where(eq(clinicalRecords.patient_id, patientId))
      .limit(1)

    if (existing[0]) {
      await db
        .update(clinicalRecords)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(eq(clinicalRecords.patient_id, patientId))
    } else {
      await db.insert(clinicalRecords).values({
        patient_id: patientId,
        nutritionist_id: nutritionistId,
        ...parsed.data,
      })
    }

    await db.insert(auditLogs).values({
      actor_id: current.profile.id,
      nutritionist_id: nutritionistId,
      action: existing[0] ? 'UPDATE' : 'CREATE',
      entity_type: 'clinical_record',
      entity_id: patientId,
    })

    revalidatePath(`/nutritionist/patients/${patientId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('saveClinicalRecordAction error:', err)
    return { success: false, error: 'Error guardando historia clínica' }
  }
}
