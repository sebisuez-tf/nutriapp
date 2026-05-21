import { z } from 'zod'

export const createAppointmentSchema = z.object({
  patient_id: z.string().uuid(),
  scheduled_at: z.string().datetime(),
  duration_minutes: z.number().min(15).max(180).default(60),
  type: z.enum(['initial', 'followup', 'online', 'remote']).default('followup'),
  notes: z.string().max(1000).optional(),
})

export const updateAppointmentSchema = createAppointmentSchema.partial()

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
