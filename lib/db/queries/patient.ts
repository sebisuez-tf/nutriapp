import { db } from '@/lib/db'
import {
  patients,
  clinicalRecords,
  measurements,
  mealPlans,
  mealSlots,
  mealItems,
  appointments,
  documents,
} from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function getPatientById(patientId: string) {
  const result = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1)
  return result[0] ?? null
}

export async function getPatientWithClinicalRecord(patientId: string) {
  const patient = await getPatientById(patientId)
  if (!patient) return null

  const record = await db
    .select()
    .from(clinicalRecords)
    .where(eq(clinicalRecords.patient_id, patientId))
    .limit(1)

  return { patient, clinicalRecord: record[0] ?? null }
}

export async function getMeasurementsByPatientId(patientId: string) {
  return db
    .select()
    .from(measurements)
    .where(eq(measurements.patient_id, patientId))
    .orderBy(sql`${measurements.measured_at} ASC`)
}

export async function getActiveMealPlan(patientId: string) {
  const plan = await db
    .select()
    .from(mealPlans)
    .where(and(eq(mealPlans.patient_id, patientId), eq(mealPlans.status, 'active')))
    .limit(1)

  if (!plan[0]) return null

  const slots = await db
    .select()
    .from(mealSlots)
    .where(eq(mealSlots.meal_plan_id, plan[0].id))
    .orderBy(mealSlots.sort_order)

  const slotIds = slots.map((s) => s.id)
  const items =
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

  const itemsBySlot: Record<string, typeof items> = {}
  for (const item of items) {
    if (!itemsBySlot[item.meal_slot_id]) itemsBySlot[item.meal_slot_id] = []
    itemsBySlot[item.meal_slot_id].push(item)
  }

  return { plan: plan[0], slots, itemsBySlot }
}

export async function getMealPlansByPatientId(patientId: string) {
  return db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.patient_id, patientId))
    .orderBy(sql`${mealPlans.created_at} DESC`)
}

export async function getAppointmentsByPatientId(patientId: string) {
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.patient_id, patientId))
    .orderBy(sql`${appointments.scheduled_at} DESC`)
}

export async function getDocumentsByPatientId(patientId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.patient_id, patientId))
    .orderBy(sql`${documents.created_at} DESC`)
}

export async function getPatientByProfileId(profileId: string) {
  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.profile_id, profileId))
    .limit(1)

  return result[0] ?? null
}
