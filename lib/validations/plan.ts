import { z } from 'zod'

export const createMealPlanSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().max(1000).optional(),
  total_calories: z.number().int().min(0).max(10000).optional(),
  total_protein_g: z.number().min(0).max(1000).optional(),
  total_carbs_g: z.number().min(0).max(2000).optional(),
  total_fat_g: z.number().min(0).max(500).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  is_template: z.boolean().optional(),
  template_name: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  patient_id: z.string().uuid().optional(),
})

export const updateMealPlanSchema = createMealPlanSchema.partial()

export const createMealSlotSchema = z.object({
  meal_plan_id: z.string().uuid(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  time_of_day: z.string().optional(),
  sort_order: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
})

export const updateMealSlotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  time_of_day: z.string().optional(),
  sort_order: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
})

export const createMealItemSchema = z.object({
  meal_slot_id: z.string().uuid(),
  food_name: z.string().min(1, 'El nombre del alimento es requerido').max(200),
  quantity: z.number().min(0).max(10000).optional(),
  unit: z.string().max(50).optional(),
  calories: z.number().min(0).max(10000).optional(),
  protein_g: z.number().min(0).max(1000).optional(),
  carbs_g: z.number().min(0).max(1000).optional(),
  fat_g: z.number().min(0).max(500).optional(),
  is_optional: z.boolean().optional(),
  alternatives: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
  sort_order: z.number().int().min(0).optional(),
})

export const updateMealItemSchema = createMealItemSchema.partial().omit({ meal_slot_id: true })

export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>
export type UpdateMealPlanInput = z.infer<typeof updateMealPlanSchema>
export type CreateMealSlotInput = z.infer<typeof createMealSlotSchema>
export type UpdateMealSlotInput = z.infer<typeof updateMealSlotSchema>
export type CreateMealItemInput = z.infer<typeof createMealItemSchema>
export type UpdateMealItemInput = z.infer<typeof updateMealItemSchema>
