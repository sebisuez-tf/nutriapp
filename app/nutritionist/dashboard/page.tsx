import { requireRole } from '@/lib/actions/auth'
import {
  getPatientCount,
  getUpcomingAppointments,
  getRecentMeasurements,
  getPatientsWithExpiringAccess,
} from '@/lib/db/queries/nutritionist'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  UserPlus,
  Activity,
  FileText,
} from 'lucide-react'

export default async function NutritionistDashboardPage() {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return <div>Perfil de nutricionista no encontrado</div>
  }

  const [patientCount, upcomingAppointments, recentMeasurements, expiringPatients] =
    await Promise.all([
      getPatientCount(nutritionistId),
      getUpcomingAppointments(nutritionistId, 7),
      getRecentMeasurements(nutritionistId, 5),
      getPatientsWithExpiringAccess(nutritionistId, 7),
    ])

  const todayAppointments = upcomingAppointments.filter((a) => {
    const apptDate = new Date(a.scheduled_at).toDateString()
    return apptDate === new Date().toDateString()
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${current.profile.full_name.split(' ')[0]}`}
        description="Resumen de tu práctica"
        action={
          <div className="flex gap-2">
            <Link href="/nutritionist/patients/new">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <UserPlus className="mr-1.5 h-4 w-4" />
                Nuevo paciente
              </Button>
            </Link>
          </div>
        }
      />

      {/* Expiring Access Alert */}
      {expiringPatients.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">
              {expiringPatients.length} paciente{expiringPatients.length > 1 ? 's' : ''} con acceso
              por vencer en 7 días
            </p>
            <p className="mt-1 text-sm text-yellow-700">
              {expiringPatients
                .map((p) => `${p.first_name} ${p.last_name}`)
                .join(', ')}
            </p>
          </div>
          <Link href="/nutritionist/patients?filter=expiring">
            <Button variant="ghost" size="sm" className="text-yellow-700">
              Ver
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pacientes activos</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{patientCount.active}</p>
              <p className="text-xs text-gray-400">{patientCount.total} total</p>
            </div>
            <div className="rounded-full bg-green-50 p-3">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Turnos hoy</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {todayAppointments.length}
              </p>
              <p className="text-xs text-gray-400">{upcomingAppointments.length} próximos 7 días</p>
            </div>
            <div className="rounded-full bg-blue-50 p-3">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Vencimientos próximos</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {expiringPatients.length}
              </p>
              <p className="text-xs text-gray-400">Próximos 7 días</p>
            </div>
            <div className="rounded-full bg-yellow-50 p-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Próximos Turnos</h2>
            <Link href="/nutritionist/appointments">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </div>
          {upcomingAppointments.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title="Sin turnos próximos"
              action={{
                label: 'Agendar turno',
                href: '/nutritionist/appointments',
              }}
            />
          ) : (
            <div className="space-y-2">
              {upcomingAppointments.slice(0, 5).map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {appt.patient_first_name} {appt.patient_last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(appt.scheduled_at)} · {appt.duration_minutes} min
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      appt.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {appt.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Measurements */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Mediciones Recientes</h2>
            <Link href="/nutritionist/patients">
              <Button variant="ghost" size="sm">
                Ver pacientes
              </Button>
            </Link>
          </div>
          {recentMeasurements.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="Sin mediciones registradas"
              description="Las mediciones de tus pacientes aparecerán aquí"
            />
          ) : (
            <div className="space-y-2">
              {recentMeasurements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {m.patient_first_name} {m.patient_last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(m.measured_at)}
                      {m.weight_kg ? ` · ${parseFloat(m.weight_kg).toFixed(1)} kg` : ''}
                      {m.bmi ? ` · IMC ${parseFloat(m.bmi).toFixed(1)}` : ''}
                    </p>
                  </div>
                  <Link href={`/nutritionist/patients/${m.patient_id}`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Ver
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/nutritionist/patients/new">
            <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
              <UserPlus className="h-5 w-5 text-green-600" />
              <span className="text-xs">Nuevo paciente</span>
            </Button>
          </Link>
          <Link href="/nutritionist/appointments">
            <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-xs">Agendar turno</span>
            </Button>
          </Link>
          <Link href="/nutritionist/plans">
            <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-xs">Nuevo plan</span>
            </Button>
          </Link>
          <Link href="/nutritionist/patients">
            <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
              <Activity className="h-5 w-5 text-orange-600" />
              <span className="text-xs">Medición</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
