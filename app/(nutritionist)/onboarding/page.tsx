'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppLogo } from '@/components/shared/AppLogo'
import { updateBrandingAction } from '@/lib/actions/branding'
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Bienvenido/a', description: 'Configurá tu perfil profesional' },
  { id: 2, title: 'Tu marca', description: 'Personalizá colores y logo' },
  { id: 3, title: 'Tu primer paciente', description: 'Agregá un paciente de prueba (opcional)' },
  { id: 4, title: '¡Todo listo!', description: 'Comenzá a usar NutriApp' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    primary_color: '#16a34a',
    secondary_color: '#15803d',
    accent_color: '#4ade80',
  })

  function handleNext() {
    setStep((s) => Math.min(s + 1, 4))
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleBrandingSubmit() {
    setIsLoading(true)
    const fd = new FormData()
    fd.append('business_name', formData.business_name || 'Mi Consultorio')
    fd.append('primary_color', formData.primary_color)
    fd.append('secondary_color', formData.secondary_color)
    fd.append('accent_color', formData.accent_color)

    const result = await updateBrandingAction(fd)
    setIsLoading(false)

    if (result.success) {
      handleNext()
    }
  }

  function handleFinish() {
    router.push('/nutritionist/dashboard')
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <AppLogo size="lg" />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  s.id < step
                    ? 'bg-green-600 text-white'
                    : s.id === step
                    ? 'bg-green-600 text-white ring-4 ring-green-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s.id < step ? <CheckCircle2 className="h-5 w-5" /> : s.id}
              </div>
            ))}
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Step 1: Welcome + Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido/a a NutriApp!</h1>
                <p className="mt-1 text-gray-500">
                  Configuremos tu cuenta en unos pocos pasos.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="business_name">Nombre de tu consultorio / negocio</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, business_name: e.target.value }))
                    }
                    placeholder="Ej: NutriSalud, Consultorio García..."
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                onClick={handleNext}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Continuar
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tu identidad visual</h1>
                <p className="mt-1 text-gray-500">
                  Elegí los colores de tu marca. Podés cambiarlos después.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="primary_color">Color principal</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, primary_color: e.target.value }))
                      }
                      className="h-10 w-14 cursor-pointer rounded border border-gray-300 p-1"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, primary_color: e.target.value }))
                      }
                      className="font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary_color">Color secundario</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, secondary_color: e.target.value }))
                      }
                      className="h-10 w-14 cursor-pointer rounded border border-gray-300 p-1"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, secondary_color: e.target.value }))
                      }
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div
                  className="rounded-lg p-4 text-white"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  <p className="font-semibold">{formData.business_name || 'Mi Consultorio'}</p>
                  <p className="text-sm opacity-80">Vista previa del color</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  onClick={handleBrandingSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Guardando...' : 'Guardar y continuar'}
                  {!isLoading && <ChevronRight className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: First Patient */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tu primer paciente</h1>
                <p className="mt-1 text-gray-500">
                  Podés agregar un paciente ahora o hacerlo después desde el panel.
                </p>
              </div>

              <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                <p className="text-gray-500 text-sm">
                  Agregá pacientes desde el panel principal una vez que completes el setup.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  onClick={handleNext}
                  variant="outline"
                  className="flex-1"
                >
                  Saltar por ahora
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">¡Todo listo!</h1>
                <p className="mt-2 text-gray-500">
                  Tu cuenta está configurada. Podés empezar a gestionar tus pacientes y planes
                  alimentarios.
                </p>
              </div>
              <Button
                onClick={handleFinish}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                Ir al Dashboard
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Paso {step} de {STEPS.length}
        </p>
      </div>
    </div>
  )
}
