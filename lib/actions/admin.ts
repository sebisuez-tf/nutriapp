'use server'

import { requireRole } from '@/lib/actions/auth'
import {
  updateNutritionistStatus,
  updateNutritionistPlan,
  getAllNutritionists,
  getTotalPatientsCount,
  getNewNutritionistsThisMonth,
  getPlanDistribution,
  getAuditLogs,
} from '@/lib/db/queries/admin'
import { revalidatePath } from 'next/cache'
import type { ActionResult, PlanType } from '@/types'
import { PLANS } from '@/lib/constants/plans'

export async function activateNutritionistAction(id: string): Promise<ActionResult<null>> {
  await requireRole('super_admin')

  try {
    await updateNutritionistStatus(id, true)
    revalidatePath('/admin/nutritionists')
    return { success: true, data: null }
  } catch (err) {
    console.error('activateNutritionistAction error:', err)
    return { success: false, error: 'Error activando nutricionista' }
  }
}

export async function suspendNutritionistAction(id: string): Promise<ActionResult<null>> {
  await requireRole('super_admin')

  try {
    await updateNutritionistStatus(id, false)
    revalidatePath('/admin/nutritionists')
    return { success: true, data: null }
  } catch (err) {
    console.error('suspendNutritionistAction error:', err)
    return { success: false, error: 'Error suspendiendo nutricionista' }
  }
}

export async function updateNutritionistPlanAction(
  id: string,
  planType: PlanType
): Promise<ActionResult<null>> {
  await requireRole('super_admin')

  const planConfig = PLANS[planType]
  if (!planConfig) {
    return { success: false, error: 'Plan inválido' }
  }

  try {
    await updateNutritionistPlan(id, planType, planConfig.maxPatients)
    revalidatePath('/admin/nutritionists')
    revalidatePath(`/admin/nutritionists/${id}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('updateNutritionistPlanAction error:', err)
    return { success: false, error: 'Error actualizando plan' }
  }
}

export async function getAdminDashboardStats() {
  await requireRole('super_admin')

  const [nutritionists, totalPatients, newThisMonth, planDistribution, recentLogs] =
    await Promise.all([
      getAllNutritionists(),
      getTotalPatientsCount(),
      getNewNutritionistsThisMonth(),
      getPlanDistribution(),
      getAuditLogs(10, 0),
    ])

  return {
    total_nutritionists: nutritionists.length,
    active_nutritionists: nutritionists.filter((n) => n.is_active).length,
    total_patients: totalPatients,
    new_nutritionists_this_month: newThisMonth,
    plan_distribution: planDistribution,
    recent_logs: recentLogs,
    recent_nutritionists: nutritionists.slice(-5).reverse(),
  }
}
