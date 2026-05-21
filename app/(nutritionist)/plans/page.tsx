import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PlanCard } from '@/components/nutritionist/PlanCard'
import { requireRole } from '@/lib/actions/auth'
import { getMealPlansByNutritionistId } from '@/lib/db/queries/plans'
import { getPatientsByNutritionistId } from '@/lib/db/queries/nutritionist'
import { Plus, FileText } from 'lucide-react'

const FILTER_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'draft', label: 'Borradores' },
  { key: 'inactive', label: 'Inactivos' },
  { key: 'archived', label: 'Archivados' },
  { key: 'template', label: 'Plantillas' },
] as const

type FilterKey = (typeof FILTER_TABS)[number]['key']

interface PlansPageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const { filter } = await searchParams
  const activeFilter: FilterKey =
    FILTER_TABS.some((t) => t.key === filter) ? (filter as FilterKey) : 'all'

  const { nutritionist } = await requireRole(['nutritionist', 'super_admin'])
  if (!nutritionist) return null

  // Fetch plans — templates have their own filter logic client-side
  const statusFilter =
    activeFilter === 'all' || activeFilter === 'template' ? undefined : activeFilter

  const [plans, patients] = await Promise.all([
    getMealPlansByNutritionistId(nutritionist.id, statusFilter),
    getPatientsByNutritionistId(nutritionist.id),
  ])

  // Build patient name lookup
  const patientMap = new Map<string, string>()
  for (const p of patients) {
    patientMap.set(p.patient.id, `${p.patient.first_name} ${p.patient.last_name}`)
  }

  // Apply template filter after fetching
  const filtered =
    activeFilter === 'template' ? plans.filter((p) => p.is_template) : plans

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planes Alimentarios"
        description="Creá y gestioná los planes de tus pacientes"
        action={
          <Link href="/nutritionist/plans/new">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo plan
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key
          return (
            <Link
              key={tab.key}
              href={`/nutritionist/plans?filter=${tab.key}`}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Plans Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin planes"
          description={
            activeFilter === 'all'
              ? 'Todavía no creaste ningún plan. ¡Comenzá creando uno ahora!'
              : `No hay planes con el filtro "${FILTER_TABS.find((t) => t.key === activeFilter)?.label}".`
          }
          action={
            activeFilter === 'all'
              ? { label: 'Crear primer plan', href: '/nutritionist/plans/new' }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={{
                id: plan.id,
                title: plan.title,
                status: plan.status,
                is_template: plan.is_template,
                template_name: plan.template_name,
                total_calories: plan.total_calories,
                total_protein_g: plan.total_protein_g,
                total_carbs_g: plan.total_carbs_g,
                total_fat_g: plan.total_fat_g,
                valid_from: plan.valid_from,
                valid_until: plan.valid_until,
                updated_at: plan.updated_at,
                patient_id: plan.patient_id,
              }}
              patientName={plan.patient_id ? patientMap.get(plan.patient_id) : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
