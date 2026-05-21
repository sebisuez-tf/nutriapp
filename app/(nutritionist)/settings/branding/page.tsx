'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/shared/PageHeader'
import { BrandingPreview } from '@/components/nutritionist/BrandingPreview'
import { updateBrandingAction, uploadLogoAction } from '@/lib/actions/branding'
import { toast } from 'sonner'
import { useEffect } from 'react'

// We need to load the current nutritionist data server-side and pass to client
// For simplicity, this page fetches via API on load
export default function BrandingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const [form, setForm] = useState({
    business_name: '',
    bio: '',
    primary_color: '#16a34a',
    secondary_color: '#15803d',
    accent_color: '#dcfce7',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    instagram_handle: '',
    address: '',
    city: '',
    country: 'Argentina',
  })

  useEffect(() => {
    fetch('/api/nutritionist/me')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setForm((prev) => ({
            ...prev,
            business_name: data.business_name ?? '',
            bio: data.bio ?? '',
            primary_color: data.primary_color ?? '#16a34a',
            secondary_color: data.secondary_color ?? '#15803d',
            accent_color: data.accent_color ?? '#dcfce7',
            contact_email: data.contact_email ?? '',
            contact_phone: data.contact_phone ?? '',
            website_url: data.website_url ?? '',
            instagram_handle: data.instagram_handle ?? '',
            address: data.address ?? '',
            city: data.city ?? '',
            country: data.country ?? 'Argentina',
          }))
          setLogoUrl(data.logo_url ?? null)
        }
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData()
    Object.entries(form).forEach(([key, val]) => {
      if (val) fd.set(key, val)
    })

    const result = await updateBrandingAction(fd)
    setIsSubmitting(false)

    if (result.success) {
      toast.success('Branding actualizado')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const fd = new FormData()
    fd.set('logo', file)

    const result = await uploadLogoAction(fd)
    setUploadingLogo(false)

    if (result.success) {
      toast.success('Logo actualizado')
      setLogoUrl(result.data)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branding"
        description="Personalizá la apariencia de tu app para pacientes"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business info */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Información del consultorio</h3>

            <div>
              <Label htmlFor="business_name">Nombre del consultorio *</Label>
              <Input
                id="business_name"
                value={form.business_name}
                onChange={(e) => update('business_name', e.target.value)}
                className="mt-1"
                placeholder="Lic. García Nutrición"
                required
              />
            </div>

            <div>
              <Label>Bio / descripción</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                className="mt-1"
                rows={2}
                placeholder="Especialista en nutrición deportiva..."
              />
            </div>

            {/* Logo upload */}
            <div>
              <Label>Logo</Label>
              <div className="mt-1 flex items-center gap-3">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded object-cover border border-gray-200" />
                )}
                <label className="cursor-pointer rounded-lg border-2 border-dashed border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-green-300 hover:text-green-600 transition-colors">
                  {uploadingLogo ? 'Subiendo...' : 'Subir logo (JPG/PNG, máx. 2MB)'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Colores</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'primary_color', label: 'Color primario' },
                { key: 'secondary_color', label: 'Color secundario' },
                { key: 'accent_color', label: 'Color de acento' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={form[key as keyof typeof form]}
                      onChange={(e) => update(key, e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded border border-gray-200 p-0.5"
                    />
                    <Input
                      value={form[key as keyof typeof form]}
                      onChange={(e) => update(key, e.target.value)}
                      pattern="^#[0-9A-Fa-f]{6}$"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Contacto y redes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email de contacto</Label>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => update('contact_email', e.target.value)}
                  className="mt-1"
                  placeholder="hola@consultorio.com"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={form.contact_phone}
                  onChange={(e) => update('contact_phone', e.target.value)}
                  className="mt-1"
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div>
                <Label>Sitio web</Label>
                <Input
                  type="url"
                  value={form.website_url}
                  onChange={(e) => update('website_url', e.target.value)}
                  className="mt-1"
                  placeholder="https://minutricionista.com"
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={form.instagram_handle}
                  onChange={(e) => update('instagram_handle', e.target.value)}
                  className="mt-1"
                  placeholder="@licgarcia_nutricion"
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  className="mt-1"
                  placeholder="Buenos Aires"
                />
              </div>
              <div>
                <Label>País</Label>
                <Input
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                  className="mt-1"
                  placeholder="Argentina"
                />
              </div>
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                className="mt-1"
                placeholder="Av. Corrientes 1234, Piso 3"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>

        {/* Live preview */}
        <div className="lg:sticky lg:top-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Vista previa</h3>
          <BrandingPreview
            businessName={form.business_name}
            primaryColor={form.primary_color}
            secondaryColor={form.secondary_color}
            accentColor={form.accent_color}
            logoUrl={logoUrl}
            bio={form.bio}
          />
        </div>
      </div>
    </div>
  )
}
