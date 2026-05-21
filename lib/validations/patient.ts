import { z } from 'zod'

export const createPatientSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido').max(100),
  last_name: z.string().min(1, 'El apellido es requerido').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  date_of_birth: z.string().optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
  occupation: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
})

export const updatePatientSchema = createPatientSchema.partial()

export const clinicalRecordSchema = z.object({
  patient_id: z.string().uuid(),
  personal_history: z.string().max(2000).optional(),
  family_history: z.string().max(2000).optional(),
  pathologies: z.array(z.string()).optional(),
  medications: z.string().max(1000).optional(),
  allergies: z.array(z.string()).optional(),
  intolerances: z.array(z.string()).optional(),
  eating_habits: z.string().max(2000).optional(),
  meal_frequency: z.number().int().min(1).max(10).optional(),
  water_intake_liters: z.number().min(0).max(10).optional(),
  alcohol_consumption: z.string().max(500).optional(),
  smoking_status: z.string().max(200).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  physical_activity: z.string().max(1000).optional(),
  main_objective: z.string().max(1000).optional(),
  secondary_objectives: z.array(z.string()).optional(),
  food_preferences: z.string().max(1000).optional(),
  food_dislikes: z.string().max(1000).optional(),
  dietary_pattern: z.enum(['omnivore', 'vegetarian', 'vegan', 'other']).optional(),
  sport_history: z.string().max(1000).optional(),
  current_sport: z.string().max(200).optional(),
  training_frequency: z.string().max(200).optional(),
  competition_level: z.string().max(200).optional(),
})

export const updatePatientAccessSchema = z.object({
  is_active: z.boolean(),
  access_expires_at: z.string().datetime().optional(),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
export type ClinicalRecordInput = z.infer<typeof clinicalRecordSchema>
export type UpdatePatientAccessInput = z.infer<typeof updatePatientAccessSchema>
