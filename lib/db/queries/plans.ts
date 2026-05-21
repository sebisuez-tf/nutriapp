import { db } from '@/lib/db'
import { mealPlans, mealSlots, mealItems } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function getMealPlansByNutritionistId(nutritionistId: string, status?: string) {
  const conditions = [eq(mealPlans.nutritionist_id, nutritionistId)]
  if (status) {
    conditions.push(
      eq(
        mealPlans.status,
        status as 'draft' | 'active' | 'inactive' | 'archived'
      )
    )
  }
  return db
    .select()
    .from(mealPlans)
    .where(and(...conditions))
    .orderBy(sql`${mealPlans.updated_at} DESC`)
}

export async function getMealPlanById(planId: string) {
  const plan = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.id, planId))
    .limit(1)

  if (!plan[0]) return null

  const slots = await db
    .select()
    .from(mealSlots)
    .where(eq(mealSlots.meal_plan_id, planId))
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

export async function getTemplatesByNutritionistId(nutritionistId: string) {
  return db
    .select()
    .from(mealPlans)
    .where(
      and(eq(mealPlans.nutritionist_id, nutritionistId), eq(mealPlans.is_template, true))
    )
    .orderBy(sql`${mealPlans.updated_at} DESC`)
}

export async function deactivatePreviousActivePlan(patientId: string) {
  return db
    .update(mealPlans)
    .set({ status: 'inactive', updated_at: new Date() })
    .where(and(eq(mealPlans.patient_id, patientId), eq(mealPlans.status, 'active')))
}

export async function getMealPlanWithFullDetails(planId: string) {
  return getMealPlanById(planId)
}
