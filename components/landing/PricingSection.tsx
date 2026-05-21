import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

const PLANS = [
  {
    key: 'basic',
    name: 'Básico',
    price: '$0',
    period: 'Gratis',
    description: 'Para empezar tu consultorio digital',
    color: 'border-gray-200',
    buttonClass: 'border-gray-200 text-gray-700 hover:bg-gray-50',
    buttonVariant: 'outline' as const,
    features: [
      'Hasta 10 pacientes',
      'Planes alimentarios',
      'Registro de mediciones',
      'Historia clínica básica',
      'Branding básico',
    ],
    highlight: false,
  },
  {
    key: 'professional',
    name: 'Profesional',
    price: '$12.000',
    period: '/mes',
    description: 'El más elegido por nutricionistas independientes',
    color: 'border-green-500 ring-2 ring-green-500',
    buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
    buttonVariant: 'default' as const,
    features: [
      'Hasta 50 pacientes',
      'Todo lo del plan Básico',
      'Chat en tiempo real',
      'Turnos y calendario',
      'Reportes PDF automáticos',
      'Branding completo con logo',
      'Acceso por vencimiento',
    ],
    highlight: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '$22.000',
    period: '/mes',
    description: 'Para consultorios con equipo',
    color: 'border-purple-200',
    buttonClass: 'border-purple-200 text-purple-700 hover:bg-purple-50',
    buttonVariant: 'outline' as const,
    features: [
      'Hasta 200 pacientes',
      'Todo lo del plan Profesional',
      'Grupos y equipos',
      'Coordinadores externos',
      'Recetario personalizado',
      'Videos educativos',
      'Productos recomendados',
      'Exportación de datos (GDPR)',
    ],
    highlight: false,
  },
  {
    key: 'club',
    name: 'Club',
    price: 'A consultar',
    period: '',
    description: 'Para clubs, equipos profesionales e instituciones',
    color: 'border-gray-200',
    buttonClass: 'border-gray-200 text-gray-700 hover:bg-gray-50',
    buttonVariant: 'outline' as const,
    features: [
      'Pacientes ilimitados',
      'Todo lo del plan Premium',
      'API acceso',
      'Múltiples nutricionistas',
      'SLA y soporte prioritario',
      'Configuración a medida',
    ],
    highlight: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Planes para cada etapa de tu carrera
          </h2>
          <p className="mt-3 text-gray-500">
            Empezá gratis y escalá cuando lo necesitás. Sin compromisos anuales.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl border ${plan.color} bg-white p-6 shadow-sm`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-green-600 px-3 py-0.5 text-xs font-bold text-white">
                    Más popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <p className="font-bold text-gray-900">{plan.name}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">{plan.description}</p>
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.key === 'club' ? 'mailto:hola@nutriapp.com.ar' : '/login'}>
                <Button
                  variant={plan.buttonVariant}
                  className={`w-full ${plan.buttonClass}`}
                >
                  {plan.key === 'club' ? 'Contactar' : 'Empezar'}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Precios en ARS. IVA no incluido. * Los pagos en línea estarán disponibles próximamente.
        </p>
      </div>
    </section>
  )
}
