import { z } from 'zod'

export const measurementSchema = z.object({
  measured_at: z.string().min(1, 'La fecha es requerida'),
  weight_kg: z.number().min(20, 'Mínimo 20 kg').max(300, 'Máximo 300 kg').optional(),
  height_cm: z
    .number()
    .min(100, 'Mínimo 100 cm')
    .max(230, 'Máximo 230 cm')
    .optional(),
  body_fat_percentage: z
    .number()
    .min(1, 'Mínimo 1%')
    .max(70, 'Máximo 70%')
    .optional(),
  muscle_mass_kg: z
    .number()
    .min(5, 'Mínimo 5 kg')
    .max(100, 'Máximo 100 kg')
    .optional(),
  bone_mass_kg: z.number().min(0.5).max(10).optional(),
  visceral_fat_level: z.number().int().min(1).max(30).optional(),
  total_body_water_percentage: z.number().min(1).max(90).optional(),
  waist_circumference: z.number().min(40).max(200).optional(),
  hip_circumference: z.number().min(50).max(250).optional(),
  arm_circumference: z.number().min(10).max(80).optional(),
  thigh_circumference: z.number().min(20).max(120).optional(),
  calf_circumference: z.number().min(15).max(80).optional(),
  chest_circumference: z.number().min(50).max(200).optional(),
  triceps_skinfold: z.number().min(1).max(80).optional(),
  subscapular_skinfold: z.number().min(1).max(80).optional(),
  abdominal_skinfold: z.number().min(1).max(100).optional(),
  suprailiac_skinfold: z.number().min(1).max(80).optional(),
  thigh_skinfold: z.number().min(1).max(80).optional(),
  metabolic_age: z.number().int().min(10).max(100).optional(),
  basal_metabolic_rate: z.number().int().min(500).max(5000).optional(),
  notes: z.string().max(1000).optional(),
  measurement_method: z.string().max(200).optional(),
})

export type MeasurementInput = z.infer<typeof measurementSchema>
