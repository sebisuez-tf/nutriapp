import { requireRole } from '@/lib/actions/auth'
import { getNutritionistById } from '@/lib/db/queries/nutritionist'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/constants/plans'
import { CheckCircle2, ArrowUpRight } from 'lucide-react'

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

export default async function BillingPage() {
  const { nutritionist } = await requireRole(['nutritionist', 'super_admin'])
  if (!nutritionist) return null

  const data = await getNutritionistById(nutritionist.id)
  if (!data) return null

  const currentPlan = data.plan_type
  const planModules = PLANS[currentPlan as keyof typeof PLANS]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturación y Plan"
        description="Gestioná tu suscripción y explorá los planes disponibles"
      />

      {/* Current plan */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Plan actual</p>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {PLAN_LABELS[currentPlan] ?? currentPlan}
              </h2>
              <Badge className={PLAN_COLORS[currentPlan] ?? 'bg-gray-100 text-gray-700'}>
                Activo
              </Badge>
            </div>
          </div>
          {data.subscription_status && (
            <div className="text-right text-sm">
              <p className="text-gray-500">Estado</p>
              <p className="font-medium text-gray-900 capitalize">{data.subscription_status}</p>
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
      </div>

      {/* Upgrade notice */}
      {currentPlan !== 'club' && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 space-y-4">
          <h3 className="font-semibold text-purple-900">Mejorá tu plan</h3>
          <p className="text-sm text-purple-700">
            Accedé a más funcionalidades como grupos, reportes avanzados, API y más capacidad de
            pacientes.
          </p>

          {/* Plan comparison */}
          <div className="grid gap-3 sm:grid-cols-3">
            {(['professional', 'premium', 'club'] as const)
              .filter((p) => {
                const order = ['basic', 'professional', 'premium', 'club']
                return order.indexOf(p) > order.indexOf(currentPlan)
              })
              .map((plan) => (
                <div
                  key={plan}
                  className="rounded-lg border border-purple-200 bg-white p-4 space-y-2"
                >
                  <p className="font-semibold text-gray-900">{PLAN_LABELS[plan]}</p>
                  <ul className="space-y-1">
                    {PLANS[plan]?.map((module) => (
                      <li key={module} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                        {module.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                    disabled
                  >
                    Próximamente
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
          </div>

          <p className="text-xs text-purple-500">
            Los pagos en línea estarán disponibles próximamente. Contactá a soporte para cambiar de
            plan.
          </p>
        </div>
      )}

      {/* Payment info placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Información de pago</h3>
        <p className="text-sm text-gray-500">
          La integración con Stripe estará disponible próximamente. Actualmente el plan se asigna
          manualmente por el equipo de NutriApp.
        </p>
        <Button variant="outline" className="mt-4" disabled>
          Gestionar facturación
        </Button>
      </div>
    </div>
  )
}
