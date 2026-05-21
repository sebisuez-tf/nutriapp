'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clinicalRecordSchema, type ClinicalRecordInput } from '@/lib/validations/patient'
import { saveClinicalRecordAction } from '@/lib/actions/patients'
import { toast } from 'sonner'
import type { ClinicalRecord } from '@/lib/db/schema'

interface ClinicalRecordFormProps {
  patientId: string
  existingRecord?: ClinicalRecord | null
}

export function ClinicalRecordForm({ patientId, existingRecord }: ClinicalRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, setValue } = useForm<ClinicalRecordInput>({
    resolver: zodResolver(clinicalRecordSchema),
    defaultValues: {
      patient_id: patientId,
      personal_history: existingRecord?.personal_history ?? undefined,
      family_history: existingRecord?.family_history ?? undefined,
      medications: existingRecord?.medications ?? undefined,
      eating_habits: existingRecord?.eating_habits ?? undefined,
      meal_frequency: existingRecord?.meal_frequency ?? undefined,
      water_intake_liters: existingRecord?.water_intake_liters
        ? parseFloat(existingRecord.water_intake_liters)
        : undefined,
      alcohol_consumption: existingRecord?.alcohol_consumption ?? undefined,
      smoking_status: existingRecord?.smoking_status ?? undefined,
      sleep_hours: existingRecord?.sleep_hours ? parseFloat(existingRecord.sleep_hours) : undefined,
      stress_level: existingRecord?.stress_level ?? undefined,
      physical_activity: existingRecord?.physical_activity ?? undefined,
      main_objective: existingRecord?.main_objective ?? undefined,
      food_preferences: existingRecord?.food_preferences ?? undefined,
      food_dislikes: existingRecord?.food_dislikes ?? undefined,
      dietary_pattern: existingRecord?.dietary_pattern ?? undefined,
      sport_history: existingRecord?.sport_history ?? undefined,
      current_sport: existingRecord?.current_sport ?? undefined,
      training_frequency: existingRecord?.training_frequency ?? undefined,
      competition_level: existingRecord?.competition_level ?? undefined,
    },
  })

  async function onSubmit(data: ClinicalRecordInput) {
    setIsSubmitting(true)
    const fd = new FormData()
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val)) {
          fd.append(key, val.join(','))
        } else {
          fd.append(key, String(val))
        }
      }
    })

    const result = await saveClinicalRecordAction(patientId, fd)
    setIsSubmitting(false)

    if (result.success) {
      toast.success('Historia clínica guardada')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Antecedentes */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Antecedentes</h3>
        <div className="space-y-4">
          <div>
            <Label>Historia personal</Label>
            <Textarea
              {...register('personal_history')}
              className="mt-1"
              rows={3}
              placeholder="Enfermedades previas, cirugías, internaciones..."
            />
          </div>
          <div>
            <Label>Historia familiar</Label>
            <Textarea
              {...register('family_history')}
              className="mt-1"
              rows={2}
              placeholder="Diabetes, hipertensión, cardiopatías familiares..."
            />
          </div>
          <div>
            <Label>Medicamentos actuales</Label>
            <Input {...register('medications')} className="mt-1" placeholder="Listar medicamentos..." />
          </div>
        </div>
      </div>

      {/* Hábitos */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Hábitos Alimentarios</h3>
        <div className="space-y-4">
          <div>
            <Label>Hábitos alimentarios</Label>
            <Textarea
              {...register('eating_habits')}
              className="mt-1"
              rows={3}
              placeholder="Describe los hábitos actuales de alimentación..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Comidas por día</Label>
              <Input
                type="number"
                {...register('meal_frequency', { valueAsNumber: true })}
                className="mt-1"
                placeholder="4"
              />
            </div>
            <div>
              <Label>Agua (litros/día)</Label>
              <Input
                type="number"
                step="0.1"
                {...register('water_intake_liters', { valueAsNumber: true })}
                className="mt-1"
                placeholder="1.5"
              />
            </div>
          </div>
          <div>
            <Label>Patrón dietario</Label>
            <Select
              onValueChange={(val) =>
                setValue('dietary_pattern', val as ClinicalRecordInput['dietary_pattern'])
              }
              defaultValue={existingRecord?.dietary_pattern ?? undefined}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="omnivore">Omnívoro</SelectItem>
                <SelectItem value="vegetarian">Vegetariano</SelectItem>
                <SelectItem value="vegan">Vegano</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Preferencias alimentarias</Label>
            <Input
              {...register('food_preferences')}
              className="mt-1"
              placeholder="Alimentos que disfruta..."
            />
          </div>
          <div>
            <Label>Alimentos que no le gustan</Label>
            <Input
              {...register('food_dislikes')}
              className="mt-1"
              placeholder="Alimentos que rechaza..."
            />
          </div>
        </div>
      </div>

      {/* Estilo de vida */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Estilo de Vida</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Horas de sueño</Label>
              <Input
                type="number"
                step="0.5"
                {...register('sleep_hours', { valueAsNumber: true })}
                className="mt-1"
                placeholder="7.5"
              />
            </div>
            <div>
              <Label>Nivel de estrés (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                {...register('stress_level', { valueAsNumber: true })}
                className="mt-1"
                placeholder="5"
              />
            </div>
          </div>
          <div>
            <Label>Consumo de alcohol</Label>
            <Input
              {...register('alcohol_consumption')}
              className="mt-1"
              placeholder="Ej: Ocasional, fin de semana..."
            />
          </div>
          <div>
            <Label>Tabaquismo</Label>
            <Input
              {...register('smoking_status')}
              className="mt-1"
              placeholder="No fuma / Ex fumador / Activo..."
            />
          </div>
          <div>
            <Label>Actividad física habitual</Label>
            <Textarea
              {...register('physical_activity')}
              className="mt-1"
              rows={2}
              placeholder="Tipo y frecuencia de actividad física..."
            />
          </div>
        </div>
      </div>

      {/* Objetivos */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Objetivos</h3>
        <div className="space-y-4">
          <div>
            <Label>Objetivo principal</Label>
            <Input
              {...register('main_objective')}
              className="mt-1"
              placeholder="Ej: Bajar de peso, ganar masa muscular..."
            />
          </div>
          <div>
            <Label>Deporte actual</Label>
            <Input
              {...register('current_sport')}
              className="mt-1"
              placeholder="Fútbol, natación, crossfit..."
            />
          </div>
          <div>
            <Label>Frecuencia de entrenamiento</Label>
            <Input
              {...register('training_frequency')}
              className="mt-1"
              placeholder="3 veces por semana..."
            />
          </div>
          <div>
            <Label>Nivel de competencia</Label>
            <Input
              {...register('competition_level')}
              className="mt-1"
              placeholder="Recreativo, Amateur, Profesional..."
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {isSubmitting ? 'Guardando...' : 'Guardar Historia Clínica'}
      </Button>
    </form>
  )
}
