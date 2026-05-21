'use server'

import { db } from '@/lib/db'
import {
  patientGroups,
  patientGroupMembers,
  nutritionistCoordinators,
  profiles,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireRole } from '@/lib/actions/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['club', 'team', 'institution', 'category']).default('category'),
})

const updateGroupSchema = createGroupSchema.partial()

export async function createGroupAction(formData: FormData): Promise<ActionResult<string>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    type: (formData.get('type') as string) || 'category',
  }

  const parsed = createGroupSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const [group] = await db
      .insert(patientGroups)
      .values({
        nutritionist_id: nutritionistId,
        name: parsed.data.name,
        description: parsed.data.description,
        type: parsed.data.type,
      })
      .returning()

    revalidatePath('/nutritionist/groups')
    return { success: true, data: group.id }
  } catch (err) {
    console.error('createGroupAction error:', err)
    return { success: false, error: 'Error creando grupo' }
  }
}

export async function updateGroupAction(
  groupId: string,
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

  const parsed = updateGroupSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await db
      .update(patientGroups)
      .set({ ...parsed.data, updated_at: new Date() })
      .where(
        and(
          eq(patientGroups.id, groupId),
          eq(patientGroups.nutritionist_id, nutritionistId)
        )
      )

    revalidatePath(`/nutritionist/groups/${groupId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('updateGroupAction error:', err)
    return { success: false, error: 'Error actualizando grupo' }
  }
}

export async function addPatientToGroupAction(
  groupId: string,
  patientId: string
): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin'])

  try {
    const existing = await db
      .select({ id: patientGroupMembers.id })
      .from(patientGroupMembers)
      .where(
        and(
          eq(patientGroupMembers.group_id, groupId),
          eq(patientGroupMembers.patient_id, patientId)
        )
      )
      .limit(1)

    if (existing[0]) {
      return { success: false, error: 'El paciente ya es miembro del grupo' }
    }

    await db.insert(patientGroupMembers).values({ group_id: groupId, patient_id: patientId })

    revalidatePath(`/nutritionist/groups/${groupId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('addPatientToGroupAction error:', err)
    return { success: false, error: 'Error agregando paciente al grupo' }
  }
}

export async function removePatientFromGroupAction(
  groupId: string,
  patientId: string
): Promise<ActionResult<null>> {
  await requireRole(['nutritionist', 'super_admin'])

  try {
    await db
      .delete(patientGroupMembers)
      .where(
        and(
          eq(patientGroupMembers.group_id, groupId),
          eq(patientGroupMembers.patient_id, patientId)
        )
      )

    revalidatePath(`/nutritionist/groups/${groupId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('removePatientFromGroupAction error:', err)
    return { success: false, error: 'Error eliminando paciente del grupo' }
  }
}

export async function inviteCoordinatorAction(
  groupId: string,
  email: string
): Promise<ActionResult<null>> {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return { success: false, error: 'Nutricionista no encontrado' }
  }

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Email inválido' }
  }

  try {
    const adminClient = await createAdminClient()

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        role: 'coordinator',
        nutritionist_id: nutritionistId,
        group_id: groupId,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/register`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // If user already exists, create the coordinator record directly
    if (data?.user) {
      const existingProfile = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.id, data.user.id))
        .limit(1)

      if (existingProfile[0]) {
        const alreadyCoordinator = await db
          .select({ id: nutritionistCoordinators.id })
          .from(nutritionistCoordinators)
          .where(
            and(
              eq(nutritionistCoordinators.nutritionist_id, nutritionistId),
              eq(nutritionistCoordinators.coordinator_profile_id, data.user.id)
            )
          )
          .limit(1)

        if (!alreadyCoordinator[0]) {
          await db.insert(nutritionistCoordinators).values({
            nutritionist_id: nutritionistId,
            coordinator_profile_id: data.user.id,
            group_id: groupId,
          })
        }
      }
    }

    revalidatePath(`/nutritionist/groups/${groupId}`)
    return { success: true, data: null }
  } catch (err) {
    console.error('inviteCoordinatorAction error:', err)
    return { success: false, error: 'Error invitando coordinador' }
  }
}
