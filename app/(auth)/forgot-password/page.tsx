'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { forgotPasswordAction } from '@/lib/actions/auth'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setIsSubmitting(true)
    const fd = new FormData()
    fd.set('email', data.email)

    const result = await forgotPasswordAction(fd)
    setIsSubmitting(false)

    if (result.success) {
      setSent(true)
    } else {
      toast.error(result.error)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Revisá tu email</h1>
        <p className="text-sm text-gray-500">
          Si el email está registrado, recibirás un enlace para restablecer tu contraseña en los
          próximos minutos.
        </p>
        <Link href="/login">
          <Button variant="outline" className="mt-2">
            Volver al inicio de sesión
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <Link
        href="/login"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
      <p className="mb-6 text-sm text-gray-500">
        Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="mt-1"
            placeholder="nombre@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </Button>
      </form>
    </div>
  )
}
