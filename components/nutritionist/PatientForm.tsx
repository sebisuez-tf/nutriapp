'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createPatientSchema, type CreatePatientInput } from '@/lib/validations/patient'
import { createPatientAction, updatePatientAction } from '@/lib/actions/patients'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Datos básicos' },
  { id: 2, title: 'Datos personales' },
  { id: 3, title: 'Información adicional' },
  { id: 4, title: 'Confirmación' },
]

interface PatientFormProps {
  patientId?: string
  defaultValues?: Partial<CreatePatientInput>
  mode?: 'create' | 'edit'
}

export function PatientForm({
  patientId,
  defaultValues,
  mode = 'create',
}: PatientFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      ...defaultValues,
    },
  })

  const formValues = watch()

  async function onSubmit(data: CreatePatientInput) {
    setIsSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          fd.append(key, String(val))
        }
      })

      let result
      if (mode === 'edit' && patientId) {
        result = await updatePatientAction(patientId, fd)
      } else {
        result = await createPatientAction(fd)
      }

      if (result.success) {
        toast.success(mode === 'create' ? 'Paciente creado' : 'Paciente actualizado')
        if (mode === 'create' && result.data) {
          router.push(`/nutritionist/patients/${result.data}`)
        } else {
          router.push(`/nutritionist/patients/${patientId}`)
        }
      } else {
        toast.error(result.error)
      }
    } catch (e) {
      toast.error('Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Step Indicators */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                s.id < step
                  ? 'bg-green-600 text-white'
                  : s.id === step
                  ? 'bg-green-600 text-white ring-4 ring-green-100'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s.id < step ? <Check className="h-4 w-4" /> : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 ${s.id < step ? 'bg-green-600' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {STEPS[step - 1].title}
          </h2>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Nombre *</Label>
                  <Input
                    id="first_name"
                    {...register('first_name')}
                    className="mt-1"
                    placeholder="María"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">Apellido *</Label>
                  <Input
                    id="last_name"
                    {...register('last_name')}
                    className="mt-1"
                    placeholder="García"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="mt-1"
                  placeholder="maria@email.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  className="mt-1"
                  placeholder="+54 11 1234-5678"
                />
              </div>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="date_of_birth">Fecha de nacimiento</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register('date_of_birth')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sex">Sexo</Label>
                <Select
                  onValueChange={(val) =>
                    setValue('sex', val as 'male' | 'female' | 'other')
                  }
                  defaultValue={defaultValues?.sex}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="occupation">Ocupación</Label>
                <Input
                  id="occupation"
                  {...register('occupation')}
                  className="mt-1"
                  placeholder="Docente, Estudiante..."
                />
              </div>

              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  {...register('city')}
                  className="mt-1"
                  placeholder="Buenos Aires"
                />
              </div>
            </div>
          )}

          {/* Step 3: Notes */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notas internas</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  className="mt-1"
                  placeholder="Notas visibles solo para vos..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Revisar datos antes de confirmar:</p>
              <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nombre</span>
                  <span className="font-medium">
                    {formValues.first_name} {formValues.last_name}
                  </span>
                </div>
                {formValues.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{formValues.email}</span>
                  </div>
                )}
                {formValues.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Teléfono</span>
                    <span className="font-medium">{formValues.phone}</span>
                  </div>
                )}
                {formValues.city && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ciudad</span>
                    <span className="font-medium">{formValues.city}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Atrás
            </Button>
          )}

          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Guardando...'
                : mode === 'create'
                ? 'Crear paciente'
                : 'Actualizar paciente'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
