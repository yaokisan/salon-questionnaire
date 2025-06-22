import { z } from 'zod'

export const questionnaireSchema = z.object({
  furigana: z.string().optional(),
  name: z.string().min(1, '氏名は必須です'),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  birth_year: z.number().optional(),
  birth_month: z.number().min(1).max(12).optional(),
  birth_day: z.number().min(1).max(31).optional(),
  age_group: z.number().optional(),
  source_type: z.enum(['storefront', 'instagram_store', 'instagram_personal', 'hotpepper', 'youtube', 'google', 'tiktok', 'referral']).optional(),
  instagram_account: z.string().optional(),
  referral_person: z.string().optional(),
  has_scalp_sensitivity: z.boolean().optional(),
  scalp_sensitivity_details: z.string().optional(),
  last_salon_date: z.string().optional(),
  last_salon_treatment: z.string().optional(),
  past_treatments: z.array(z.string()).optional(),
})