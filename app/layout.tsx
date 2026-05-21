import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'NutriApp — Plataforma para nutricionistas',
    template: '%s | NutriApp',
  },
  description:
    'Gestioná tu consultorio de nutrición de forma profesional. Planes alimentarios, seguimiento de pacientes, turnos y más.',
  keywords: ['nutricionista', 'planes alimentarios', 'seguimiento pacientes', 'NutriApp'],
  authors: [{ name: 'NutriApp' }],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'NutriApp',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            classNames: {
              toast: 'font-sans',
            },
          }}
        />
      </body>
    </html>
  )
}
