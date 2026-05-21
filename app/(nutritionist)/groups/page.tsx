import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GroupForm } from '@/components/nutritionist/GroupForm'
import { requireRole } from '@/lib/actions/auth'
import { getGroupsByNutritionistId } from '@/lib/db/queries/groups'
import { Users, Plus, ChevronRight } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  club: 'Club',
  team: 'Equipo',
  institution: 'Institución',
  category: 'Categoría',
}

export default async function GroupsPage() {
  const { nutritionist } = await requireRole(['nutritionist', 'super_admin'])
  if (!nutritionist) return null

  const groups = await getGroupsByNutritionistId(nutritionist.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grupos"
        description="Gestioná equipos, clubes e instituciones"
        action={
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo grupo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear grupo</DialogTitle>
              </DialogHeader>
              <GroupForm />
            </DialogContent>
          </Dialog>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin grupos"
          description="Creá grupos para gestionar equipos, clubes o instituciones de forma colectiva."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/nutritionist/groups/${group.id}`}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {TYPE_LABELS[group.type] ?? group.type}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              </div>

              {group.description && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{group.description}</p>
              )}

              <div className="mt-auto pt-3 flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100">
                <Users className="h-3.5 w-3.5" />
                <span>{group.member_count} miembro{group.member_count !== 1 ? 's' : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
