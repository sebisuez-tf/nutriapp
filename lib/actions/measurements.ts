'use server'

import { db } from '@/lib/db'
import { measurements, auditLogs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { measurementSchema } from '@/lib/validations/measurement'
import { requireRole } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import { calculateBMI } from '@/lib/utils'
import type { ActionResult } from '@/types'

export async function createMeasurementAction(
  patientId: string,
  formData: FormData
): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const raw = {
    measured_at: formData.get('measured_at') as string,
    weight_kg: formData.get('weight_kg') ? parseFloat(formData.get('weight_kg') as string) : undefined,
    height_cm: formData.get('height_cm') ? parseFloat(formData.get('height_cm') as string) : undefined,
    body_fat_percentage: formData.get('body_fat_percentage')
      ? parseFloat(formData.get('body_fat_percentage') as string)
      : undefined,
    muscle_mass_kg: formData.get('muscle_mass_kg')
      ? parseFloat(formData.get('muscle_mass_kg') as string)
      : undefined,
    bone_mass_kg: formData.get('bone_mass_kg')
      ? parseFloat(formData.get('bone_mass_kg') as string)
      : undefined,
    visceral_fat_level: formData.get('visceral_fat_level')
      ? parseInt(formData.get('visceral_fat_level') as string)
      : undefined,
    total_body_water_percentage: formData.get('total_body_water_percentage')
      ? parseFloat(formData.get('total_body_water_percentage') as string)
      : undefined,
    waist_circumference: formData.get('waist_circumference')
      ? parseFloat(formData.get('waist_circumference') as string)
      : undefined,
    hip_circumference: formData.get('hip_circumference')
      ? parseFloat(formData.get('hip_circumference') as string)
      : undefined,
    arm_circumference: formData.get('arm_circumference')
      ? parseFloat(formData.get('arm_circumference') as string)
      : undefined,
    thigh_circumference: formData.get('thigh_circumference')
      ? parseFloat(formData.get('thigh_circumference') as string)
      : undefined,
    calf_circumference: formData.get('calf_circumference')
      ? parseFloat(formData.get('calf_circumference') as string)
      : undefined,
    chest_circumference: formData.get('chest_circumference')
      ? parseFloat(formData.get('chest_circumference') as string)
      : undefined,
    triceps_skinfold: formData.get('triceps_skinfold')
      ? parseFloat(formData.get('triceps_skinfold') as string)
      : undefined,
    subscapular_skinfold: formData.get('subscapular_skinfold')
      ? parseFloat(formData.get('subscapular_skinfold') as string)
      : undefined,
    abdominal_skinfold: formData.get('abdominal_skinfold')
      ? parseFloat(formData.get('abdominal_skinfold') as string)
      : undefined,
    suprailiac_skinfold: formData.get('suprailiac_skinfold')
      ? parseFloat(formData.get('suprailiac_skinfold') as string)
      : undefined,
    thigh_skinfold: formData.get('thigh_skinfold')
      ? parseFloat(formData.get('thigh_skinfold') as string)
      : undefined,
    metabolic_age: formData.get('metabolic_age')
      ? parseInt(formData.get('metabolic_age') as string)
      : undefined,
    basal_metabolic_rate: formData.get('basal_metabolic_rate')
      ? parseInt(formData.get('basal_metabolic_rate') as string)
      : undefined,
    notes: (formData.get('notes') as string) || undefined,
    measurement_method: (formData.get('measurement_method') as string) || undefined,
  }

  const parsed = measurementSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    // Compute BMI in application layer
    let bmi: number | null | undefined
    if (parsed.data.weight_kg && parsed.data.height_cm) {
      bmi = calculateBMI(parsed.data.weight_kg, parsed.data.height_cm)
    }

    const [newMeasurement] = await db
      .insert(measurements)
      .values({
        patient_id: patientId,
        nutritionist_id: nutritionistId,
        measured_at: parsed.data.measured_at,
        weight_kg: parsed.data.weight_kg?.toString(),
        height_cm: parsed.data.height_cm?.toString(),
        bmi: bmi?.toString(),
        body_fat_percentage: parsed.data.body_fat_percentage?.toString(),
        muscle_mass_kg: parsed.data.muscle_mass_kg?.toString(),
        bone_mass_kg: parsed.data.bone_mass_kg?.toString(),
        visceral_fat_level: parsed.data.visceral_fat_level,
        total_body_water_percentage: parsed.data.total_body_water_percentage?.toString(),
        waist_circumference: parsed.data.waist_circumference?.toString(),
        hip_circumference: parsed.data.hip_circumference?.toString(),
        arm_circumference: parsed.data.arm_circumference?.toString(),
        thigh_circumference: parsed.data.thigh_circumference?.toString(),
        calf_circumference: parsed.data.calf_circumference?.toString(),
        chest_circumference: parsed.data.chest_circumference?.toString(),
        triceps_skinfold: parsed.data.triceps_skinfold?.toString(),
        subscapular_skinfold: parsed.data.subscapular_skinfold?.toString(),
        abdominal_skinfold: parsed.data.abdominal_skinfold?.toString(),
        suprailiac_skinfold: parsed.data.suprailiac_skinfold?.toString(),
        thigh_skinfold: parsed.data.thigh_skinfold?.toString(),
        metabolic_age: parsed.data.metabolic_age,
        basal_metabolic_rate: parsed.data.basal_metabolic_rate,
        notes: parsed.data.notes,
        measurement_method: parsed.data.measurement_method,
      })
      .returning()

    await db.insert(auditLogs).values({
      actor_id: current.profile.id,
      nutritionist_id: nutritionistId,
      action: 'CREATE',
      entity_type: 'measurement',
      entity_id: newMeasurement.id,
    })

    revalidatePath(`/nutritionist/patients/${patientId}`)
    return { success: true, data: newMeasurement.id }
  } catch (err) {
    console.error('createMeasurementAction error:', err)
    return { success: false, error: 'Error guardando medición' }
  }
}

export async function getMeasurementsChartData(patientId: string): Promise<
  Array<{
    date: string
    weight_kg: number | null
    body_fat_percentage: number | null
    muscle_mass_kg: number | null
  }>
> {
  const data = await db
    .select({
      measured_at: measurements.measured_at,
      weight_kg: measurements.weight_kg,
      body_fat_percentage: measurements.body_fat_percentage,
      muscle_mass_kg: measurements.muscle_mass_kg,
    })
    .from(measurements)
    .where(eq(measurements.patient_id, patientId))
    .orderBy(measurements.measured_at)

  return data.map((m) => ({
    date: m.measured_at,
    weight_kg: m.weight_kg ? parseFloat(m.weight_kg) : null,
    body_fat_percentage: m.body_fat_percentage ? parseFloat(m.body_fat_percentage) : null,
    muscle_mass_kg: m.muscle_mass_kg ? parseFloat(m.muscle_mass_kg) : null,
  }))
}
