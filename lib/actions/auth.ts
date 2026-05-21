'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, nutritionists } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  inviteNutritionistSchema,
} from '@/lib/validations/auth'
import type { Role, ActionResult } from '@/types'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendNutritionistInvite } from '@/lib/services/resend'

const ROLE_DASHBOARDS: Record<string, string> = {
  super_admin: '/admin/dashboard',
  nutritionist: '/nutritionist/dashboard',
  patient: '/patient/dashboard',
  coordinator: '/nutritionist/dashboard',
  support: '/admin/dashboard',
}

export async function loginAction(formData: FormData): Promise<ActionResult<null>> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !data.user) {
    return { success: false, error: 'Email o contraseña incorrectos' }
  }

  const role = (data.user.user_metadata?.role as string) ?? 'nutritionist'
  const dashboard = ROLE_DASHBOARDS[role] ?? '/nutritionist/dashboard'

  redirect(dashboard)
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<ActionResult<null>> {
  const raw = { email: formData.get('email') as string }
  const parsed = forgotPasswordSchema.safeParse(raw)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Email inválido' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { success: false, error: 'Error enviando email. Intentá de nuevo.' }
  }

  return { success: true, data: null }
}

export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult<null>> {
  const raw = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: 'Error actualizando contraseña. El enlace puede haber expirado.' }
  }

  redirect('/login')
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!profile) return null

    let nutritionist = null
    if (profile.role === 'nutritionist' || profile.role === 'coordinator') {
      nutritionist = await db
        .select()
        .from(nutritionists)
        .where(eq(nutritionists.profile_id, user.id))
        .limit(1)
        .then((r) => r[0] ?? null)
    }

    return { user, profile, nutritionist }
  } catch {
    return null
  }
}

export async function requireRole(allowedRoles: Role | Role[]) {
  const current = await getCurrentUser()

  if (!current) {
    redirect('/login')
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  if (!roles.includes(current.profile.role as Role)) {
    const dashboard = ROLE_DASHBOARDS[current.profile.role] ?? '/login'
    redirect(dashboard)
  }

  return current
}

export async function requireModule(module: string) {
  const current = await getCurrentUser()
  if (!current?.nutritionist) {
    redirect('/login')
  }

  const { getPlanModules } = await import('@/lib/constants/plans')
  const planType = current.nutritionist.plan_type as import('@/types').PlanType
  const modules = getPlanModules(planType)

  if (!modules.includes(module as import('@/types').Module)) {
    return false
  }

  return true
}

export async function inviteNutritionistAction(
  formData: FormData
): Promise<ActionResult<null>> {
  await requireRole('super_admin')

  const raw = {
    email: formData.get('email') as string,
    full_name: formData.get('full_name') as string,
  }

  const parsed = inviteNutritionistSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const adminClient = await createAdminClient()

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: {
        full_name: parsed.data.full_name,
        role: 'nutritionist',
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/register`,
    })

    if (error || !data) {
      return { success: false, error: error?.message ?? 'Error creando usuario' }
    }

    await sendNutritionistInvite({
      email: parsed.data.email,
      magicLink: `${process.env.NEXT_PUBLIC_APP_URL}/register`,
    })

    revalidatePath('/admin/nutritionists')
    return { success: true, data: null }
  } catch (err) {
    console.error('inviteNutritionistAction error:', err)
    return { success: false, error: 'Error interno del servidor' }
  }
}
