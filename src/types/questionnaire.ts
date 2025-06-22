export interface QuestionnaireResponse {
  id?: string
  furigana?: string
  name: string
  address?: string
  postal_code?: string
  phone?: string
  birth_year?: number
  birth_month?: number
  birth_day?: number
  age_group?: number
  source_type?: 'storefront' | 'instagram_store' | 'instagram_personal' | 'hotpepper' | 'youtube' | 'google' | 'tiktok' | 'referral'
  instagram_account?: string
  referral_person?: string
  has_scalp_sensitivity?: boolean
  scalp_sensitivity_details?: string
  last_salon_date?: string
  last_salon_treatment?: string
  past_treatments?: string[]
  created_at?: string
  updated_at?: string
}

export interface OCRImage {
  id?: string
  questionnaire_id?: string
  image_url: string
  ocr_text?: string
  created_at?: string
}