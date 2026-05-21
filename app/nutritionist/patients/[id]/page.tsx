import { requireRole } from '@/lib/actions/auth'
import {
  getPatientById,
  getPatientWithClinicalRecord,
  getMeasurementsByPatientId,
  getMealPlansByPatientId,
  getAppointmentsByPatientId,
  getDocumentsByPatientId,
} from '@/lib/db/queries/patient'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClinicalRecordForm } from '@/components/nutritionist/ClinicalRecordForm'
import { MeasurementForm } from '@/components/nutritionist/MeasurementForm'
import { WeightChart } from '@/components/charts/WeightChart'
import { BodyFatChart } from '@/components/charts/BodyFatChart'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, UserCheck, UserX, RotateCcw } from 'lucide-react'
import { formatDate, formatDateTime, isAccessExpired, isAccessExpiringSoon } from '@/lib/utils'
import {
  togglePatientAccessAction,
  renewPatientAccessAction,
} from '@/lib/actions/patients'
import { PatientDocumentsTab } from '@/components/nutritionist/PatientDocumentsTab'
import { Activity, Calendar, List } from 'lucide-react'

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(['nutritionist', 'super_admin'])

  const [patientData, measurements, mealPlans, appointments, documents] = await Promise.all([
    getPatientWithClinicalRecord(id),
    getMeasurementsByPatientId(id),
    getMealPlansByPatientId(id),
    getAppointmentsByPatientId(id),
    getDocumentsByPatientId(id),
  ])

  if (!patientData) notFound()

  const { patient, clinicalRecord } = patientData

  const accessExpired = isAccessExpired(patient.access_expires_at)
  const accessExpiringSoon = isAccessExpiringSoon(patient.access_expires_at)

  const measurementChartData = measurements.map((m) => ({
    date: m.measured_at,
    weight_kg: m.weight_kg ? parseFloat(m.weight_kg) : null,
    body_fat_percentage: m.body_fat_percentage ? parseFloat(m.body_fat_percentage) : null,
    muscle_mass_kg: m.muscle_mass_kg ? parseFloat(m.muscle_mass_kg) : null,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/nutritionist/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <PageHeader
          title={`${patient.first_name} ${patient.last_name}`}
          description={patient.email ?? patient.phone ?? ''}
          action={
            <div className="flex gap-2">
              {patient.is_active ? (
                <Badge className="bg-green-100 text-green-700">Activo</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700">Inactivo</Badge>
              )}
              {accessExpired && (
                <Badge className="bg-red-100 text-red-700">Acceso vencido</Badge>
              )}
              {!accessExpired && accessExpiringSoon && (
                <Badge className="bg-yellow-100 text-yellow-700">Vence pronto</Badge>
              )}
            </div>
          }
        />
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="clinical">Historia</TabsTrigger>
          <TabsTrigger value="measurements">Mediciones</TabsTrigger>
          <TabsTrigger value="plans">Planes</TabsTrigger>
          <TabsTrigger value="appointments">Turnos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Access Control */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Control de Acceso</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Estado</span>
                  <span className={`font-medium ${patient.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {patient.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vencimiento</span>
                  <span className={`font-medium ${accessExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    {patient.access_expires_at
                      ? formatDate(patient.access_expires_at)
                      : 'Sin límite'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <form>
                  <Button
                    size="sm"
                    variant={patient.is_active ? 'destructive' : 'default'}
                    formAction={async () => {
                      'use server'
                      await togglePatientAccessAction(id, !patient.is_active)
                    }}
                  >
                    {patient.is_active ? (
                      <>
                        <UserX className="mr-1 h-3.5 w-3.5" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-1 h-3.5 w-3.5" />
                        Activar
                      </>
                    )}
                  </Button>
                </form>

                <form>
                  <Button
                    size="sm"
                    variant="outline"
                    formAction={async () => {
                      'use server'
                      await renewPatientAccessAction(id, 30)
                    }}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Renovar 30 días
                  </Button>
                </form>
              </div>
            </div>

            {/* Basic Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Datos Básicos</h3>
              <div className="space-y-2 text-sm">
                {patient.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nacimiento</span>
                    <span>{formatDate(patient.date_of_birth)}</span>
                  </div>
                )}
                {patient.sex && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sexo</span>
                    <span className="capitalize">
                      {patient.sex === 'male' ? 'Masculino' : patient.sex === 'female' ? 'Femenino' : 'Otro'}
                    </span>
                  </div>
                )}
                {patient.occupation && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ocupación</span>
                    <span>{patient.occupation}</span>
                  </div>
                )}
                {patient.city && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ciudad</span>
                    <span>{patient.city}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Registro</span>
                  <span>{formatDate(patient.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Last measurement */}
            {measurements.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">Última Medición</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha</span>
                    <span>{formatDate(measurements[measurements.length - 1].measured_at)}</span>
                  </div>
                  {measurements[measurements.length - 1].weight_kg && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Peso</span>
                      <span className="font-medium">
                        {parseFloat(measurements[measurements.length - 1].weight_kg!).toFixed(1)} kg
                      </span>
                    </div>
                  )}
                  {measurements[measurements.length - 1].bmi && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">IMC</span>
                      <span className="font-medium">
                        {parseFloat(measurements[measurements.length - 1].bmi!).toFixed(1)}
                      </span>
                    </div>
                  )}
                  {measurements[measurements.length - 1].body_fat_percentage && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Grasa corporal</span>
                      <span className="font-medium">
                        {parseFloat(measurements[measurements.length - 1].body_fat_percentage!).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Clinical Record Tab */}
        <TabsContent value="clinical" className="pt-4">
          <ClinicalRecordForm patientId={id} existingRecord={clinicalRecord} />
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measurements" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Nueva Medición</h3>
              <MeasurementForm patientId={id} />
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">Evolución del Peso</h3>
                <WeightChart data={measurementChartData} />
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">Grasa Corporal</h3>
                <BodyFatChart data={measurementChartData} />
              </div>
            </div>
          </div>

          {measurements.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Historial</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                      <th className="pb-2 text-right text-xs font-medium text-gray-500">Peso (kg)</th>
                      <th className="pb-2 text-right text-xs font-medium text-gray-500">IMC</th>
                      <th className="pb-2 text-right text-xs font-medium text-gray-500">Grasa (%)</th>
                      <th className="pb-2 text-right text-xs font-medium text-gray-500">Músculo (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...measurements].reverse().map((m) => (
                      <tr key={m.id} className="border-b border-gray-50">
                        <td className="py-2">{formatDate(m.measured_at)}</td>
                        <td className="py-2 text-right">{m.weight_kg ? parseFloat(m.weight_kg).toFixed(1) : '—'}</td>
                        <td className="py-2 text-right">{m.bmi ? parseFloat(m.bmi).toFixed(1) : '—'}</td>
                        <td className="py-2 text-right">{m.body_fat_percentage ? parseFloat(m.body_fat_percentage).toFixed(1) : '—'}</td>
                        <td className="py-2 text-right">{m.muscle_mass_kg ? parseFloat(m.muscle_mass_kg).toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="pt-4">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Planes del Paciente</h3>
            <Link href="/nutritionist/plans">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                Gestionar planes
              </Button>
            </Link>
          </div>
          {mealPlans.length === 0 ? (
            <EmptyState
              icon={<List className="h-6 w-6" />}
              title="Sin planes asignados"
              action={{ label: 'Crear plan', href: '/nutritionist/plans' }}
            />
          ) : (
            <div className="space-y-3">
              {mealPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">{plan.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        className={
                          plan.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : plan.status === 'draft'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {plan.status === 'active' ? 'Activo' : plan.status === 'draft' ? 'Borrador' : 'Inactivo'}
                      </Badge>
                      {plan.total_calories && (
                        <span className="text-xs text-gray-500">{plan.total_calories} kcal</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/nutritionist/plans/${plan.id}`}>
                    <Button variant="ghost" size="sm">Ver</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="pt-4">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Historial de Turnos</h3>
            <Link href="/nutritionist/appointments">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                Agendar turno
              </Button>
            </Link>
          </div>
          {appointments.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title="Sin turnos registrados"
            />
          ) : (
            <div className="space-y-2">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(appt.scheduled_at)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appt.duration_minutes} min ·{' '}
                      {appt.type === 'initial' ? 'Primera consulta' : appt.type === 'followup' ? 'Seguimiento' : appt.type}
                    </p>
                  </div>
                  <Badge
                    className={
                      appt.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : appt.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }
                  >
                    {appt.status === 'completed'
                      ? 'Completado'
                      : appt.status === 'cancelled'
                      ? 'Cancelado'
                      : appt.status === 'confirmed'
                      ? 'Confirmado'
                      : 'Agendado'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="pt-4">
          <PatientDocumentsTab
            patientId={id}
            patientEmail={patient.email}
            documents={documents.map((d) => ({
              id: d.id,
              title: d.title,
              type: d.type,
              file_url: d.file_url,
              generated_at: d.generated_at,
              is_sent_to_patient: d.is_sent_to_patient,
            }))}
            mealPlans={mealPlans.map((p) => ({
              id: p.id,
              title: p.title,
              status: p.status,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
