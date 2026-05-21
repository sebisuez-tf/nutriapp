import { getAdminDashboardStats } from '@/lib/actions/admin'
import { PageHeader } from '@/components/shared/PageHeader'
import { PatientGrowthChart } from '@/components/charts/PatientGrowthChart'
import { formatDate } from '@/lib/utils'
import { Users, UserPlus, Activity, TrendingUp } from 'lucide-react'
import { PLANS } from '@/lib/constants/plans'

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats()

  const planChartData = stats.plan_distribution.map((p) => ({
    month: PLANS[p.plan_type as keyof typeof PLANS]?.name ?? p.plan_type,
    count: p.count,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Admin"
        description="Vista general de la plataforma NutriApp"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Nutricionistas</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total_nutritionists}</p>
              <p className="text-xs text-gray-400">{stats.active_nutritionists} activos</p>
            </div>
            <div className="rounded-full bg-green-50 p-3">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Pacientes</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total_patients}</p>
            </div>
            <div className="rounded-full bg-blue-50 p-3">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Nuevos este mes</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stats.new_nutritionists_this_month}
              </p>
            </div>
            <div className="rounded-full bg-purple-50 p-3">
              <UserPlus className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Plan más popular</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {stats.plan_distribution.sort((a, b) => b.count - a.count)[0]?.plan_type
                  ? PLANS[
                      stats.plan_distribution.sort((a, b) => b.count - a.count)[0]
                        .plan_type as keyof typeof PLANS
                    ]?.name ?? '—'
                  : '—'}
              </p>
            </div>
            <div className="rounded-full bg-orange-50 p-3">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plan Distribution */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Distribución por Plan</h2>
          <PatientGrowthChart data={planChartData} />
        </div>

        {/* Recent Nutritionists */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Nutricionistas Recientes</h2>
          {stats.recent_nutritionists.length === 0 ? (
            <p className="text-sm text-gray-400">Sin registros</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_nutritionists.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.full_name}</p>
                    <p className="text-xs text-gray-500">{n.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {PLANS[n.plan_type as keyof typeof PLANS]?.name ?? n.plan_type}
                    </span>
                    <p className="mt-1 text-xs text-gray-400">{formatDate(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Actividad Reciente</h2>
        {stats.recent_logs.length === 0 ? (
          <p className="text-sm text-gray-400">Sin actividad reciente</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs font-medium text-gray-500">Usuario</th>
                  <th className="pb-2 text-left text-xs font-medium text-gray-500">Acción</th>
                  <th className="pb-2 text-left text-xs font-medium text-gray-500">Entidad</th>
                  <th className="pb-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700">{log.actor_full_name ?? '—'}</td>
                    <td className="py-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">{log.entity_type}</td>
                    <td className="py-2 text-gray-400 text-xs">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
