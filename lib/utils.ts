import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isAccessExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return false
  const d = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  return d < new Date()
}

export function isAccessExpiringSoon(
  expiresAt: Date | string | null | undefined,
  daysAhead = 7
): boolean {
  if (!expiresAt) return false
  const d = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  const threshold = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
  return d > new Date() && d <= threshold
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function calculateBMI(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined
): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getBMICategory(
  bmi: number | null | undefined
): { label: string; color: string } | null {
  if (!bmi) return null
  if (bmi < 18.5) return { label: 'Bajo peso', color: 'text-blue-600' }
  if (bmi < 25) return { label: 'Normal', color: 'text-green-600' }
  if (bmi < 30) return { label: 'Sobrepeso', color: 'text-yellow-600' }
  return { label: 'Obesidad', color: 'text-red-600' }
}
