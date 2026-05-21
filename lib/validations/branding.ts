import { z } from 'zod'

export const updateBrandingSchema = z.object({
  business_name: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido'),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido'),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  instagram_handle: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>
