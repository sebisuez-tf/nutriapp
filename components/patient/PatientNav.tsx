'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, UtensilsCrossed, TrendingUp, Menu, X, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/lib/actions/auth'
import type { NutritionistBranding } from '@/types'
import Image from 'next/image'

interface PatientNavProps {
  patientName: string
  branding: NutritionistBranding
}

const navItems = [
  { href: '/patient/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/patient/plan', label: 'Mi Plan', icon: UtensilsCrossed },
  { href: '/patient/reports', label: 'Mi Evolución', icon: TrendingUp },
]

export function PatientNav({ patientName, branding }: PatientNavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {branding.logo_url ? (
            <div className="h-8 w-8 overflow-hidden rounded-lg">
              <Image
                src={branding.logo_url}
                alt={branding.business_name}
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: branding.primary_color }}
            >
              {branding.business_name.charAt(0)}
            </div>
          )}
          <span className="hidden text-sm font-semibold text-gray-900 sm:block">
            {branding.business_name}
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                style={isActive ? { backgroundColor: branding.primary_color } : undefined}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Patient name + mobile menu */}
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-gray-600 sm:block">
            Hola, {patientName.split(' ')[0]}
          </span>
          <form action={logoutAction} className="hidden sm:block">
            <button
              type="submit"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-1.5 text-gray-600 sm:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 sm:hidden">
          <p className="mb-2 text-xs text-gray-500">Hola, {patientName}</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
                  )}
                  style={isActive ? { backgroundColor: branding.primary_color } : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <form action={logoutAction} className="mt-2 border-t border-gray-100 pt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
