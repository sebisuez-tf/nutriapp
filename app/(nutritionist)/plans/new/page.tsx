'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/shared/PageHeader'
import { createMealPlanAction } from '@/lib/actions/plans'
import { createMealPlanSchema, type CreateMealPlanInput } from '@/lib/validations/plan'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewPlanPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMealPlanInput>({
    resolver: zodResolver(createMealPlanSchema),
    defaultValues: {
      is_template: false,
    },
  })

  const isTemplate = watch('is_template')

  async function onSubmit(data: CreateMealPlanInput) {
    setIsSubmitting(true)
    const fd = new FormData()
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        fd.append(key, String(val))
      }
    })

    const result = await createMealPlanAction(fd)
    setIsSubmitting(false)

    if (result.success) {
      toast.success('Plan creado')
      router.push(`/nutritionist/plans/${result.data}`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/nutritionist/plans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <PageHeader title="Nuevo Plan" description="Completá los datos básicos del plan" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Información del plan</h3>

          <div>
            <Label htmlFor="title">Nombre del plan *</Label>
            <Input
              id="title"
              {...register('title')}
              className="mt-1"
              placeholder="Plan hipocalórico semana 1"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register('description')}
              className="mt-1"
              rows={2}
              placeholder="Breve descripción del objetivo del plan..."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              className="mt-1"
              rows={2}
              placeholder="Notas solo visibles para vos..."
            />
          </div>

          {/* Template toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_template"
              checked={isTemplate}
              onChange={(e) => setValue('is_template', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600"
            />
            <div>
              <Label htmlFor="is_template" className="cursor-pointer">
                Guardar como plantilla
              </Label>
              <p className="text-xs text-gray-500">
                Las plantillas se pueden reutilizar para múltiples pacientes
              </p>
            </div>
          </div>

          {isTemplate && (
            <div>
              <Label htmlFor="template_name">Nombre de plantilla *</Label>
              <Input
                id="template_name"
                {...register('template_name')}
                className="mt-1"
                placeholder="Ej: Plan vegano básico"
              />
              {errors.template_name && (
                <p className="mt-1 text-xs text-red-500">{errors.template_name.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Macros objetivo (opcional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_calories">Calorías totales (kcal)</Label>
              <Input
                id="total_calories"
                type="number"
                {...register('total_calories', { valueAsNumber: true })}
                className="mt-1"
                placeholder="2000"
              />
            </div>
            <div>
              <Label htmlFor="total_protein_g">Proteínas (g)</Label>
              <Input
                id="total_protein_g"
                type="number"
                step="0.1"
                {...register('total_protein_g', { valueAsNumber: true })}
                className="mt-1"
                placeholder="150"
              />
            </div>
            <div>
              <Label htmlFor="total_carbs_g">Carbohidratos (g)</Label>
              <Input
                id="total_carbs_g"
                type="number"
                step="0.1"
                {...register('total_carbs_g', { valueAsNumber: true })}
                className="mt-1"
                placeholder="200"
              />
            </div>
            <div>
              <Label htmlFor="total_fat_g">Grasas (g)</Label>
              <Input
                id="total_fat_g"
                type="number"
                step="0.1"
                {...register('total_fat_g', { valueAsNumber: true })}
                className="mt-1"
                placeholder="70"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Vigencia (opcional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valid_from">Desde</Label>
              <Input
                id="valid_from"
                type="date"
                {...register('valid_from')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="valid_until">Hasta</Label>
              <Input
                id="valid_until"
                type="date"
                {...register('valid_until')}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? 'Creando...' : 'Crear plan y continuar'}
          </Button>
          <Link href="/nutritionist/plans">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
