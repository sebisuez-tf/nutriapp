import { requireRole } from '@/lib/actions/auth'
import { getPatientByProfileId, getActiveMealPlan, getAppointmentsByPatientId } from '@/lib/db/queries/patient'
import { redirect } from 'next/navigation'
import { formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UtensilsCrossed, Calendar, TrendingUp } from 'lucide-react'

export default async function PatientDashboardPage() {
  const current = await requireRole('patient')

  const patient = await getPatientByProfileId(current.profile.id)
  if (!patient) redirect('/login')

  const [activePlanData, appointments] = await Promise.all([
    getActiveMealPlan(patient.id),
    getAppointmentsByPatientId(patient.id),
  ])

  const nextAppointment = appointments.find(
    (a) =>
      (a.status === 'scheduled' || a.status === 'confirmed') &&
      new Date(a.scheduled_at) > new Date()
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {patient.first_name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Aquí podés ver tu plan y seguir tu progreso
        </p>
      </div>

      {/* Active Plan Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <UtensilsCrossed className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Plan alimentario activo</p>
              <p className="font-semibold text-gray-900">
                {activePlanData?.plan.title ?? 'Sin plan activo'}
              </p>
            </div>
          </div>
          {activePlanData && (
            <Link href="/patient/plan">
              <Button size="sm" className="text-xs" variant="outline">
                Ver plan
              </Button>
            </Link>
          )}
        </div>

        {activePlanData && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Calorías objetivo</p>
              <p className="font-semibold">
                {activePlanData.plan.total_calories
                  ? `${activePlanData.plan.total_calories} kcal`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Desde</p>
              <p className="font-semibold">
                {activePlanData.plan.valid_from
                  ? formatDate(activePlanData.plan.valid_from)
                  : '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Next Appointment */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Próximo turno</p>
            {nextAppointment ? (
              <div>
                <p className="font-semibold text-gray-900">
                  {formatDateTime(nextAppointment.scheduled_at)}
                </p>
                <p className="text-xs text-gray-500">
                  Duración: {nextAppointment.duration_minutes} min
                </p>
              </div>
            ) : (
              <p className="font-medium text-gray-500">Sin turnos agendados</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/patient/plan">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm hover:border-green-300 hover:shadow-md transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <UtensilsCrossed className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Mi Plan</span>
          </div>
        </Link>

        <Link href="/patient/reports">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Evolución</span>
          </div>
        </Link>

        <Link href="/patient/reports">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Historial</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
