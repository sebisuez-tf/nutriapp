import { requireRole } from '@/lib/actions/auth'
import { getPatientByProfileId, getMeasurementsByPatientId } from '@/lib/db/queries/patient'
import { redirect } from 'next/navigation'
import { WeightChart } from '@/components/charts/WeightChart'
import { BodyFatChart } from '@/components/charts/BodyFatChart'
import { CompositionComparisonTable } from '@/components/charts/CompositionComparisonTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { TrendingUp } from 'lucide-react'

export default async function PatientReportsPage() {
  const current = await requireRole('patient')

  const patient = await getPatientByProfileId(current.profile.id)
  if (!patient) redirect('/login')

  const measurements = await getMeasurementsByPatientId(patient.id)

  if (measurements.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon={<TrendingUp className="h-7 w-7" />}
          title="Sin mediciones registradas"
          description="Tu nutricionista aún no ha registrado mediciones. Consultale en tu próxima visita."
        />
      </div>
    )
  }

  const chartData = measurements.map((m) => ({
    date: m.measured_at,
    weight_kg: m.weight_kg ? parseFloat(m.weight_kg) : null,
    body_fat_percentage: m.body_fat_percentage ? parseFloat(m.body_fat_percentage) : null,
    muscle_mass_kg: m.muscle_mass_kg ? parseFloat(m.muscle_mass_kg) : null,
  }))

  const first = measurements[0]
  const latest = measurements[measurements.length - 1]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Evolución</h1>
        <p className="mt-1 text-sm text-gray-500">
          {measurements.length} medición{measurements.length !== 1 ? 'es' : ''} registrada{measurements.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Comparison table */}
      {measurements.length > 1 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Primera vs Última Medición</h2>
          <CompositionComparisonTable
            first={{
              measured_at: first.measured_at,
              weight_kg: first.weight_kg ? parseFloat(first.weight_kg) : null,
              bmi: first.bmi ? parseFloat(first.bmi) : null,
              body_fat_percentage: first.body_fat_percentage
                ? parseFloat(first.body_fat_percentage)
                : null,
              muscle_mass_kg: first.muscle_mass_kg ? parseFloat(first.muscle_mass_kg) : null,
              waist_circumference: first.waist_circumference
                ? parseFloat(first.waist_circumference)
                : null,
            }}
            latest={{
              measured_at: latest.measured_at,
              weight_kg: latest.weight_kg ? parseFloat(latest.weight_kg) : null,
              bmi: latest.bmi ? parseFloat(latest.bmi) : null,
              body_fat_percentage: latest.body_fat_percentage
                ? parseFloat(latest.body_fat_percentage)
                : null,
              muscle_mass_kg: latest.muscle_mass_kg ? parseFloat(latest.muscle_mass_kg) : null,
              waist_circumference: latest.waist_circumference
                ? parseFloat(latest.waist_circumference)
                : null,
            }}
          />
        </div>
      )}

      {/* Weight Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Evolución del Peso</h2>
        <WeightChart data={chartData} />
      </div>

      {/* Body Fat Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Evolución de Grasa Corporal</h2>
        <BodyFatChart data={chartData} />
      </div>
    </div>
  )
}
