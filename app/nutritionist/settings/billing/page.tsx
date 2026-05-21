import { requireRole } from '@/lib/actions/auth'
import { getNutritionistById } from '@/lib/db/queries/nutritionist'
import { getSubscriptionStatusAction } from '@/lib/actions/billing'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/lib/constants/plans'
import { CheckCircle2 } from 'lucide-react'
import { BillingUpgradeSection } from '@/components/nutritionist/BillingUpgradeSection'
import { formatDate } from '@/lib/utils'

const PLAN_LABELS: Record<string, string> = {
  basic: 'Básico',
  professional: 'Profesional',
  premium: 'Premium',
  club: 'Club',
}

const PLAN_COLORS: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-700',
  professional: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700',
  club: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  past_due: 'Pago pendiente',
  cancelled: 'Cancelado',
  trial: 'Prueba gratuita',
}

export default async function BillingPage() {
  const { nutritionist } = await requireRole(['nutritionist', 'super_admin'])
  if (!nutritionist) return null

  const [data, sub] = await Promise.all([
    getNutritionistById(nutritionist.id),
    getSubscriptionStatusAction(),
  ])

  if (!data) return null

  const currentPlan = data.plan_type
  const planModules = PLANS[currentPlan as keyof typeof PLANS]?.modules

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturación y Plan"
        description="Gestioná tu suscripción y explorá los planes disponibles"
      />

      {/* Current Plan */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Plan actual</p>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {PLAN_LABELS[currentPlan] ?? currentPlan}
              </h2>
              <Badge className={PLAN_COLORS[currentPlan] ?? 'bg-gray-100 text-gray-700'}>
                {sub ? STATUS_LABELS[sub.status] ?? sub.status : 'Activo'}
              </Badge>
            </div>
          </div>

          {sub && (
            <div className="text-right text-sm space-y-1">
              {sub.current_period_end && (
                <div>
                  <p className="text-xs text-gray-500">Próxima renovación</p>
                  <p className="font-medium text-gray-900">{formatDate(sub.current_period_end)}</p>
                </div>
              )}
              {sub.cancel_at_period_end && (
                <p className="text-xs text-red-600 font-medium">
                  Se cancela al fin del período
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">Módulos incluidos</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {planModules?.map((module) => (
              <div key={module} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="capitalize">{module.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Capacidad: hasta <strong>{data.max_patients}</strong> pacientes activos
          </p>
        </div>
      </div>

      {/* Upgrade / Manage Section */}
      <BillingUpgradeSection currentPlan={currentPlan} hasStripeSubscription={!!sub?.stripe_subscription_id} />
    </div>
  )
}
