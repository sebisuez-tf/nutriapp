import { db } from '@/lib/db'
import { patientGroups, patientGroupMembers, patients, measurements } from '@/lib/db/schema'
import { eq, sql, avg } from 'drizzle-orm'

export async function getGroupsByNutritionistId(nutritionistId: string) {
  const groups = await db
    .select({
      id: patientGroups.id,
      name: patientGroups.name,
      description: patientGroups.description,
      type: patientGroups.type,
      created_at: patientGroups.created_at,
      member_count: sql<number>`(
        SELECT COUNT(*)::int FROM patient_group_members
        WHERE patient_group_members.group_id = ${patientGroups.id}
      )`,
    })
    .from(patientGroups)
    .where(eq(patientGroups.nutritionist_id, nutritionistId))
    .orderBy(patientGroups.name)

  return groups
}

export async function getGroupById(groupId: string) {
  const group = await db
    .select()
    .from(patientGroups)
    .where(eq(patientGroups.id, groupId))
    .limit(1)

  if (!group[0]) return null

  const members = await db
    .select({
      id: patientGroupMembers.id,
      patient_id: patientGroupMembers.patient_id,
      joined_at: patientGroupMembers.joined_at,
      first_name: patients.first_name,
      last_name: patients.last_name,
      email: patients.email,
      is_active: patients.is_active,
    })
    .from(patientGroupMembers)
    .leftJoin(patients, eq(patientGroupMembers.patient_id, patients.id))
    .where(eq(patientGroupMembers.group_id, groupId))
    .orderBy(patients.last_name)

  return { group: group[0], members }
}

export async function getGroupMembers(groupId: string) {
  const members = await db
    .select({
      id: patientGroupMembers.id,
      patient_id: patientGroupMembers.patient_id,
      joined_at: patientGroupMembers.joined_at,
      first_name: patients.first_name,
      last_name: patients.last_name,
      email: patients.email,
      is_active: patients.is_active,
      date_of_birth: patients.date_of_birth,
      latest_weight: sql<string | null>`(
        SELECT weight_kg::text FROM measurements
        WHERE measurements.patient_id = ${patientGroupMembers.patient_id}
        ORDER BY measured_at DESC LIMIT 1
      )`,
      latest_body_fat: sql<string | null>`(
        SELECT body_fat_percentage::text FROM measurements
        WHERE measurements.patient_id = ${patientGroupMembers.patient_id}
        ORDER BY measured_at DESC LIMIT 1
      )`,
    })
    .from(patientGroupMembers)
    .leftJoin(patients, eq(patientGroupMembers.patient_id, patients.id))
    .where(eq(patientGroupMembers.group_id, groupId))
    .orderBy(patients.last_name)

  return members
}

export async function getGroupAggregateMetrics(groupId: string) {
  const memberIds = await db
    .select({ patient_id: patientGroupMembers.patient_id })
    .from(patientGroupMembers)
    .where(eq(patientGroupMembers.group_id, groupId))

  if (!memberIds.length) {
    return { avg_weight: null, avg_body_fat: null, avg_muscle_mass: null, member_count: 0 }
  }

  const patientIdList = memberIds.map((m) => m.patient_id)

  const result = await db
    .select({
      avg_weight: sql<number>`AVG(DISTINCT m.weight_kg)`,
      avg_body_fat: sql<number>`AVG(DISTINCT m.body_fat_percentage)`,
      avg_muscle_mass: sql<number>`AVG(DISTINCT m.muscle_mass_kg)`,
    })
    .from(measurements)
    .where(
      sql`${measurements.patient_id} = ANY(ARRAY[${sql.join(
        patientIdList.map((id) => sql`${id}::uuid`),
        sql`, `
      )}]) AND ${measurements.measured_at} = (
        SELECT MAX(m2.measured_at) FROM measurements m2
        WHERE m2.patient_id = ${measurements.patient_id}
      )`
    )

  return {
    avg_weight: result[0]?.avg_weight ?? null,
    avg_body_fat: result[0]?.avg_body_fat ?? null,
    avg_muscle_mass: result[0]?.avg_muscle_mass ?? null,
    member_count: patientIdList.length,
  }
}
