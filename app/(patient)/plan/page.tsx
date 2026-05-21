import { requireRole } from '@/lib/actions/auth'
import { getPatientByProfileId, getActiveMealPlan } from '@/lib/db/queries/patient'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { UtensilsCrossed, Clock } from 'lucide-react'

export default async function PatientPlanPage() {
  const current = await requireRole('patient')

  const patient = await getPatientByProfileId(current.profile.id)
  if (!patient) redirect('/login')

  const planData = await getActiveMealPlan(patient.id)

  if (!planData) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon={<UtensilsCrossed className="h-7 w-7" />}
          title="Sin plan alimentario activo"
          description="Tu nutricionista aún no te ha asignado un plan. Contactale para consultarle."
        />
      </div>
    )
  }

  const { plan, slots, itemsBySlot } = planData

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Plan Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-start justify-between">
          <h1 className="text-xl font-bold text-gray-900">{plan.title}</h1>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activo</Badge>
        </div>

        {plan.description && (
          <p className="mb-3 text-sm text-gray-600">{plan.description}</p>
        )}

        {/* Validity */}
        {(plan.valid_from ?? plan.valid_until) && (
          <p className="text-xs text-gray-500">
            Vigencia: {plan.valid_from ? formatDate(plan.valid_from) : '?'}
            {plan.valid_until ? ` al ${formatDate(plan.valid_until)}` : ''}
          </p>
        )}

        {/* Macro overview */}
        {plan.total_calories && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-green-50 p-3 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-lg font-bold text-green-700">{plan.total_calories}</p>
              <p className="text-xs text-green-600">kcal</p>
            </div>
            {plan.total_protein_g && (
              <div className="text-center">
                <p className="text-lg font-bold text-blue-700">
                  {parseFloat(plan.total_protein_g).toFixed(0)}g
                </p>
                <p className="text-xs text-blue-600">Proteína</p>
              </div>
            )}
            {plan.total_carbs_g && (
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-700">
                  {parseFloat(plan.total_carbs_g).toFixed(0)}g
                </p>
                <p className="text-xs text-yellow-600">Carbohidratos</p>
              </div>
            )}
            {plan.total_fat_g && (
              <div className="text-center">
                <p className="text-lg font-bold text-orange-700">
                  {parseFloat(plan.total_fat_g).toFixed(0)}g
                </p>
                <p className="text-xs text-orange-600">Grasas</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meal Slots */}
      {slots.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-7 w-7" />}
          title="Plan sin comidas"
          description="Tu nutricionista aún no agregó comidas al plan"
        />
      ) : (
        <div className="space-y-4">
          {slots.map((slot) => {
            const items = itemsBySlot[slot.id] ?? []
            return (
              <div
                key={slot.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">{slot.name}</h3>
                  {slot.time_of_day && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{slot.time_of_day.slice(0, 5)}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {items.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">Sin alimentos</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {item.food_name}
                              </p>
                              {item.is_optional && (
                                <Badge variant="secondary" className="text-xs py-0">
                                  Opcional
                                </Badge>
                              )}
                            </div>
                            {item.notes && (
                              <p className="mt-0.5 text-xs text-gray-500">{item.notes}</p>
                            )}
                            {item.alternatives && (
                              <p className="mt-0.5 text-xs text-green-600">
                                Alt: {item.alternatives}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            {item.quantity && (
                              <p className="text-sm font-semibold text-gray-700">
                                {item.quantity}
                                {item.unit ? ` ${item.unit}` : ''}
                              </p>
                            )}
                            {item.calories && (
                              <p className="text-xs text-gray-400">
                                {parseFloat(item.calories).toFixed(0)} kcal
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {slot.notes && (
                  <div className="border-t border-gray-100 bg-yellow-50 px-4 py-2">
                    <p className="text-xs text-yellow-700">Nota: {slot.notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
