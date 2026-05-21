import { requireRole } from '@/lib/actions/auth'
import { getPatientById } from '@/lib/db/queries/patient'
import { ChatWindow } from '@/components/shared/ChatWindow'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export default async function PatientChatPage({ params }: ChatPageProps) {
  const { id } = await params
  const { nutritionist, profile } = await requireRole(['nutritionist', 'super_admin'])
  if (!nutritionist) return null

  const patient = await getPatientById(id)
  if (!patient || patient.nutritionist_id !== nutritionist.id) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/nutritionist/patients/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a ficha
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">
          Chat con {patient.first_name} {patient.last_name}
        </h1>
      </div>

      <ChatWindow
        nutritionistId={nutritionist.id}
        patientId={id}
        currentUserId={profile.id}
        patientName={`${patient.first_name} ${patient.last_name}`}
      />
    </div>
  )
}
