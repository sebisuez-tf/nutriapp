import { PageHeader } from '@/components/shared/PageHeader'
import { AppointmentCalendar } from '@/components/nutritionist/AppointmentCalendar'
import { AppointmentForm } from '@/components/nutritionist/AppointmentForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/actions/auth'
import { getAllAppointmentsByNutritionistId } from '@/lib/db/queries/nutritionist'
import { getPatientsByNutritionistId } from '@/lib/db/queries/nutritionist'
import { Plus } from 'lucide-react'

export default async function AppointmentsPage() {
  const { nutritionist } = await requireRole(['nutritionist', 'super_admin'])
  if (!nutritionist) return null

  const [rawAppointments, patientsData] = await Promise.all([
    getAllAppointmentsByNutritionistId(nutritionist.id),
    getPatientsByNutritionistId(nutritionist.id),
  ])

  const appointments = rawAppointments.map((a) => ({
    id: a.id,
    scheduled_at: a.scheduled_at,
    duration_minutes: a.duration_minutes,
    type: a.type,
    status: a.status,
    notes: a.notes,
    patient_name: `${a.patient_first_name ?? ''} ${a.patient_last_name ?? ''}`.trim(),
    patient_id: a.patient_id,
  }))

  const patients = patientsData.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Turnos"
        description="Gestioná los turnos de tus pacientes"
        action={
          <Dialog>
            <DialogTrigger render={<Button className="bg-green-600 hover:bg-green-700 text-white" />}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo turno
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Agendar nuevo turno</DialogTitle>
              </DialogHeader>
              <AppointmentForm patients={patients} />
            </DialogContent>
          </Dialog>
        }
      />

      <AppointmentCalendar appointments={appointments} />
    </div>
  )
}
