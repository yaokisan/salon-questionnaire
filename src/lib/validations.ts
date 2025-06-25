import { z } from 'zod'

// 新しいアンケートフォーム用スキーマ（新フィールドが必須）
export const questionnaireFormSchema = z.object({
  furigana: z.string().min(1, 'ふりがなは必須です'),
  name: z.string().min(1, '氏名は必須です'),
  last_name: z.string().min(1, '姓は必須です'),
  first_name: z.string().min(1, '名は必須です'),
  last_name_furigana: z.string().min(1, '姓のふりがなは必須です'),
  first_name_furigana: z.string().min(1, '名のふりがなは必須です'),
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

// OCR用スキーマ（すべての項目をオプションに）
export const ocrFormSchema = z.object({
  furigana: z.string().optional(),
  name: z.string().optional(),
  last_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name_furigana: z.string().optional(),
  first_name_furigana: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  birth_year: z.number().optional(),
  birth_month: z.number().optional(),
  birth_day: z.number().optional(),
  source_type: z.enum(['storefront', 'instagram_store', 'instagram_personal', 'hotpepper', 'youtube', 'google', 'tiktok', 'referral']).optional(),
  instagram_account: z.string().optional(),
  referral_person: z.string().optional(),
  has_scalp_sensitivity: z.boolean().optional(),
  scalp_sensitivity_details: z.string().optional(),
  last_salon_year: z.number().optional(),
  last_salon_month: z.number().optional(),
  last_salon_treatment: z.string().optional(),
  past_treatments: z.array(z.string()).optional(),
})

// 管理者画面用スキーマ（後方互換性のため新フィールドはオプション）
export const questionnaireSchema = z.object({
  furigana: z.string().min(1, 'ふりがなは必須です'),
  name: z.string().min(1, '氏名は必須です'),
  last_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name_furigana: z.string().optional(),
  first_name_furigana: z.string().optional(),
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