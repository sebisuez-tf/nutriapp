'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  generateAnthropometricPDFAction,
  generateMealPlanPDFAction,
  sendDocumentToPatientAction,
  getSignedDocumentUrlAction,
} from '@/lib/actions/documents'
import { toast } from 'sonner'
import { FileText, Download, Send, Loader2, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Document {
  id: string
  title: string
  type: string
  file_url: string
  generated_at: Date | string
  is_sent_to_patient: boolean
}

interface MealPlanOption {
  id: string
  title: string
  status: string
}

interface PatientDocumentsTabProps {
  patientId: string
  patientEmail: string | null
  documents: Document[]
  mealPlans: MealPlanOption[]
}

function DownloadButton({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    const result = await getSignedDocumentUrlAction(documentId)
    setLoading(false)

    if (result.success) {
      window.open(result.data, '_blank')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDownload} disabled={loading}>
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

function SendButton({
  documentId,
  isSent,
  hasEmail,
}: {
  documentId: string
  isSent: boolean
  hasEmail: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(isSent)

  async function handleSend() {
    if (!hasEmail) {
      toast.error('El paciente no tiene email registrado')
      return
    }
    setLoading(true)
    const result = await sendDocumentToPatientAction(documentId)
    setLoading(false)

    if (result.success) {
      toast.success('Documento enviado al paciente')
      setSent(true)
    } else {
      toast.error(result.error)
    }
  }

  if (sent) {
    return (
      <span className="text-xs text-green-600 font-medium px-2">Enviado</span>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSend} disabled={loading || !hasEmail}>
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

export function PatientDocumentsTab({
  patientId,
  patientEmail,
  documents: initialDocuments,
  mealPlans,
}: PatientDocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [generatingAnthro, setGeneratingAnthro] = useState(false)
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null)
  const [showPlanPicker, setShowPlanPicker] = useState(false)

  async function handleGenerateAnthro() {
    setGeneratingAnthro(true)
    const result = await generateAnthropometricPDFAction(patientId)
    setGeneratingAnthro(false)

    if (result.success) {
      toast.success('Informe antropométrico generado')
      // Refresh page to show new document
      window.location.reload()
    } else {
      toast.error(result.error)
    }
  }

  async function handleGeneratePlanPDF(planId: string) {
    setGeneratingPlanId(planId)
    const result = await generateMealPlanPDFAction(planId, patientId)
    setGeneratingPlanId(null)
    setShowPlanPicker(false)

    if (result.success) {
      toast.success('PDF del plan generado')
      window.location.reload()
    } else {
      toast.error(result.error)
    }
  }

  const activePlans = mealPlans.filter((p) => p.status === 'active')
  const allPlans = mealPlans

  return (
    <div className="space-y-4">
      {/* Generate PDF Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateAnthro}
          disabled={generatingAnthro}
          className="text-xs"
        >
          {generatingAnthro ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-3.5 w-3.5" />
          )}
          Generar informe antropométrico
        </Button>

        <div className="relative">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPlanPicker((v) => !v)}
            className="text-xs"
            disabled={allPlans.length === 0}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            PDF de plan alimentario
          </Button>

          {showPlanPicker && allPlans.length > 0 && (
            <div className="absolute left-0 top-full mt-1 z-10 min-w-[240px] rounded-lg border border-gray-200 bg-white shadow-lg">
              {allPlans.map((plan) => (
                <button
                  key={plan.id}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
                  onClick={() => handleGeneratePlanPDF(plan.id)}
                  disabled={generatingPlanId === plan.id}
                >
                  {generatingPlanId === plan.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                  )}
                  <span className="truncate">{plan.title}</span>
                  {plan.status === 'active' && (
                    <span className="ml-auto text-xs text-green-600 font-medium">Activo</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!patientEmail && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          El paciente no tiene email registrado — no se pueden enviar documentos por email.
        </p>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Sin documentos generados"
          description="Generá PDF de planes alimentarios o informes antropométricos"
        />
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <FileText className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(doc.generated_at)}
                    {doc.is_sent_to_patient && (
                      <span className="ml-1 text-green-600">· Enviado</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <DownloadButton documentId={doc.id} />
                <SendButton
                  documentId={doc.id}
                  isSent={doc.is_sent_to_patient}
                  hasEmail={!!patientEmail}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
