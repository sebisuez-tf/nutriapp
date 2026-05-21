import { getAllNutritionists } from '@/lib/db/queries/admin'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/constants/plans'
import { formatDate } from '@/lib/utils'
import { Users, UserPlus } from 'lucide-react'

export default async function AdminNutritionistsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; plan?: string }>
}) {
  const params = await searchParams
  const search = params.search?.toLowerCase() ?? ''
  const planFilter = params.plan ?? ''

  const allNutritionists = await getAllNutritionists()

  const filtered = allNutritionists.filter((n) => {
    const matchesSearch =
      !search ||
      (n.full_name ?? '').toLowerCase().includes(search) ||
      (n.email ?? '').toLowerCase().includes(search) ||
      (n.business_name ?? '').toLowerCase().includes(search)

    const matchesPlan = !planFilter || n.plan_type === planFilter

    return matchesSearch && matchesPlan
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutricionistas"
        description={`${allNutritionists.length} registrados en total`}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form className="flex flex-1 items-center gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por nombre, email..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            name="plan"
            defaultValue={planFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los planes</option>
            {Object.entries(PLANS).map(([key, plan]) => (
              <option key={key} value={key}>
                {plan.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            Filtrar
          </Button>
        </form>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Sin nutricionistas"
          description="No se encontraron nutricionistas con los filtros seleccionados"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nombre / Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Negocio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pacientes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Registro
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{n.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{n.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{n.business_name || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {PLANS[n.plan_type as keyof typeof PLANS]?.name ?? n.plan_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {n.patient_count} / {n.max_patients}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        n.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {n.is_active ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDate(n.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/nutritionists/${n.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
