import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  'Planes alimentarios con editor drag & drop',
  'Seguimiento de mediciones y composición corporal',
  'App personalizada con tu marca',
  'Chat en tiempo real con pacientes',
  'Turnos y recordatorios automáticos',
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 py-20">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-green-100 opacity-40 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-100 opacity-40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Plataforma para nutricionistas
            </div>

            <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">
              Gestioná tu consultorio{' '}
              <span className="text-green-600">de forma profesional</span>
            </h1>

            <p className="text-lg text-gray-600">
              NutriApp es la plataforma todo-en-uno para nutricionistas argentinos. Creá planes
              alimentarios, hacé seguimiento de tus pacientes y mostrá tu marca con tu identidad
              visual propia.
            </p>

            <ul className="space-y-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="#pricing">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base">
                  Empezar gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="px-6 py-3 text-base">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-400">
              Sin tarjeta de crédito. Cancelá cuando quieras.
            </p>
          </div>

          {/* App preview mockup */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
              {/* Fake header */}
              <div className="flex items-center gap-2 border-b border-gray-100 bg-green-600 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
                </div>
                <span className="text-xs font-medium text-white">NutriApp — Dashboard</span>
              </div>
              {/* Fake content */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {['24 Pacientes', '8 Activos', '3 Turnos hoy'].map((s) => (
                    <div key={s} className="rounded-lg bg-green-50 p-3 text-center">
                      <p className="text-xs font-semibold text-green-700">{s}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-100 p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Plan semana 3 — María G.</p>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded bg-gray-50 p-1.5 font-bold">1850 kcal</div>
                    <div className="rounded bg-blue-50 p-1.5 font-bold text-blue-700">130g P</div>
                    <div className="rounded bg-yellow-50 p-1.5 font-bold text-yellow-700">210g HC</div>
                    <div className="rounded bg-orange-50 p-1.5 font-bold text-orange-700">58g G</div>
                  </div>
                  {['Desayuno', 'Almuerzo', 'Merienda', 'Cena'].map((slot) => (
                    <div key={slot} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5">
                      <span className="text-xs text-gray-700">{slot}</span>
                      <span className="text-xs text-gray-400">3-4 alimentos</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 rounded-xl bg-white border border-gray-200 shadow-lg p-3">
              <p className="text-xs font-semibold text-gray-900">IMC calculado</p>
              <p className="text-2xl font-bold text-green-600">22.4</p>
              <p className="text-xs text-green-600">Peso normal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
