import { LandingNav } from '@/components/landing/LandingNav'
import { HeroSection } from '@/components/landing/HeroSection'
import { PricingSection } from '@/components/landing/PricingSection'
import Link from 'next/link'
import {
  BarChart2,
  Calendar,
  MessageSquare,
  FileText,
  Palette,
  Users,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'Planes alimentarios',
    description:
      'Editor drag & drop con cálculo automático de macros. Creá plantillas reutilizables y asignalas a múltiples pacientes.',
  },
  {
    icon: BarChart2,
    title: 'Seguimiento corporal',
    description:
      'Registrá peso, grasa, masa muscular, perímetros y más. IMC y categorías calculados automáticamente.',
  },
  {
    icon: Calendar,
    title: 'Turnos y calendario',
    description:
      'Gestioná tu agenda con un calendario visual. Recordatorios automáticos por email.',
  },
  {
    icon: MessageSquare,
    title: 'Chat en tiempo real',
    description:
      'Comunicá con tus pacientes de forma segura y directa desde la plataforma.',
  },
  {
    icon: Palette,
    title: 'Marca propia',
    description:
      'Personalizá colores, logo y datos de contacto. Tus pacientes ven tu marca, no la nuestra.',
  },
  {
    icon: Users,
    title: 'Grupos y equipos',
    description:
      'Gestioná clubs, equipos e instituciones con métricas agregadas y coordinadores externos.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacidad y GDPR',
    description:
      'Datos alojados en servidores seguros. Exportación y eliminación de datos a pedido.',
  },
  {
    icon: Smartphone,
    title: 'Mobile first',
    description:
      'Diseño optimizado para móviles. Tus pacientes acceden desde cualquier dispositivo.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Lic. Valentina Ruiz',
    role: 'Nutricionista deportiva · Córdoba',
    text: 'Antes tardaba horas en armar planes en Excel. Con NutriApp lo hago en minutos y queda mucho más profesional. Mis pacientes están encantados con la app.',
  },
  {
    name: 'Lic. Martín López',
    role: 'Nutricionista clínico · Buenos Aires',
    text: 'El seguimiento de mediciones con los gráficos automáticos me ahorra tiempo y les muestra a los pacientes su progreso de forma visual. Muy recomendable.',
  },
  {
    name: 'Lic. Carla Méndez',
    role: 'Nutricionista institucional · Rosario',
    text: 'Trabajo con un club de fútbol y la funcionalidad de grupos es exactamente lo que necesitaba. Los dirigentes ven métricas generales sin ver datos individuales.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      <HeroSection />

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Todo lo que necesitás en un solo lugar
            </h2>
            <p className="mt-3 text-gray-500">
              Funcionalidades diseñadas para el flujo de trabajo real de un nutricionista.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Icon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="mb-1.5 font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      {/* Testimonials */}
      <section id="testimonials" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Lo que dicen nuestros usuarios
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, text }) => (
              <div
                key={name}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <p className="mb-4 text-sm text-gray-600 italic">"{text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-16 text-center">
        <div className="mx-auto max-w-2xl px-4 space-y-4">
          <h2 className="text-3xl font-extrabold text-white">
            Empezá hoy. Es gratis.
          </h2>
          <p className="text-green-100">
            Únite a los nutricionistas que ya digitalizaron su consultorio con NutriApp.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/login">
              <button className="rounded-lg bg-white px-6 py-3 font-semibold text-green-700 hover:bg-green-50 transition-colors">
                Crear cuenta gratis
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} NutriApp · Desarrollado para nutricionistas argentinos</p>
        <div className="mt-2 flex justify-center gap-4">
          <a href="#" className="hover:text-gray-600">Términos y condiciones</a>
          <a href="#" className="hover:text-gray-600">Política de privacidad</a>
          <a href="mailto:hola@nutriapp.com.ar" className="hover:text-gray-600">Contacto</a>
        </div>
      </footer>
    </div>
  )
}
