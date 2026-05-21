'use server'

import { db } from '@/lib/db'
import { recipes, recipeIngredients, auditLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createRecipeSchema, updateRecipeSchema } from '@/lib/validations/recipe'
import { requireRole } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'

export async function createRecipeAction(formData: FormData): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const tagsRaw = formData.get('tags') as string
  const ingredientsRaw = formData.get('ingredients') as string

  const raw = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    instructions: (formData.get('instructions') as string) || undefined,
    prep_time_minutes: formData.get('prep_time_minutes')
      ? parseInt(formData.get('prep_time_minutes') as string)
      : undefined,
    cook_time_minutes: formData.get('cook_time_minutes')
      ? parseInt(formData.get('cook_time_minutes') as string)
      : undefined,
    servings: formData.get('servings') ? parseInt(formData.get('servings') as string) : undefined,
    calories_per_serving: formData.get('calories_per_serving')
      ? parseFloat(formData.get('calories_per_serving') as string)
      : undefined,
    protein_per_serving: formData.get('protein_per_serving')
      ? parseFloat(formData.get('protein_per_serving') as string)
      : undefined,
    carbs_per_serving: formData.get('carbs_per_serving')
      ? parseFloat(formData.get('carbs_per_serving') as string)
      : undefined,
    fat_per_serving: formData.get('fat_per_serving')
      ? parseFloat(formData.get('fat_per_serving') as string)
      : undefined,
    tags: tagsRaw
      ? tagsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    is_public: formData.get('is_public') === 'true',
    ingredients: ingredientsRaw ? JSON.parse(ingredientsRaw) : [],
  }

  const parsed = createRecipeSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const [recipe] = await db
      .insert(recipes)
      .values({
        nutritionist_id: nutritionistId,
        title: parsed.data.title,
        description: parsed.data.description,
        instructions: parsed.data.instructions,
        prep_time_minutes: parsed.data.prep_time_minutes,
        cook_time_minutes: parsed.data.cook_time_minutes,
        servings: parsed.data.servings,
        calories_per_serving: parsed.data.calories_per_serving?.toString(),
        protein_per_serving: parsed.data.protein_per_serving?.toString(),
        carbs_per_serving: parsed.data.carbs_per_serving?.toString(),
        fat_per_serving: parsed.data.fat_per_serving?.toString(),
        tags: parsed.data.tags ?? [],
        is_public: parsed.data.is_public,
      })
      .returning()

    if (parsed.data.ingredients && parsed.data.ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        parsed.data.ingredients.map((ing, idx) => ({
          recipe_id: recipe.id,
          ingredient_name: ing.ingredient_name,
          quantity: ing.quantity?.toString(),
          unit: ing.unit,
          notes: ing.notes,
          sort_order: ing.sort_order ?? idx,
        }))
      )
    }

    await db.insert(auditLogs).values({
      actor_id: current.profile.id,
      nutritionist_id: nutritionistId,
      action: 'CREATE',
      entity_type: 'recipe',
      entity_id: recipe.id,
    })

    revalidatePath('/nutritionist/recipes')
    return { success: true, data: recipe.id }
  } catch (err) {
    console.error('createRecipeAction error:', err)
    return { success: false, error: 'Error creando receta' }
  }
}

export async function updateRecipeAction(
  recipeId: string,
  formData: FormData
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const raw: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (value !== '') raw[key] = value
  }

  const parsed = updateRecipeSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const { ingredients, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, ...recipeData } = parsed.data

    await db
      .update(recipes)
      .set({
        ...recipeData,
        calories_per_serving: calories_per_serving?.toString(),
        protein_per_serving: protein_per_serving?.toString(),
        carbs_per_serving: carbs_per_serving?.toString(),
        fat_per_serving: fat_per_serving?.toString(),
        updated_at: new Date(),
      })
      .where(and(eq(recipes.id, recipeId), eq(recipes.nutritionist_id, nutritionistId)))

    if (ingredients !== undefined) {
      await db.delete(recipeIngredients).where(eq(recipeIngredients.recipe_id, recipeId))

      if (ingredients.length > 0) {
        await db.insert(recipeIngredients).values(
          ingredients.map((ing, idx) => ({
            recipe_id: recipeId,
            ingredient_name: ing.ingredient_name,
            quantity: ing.quantity?.toString(),
            unit: ing.unit,
            notes: ing.notes,
            sort_order: ing.sort_order ?? idx,
          }))
        )
      }
    }

    revalidatePath('/nutritionist/recipes')
    revalidatePath(`/nutritionist/recipes/${recipeId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('updateRecipeAction error:', err)
    return { success: false, error: 'Error actualizando receta' }
  }
}

export async function deleteRecipeAction(recipeId: string): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    await db
      .delete(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.nutritionist_id, nutritionistId)))

    revalidatePath('/nutritionist/recipes')
    return { success: true, data: null }
  } catch (err) {
    console.error('deleteRecipeAction error:', err)
    return { success: false, error: 'Error eliminando receta' }
  }
}

export async function toggleRecipeVisibilityAction(recipeId: string): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    const recipe = await db
      .select({ is_public: recipes.is_public })
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.nutritionist_id, nutritionistId)))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!recipe) return { success: false, error: 'Receta no encontrada' }

    await db
      .update(recipes)
      .set({ is_public: !recipe.is_public, updated_at: new Date() })
      .where(and(eq(recipes.id, recipeId), eq(recipes.nutritionist_id, nutritionistId)))

    revalidatePath('/nutritionist/recipes')
    return { success: true, data: null }
  } catch (err) {
    console.error('toggleRecipeVisibilityAction error:', err)
    return { success: false, error: 'Error actualizando visibilidad' }
  }
}
