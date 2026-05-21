import type { Module, PlanType } from '@/types'

export const PLANS = {
  basic: {
    id: 'basic' as const,
    name: 'Básico',
    price: 0,
    maxPatients: 20,
    description: 'Para nutricionistas que recién empiezan',
    modules: [
      'patients',
      'clinical_records',
      'measurements',
      'meal_plans',
      'appointments',
    ] as Module[],
  },
  professional: {
    id: 'professional' as const,
    name: 'Profesional',
    price: 29,
    maxPatients: 100,
    description: 'Para nutricionistas con práctica establecida',
    modules: [
      'patients',
      'clinical_records',
      'measurements',
      'meal_plans',
      'pdf_reports',
      'recipes',
      'appointments',
      'chat',
      'branding',
      'educational_videos',
      'analytics',
    ] as Module[],
  },
  premium: {
    id: 'premium' as const,
    name: 'Premium',
    price: 59,
    maxPatients: 500,
    description: 'Para equipos y clínicas de nutrición',
    modules: [
      'patients',
      'clinical_records',
      'measurements',
      'meal_plans',
      'pdf_reports',
      'recipes',
      'appointments',
      'chat',
      'branding',
      'educational_videos',
      'groups',
      'analytics',
      'coordinators',
      'group_reports',
    ] as Module[],
  },
  club: {
    id: 'club' as const,
    name: 'Club / Institución',
    price: 99,
    maxPatients: 2000,
    description: 'Para clubes deportivos e instituciones',
    modules: [
      'patients',
      'clinical_records',
      'measurements',
      'meal_plans',
      'pdf_reports',
      'recipes',
      'appointments',
      'chat',
      'branding',
      'educational_videos',
      'groups',
      'analytics',
      'coordinators',
      'group_reports',
      'white_label_advanced',
    ] as Module[],
  },
} as const

export const PLAN_MODULES: Record<PlanType, Module[]> = {
  basic: PLANS.basic.modules,
  professional: PLANS.professional.modules,
  premium: PLANS.premium.modules,
  club: PLANS.club.modules,
}

export function getPlanModules(planType: PlanType): Module[] {
  return PLAN_MODULES[planType] ?? PLAN_MODULES.basic
}

export type Plans = typeof PLANS
