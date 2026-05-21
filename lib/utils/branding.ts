import type { NutritionistBranding } from '@/types'

const DEFAULT_BRANDING: NutritionistBranding = {
  logo_url: null,
  primary_color: '#16a34a',
  secondary_color: '#15803d',
  accent_color: '#4ade80',
  business_name: 'NutriApp',
}

export function getBranding(partial: Partial<NutritionistBranding>): NutritionistBranding {
  return { ...DEFAULT_BRANDING, ...partial }
}

export function generateCssVars(branding: NutritionistBranding): string {
  return `--color-primary: ${branding.primary_color}; --color-secondary: ${branding.secondary_color}; --color-accent: ${branding.accent_color};`
}

export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '22 163 74'
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}

export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function lightenColor(hex: string, amount: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = Math.min(255, parseInt(result[1], 16) + amount)
  const g = Math.min(255, parseInt(result[2], 16) + amount)
  const b = Math.min(255, parseInt(result[3], 16) + amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
