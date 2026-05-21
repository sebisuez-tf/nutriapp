'use client'

import { AppLogo } from '@/components/shared/AppLogo'
import { Leaf } from 'lucide-react'

interface BrandingPreviewProps {
  businessName: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string | null
  bio?: string | null
}

export function BrandingPreview({
  businessName,
  primaryColor,
  secondaryColor,
  accentColor,
  logoUrl,
  bio,
}: BrandingPreviewProps) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header bar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: primaryColor }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded object-cover" />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded"
            style={{ backgroundColor: accentColor }}
          >
            <Leaf className="h-4 w-4 text-white" />
          </div>
        )}
        <span className="font-semibold text-white">{businessName || 'Tu consultorio'}</span>
      </div>

      {/* Content preview */}
      <div className="bg-white p-4 space-y-3">
        {bio && <p className="text-sm text-gray-600">{bio}</p>}

        {/* Sample card */}
        <div
          className="rounded-lg p-3 text-white text-sm"
          style={{ backgroundColor: secondaryColor }}
        >
          <p className="font-medium">Plan de la semana</p>
          <p className="text-xs opacity-90 mt-0.5">Actualizado hoy</p>
        </div>

        {/* Sample button */}
        <button
          type="button"
          className="w-full rounded-lg py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          Ver mi plan
        </button>

        {/* Sample accent */}
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-xs text-gray-500">Próximo turno: Mañana 10:00</span>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
        <p className="text-xs text-gray-400">Vista previa de cómo verán tus pacientes tu app</p>
      </div>
    </div>
  )
}
