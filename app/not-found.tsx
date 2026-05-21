import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AppLogo } from '@/components/shared/AppLogo'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 text-center">
      <AppLogo size="lg" className="mb-8" />

      <p className="text-8xl font-extrabold text-gray-200 select-none">404</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-gray-500">
        La página que buscás no existe o fue movida. Verificá la URL o volvé al inicio.
      </p>

      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Home className="mr-2 h-4 w-4" />
            Ir al inicio
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="outline">Iniciar sesión</Button>
        </Link>
      </div>
    </div>
  )
}
