import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { requireRole } from '@/lib/actions/auth'
import { getPatientsByNutritionistId } from '@/lib/db/queries/nutritionist'
import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function MessagesPage() {
  const { nutritionist, profile } = await requireRole(['nutritionist', 'super_admin'])
  if (!nutritionist) return null

  const patientsData = await getPatientsByNutritionistId(nutritionist.id)

  // For each patient that has messages, get the last message and unread count
  const patientIds = patientsData.map((p) => p.id)

  const messageSummaries = await Promise.all(
    patientIds.map(async (patientId) => {
      const lastMsg = await db
        .select()
        .from(messages)
        .where(eq(messages.patient_id, patientId))
        .orderBy(sql`${messages.created_at} DESC`)
        .limit(1)

      const unreadResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.patient_id, patientId),
            eq(messages.receiver_id, profile.id),
            eq(messages.is_read, false)
          )
        )

      return {
        patientId,
        lastMessage: lastMsg[0] ?? null,
        unreadCount: Number(unreadResult[0]?.count ?? 0),
      }
    })
  )

  // Filter patients that have at least one message
  const conversationsWithMessages = messageSummaries.filter((s) => s.lastMessage !== null)

  const patientMap = new Map(patientsData.map((p) => [p.id, p]))

  // Sort by last message date descending
  conversationsWithMessages.sort((a, b) => {
    const aDate = new Date(a.lastMessage!.created_at).getTime()
    const bDate = new Date(b.lastMessage!.created_at).getTime()
    return bDate - aDate
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mensajes"
        description="Conversaciones con tus pacientes en tiempo real"
      />

      {conversationsWithMessages.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-7 w-7" />}
          title="Sin conversaciones"
          description="Iniciá una conversación abriendo la ficha de un paciente."
        />
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {conversationsWithMessages.map(({ patientId, lastMessage, unreadCount }) => {
            const patient = patientMap.get(patientId)
            if (!patient || !lastMessage) return null
            return (
              <Link
                key={patientId}
                href={`/nutritionist/patients/${patientId}/chat`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                  {patient.first_name[0]}{patient.last_name[0]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 truncate">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {formatDate(lastMessage.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {lastMessage.sender_id === profile.id ? 'Vos: ' : ''}
                    {lastMessage.content}
                  </p>
                </div>

                {/* Unread badge */}
                {unreadCount > 0 && (
                  <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1.5 text-xs font-bold text-white">
                    {unreadCount}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
