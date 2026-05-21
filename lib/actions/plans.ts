'use server'

import { db } from '@/lib/db'
import { mealPlans, mealSlots, mealItems, auditLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import {
  createMealPlanSchema,
  updateMealPlanSchema,
  createMealSlotSchema,
  updateMealSlotSchema,
  createMealItemSchema,
  updateMealItemSchema,
} from '@/lib/validations/plan'
import { requireRole } from '@/lib/actions/auth'
import { deactivatePreviousActivePlan, getMealPlanById } from '@/lib/db/queries/plans'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'

export async function createMealPlanAction(formData: FormData): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const raw = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    total_calories: formData.get('total_calories')
      ? parseInt(formData.get('total_calories') as string)
      : undefined,
    total_protein_g: formData.get('total_protein_g')
      ? parseFloat(formData.get('total_protein_g') as string)
      : undefined,
    total_carbs_g: formData.get('total_carbs_g')
      ? parseFloat(formData.get('total_carbs_g') as string)
      : undefined,
    total_fat_g: formData.get('total_fat_g')
      ? parseFloat(formData.get('total_fat_g') as string)
      : undefined,
    valid_from: (formData.get('valid_from') as string) || undefined,
    valid_until: (formData.get('valid_until') as string) || undefined,
    is_template: formData.get('is_template') === 'true',
    template_name: (formData.get('template_name') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
    patient_id: (formData.get('patient_id') as string) || undefined,
  }

  const parsed = createMealPlanSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const [plan] = await db
      .insert(mealPlans)
      .values({
        nutritionist_id: nutritionistId,
        ...parsed.data,
        total_protein_g: parsed.data.total_protein_g?.toString(),
        total_carbs_g: parsed.data.total_carbs_g?.toString(),
        total_fat_g: parsed.data.total_fat_g?.toString(),
      })
      .returning()

    revalidatePath('/nutritionist/plans')
    return { success: true, data: plan.id }
  } catch (err) {
    console.error('createMealPlanAction error:', err)
    return { success: false, error: 'Error creando plan' }
  }
}

