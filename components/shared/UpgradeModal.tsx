'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, Lock } from 'lucide-react'
import Link from 'next/link'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName: string
  requiredPlan: string
}

const PLAN_LABELS: Record<string, string> = {
  professional: 'Profesional',
  premium: 'Premium',
  club: 'Club',
}

export function UpgradeModal({
  open,
  onOpenChange,
  featureName,
  requiredPlan,
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Lock className="h-6 w-6 text-purple-600" />
          </div>
          <DialogTitle>Funcionalidad premium</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-gray-600">
            <strong>{featureName}</strong> está disponible en el plan{' '}
            <strong>{PLAN_LABELS[requiredPlan] ?? requiredPlan}</strong> o superior.
          </p>

          <p className="text-xs text-gray-400">
            Mejorá tu plan para acceder a esta funcionalidad y muchas más.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link href="/nutritionist/settings/billing">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              Ver planes
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Ahora no
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
