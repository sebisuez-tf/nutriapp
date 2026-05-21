import { requireRole } from '@/lib/actions/auth'
import { db } from '@/lib/db'
import { patients, nutritionists } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PatientNav } from '@/components/patient/PatientNav'
import { AccessExpiredScreen } from '@/components/patient/AccessExpiredScreen'
import { getBranding } from '@/lib/utils/branding'
import { isAccessExpired } from '@/lib/utils'

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const current = await requireRole('patient')

  // Get patient record
  const patient = await db
    .select()
    .from(patients)
    .where(eq(patients.profile_id, current.profile.id))
    .limit(1)
    .then((r) => r[0] ?? null)

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Paciente no encontrado</p>
      </div>
    )
  }

  // Get nutritionist branding
  const nutritionist = await db
    .select()
    .from(nutritionists)
    .where(eq(nutritionists.id, patient.nutritionist_id))
    .limit(1)
    .then((r) => r[0] ?? null)

  const branding = getBranding({
    logo_url: nutritionist?.logo_url ?? null,
    primary_color: nutritionist?.primary_color ?? '#16a34a',
    secondary_color: nutritionist?.secondary_color ?? '#15803d',
    accent_color: nutritionist?.accent_color ?? '#4ade80',
    business_name: nutritionist?.business_name ?? 'NutriApp',
  })

  // Check access expiry
  if (!patient.is_active || isAccessExpired(patient.access_expires_at)) {
    return (
      <AccessExpiredScreen
        nutritionistName={nutritionist?.business_name ?? 'Tu nutricionista'}
        contactEmail={nutritionist?.contact_email}
        contactPhone={nutritionist?.contact_phone}
        branding={branding}
      />
    )
  }

  const cssVars = `
    :root {
      --color-brand-primary: ${branding.primary_color};
      --color-brand-secondary: ${branding.secondary_color};
      --color-brand-accent: ${branding.accent_color};
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      <div className="flex min-h-screen flex-col bg-gray-50">
        <PatientNav
          patientName={`${patient.first_name} ${patient.last_name}`}
          branding={branding}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </>
  )
}
