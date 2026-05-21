import Link from 'next/link'
import { getInitials, isAccessExpired, isAccessExpiringSoon, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'

interface PatientCardProps {
  patient: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    is_active: boolean
    access_expires_at: Date | null
    city: string | null
    date_of_birth: string | null
    created_at: Date
  }
  latestMeasurement?: {
    weight_kg: string | null
    measured_at: string
  } | null
  activePlanTitle?: string | null
}

function AccessBadge({
  isActive,
  expiresAt,
}: {
  isActive: boolean
  expiresAt: Date | null
}) {
  if (!isActive) {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Inactivo
      </Badge>
    )
  }

  if (isAccessExpired(expiresAt)) {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Acceso vencido
      </Badge>
    )
  }

  if (isAccessExpiringSoon(expiresAt)) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Vence pronto
      </Badge>
    )
  }

  return (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1">
      <CheckCircle className="h-3 w-3" />
      Activo
    </Badge>
  )
}

export function PatientCard({ patient, latestMeasurement, activePlanTitle }: PatientCardProps) {
  const fullName = `${patient.first_name} ${patient.last_name}`
  const initials = getInitials(fullName)

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{fullName}</p>
          {patient.email && (
            <p className="truncate text-xs text-gray-500">{patient.email}</p>
          )}
          {patient.city && (
            <p className="text-xs text-gray-400">{patient.city}</p>
          )}
        </div>
        <AccessBadge isActive={patient.is_active} expiresAt={patient.access_expires_at} />
      </div>

      {/* Stats */}
      <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2.5 text-xs">
        <div>
          <p className="text-gray-500">Plan activo</p>
          <p className="font-medium text-gray-700 truncate">
            {activePlanTitle ?? 'Sin plan'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Última medición</p>
          <p className="font-medium text-gray-700">
            {latestMeasurement
              ? formatDate(latestMeasurement.measured_at)
              : 'Sin mediciones'}
          </p>
        </div>
      </div>

      {/* Access expiry */}
      {patient.access_expires_at && (
        <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>
            Vence: {formatDate(patient.access_expires_at)}
          </span>
        </div>
      )}

      {/* Action */}
      <Link href={`/nutritionist/patients/${patient.id}`} className="mt-auto">
        <Button variant="outline" size="sm" className="w-full">
          Ver paciente
        </Button>
      </Link>
    </div>
  )
}
