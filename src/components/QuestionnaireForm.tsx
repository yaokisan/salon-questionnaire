'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { questionnaireSchema } from '@/lib/validations'
import { QuestionnaireResponse } from '@/types/questionnaire'
import { fetchAddressFromPostalCode, generateFurigana, formatPostalCode, formatPhoneNumber } from '@/lib/utils'

type FormData = {
  furigana: string
  name: string
  address?: string
  postal_code: string
  phone: string
  birth_year: number
  birth_month: number
  birth_day: number
  source_type: 'storefront' | 'instagram_store' | 'instagram_personal' | 'hotpepper' | 'youtube' | 'google' | 'tiktok' | 'referral'
  instagram_account?: string
  referral_person?: string
  has_scalp_sensitivity: boolean
  scalp_sensitivity_details?: string
  last_salon_year?: number
  last_salon_month?: number
  last_salon_treatment?: string
  past_treatments?: string[]
}

export default function QuestionnaireForm() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(questionnaireSchema),
    mode: 'onChange',
  })

  const sourceType = watch('source_type')
  const hasScalpSensitivity = watch('has_scalp_sensitivity')
  const watchedName = watch('name')
  const watchedPostalCode = watch('postal_code')

  // 氏名変更時にふりがなを自動生成
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const furigana = generateFurigana(name)
    if (furigana) {
      setValue('furigana', furigana)
    }
  }

  // 郵便番号変更時に住所を自動取得
  const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value)
    setValue('postal_code', formatted)
    
    if (formatted.length === 8) { // 000-0000 format
      const address = await fetchAddressFromPostalCode(formatted)
      if (address) {
        setValue('address', address)
      }
    }
  }

  // 電話番号フォーマット
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setValue('phone', formatted)
  }

  // ステップ進行時のバリデーション
  const handleNextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = []
    
    switch (step) {
      case 1:
        fieldsToValidate = ['name', 'furigana', 'postal_code', 'phone', 'birth_year', 'birth_month', 'birth_day']
        break
      case 2:
        fieldsToValidate = ['source_type']
        break
      case 3:
        fieldsToValidate = ['has_scalp_sensitivity']
        break
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setStep(step + 1)
    }
  }

  const onSubmit = async (data: FormData) => {
    setShowConfirmation(true)
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    const data = watch()
    
    try {
      const response = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSubmitted(true)
        setShowConfirmation(false)
      } else {
        const errorData = await response.json()
        console.error('Error submitting questionnaire:', errorData)
        alert(errorData.error || '送信中にエラーが発生しました。もう一度お試しください。')
      }
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

  if (showConfirmation) {
    const data = watch()
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              入力内容の確認
            </h2>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">氏名</label>
                  <p className="text-gray-900">{data.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ふりがな</label>
                  <p className="text-gray-900">{data.furigana}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">住所</label>
                <p className="text-gray-900">〒{data.postal_code} {data.address}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">電話番号</label>
                <p className="text-gray-900">{data.phone}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">生年月日</label>
                <p className="text-gray-900">{data.birth_year}年{data.birth_month}月{data.birth_day}日</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">来店きっかけ</label>
                <p className="text-gray-900">{getSourceLabel(data.source_type)}</p>
                {data.source_type === 'instagram_personal' && data.instagram_account && (
                  <p className="text-sm text-gray-600">アカウント: {data.instagram_account}</p>
                )}
                {data.source_type === 'referral' && data.referral_person && (
                  <p className="text-sm text-gray-600">ご紹介者: {data.referral_person}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">アレルギー</label>
                <p className="text-gray-900">{data.has_scalp_sensitivity ? 'はい' : 'いいえ'}</p>
                {data.has_scalp_sensitivity && data.scalp_sensitivity_details && (
                  <p className="text-sm text-gray-600">詳細: {data.scalp_sensitivity_details}</p>
                )}
              </div>
              
              {(data.last_salon_year || data.last_salon_treatment) && (
                <div>
                  <label className="text-sm font-medium text-gray-700">前回施術</label>
                  <p className="text-gray-900">
                    {data.last_salon_year && data.last_salon_month && `${data.last_salon_year}年${data.last_salon_month}月頃`}
                  </p>
                  {data.last_salon_treatment && (
                    <p className="text-sm text-gray-600">内容: {data.last_salon_treatment}</p>
                  )}
                </div>
              )}
              
              {data.past_treatments && data.past_treatments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">過去の施術</label>
                  <p className="text-gray-900">{data.past_treatments.join(', ')}</p>
                </div>
              )}
            </div>
            
            <p className="text-center text-gray-600 mb-6">
              上記の内容で送信してよろしいですか？
            </p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                修正する
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isSubmitting ? '送信中...' : '送信する'}
              </button>
            </div>
          </div>
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
                    氏名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    onChange={handleNameChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="山田 太郎"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ふりがな <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('furigana')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="やまだ たろう"
                  />
                  {errors.furigana && (
                    <p className="text-red-500 text-sm mt-1">{errors.furigana.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    郵便番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('postal_code')}
                    onChange={handlePostalCodeChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="〒000-0000"
                    maxLength={8}
                  />
                  {errors.postal_code && (
                    <p className="text-red-500 text-sm mt-1">{errors.postal_code.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    住所
                  </label>
                  <input
                    type="text"
                    {...register('address')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="大阪府大阪市..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    onChange={handlePhoneChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="090-0000-0000"
                    maxLength={13}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生年月日 <span className="text-red-500">*</span>
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
                  {(errors.birth_year || errors.birth_month || errors.birth_day) && (
                    <p className="text-red-500 text-sm mt-1">生年月日を正しく入力してください</p>
                  )}
                </div>

              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">当店を知ったきっかけ <span className="text-red-500">*</span></h2>
                
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
                {errors.source_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.source_type.message}</p>
                )}

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
                    頭皮がシミやすい/アレルギー等ございますか？ <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="has_scalp_sensitivity"
                        value="true"
                        onChange={(e) => setValue('has_scalp_sensitivity', true)}
                        className="w-4 h-4 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-gray-700">はい</span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="has_scalp_sensitivity"
                        value="false"
                        onChange={(e) => setValue('has_scalp_sensitivity', false)}
                        className="w-4 h-4 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-gray-700">いいえ</span>
                    </label>
                  </div>
                  {errors.has_scalp_sensitivity && (
                    <p className="text-red-500 text-sm mt-1">{errors.has_scalp_sensitivity.message}</p>
                  )}
                </div>

                {hasScalpSensitivity === true && (
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
                    前回の美容室での施術時期
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      {...register('last_salon_year', { valueAsNumber: true })}
                      className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">年を選択</option>
                      {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                        <option key={year} value={year}>{year}年</option>
                      ))}
                    </select>
                    <select
                      {...register('last_salon_month', { valueAsNumber: true })}
                      className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">月を選択</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month}月</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    施術内容
                  </label>
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
                  onClick={handleNextStep}
                  className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors ml-auto"
                >
                  次へ
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors ml-auto"
                >
                  内容を確認する
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function getSourceLabel(source: string) {
  const labels: Record<string, string> = {
    storefront: '店頭',
    instagram_store: 'Instagram（店舗）',
    instagram_personal: 'Instagram（個人）',
    hotpepper: 'ホットペッパー',
    youtube: 'YouTube',
    google: 'Google',
    tiktok: 'TikTok',
    referral: 'ご紹介',
  }
  return labels[source] || source
}