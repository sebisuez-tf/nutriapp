'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createAppointmentSchema, type CreateAppointmentInput } from '@/lib/validations/appointment'
import { createAppointmentAction } from '@/lib/actions/appointments'
import { toast } from 'sonner'

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface AppointmentFormProps {
  patients: Patient[]
  preselectedPatientId?: string
  onSuccess?: () => void
}

export function AppointmentForm({
  patients,
  preselectedPatientId,
  onSuccess,
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Default to tomorrow at 10:00
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)
  const defaultDateTime = tomorrow.toISOString().slice(0, 16)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateAppointmentInput>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      patient_id: preselectedPatientId ?? '',
      duration_minutes: 60,
      type: 'followup',
    },
  })

  async function onSubmit(data: CreateAppointmentInput) {
    setIsSubmitting(true)
    const fd = new FormData()
    fd.set('patient_id', data.patient_id)
    fd.set('scheduled_at', new Date(data.scheduled_at).toISOString())
    fd.set('duration_minutes', String(data.duration_minutes))
    fd.set('type', data.type)
    if (data.notes) fd.set('notes', data.notes)

    const result = await createAppointmentAction(fd)
    setIsSubmitting(false)

    if (result.success) {
      toast.success('Turno agendado')
      onSuccess?.()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Patient */}
      <div>
        <Label>Paciente *</Label>
        <Select
          onValueChange={(val) => setValue('patient_id', val)}
          defaultValue={preselectedPatientId}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Seleccionar paciente..." />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.patient_id && (
          <p className="mt-1 text-xs text-red-500">{errors.patient_id.message}</p>
        )}
      </div>

      {/* Date & time */}
      <div>
        <Label htmlFor="scheduled_at">Fecha y hora *</Label>
        <Input
          id="scheduled_at"
          type="datetime-local"
          defaultValue={defaultDateTime}
          {...register('scheduled_at')}
          className="mt-1"
        />
        {errors.scheduled_at && (
          <p className="mt-1 text-xs text-red-500">{errors.scheduled_at.message}</p>
        )}
      </div>

      {/* Duration + Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Duración (min)</Label>
          <Input
            type="number"
            step="15"
            min="15"
            max="180"
            {...register('duration_minutes', { valueAsNumber: true })}
            className="mt-1"
            defaultValue={60}
          />
          {errors.duration_minutes && (
            <p className="mt-1 text-xs text-red-500">{errors.duration_minutes.message}</p>
          )}
        </div>
        <div>
          <Label>Tipo</Label>
          <Select
            onValueChange={(val) =>
              setValue('type', val as CreateAppointmentInput['type'])
            }
            defaultValue="followup"
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial">Consulta inicial</SelectItem>
              <SelectItem value="followup">Seguimiento</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="remote">Remoto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label>Notas</Label>
        <Textarea
          {...register('notes')}
          className="mt-1"
          rows={2}
          placeholder="Indicaciones o recordatorios para el turno..."
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {isSubmitting ? 'Agendando...' : 'Agendar turno'}
      </Button>
    </form>
  )
}
