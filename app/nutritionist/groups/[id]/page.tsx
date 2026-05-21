import { requireRole } from '@/lib/actions/auth'
import { getGroupById, getGroupMembers, getGroupAggregateMetrics } from '@/lib/db/queries/groups'
import { getPatientsByNutritionistId } from '@/lib/db/queries/nutritionist'
import { addPatientToGroupAction, removePatientFromGroupAction, inviteCoordinatorAction } from '@/lib/actions/groups'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, UserMinus, UserPlus, Mail, Users, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface GroupDetailPageProps {
  params: Promise<{ id: string }>
}

const TYPE_LABELS: Record<string, string> = {
  club: 'Club',
  team: 'Equipo',
  institution: 'Institución',
  category: 'Categoría',
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = await params
  const { nutritionist } = await requireRole(['nutritionist', 'super_admin'])
  if (!nutritionist) return null

  const [groupData, metrics, members, patientsData] = await Promise.all([
    getGroupById(id),
    getGroupAggregateMetrics(id),
    getGroupMembers(id),
    getPatientsByNutritionistId(nutritionist.id),
  ])

  if (!groupData || groupData.group.nutritionist_id !== nutritionist.id) {
    notFound()
  }

  const { group } = groupData
  const memberPatientIds = new Set(members.map((m) => m.patient_id))

  // Patients not yet in group
  const availablePatients = patientsData.filter((p) => !memberPatientIds.has(p.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/nutritionist/groups">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Grupos
          </Button>
        </Link>
        <PageHeader
          title={group.name}
          description={`${TYPE_LABELS[group.type] ?? group.type} · ${members.length} miembro${members.length !== 1 ? 's' : ''}`}
        />
      </div>

      {/* Aggregate metrics */}
      {metrics.member_count > 0 && (
        <div className="grid grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {metrics.avg_weight ? `${Number(metrics.avg_weight).toFixed(1)} kg` : '—'}
            </p>
            <p className="text-xs text-gray-500">Peso promedio</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {metrics.avg_body_fat ? `${Number(metrics.avg_body_fat).toFixed(1)}%` : '—'}
            </p>
            <p className="text-xs text-gray-500">% grasa prom.</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {metrics.avg_muscle_mass ? `${Number(metrics.avg_muscle_mass).toFixed(1)} kg` : '—'}
            </p>
            <p className="text-xs text-gray-500">Músculo prom.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Members list */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Miembros</h2>

          {members.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">Sin miembros aún.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                    {(member.first_name ?? '?')[0]}{(member.last_name ?? '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Desde {formatDate(member.joined_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {member.latest_weight && (
                      <span>{parseFloat(member.latest_weight).toFixed(1)} kg</span>
                    )}
                    {member.is_active ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">Activo</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 text-xs">Inactivo</Badge>
                    )}
                  </div>
                  <form>
                    <button
                      type="submit"
                      formAction={async () => {
                        'use server'
                        await removePatientFromGroupAction(id, member.patient_id)
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Quitar del grupo"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Add patient + Invite coordinator */}
        <div className="space-y-4">
          {/* Add patient */}
          {availablePatients.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Agregar paciente
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {availablePatients.map((p) => (
                  <form key={p.id}>
                    <button
                      type="submit"
                      formAction={async () => {
                        'use server'
                        await addPatientToGroupAction(id, p.id)
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-700">
                        {p.first_name} {p.last_name}
                      </span>
                      <Plus className="h-3.5 w-3.5 text-green-600" />
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}

          {/* Invite coordinator */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invitar coordinador
            </h3>
            <p className="text-xs text-gray-500">
              El coordinador podrá ver los datos del grupo sin acceso a información clínica individual.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                name="email"
                required
                placeholder="coordinador@email.com"
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                formAction={async (fd: FormData) => {
                  'use server'
                  const email = fd.get('email') as string
                  await inviteCoordinatorAction(id, email)
                }}
                className="w-full rounded-md bg-green-600 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                Invitar
              </button>
            </form>
          </div>

          {group.description && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Descripción</h3>
              <p className="text-sm text-gray-600">{group.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