export async function updateMealPlanAction(
  planId: string,
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

  const parsed = updateMealPlanSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await db
      .update(mealPlans)
      .set({ ...parsed.data, updated_at: new Date() })
      .where(
        and(eq(mealPlans.id, planId), eq(mealPlans.nutritionist_id, nutritionistId))
      )

    revalidatePath(`/nutritionist/plans/${planId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('updateMealPlanAction error:', err)
    return { success: false, error: 'Error actualizando plan' }
  }
}

export async function activateMealPlanAction(
  planId: string,
  patientId: string
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    await deactivatePreviousActivePlan(patientId)

    await db
      .update(mealPlans)
      .set({
        status: 'active',
        patient_id: patientId,
        updated_at: new Date(),
      })
      .where(
        and(eq(mealPlans.id, planId), eq(mealPlans.nutritionist_id, nutritionistId))
      )

    await db.insert(auditLogs).values({
      actor_id: current.profile.id,
      nutritionist_id: nutritionistId,
      action: 'ACTIVATE',
      entity_type: 'meal_plan',
      entity_id: planId,
    })

    revalidatePath(`/nutritionist/patients/${patientId}`)
    revalidatePath(`/nutritionist/plans/${planId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('activateMealPlanAction error:', err)
    return { success: false, error: 'Error activando plan' }
  }
}

export async function assignPlanToPatientAction(
  planId: string,
  patientId: string
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    await db
      .update(mealPlans)
      .set({ patient_id: patientId, updated_at: new Date() })
      .where(
        and(eq(mealPlans.id, planId), eq(mealPlans.nutritionist_id, nutritionistId))
      )

    revalidatePath(`/nutritionist/patients/${patientId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('assignPlanToPatientAction error:', err)
    return { success: false, error: 'Error asignando plan' }
  }
}

export async function duplicatePlanAction(planId: string): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    const original = await getMealPlanById(planId)
    if (!original) {
      return { success: false, error: 'Plan no encontrado' }
    }

    const { plan, slots, itemsBySlot } = original

    const [newPlan] = await db
      .insert(mealPlans)
      .values({
        nutritionist_id: nutritionistId,
        title: `Copia de ${plan.title}`,
        description: plan.description,
        is_template: plan.is_template,
        template_name: plan.template_name,
        status: 'draft',
        total_calories: plan.total_calories,
        total_protein_g: plan.total_protein_g,
        total_carbs_g: plan.total_carbs_g,
        total_fat_g: plan.total_fat_g,
        notes: plan.notes,
        valid_from: plan.valid_from,
        valid_until: plan.valid_until,
      })
      .returning()

    for (const slot of slots) {
      const [newSlot] = await db
        .insert(mealSlots)
        .values({
          meal_plan_id: newPlan.id,
          name: slot.name,
          time_of_day: slot.time_of_day,
          sort_order: slot.sort_order,
          notes: slot.notes,
        })
        .returning()

      const items = itemsBySlot[slot.id] ?? []
      if (items.length > 0) {
        await db.insert(mealItems).values(
          items.map((item) => ({
            meal_slot_id: newSlot.id,
            food_name: item.food_name,
            quantity: item.quantity,
            unit: item.unit,
            calories: item.calories,
            protein_g: item.protein_g,
            carbs_g: item.carbs_g,
            fat_g: item.fat_g,
            is_optional: item.is_optional,
            alternatives: item.alternatives,
            notes: item.notes,
            sort_order: item.sort_order,
          }))
        )
      }
    }

    revalidatePath('/nutritionist/plans')
    return { success: true, data: newPlan.id }
  } catch (err) {
    console.error('duplicatePlanAction error:', err)
    return { success: false, error: 'Error duplicando plan' }
  }
}

export async function savePlanAsTemplateAction(
  planId: string,
  templateName: string
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  try {
    await db
      .update(mealPlans)
      .set({ is_template: true, template_name: templateName, updated_at: new Date() })
      .where(
        and(eq(mealPlans.id, planId), eq(mealPlans.nutritionist_id, nutritionistId))
      )

    revalidatePath('/nutritionist/plans')
    return { success: true, data: null }
  } catch (err) {
    console.error('savePlanAsTemplateAction error:', err)
    return { success: false, error: 'Error guardando como plantilla' }
  }
}

export async function addMealSlotAction(
  planId: string,
  name: string,
  sortOrder: number
): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const parsed = createMealSlotSchema.safeParse({ meal_plan_id: planId, name, sort_order: sortOrder })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const [slot] = await db
      .insert(mealSlots)
      .values({
        meal_plan_id: planId,
        name,
        sort_order: sortOrder,
      })
      .returning()

    revalidatePath(`/nutritionist/plans/${planId}`)
    return { success: true, data: slot.id }
  } catch (err) {
    console.error('addMealSlotAction error:', err)
    return { success: false, error: 'Error agregando momento' }
  }
}

export async function updateMealSlotAction(
  slotId: string,
  data: Partial<{ name: string; time_of_day: string; sort_order: number; notes: string }>
): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin'])

  const parsed = updateMealSlotSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await db.update(mealSlots).set(parsed.data).where(eq(mealSlots.id, slotId))
    return { success: true, data: null }
  } catch (err) {
    console.error('updateMealSlotAction error:', err)
    return { success: false, error: 'Error actualizando momento' }
  }
}

export async function deleteMealSlotAction(slotId: string): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin'])

  try {
    const [slot] = await db
      .select({ meal_plan_id: mealSlots.meal_plan_id })
      .from(mealSlots)
      .where(eq(mealSlots.id, slotId))
      .limit(1)

    await db.delete(mealSlots).where(eq(mealSlots.id, slotId))

    if (slot) {
      revalidatePath(`/nutritionist/plans/${slot.meal_plan_id}`)
    }
    return { success: true, data: null }
  } catch (err) {
    console.error('deleteMealSlotAction error:', err)
    return { success: false, error: 'Error eliminando momento' }
  }
}

export async function addMealItemAction(
  slotId: string,
  formData: FormData
): Promise<ActionResult<string>> {
  await requireRole(['nutritionist', 'super_admin'])

  const raw = {
    meal_slot_id: slotId,
    food_name: formData.get('food_name') as string,
    quantity: formData.get('quantity') ? parseFloat(formData.get('quantity') as string) : undefined,
    unit: (formData.get('unit') as string) || undefined,
    calories: formData.get('calories')
      ? parseFloat(formData.get('calories') as string)
      : undefined,
    protein_g: formData.get('protein_g')
      ? parseFloat(formData.get('protein_g') as string)
      : undefined,
    carbs_g: formData.get('carbs_g')
      ? parseFloat(formData.get('carbs_g') as string)
      : undefined,
    fat_g: formData.get('fat_g') ? parseFloat(formData.get('fat_g') as string) : undefined,
    is_optional: formData.get('is_optional') === 'true',
    alternatives: (formData.get('alternatives') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
    sort_order: formData.get('sort_order')
      ? parseInt(formData.get('sort_order') as string)
      : 0,
  }

  const parsed = createMealItemSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const [item] = await db
      .insert(mealItems)
      .values({
        meal_slot_id: slotId,
        food_name: parsed.data.food_name,
        quantity: parsed.data.quantity?.toString(),
        unit: parsed.data.unit,
        calories: parsed.data.calories?.toString(),
        protein_g: parsed.data.protein_g?.toString(),
        carbs_g: parsed.data.carbs_g?.toString(),
        fat_g: parsed.data.fat_g?.toString(),
        is_optional: parsed.data.is_optional,
        alternatives: parsed.data.alternatives,
        notes: parsed.data.notes,
        sort_order: parsed.data.sort_order,
      })
      .returning()

    return { success: true, data: item.id }
  } catch (err) {
    console.error('addMealItemAction error:', err)
    return { success: false, error: 'Error agregando alimento' }
  }
}

export async function updateMealItemAction(
  itemId: string,
  formData: FormData
): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin'])

  const raw: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (value !== '') raw[key] = value
  }

  const parsed = updateMealItemSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await db.update(mealItems).set(parsed.data).where(eq(mealItems.id, itemId))
    return { success: true, data: null }
  } catch (err) {
    console.error('updateMealItemAction error:', err)
    return { success: false, error: 'Error actualizando alimento' }
  }
}

export async function deleteMealItemAction(itemId: string): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin'])

  try {
    await db.delete(mealItems).where(eq(mealItems.id, itemId))
    return { success: true, data: null }
  } catch (err) {
    console.error('deleteMealItemAction error:', err)
    return { success: false, error: 'Error eliminando alimento' }
  }
}

export async function reorderMealItemsAction(
  items: Array<{ id: string; sort_order: number }>
): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin'])

  try {
    await Promise.all(
      items.map((item) =>
        db
          .update(mealItems)
          .set({ sort_order: item.sort_order })
          .where(eq(mealItems.id, item.id))
      )
    )
    return { success: true, data: null }
  } catch (err) {
    console.error('reorderMealItemsAction error:', err)
    return { success: false, error: 'Error reordenando alimentos' }
  }
}
