import type { NutritionistBranding } from '@/types'
import { Clock, Mail, Phone } from 'lucide-react'

interface AccessExpiredScreenProps {
  nutritionistName: string
  contactEmail?: string | null
  contactPhone?: string | null
  branding: NutritionistBranding
}

export function AccessExpiredScreen({
  nutritionistName,
  contactEmail,
  contactPhone,
  branding,
}: AccessExpiredScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md text-center">
        {/* Logo / Brand */}
        <div
          className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: branding.primary_color }}
        >
          <Clock className="h-8 w-8" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Acceso vencido</h1>
        <p className="mb-6 text-gray-600">
          Tu período de acceso al portal de{' '}
          <strong>{branding.business_name}</strong> ha expirado.
        </p>

        {/* Contact Block */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Contactá a tu nutricionista para renovar tu acceso:
          </p>
          <p className="mb-4 font-semibold text-gray-900">{nutritionistName}</p>

          <div className="space-y-2">
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: branding.primary_color }}
              >
                <Mail className="h-4 w-4" />
                <span>Enviar email</span>
              </a>
            )}
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Phone className="h-4 w-4" />
                <span>{contactPhone}</span>
              </a>
            )}
            {!contactEmail && !contactPhone && (
              <p className="text-sm text-gray-500">
                No hay datos de contacto disponibles
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Si creés que esto es un error, por favor escribile a tu nutricionista.
        </p>
      </div>
    </div>
  )
}
