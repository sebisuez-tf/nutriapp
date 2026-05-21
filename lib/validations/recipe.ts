import { z } from 'zod'

export const recipeIngredientSchema = z.object({
  ingredient_name: z.string().min(1, 'El nombre del ingrediente es requerido').max(200),
  quantity: z.number().min(0).max(10000).optional(),
  unit: z.string().max(50).optional(),
  notes: z.string().max(200).optional(),
  sort_order: z.number().int().min(0).default(0),
})

export const createRecipeSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().max(1000).optional(),
  instructions: z.string().max(5000).optional(),
  prep_time_minutes: z.number().int().min(0).max(600).optional(),
  cook_time_minutes: z.number().int().min(0).max(600).optional(),
  servings: z.number().int().min(1).max(100).optional(),
  calories_per_serving: z.number().min(0).max(5000).optional(),
  protein_per_serving: z.number().min(0).max(500).optional(),
  carbs_per_serving: z.number().min(0).max(1000).optional(),
  fat_per_serving: z.number().min(0).max(500).optional(),
  tags: z.array(z.string().max(50)).optional(),
  is_public: z.boolean().default(false),
  ingredients: z.array(recipeIngredientSchema).optional(),
})

export const updateRecipeSchema = createRecipeSchema.partial()

export type RecipeIngredientInput = z.infer<typeof recipeIngredientSchema>
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>
