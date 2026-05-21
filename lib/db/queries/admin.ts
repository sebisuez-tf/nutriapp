import { db } from '@/lib/db'
import { nutritionists, profiles, patients, auditLogs } from '@/lib/db/schema'
import { eq, count, gte, sql } from 'drizzle-orm'
import type { PlanType } from '@/types'

export async function getAllNutritionists() {
  const result = await db
    .select({
      id: nutritionists.id,
      profile_id: nutritionists.profile_id,
      business_name: nutritionists.business_name,
      plan_type: nutritionists.plan_type,
      is_active: nutritionists.is_active,
      created_at: nutritionists.created_at,
      max_patients: nutritionists.max_patients,
      city: nutritionists.city,
      country: nutritionists.country,
      full_name: profiles.full_name,
      email: profiles.email,
      avatar_url: profiles.avatar_url,
      patient_count: sql<number>`(
        SELECT COUNT(*)::int FROM patients WHERE patients.nutritionist_id = ${nutritionists.id}
      )`,
    })
    .from(nutritionists)
    .leftJoin(profiles, eq(nutritionists.profile_id, profiles.id))
    .orderBy(nutritionists.created_at)

  return result
}

export async function getNutritionistById(id: string) {
  const result = await db
    .select({
      id: nutritionists.id,
      profile_id: nutritionists.profile_id,
      business_name: nutritionists.business_name,
      bio: nutritionists.bio,
      logo_url: nutritionists.logo_url,
      primary_color: nutritionists.primary_color,
      secondary_color: nutritionists.secondary_color,
      accent_color: nutritionists.accent_color,
      contact_email: nutritionists.contact_email,
      contact_phone: nutritionists.contact_phone,
      website_url: nutritionists.website_url,
      instagram_handle: nutritionists.instagram_handle,
      address: nutritionists.address,
      city: nutritionists.city,
      country: nutritionists.country,
      is_active: nutritionists.is_active,
      plan_type: nutritionists.plan_type,
      plan_expires_at: nutritionists.plan_expires_at,
      max_patients: nutritionists.max_patients,
      onboarding_step: nutritionists.onboarding_step,
      created_at: nutritionists.created_at,
      updated_at: nutritionists.updated_at,
      full_name: profiles.full_name,
      email: profiles.email,
      phone: profiles.phone,
      avatar_url: profiles.avatar_url,
    })
    .from(nutritionists)
    .leftJoin(profiles, eq(nutritionists.profile_id, profiles.id))
    .where(eq(nutritionists.id, id))
    .limit(1)

  return result[0] ?? null
}

export async function getTotalPatientsCount(): Promise<number> {
  const result = await db.select({ count: count() }).from(patients)
  return result[0]?.count ?? 0
}

export async function getNewNutritionistsThisMonth(): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const result = await db
    .select({ count: count() })
    .from(nutritionists)
    .where(gte(nutritionists.created_at, startOfMonth))

  return result[0]?.count ?? 0
}

export async function getPlanDistribution(): Promise<{ plan_type: string; count: number }[]> {
  const result = await db
    .select({
      plan_type: nutritionists.plan_type,
      count: count(),
    })
    .from(nutritionists)
    .groupBy(nutritionists.plan_type)

  return result.map((r) => ({ plan_type: r.plan_type, count: r.count }))
}

export async function getAuditLogs(limit = 50, offset = 0) {
  const result = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity_type: auditLogs.entity_type,
      entity_id: auditLogs.entity_id,
      old_values: auditLogs.old_values,
      new_values: auditLogs.new_values,
      ip_address: auditLogs.ip_address,
      created_at: auditLogs.created_at,
      actor_full_name: profiles.full_name,
      actor_email: profiles.email,
    })
    .from(auditLogs)
    .leftJoin(profiles, eq(auditLogs.actor_id, profiles.id))
    .orderBy(sql`${auditLogs.created_at} DESC`)
    .limit(limit)
    .offset(offset)

  return result
}

export async function updateNutritionistStatus(id: string, isActive: boolean) {
  return db
    .update(nutritionists)
    .set({ is_active: isActive, updated_at: new Date() })
    .where(eq(nutritionists.id, id))
}

export async function updateNutritionistPlan(id: string, planType: PlanType, maxPatients: number) {
  return db
    .update(nutritionists)
    .set({ plan_type: planType, max_patients: maxPatients, updated_at: new Date() })
    .where(eq(nutritionists.id, id))
}
