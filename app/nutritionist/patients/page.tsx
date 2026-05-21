import { requireRole } from '@/lib/actions/auth'
import { getPatientsByNutritionistId, getPatientCount } from '@/lib/db/queries/nutritionist'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PatientCard } from '@/components/nutritionist/PatientCard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserPlus, Users } from 'lucide-react'

export default async function NutritionistPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; filter?: string }>
}) {
  const current = await requireRole(['nutritionist', 'super_admin'])
  const nutritionistId = current.nutritionist?.id

  if (!nutritionistId) {
    return <div>Perfil de nutricionista no encontrado</div>
  }

  const params = await searchParams
  const search = params.search ?? ''
  const filter = params.filter ?? 'all'

  const isActiveFilter =
    filter === 'active' ? true : filter === 'inactive' ? false : undefined

  const [patients, counts] = await Promise.all([
    getPatientsByNutritionistId(nutritionistId, {
      isActive: isActiveFilter,
      searchTerm: search || undefined,
    }),
    getPatientCount(nutritionistId),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pacientes"
        description={`${counts.active} activos · ${counts.inactive} inactivos`}
        action={
          <Link href="/nutritionist/patients/new">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Nuevo paciente
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form className="flex flex-1 gap-2" method="GET">
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por nombre o email..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex gap-1">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Activos' },
              { value: 'inactive', label: 'Inactivos' },
              { value: 'expiring', label: 'Por vencer' },
            ].map((f) => (
              <Link
                key={f.value}
                href={`/nutritionist/patients?filter=${f.value}${search ? `&search=${search}` : ''}`}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </form>
      </div>

      {patients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Sin pacientes"
          description={
            search
              ? `No se encontraron pacientes para "${search}"`
              : 'Agregá tu primer paciente para comenzar'
          }
          action={{
            label: 'Agregar paciente',
            href: '/nutritionist/patients/new',
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={{
                ...patient,
                date_of_birth: patient.date_of_birth ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
