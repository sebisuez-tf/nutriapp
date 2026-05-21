import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Copy, Archive, Eye, FileText } from 'lucide-react'
import { duplicatePlanAction } from '@/lib/actions/plans'
import { formatDate } from '@/lib/utils'

interface PlanCardProps {
  plan: {
    id: string
    title: string
    status: string
    is_template: boolean
    template_name: string | null
    total_calories: number | null
    total_protein_g: string | null
    total_carbs_g: string | null
    total_fat_g: string | null
    valid_from: string | null
    valid_until: string | null
    updated_at: Date
    patient_id: string | null
  }
  patientName?: string | null
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-green-100 text-green-700' },
  draft: { label: 'Borrador', className: 'bg-gray-100 text-gray-700' },
  inactive: { label: 'Inactivo', className: 'bg-yellow-100 text-yellow-700' },
  archived: { label: 'Archivado', className: 'bg-red-100 text-red-700' },
}

export function PlanCard({ plan, patientName }: PlanCardProps) {
  const statusConfig = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.draft

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-gray-900">{plan.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {plan.is_template
              ? `Plantilla: ${plan.template_name ?? plan.title}`
              : patientName
              ? `Paciente: ${patientName}`
              : 'Sin asignar'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Badge className={`${statusConfig.className} hover:${statusConfig.className}`}>
            {statusConfig.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/nutritionist/plans/${plan.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver / Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <form>
                  <button
                    type="submit"
                    formAction={async () => {
                      'use server'
                      await duplicatePlanAction(plan.id)
                    }}
                    className="flex w-full items-center"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Macros */}
      {plan.total_calories && (
        <div className="mb-3 grid grid-cols-4 gap-1 rounded-lg bg-gray-50 p-2 text-center">
          <div>
            <p className="text-sm font-bold text-gray-900">{plan.total_calories}</p>
            <p className="text-xs text-gray-500">kcal</p>
          </div>
          <div>
            <p className="text-sm font-bold text-blue-700">
              {plan.total_protein_g ? `${parseFloat(plan.total_protein_g).toFixed(0)}g` : '—'}
            </p>
            <p className="text-xs text-gray-500">Prot</p>
          </div>
          <div>
            <p className="text-sm font-bold text-yellow-700">
              {plan.total_carbs_g ? `${parseFloat(plan.total_carbs_g).toFixed(0)}g` : '—'}
            </p>
            <p className="text-xs text-gray-500">HC</p>
          </div>
          <div>
            <p className="text-sm font-bold text-orange-700">
              {plan.total_fat_g ? `${parseFloat(plan.total_fat_g).toFixed(0)}g` : '—'}
            </p>
            <p className="text-xs text-gray-500">Grasas</p>
          </div>
        </div>
      )}

      {/* Validity */}
      {(plan.valid_from ?? plan.valid_until) && (
        <p className="mb-3 text-xs text-gray-500">
          {plan.valid_from ? formatDate(plan.valid_from) : ''}
          {plan.valid_until ? ` → ${formatDate(plan.valid_until)}` : ''}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex justify-between items-center text-xs text-gray-400">
        <span>Actualizado {formatDate(plan.updated_at)}</span>
        {plan.is_template && <FileText className="h-3.5 w-3.5" />}
      </div>

      <Link href={`/nutritionist/plans/${plan.id}`} className="mt-3">
        <Button variant="outline" size="sm" className="w-full">
          Editar plan
        </Button>
      </Link>
    </div>
  )
}
