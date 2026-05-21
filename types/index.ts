export type Role = 'super_admin' | 'nutritionist' | 'patient' | 'coordinator' | 'support'

export type PlanType = 'basic' | 'professional' | 'premium' | 'club'

export type PatientSex = 'male' | 'female' | 'other'

export type DietaryPattern = 'omnivore' | 'vegetarian' | 'vegan' | 'other'

export type MealPlanStatus = 'draft' | 'active' | 'inactive' | 'archived'

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export type AppointmentType = 'initial' | 'followup' | 'online' | 'remote'

export type DocumentType = 'meal_plan_pdf' | 'anthropometric_report' | 'other'

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trial'

export type GroupType = 'club' | 'team' | 'institution' | 'category'

export type Module =
  | 'patients'
  | 'clinical_records'
  | 'measurements'
  | 'meal_plans'
  | 'pdf_reports'
  | 'recipes'
  | 'appointments'
  | 'chat'
  | 'branding'
  | 'educational_videos'
  | 'groups'
  | 'analytics'
  | 'coordinators'
  | 'group_reports'
  | 'white_label_advanced'

export interface NutritionistBranding {
  logo_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  business_name: string
}

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string }
