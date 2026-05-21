import { PageHeader } from '@/components/shared/PageHeader'
import { PatientForm } from '@/components/nutritionist/PatientForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/nutritionist/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <PageHeader title="Nuevo Paciente" description="Completá los datos del paciente" />
      </div>
      <PatientForm mode="create" />
    </div>
  )
}
