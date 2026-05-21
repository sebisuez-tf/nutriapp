import { requireRole } from '@/lib/actions/auth'
import { NutritionistSidebar } from '@/components/nutritionist/NutritionistSidebar'
import { getBranding } from '@/lib/utils/branding'

export default async function NutritionistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const current = await requireRole(['nutritionist', 'super_admin', 'coordinator'])

  const branding = getBranding({
    logo_url: current.nutritionist?.logo_url ?? null,
    primary_color: current.nutritionist?.primary_color ?? '#16a34a',
    secondary_color: current.nutritionist?.secondary_color ?? '#15803d',
    accent_color: current.nutritionist?.accent_color ?? '#4ade80',
    business_name: current.nutritionist?.business_name ?? current.profile.full_name,
  })

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
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <NutritionistSidebar
          nutritionistName={current.profile.full_name}
          branding={branding}
        />
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </main>
      </div>
    </>
  )
}
