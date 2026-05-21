import { getNutritionistById } from '@/lib/db/queries/admin'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { activateNutritionistAction, suspendNutritionistAction, updateNutritionistPlanAction } from '@/lib/actions/admin'
import { PLANS } from '@/lib/constants/plans'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { PlanType } from '@/types'

export default async function AdminNutritionistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const nutritionist = await getNutritionistById(id)

  if (!nutritionist) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/nutritionists">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <PageHeader
          title={nutritionist.full_name ?? nutritionist.business_name}
          description={nutritionist.email ?? ''}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Perfil</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nombre</span>
              <span className="font-medium">{nutritionist.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{nutritionist.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Teléfono</span>
              <span className="font-medium">{nutritionist.phone ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Negocio</span>
              <span className="font-medium">{nutritionist.business_name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ciudad</span>
              <span className="font-medium">{nutritionist.city ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">País</span>
              <span className="font-medium">{nutritionist.country ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Registro</span>
              <span className="font-medium">{formatDate(nutritionist.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Suscripción</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Plan actual</span>
              <Badge variant="secondary">
                {PLANS[nutritionist.plan_type as keyof typeof PLANS]?.name ?? nutritionist.plan_type}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Max pacientes</span>
              <span className="font-medium">{nutritionist.max_patients}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expira</span>
              <span className="font-medium">
                {nutritionist.plan_expires_at
                  ? formatDate(nutritionist.plan_expires_at)
                  : 'Sin límite'}
              </span>
            </div>
          </div>

          {/* Change Plan */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs text-gray-500">Cambiar plan:</p>
            <form className="flex gap-2">
              <input type="hidden" name="id" value={id} />
              <select
                name="plan_type"
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs"
                defaultValue={nutritionist.plan_type}
              >
                {Object.entries(PLANS).map(([key, plan]) => (
                  <option key={key} value={key}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                formAction={async (fd: FormData) => {
                  'use server'
                  await updateNutritionistPlanAction(id, fd.get('plan_type') as PlanType)
                }}
                className="text-xs"
              >
                Aplicar
              </Button>
            </form>
          </div>
        </div>

        {/* Actions Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Estado & Acciones</h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Estado actual</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                nutritionist.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {nutritionist.is_active ? 'Activo' : 'Suspendido'}
            </span>
          </div>

          <div className="space-y-2">
            {nutritionist.is_active ? (
              <form>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  formAction={async () => {
                    'use server'
                    await suspendNutritionistAction(id)
                  }}
                >
                  Suspender Cuenta
                </Button>
              </form>
            ) : (
              <form>
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  formAction={async () => {
                    'use server'
                    await activateNutritionistAction(id)
                  }}
                >
                  Activar Cuenta
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
