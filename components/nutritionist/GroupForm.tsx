'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createGroupAction } from '@/lib/actions/groups'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface GroupFormProps {
  onSuccess?: (groupId: string) => void
}

export function GroupForm({ onSuccess }: GroupFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState<string>('category')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.currentTarget)
    fd.set('type', type)

    const result = await createGroupAction(fd)
    setIsSubmitting(false)

    if (result.success) {
      toast.success('Grupo creado')
      if (onSuccess) {
        onSuccess(result.data)
      } else {
        router.push(`/nutritionist/groups/${result.data}`)
      }
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre del grupo *</Label>
        <Input
          id="name"
          name="name"
          required
          className="mt-1"
          placeholder="Club Atletismo Norte"
        />
      </div>

      <div>
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(val) => setType(val ?? 'category')}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="club">Club</SelectItem>
            <SelectItem value="team">Equipo</SelectItem>
            <SelectItem value="institution">Institución</SelectItem>
            <SelectItem value="category">Categoría</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          className="mt-1"
          rows={2}
          placeholder="Descripción opcional del grupo..."
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {isSubmitting ? 'Creando...' : 'Crear grupo'}
      </Button>
    </form>
  )
}
