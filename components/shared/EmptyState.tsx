import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InboxIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon ?? <InboxIcon className="h-7 w-7" />}
      </div>
      <h3 className="mb-1 text-base font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <>
          {action.href ? (
            <Link href={action.href}>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              onClick={action.onClick}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {action.label}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
