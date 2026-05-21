import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeConfig = {
  sm: { icon: 16, text: 'text-base', container: 'gap-1' },
  md: { icon: 24, text: 'text-xl', container: 'gap-2' },
  lg: { icon: 36, text: 'text-3xl', container: 'gap-3' },
}

export function AppLogo({ size = 'md', showText = true, className }: AppLogoProps) {
  const config = sizeConfig[size]

  return (
    <div className={cn('flex items-center', config.container, className)}>
      <div className="flex items-center justify-center rounded-lg bg-green-600 p-1.5">
        <Leaf
          size={config.icon}
          className="text-white"
          strokeWidth={2}
        />
      </div>
      {showText && (
        <span
          className={cn(
            'font-bold tracking-tight text-gray-900',
            config.text
          )}
        >
          NutriApp
        </span>
      )}
    </div>
  )
}
