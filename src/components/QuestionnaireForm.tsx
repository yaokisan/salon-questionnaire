'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { questionnaireSchema } from '@/lib/validations'
import { QuestionnaireResponse } from '@/types/questionnaire'
import { supabase } from '@/lib/supabase'

type FormData = {
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
}

export default function QuestionnaireForm() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(questionnaireSchema),
  })

  const sourceType = watch('source_type')
  const hasScalpSensitivity = watch('has_scalp_sensitivity')

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('questionnaire_responses')
        .insert([data])

      if (error) throw error
      
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting questionnaire:', error)
      alert('送信中にエラーが発生しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">送信完了</h2>
          <p className="text-gray-600 mb-6">
            アンケートのご回答ありがとうございました。
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
              BELO OSAKA アンケート
            </h1>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              ステップ {step} / 4
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">基本情報</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ふりがな
                  </label>
                  <input
                    type="text"
                    {...register('furigana')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="やまだ たろう"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="山田 太郎"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    住所
                  </label>
                  <input
                    type="text"
                    {...register('postal_code')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-2"
                    placeholder="〒000-0000"
                  />
                  <input
                    type="text"
                    {...register('address')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="大阪府大阪市..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="090-0000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生年月日
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      {...register('birth_year', { valueAsNumber: true })}
                      className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">年</option>
                      {Array.from({ length: 100 }, (_, i) => 2024 - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select
                      {...register('birth_month', { valueAsNumber: true })}
                      className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">月</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select
                      {...register('birth_day', { valueAsNumber: true })}
                      className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">日</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    年代
                  </label>
                  <select
                    {...register('age_group', { valueAsNumber: true })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    <option value={10}>10代</option>
                    <option value={20}>20代</option>
                    <option value={30}>30代</option>
                    <option value={40}>40代</option>
                    <option value={50}>50代</option>
                    <option value={60}>60代以上</option>
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">当店を知ったきっかけ</h2>
                
                <div className="space-y-3">
                  {[
                    { value: 'storefront', label: '店頭' },
                    { value: 'instagram_store', label: 'Instagram（お店のアカウント）' },
                    { value: 'instagram_personal', label: 'Instagram（個人アカウント）' },
                    { value: 'hotpepper', label: 'ホットペッパー' },
                    { value: 'youtube', label: 'YouTube' },
                    { value: 'google', label: 'Google' },
                    { value: 'tiktok', label: 'TikTok' },
                    { value: 'referral', label: 'ご紹介' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        value={option.value}
                        {...register('source_type')}
                        className="w-4 h-4 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>

                {sourceType === 'instagram_personal' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      誰のアカウント
                    </label>
                    <input
                      type="text"
                      {...register('instagram_account')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="アカウント名を入力"
                    />
                  </div>
                )}

                {sourceType === 'referral' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ご紹介者様のお名前
                    </label>
                    <input
                      type="text"
                      {...register('referral_person')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="お名前を入力"
                    />
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">頭皮・アレルギーについて</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    頭皮がシミやすい/アレルギー等ございますか？
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        value="true"
                        {...register('has_scalp_sensitivity', { setValueAs: v => v === 'true' })}
                        className="w-4 h-4 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-gray-700">はい</span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        value="false"
                        {...register('has_scalp_sensitivity', { setValueAs: v => v === 'true' })}
                        className="w-4 h-4 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-gray-700">いいえ</span>
                    </label>
                  </div>
                </div>

                {hasScalpSensitivity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      どのような症状ですか？
                    </label>
                    <textarea
                      {...register('scalp_sensitivity_details')}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="症状を詳しく教えてください"
                    />
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">施術履歴</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    前回の美容室での施術内容
                  </label>
                  <input
                    type="text"
                    {...register('last_salon_date')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-2"
                    placeholder="いつ頃（例：2024年1月）"
                  />
                  <textarea
                    {...register('last_salon_treatment')}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="施術内容を教えてください"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    今まで行ったことがあるお薬を使った施術内容（複数選択可）
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'カラー',
                      'ブリーチ',
                      '白髪染め/黒染め',
                      '縮毛矯正',
                      '酸熱トリートメント',
                      'ストレートパーマ',
                      'パーマ',
                    ].map((treatment) => (
                      <label key={treatment} className="flex items-center space-x-2 p-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          value={treatment}
                          {...register('past_treatments')}
                          className="w-4 h-4 text-pink-500 focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-700">{treatment}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  戻る
                </button>
              )}
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors ml-auto"
                >
                  次へ
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors ml-auto"
                >
                  {isSubmitting ? '送信中...' : '送信する'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}