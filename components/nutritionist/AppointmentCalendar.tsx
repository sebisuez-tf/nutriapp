'use client'

import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'

interface Appointment {
  id: string
  scheduled_at: Date
  duration_minutes: number
  type: string
  status: string
  notes: string | null
  patient_name: string
  patient_id: string
}

interface AppointmentCalendarProps {
  appointments: Appointment[]
}

const TYPE_LABELS: Record<string, string> = {
  initial: 'Inicial',
  followup: 'Seguimiento',
  online: 'Online',
  remote: 'Remoto',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
  no_show: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

export function AppointmentCalendar({ appointments }: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start of calendar to Monday
  const startPad = (getDay(monthStart) + 6) % 7

  const selectedDayAppointments = selectedDay
    ? appointments
        .filter((a) => isSameDay(new Date(a.scheduled_at), selectedDay))
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    : []

  function getAppointmentsForDay(day: Date) {
    return appointments.filter((a) => isSameDay(new Date(a.scheduled_at), day))
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_300px]">
      {/* Calendar grid */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold capitalize text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-gray-500"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Start padding */}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="h-16 border-r border-b border-gray-50" />
          ))}

          {days.map((day) => {
            const dayAppts = getAppointmentsForDay(day)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const today = isToday(day)
            const inMonth = isSameMonth(day, currentMonth)

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`h-16 border-r border-b border-gray-50 p-1 text-left transition-colors hover:bg-gray-50 ${
                  isSelected ? 'bg-green-50' : ''
                } ${!inMonth ? 'opacity-40' : ''}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    today
                      ? 'bg-green-600 text-white'
                      : isSelected
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-700'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayAppts.length > 0 && (
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    {dayAppts.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="truncate rounded bg-green-100 px-1 text-xs text-green-700"
                      >
                        {format(new Date(a.scheduled_at), 'HH:mm')}
                      </div>
                    ))}
                    {dayAppts.length > 2 && (
                      <div className="text-xs text-gray-400">+{dayAppts.length - 2}</div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {selectedDay
            ? format(selectedDay, "d 'de' MMMM", { locale: es })
            : 'Seleccioná un día'}
        </h3>

        {selectedDayAppointments.length === 0 ? (
          <p className="text-sm text-gray-400">Sin turnos este día.</p>
        ) : (
          selectedDayAppointments.map((appt) => (
            <div
              key={appt.id}
              className={`rounded-lg border p-3 ${STATUS_COLORS[appt.status] ?? 'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="text-sm font-medium">{appt.patient_name}</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(appt.scheduled_at), 'HH:mm')}
                </span>
                <span>{appt.duration_minutes} min</span>
                <span>{TYPE_LABELS[appt.type] ?? appt.type}</span>
              </div>
              {appt.notes && (
                <p className="mt-1.5 text-xs opacity-80 truncate">{appt.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
