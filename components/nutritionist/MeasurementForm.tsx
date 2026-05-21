'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { measurementSchema, type MeasurementInput } from '@/lib/validations/measurement'
import { createMeasurementAction } from '@/lib/actions/measurements'
import { toast } from 'sonner'
import { calculateBMI, getBMICategory } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface MeasurementFormProps {
  patientId: string
  onSuccess?: () => void
}

export function MeasurementForm({ patientId, onSuccess }: MeasurementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<MeasurementInput>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      measured_at: new Date().toISOString().split('T')[0],
    },
  })

  const weight = watch('weight_kg')
  const height = watch('height_cm')

  const bmi =
    weight && height && weight > 0 && height > 0
      ? calculateBMI(weight, height)
      : null

  const bmiCategory = bmi ? getBMICategory(bmi) : null

  async function onSubmit(data: MeasurementInput) {
    setIsSubmitting(true)
    const fd = new FormData()
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        fd.append(key, String(val))
      }
    })

    const result = await createMeasurementAction(patientId, fd)
    setIsSubmitting(false)

    if (result.success) {
      toast.success('Medición registrada')
      onSuccess?.()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Date */}
      <div>
        <Label htmlFor="measured_at">Fecha de medición *</Label>
        <Input
          id="measured_at"
          type="date"
          {...register('measured_at')}
          className="mt-1"
        />
        {errors.measured_at && (
          <p className="mt-1 text-xs text-red-500">{errors.measured_at.message}</p>
        )}
      </div>

      {/* Peso y Talla + BMI live */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Peso y Talla</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight_kg">Peso (kg)</Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              {...register('weight_kg', { valueAsNumber: true })}
              className="mt-1"
              placeholder="70.5"
            />
            {errors.weight_kg && (
              <p className="mt-1 text-xs text-red-500">{errors.weight_kg.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="height_cm">Talla (cm)</Label>
            <Input
              id="height_cm"
              type="number"
              step="0.1"
              {...register('height_cm', { valueAsNumber: true })}
              className="mt-1"
              placeholder="165"
            />
            {errors.height_cm && (
              <p className="mt-1 text-xs text-red-500">{errors.height_cm.message}</p>
            )}
          </div>
        </div>

        {/* Live BMI */}
        {bmi && bmiCategory && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <span className="text-sm text-gray-600">IMC calculado:</span>
            <div className="text-right">
              <span className="text-xl font-bold text-gray-900">{bmi}</span>
              <span className={cn('ml-2 text-sm font-medium', bmiCategory.color)}>
                {bmiCategory.label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Composición corporal */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Composición Corporal</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Grasa corporal (%)</Label>
            <Input
              type="number"
              step="0.1"
              {...register('body_fat_percentage', { valueAsNumber: true })}
              className="mt-1"
              placeholder="22.5"
            />
          </div>
          <div>
            <Label>Masa muscular (kg)</Label>
            <Input
              type="number"
              step="0.1"
              {...register('muscle_mass_kg', { valueAsNumber: true })}
              className="mt-1"
              placeholder="28.0"
            />
          </div>
          <div>
            <Label>Masa ósea (kg)</Label>
            <Input
              type="number"
              step="0.1"
              {...register('bone_mass_kg', { valueAsNumber: true })}
              className="mt-1"
              placeholder="2.8"
            />
          </div>
          <div>
            <Label>Grasa visceral (nivel)</Label>
            <Input
              type="number"
              {...register('visceral_fat_level', { valueAsNumber: true })}
              className="mt-1"
              placeholder="5"
            />
          </div>
          <div>
            <Label>Agua corporal (%)</Label>
            <Input
              type="number"
              step="0.1"
              {...register('total_body_water_percentage', { valueAsNumber: true })}
              className="mt-1"
              placeholder="58.0"
            />
          </div>
          <div>
            <Label>Edad metabólica</Label>
            <Input
              type="number"
              {...register('metabolic_age', { valueAsNumber: true })}
              className="mt-1"
              placeholder="28"
            />
          </div>
          <div>
            <Label>TMB (kcal/día)</Label>
            <Input
              type="number"
              {...register('basal_metabolic_rate', { valueAsNumber: true })}
              className="mt-1"
              placeholder="1600"
            />
          </div>
        </div>
      </div>

      {/* Circumferences */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Perímetros (cm)</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'waist_circumference' as const, label: 'Cintura' },
            { name: 'hip_circumference' as const, label: 'Cadera' },
            { name: 'arm_circumference' as const, label: 'Brazo' },
            { name: 'thigh_circumference' as const, label: 'Muslo' },
            { name: 'calf_circumference' as const, label: 'Pantorrilla' },
            { name: 'chest_circumference' as const, label: 'Pecho' },
          ].map((field) => (
            <div key={field.name}>
              <Label>{field.label}</Label>
              <Input
                type="number"
                step="0.1"
                {...register(field.name, { valueAsNumber: true })}
                className="mt-1"
                placeholder="0.0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Method & Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Método de medición</Label>
          <Input
            {...register('measurement_method')}
            className="mt-1"
            placeholder="Bioimpedancia, pliegues..."
          />
        </div>
      </div>

      <div>
        <Label>Notas</Label>
        <Textarea
          {...register('notes')}
          className="mt-1"
          rows={2}
          placeholder="Observaciones de la medición..."
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {isSubmitting ? 'Guardando...' : 'Registrar Medición'}
      </Button>
    </form>
  )
}
