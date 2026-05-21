'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/constants/plans'
import { createCheckoutSessionAction, getPortalSessionAction } from '@/lib/actions/billing'

const UPGRADE_PLANS = ['professional', 'premium', 'club'] as const
type UpgradePlan = (typeof UPGRADE_PLANS)[number]

const PLAN_HIGHLIGHT: Record<UpgradePlan, string> = {
  professional: 'border-blue-200 bg-blue-50/50',
  premium: 'border-purple-200 bg-purple-50/50',
  club: 'border-green-200 bg-green-50/50',
}

const PLAN_BUTTON: Record<UpgradePlan, string> = {
  professional: 'bg-blue-600 hover:bg-blue-700 text-white',
  premium: 'bg-purple-600 hover:bg-purple-700 text-white',
  club: 'bg-green-600 hover:bg-green-700 text-white',
}

interface Props {
  currentPlan: string
  hasStripeSubscription: boolean
}

export function BillingUpgradeSection({ currentPlan, hasStripeSubscription }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade(plan: UpgradePlan) {
    setLoading(plan)
    setError(null)
    const result = await createCheckoutSessionAction(plan)
    // If redirect succeeded this line is never reached
    if (!result.success) {
      setError(result.error)
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    setError(null)
    const result = await getPortalSessionAction()
    if (!result.success) {
      setError(result.error)
      setLoading(null)
    }
  }

  const plansToShow = UPGRADE_PLANS.filter((p) => p !== currentPlan)

  return (
    <div className="space-y-4">
      {hasStripeSubscription && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Gestionar suscripción</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Actualizá método de pago, descargá facturas o cancelá tu plan
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={loading === 'portal'}
              className="gap-2"
            >
              {loading === 'portal' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Portal de facturación
            </Button>
          </div>
        </div>
      )}

      {plansToShow.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            {currentPlan === 'basic' ? 'Mejorar plan' : 'Otros planes'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plansToShow.map((planKey) => {
              const plan = PLANS[planKey]
              return (
                <div
                  key={planKey}
                  className={`rounded-xl border p-5 space-y-4 ${PLAN_HIGHLIGHT[planKey]}`}
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{plan.name}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{plan.description}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      ${plan.price}
                      <span className="text-sm font-normal text-gray-500">/mes</span>
                    </p>
                  </div>

                  <ul className="space-y-1.5">
                    {plan.modules.slice(0, 6).map((mod) => (
                      <li key={mod} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <span className="capitalize">{mod.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                    {plan.modules.length > 6 && (
                      <li className="text-xs text-gray-400 pl-5.5">
                        +{plan.modules.length - 6} módulos más
                      </li>
                    )}
                  </ul>

                  <p className="text-xs text-gray-500">
                    Hasta <strong>{plan.maxPatients.toLocaleString()}</strong> pacientes
                  </p>

                  <Button
                    className={`w-full ${PLAN_BUTTON[planKey]}`}
                    onClick={() => handleUpgrade(planKey)}
                    disabled={loading === planKey}
                  >
                    {loading === planKey ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {currentPlan === 'basic' ? 'Contratar plan' : 'Cambiar a este plan'}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
