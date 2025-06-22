import { z } from 'zod'

export const questionnaireSchema = z.object({
  furigana: z.string().min(1, 'ふりがなは必須です'),
  name: z.string().min(1, '氏名は必須です'),
  address: z.string().optional(),
  postal_code: z.string().min(1, '郵便番号は必須です'),
  phone: z.string().min(1, '電話番号は必須です'),
  birth_year: z.number().min(1900, '生年は必須です').max(new Date().getFullYear()),
  birth_month: z.number().min(1, '生月は必須です').max(12),
  birth_day: z.number().min(1, '生日は必須です').max(31),
  source_type: z.enum(['storefront', 'instagram_store', 'instagram_personal', 'hotpepper', 'youtube', 'google', 'tiktok', 'referral'], {
    required_error: '来店きっかけは必須です'
  }),
  instagram_account: z.string().optional(),
  referral_person: z.string().optional(),
  has_scalp_sensitivity: z.boolean({
    required_error: 'アレルギーの有無は必須です'
  }),
  scalp_sensitivity_details: z.string().optional(),
  last_salon_year: z.number().optional(),
  last_salon_month: z.number().optional(),
  last_salon_treatment: z.string().optional(),
  past_treatments: z.array(z.string()).optional(),
})