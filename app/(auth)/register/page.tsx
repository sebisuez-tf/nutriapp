'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Mínimo 2 caracteres'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type RegisterInput = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // The email comes from the invite token in the URL hash (handled by Supabase)
    // We can try to get it from the session
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setEmail(data.user.email)
      }
    })
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    setIsSubmitting(true)
    const supabase = createClient()

    // Update user metadata with full name
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
      data: { full_name: data.full_name },
    })

    if (updateError) {
      setIsSubmitting(false)
      toast.error(updateError.message)
      return
    }

    // Get user to determine role and redirect
    const { data: userData } = await supabase.auth.getUser()
    const role = userData.user?.user_metadata?.role ?? 'nutritionist'

    toast.success('Cuenta configurada correctamente')

    if (role === 'nutritionist') {
      router.push('/nutritionist/onboarding')
    } else if (role === 'patient') {
      router.push('/patient/dashboard')
    } else {
      router.push('/nutritionist/dashboard')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Completar registro</h1>
      <p className="mb-2 text-sm text-gray-500">
        Completá tu perfil para acceder a NutriApp.
      </p>
      {email && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          Registrando: <strong>{email}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input
            id="full_name"
            autoComplete="name"
            {...register('full_name')}
            className="mt-1"
            placeholder="Lic. María García"
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              className="pr-10"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="mt-1"
            placeholder="Repetí la contraseña"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? 'Configurando...' : 'Completar registro'}
        </Button>
      </form>
    </div>
  )
}
