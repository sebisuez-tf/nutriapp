'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppLogo } from '@/components/shared/AppLogo'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/">
          <AppLogo size="md" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Funcionalidades
          </a>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Planes
          </a>
          <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Testimonios
          </a>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Iniciar sesión
            </Button>
          </Link>
          <Link href="#pricing">
            <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm">
              Empezar gratis
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menú"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 space-y-3 md:hidden">
          <a href="#features" className="block text-sm text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>
            Funcionalidades
          </a>
          <a href="#pricing" className="block text-sm text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>
            Planes
          </a>
          <a href="#testimonials" className="block text-sm text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>
            Testimonios
          </a>
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="#pricing" onClick={() => setMenuOpen(false)}>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                Empezar gratis
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
