export const BMI_CATEGORIES = [
  { label: 'Bajo peso', min: 0, max: 18.5, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  { label: 'Normal', min: 18.5, max: 25, color: 'text-green-500', bgColor: 'bg-green-100' },
  { label: 'Sobrepeso', min: 25, max: 30, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  { label: 'Obesidad grado I', min: 30, max: 35, color: 'text-orange-500', bgColor: 'bg-orange-100' },
  { label: 'Obesidad grado II', min: 35, max: 40, color: 'text-red-400', bgColor: 'bg-red-100' },
  { label: 'Obesidad grado III', min: 40, max: Infinity, color: 'text-red-600', bgColor: 'bg-red-200' },
] as const

export const DEFAULT_BRANDING_COLORS = {
  primary_color: '#16a34a',
  secondary_color: '#15803d',
  accent_color: '#4ade80',
} as const

export const MAX_FILE_SIZES = {
  logo: 2 * 1024 * 1024, // 2MB
  recipe_image: 5 * 1024 * 1024, // 5MB
  pdf: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
} as const

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'] as const

export const DEFAULT_APPOINTMENT_DURATION = 60 // minutes

export const PATIENT_ACCESS_RENEWAL_DAYS = 30

export const EXPIRING_ACCESS_WARNING_DAYS = 7

export const MESSAGES_PER_PAGE = 50

export const PLANS_PER_PAGE = 20

export const PATIENTS_PER_PAGE = 20

export const AUDIT_LOGS_PER_PAGE = 50
