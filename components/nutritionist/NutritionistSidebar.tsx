'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  ChefHat,
  Calendar,
  Users2,
  BarChart3,
  Settings,
  LogOut,
  MessageSquare,
  ChevronRight,
  Bell,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { logoutAction } from '@/lib/actions/auth'
import type { NutritionistBranding } from '@/types'
import Image from 'next/image'

interface NutritionistSidebarProps {
  nutritionistName: string
  branding: NutritionistBranding
  unreadCount?: number
}

const navItems = [
  { href: '/nutritionist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/nutritionist/patients', label: 'Pacientes', icon: Users },
  { href: '/nutritionist/plans', label: 'Planes', icon: FileText },
  { href: '/nutritionist/recipes', label: 'Recetas', icon: ChefHat },
  { href: '/nutritionist/appointments', label: 'Turnos', icon: Calendar },
  { href: '/nutritionist/messages', label: 'Mensajes', icon: MessageSquare },
  { href: '/nutritionist/groups', label: 'Grupos', icon: Users2 },
  { href: '/nutritionist/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/nutritionist/settings/branding', label: 'Configuración', icon: Settings },
]

export function NutritionistSidebar({
  nutritionistName,
  branding,
  unreadCount = 0,
}: NutritionistSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Brand Header */}
      <div
        className="flex h-16 items-center gap-3 border-b border-gray-100 px-4"
        style={{ borderBottomColor: branding.primary_color + '20' }}
      >
        {branding.logo_url ? (
          <div className="h-9 w-9 overflow-hidden rounded-lg">
            <Image
              src={branding.logo_url}
              alt={branding.business_name}
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: branding.primary_color }}
          >
            {getInitials(branding.business_name || nutritionistName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {branding.business_name || nutritionistName}
          </p>
        </div>
        <button className="relative rounded-full p-1 text-gray-400 hover:text-gray-600">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')

          const isMessages = item.href === '/nutritionist/messages'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              style={
                isActive
                  ? { backgroundColor: branding.primary_color }
                  : undefined
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isMessages && unreadCount > 0 && !isActive && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                  {unreadCount}
                </span>
              )}
              {isActive && <ChevronRight className="h-3 w-3" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 p-2">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
