import { db } from '@/lib/db'
import { nutritionists, patients, appointments, measurements, profiles } from '@/lib/db/schema'
import { eq, and, gte, lte, ilike, or, sql, count } from 'drizzle-orm'
import type { Nutritionist } from '@/lib/db/schema'

export async function getNutritionistByProfileId(profileId: string) {
  const result = await db
    .select()
    .from(nutritionists)
    .where(eq(nutritionists.profile_id, profileId))
    .limit(1)

  return result[0] ?? null
}

export async function getNutritionistById(id: string) {
  const result = await db
    .select()
    .from(nutritionists)
    .where(eq(nutritionists.id, id))
    .limit(1)

  return result[0] ?? null
}

export async function getPatientsByNutritionistId(
  nutritionistId: string,
  filters?: { isActive?: boolean; searchTerm?: string }
) {
  const conditions = [eq(patients.nutritionist_id, nutritionistId)]

  if (filters?.isActive !== undefined) {
    conditions.push(eq(patients.is_active, filters.isActive))
  }

  if (filters?.searchTerm) {
    const term = `%${filters.searchTerm}%`
    conditions.push(
      or(
        ilike(patients.first_name, term),
        ilike(patients.last_name, term),
        ilike(patients.email ?? '', term)
      ) as ReturnType<typeof eq>
    )
  }

  return db
    .select()
    .from(patients)
    .where(and(...conditions))
    .orderBy(patients.last_name, patients.first_name)
}

export async function getPatientCount(nutritionistId: string) {
  const total = await db
    .select({ count: count() })
    .from(patients)
    .where(eq(patients.nutritionist_id, nutritionistId))

  const active = await db
    .select({ count: count() })
    .from(patients)
    .where(and(eq(patients.nutritionist_id, nutritionistId), eq(patients.is_active, true)))

  return {
    total: total[0]?.count ?? 0,
    active: active[0]?.count ?? 0,
    inactive: (total[0]?.count ?? 0) - (active[0]?.count ?? 0),
  }
}

export async function getUpcomingAppointments(nutritionistId: string, days = 7) {
  const now = new Date()
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const result = await db
    .select({
      id: appointments.id,
      scheduled_at: appointments.scheduled_at,
      duration_minutes: appointments.duration_minutes,
      status: appointments.status,
      type: appointments.type,
      notes: appointments.notes,
      patient_first_name: patients.first_name,
      patient_last_name: patients.last_name,
      patient_id: appointments.patient_id,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patient_id, patients.id))
    .where(
      and(
        eq(appointments.nutritionist_id, nutritionistId),
        gte(appointments.scheduled_at, now),
        lte(appointments.scheduled_at, future),
        or(
          eq(appointments.status, 'scheduled'),
          eq(appointments.status, 'confirmed')
        ) as ReturnType<typeof eq>
      )
    )
    .orderBy(appointments.scheduled_at)
    .limit(10)

  return result
}

export async function getRecentMeasurements(nutritionistId: string, limit = 10) {
  const result = await db
    .select({
      id: measurements.id,
      measured_at: measurements.measured_at,
      weight_kg: measurements.weight_kg,
      bmi: measurements.bmi,
      body_fat_percentage: measurements.body_fat_percentage,
      patient_id: measurements.patient_id,
      patient_first_name: patients.first_name,
      patient_last_name: patients.last_name,
    })
    .from(measurements)
    .leftJoin(patients, eq(measurements.patient_id, patients.id))
    .where(eq(measurements.nutritionist_id, nutritionistId))
    .orderBy(sql`${measurements.created_at} DESC`)
    .limit(limit)

  return result
}

export async function getPatientsWithExpiringAccess(nutritionistId: string, daysAhead = 7) {
  const now = new Date()
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  return db
    .select()
    .from(patients)
    .where(
      and(
        eq(patients.nutritionist_id, nutritionistId),
        eq(patients.is_active, true),
        gte(patients.access_expires_at, now),
        lte(patients.access_expires_at, future)
      )
    )
    .orderBy(patients.access_expires_at)
}

export async function updateNutritionistBranding(id: string, data: Partial<Nutritionist>) {
  return db
    .update(nutritionists)
    .set({ ...data, updated_at: new Date() })
    .where(eq(nutritionists.id, id))
    .returning()
}

export async function getAllAppointmentsByNutritionistId(nutritionistId: string) {
  const result = await db
    .select({
      id: appointments.id,
      scheduled_at: appointments.scheduled_at,
      duration_minutes: appointments.duration_minutes,
      status: appointments.status,
      type: appointments.type,
      notes: appointments.notes,
      patient_first_name: patients.first_name,
      patient_last_name: patients.last_name,
      patient_id: appointments.patient_id,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patient_id, patients.id))
    .where(eq(appointments.nutritionist_id, nutritionistId))
    .orderBy(appointments.scheduled_at)

  return result
}

export async function getNutritionistWithProfile(nutritionistId: string) {
  const result = await db
    .select({
      nutritionist: nutritionists,
      profile: profiles,
    })
    .from(nutritionists)
    .leftJoin(profiles, eq(nutritionists.profile_id, profiles.id))
    .where(eq(nutritionists.id, nutritionistId))
    .limit(1)

  return result[0] ?? null
}
