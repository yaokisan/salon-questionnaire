'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { questionnaireSchema } from '@/lib/validations'
import { QuestionnaireResponse } from '@/types/questionnaire'
import { Upload, RotateCcw, Save, Eye } from 'lucide-react'

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

export default function OCREditor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<any>(null)
  const [extractedText, setExtractedText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(questionnaireSchema),
    mode: 'onChange',
  })

  const sourceType = watch('source_type')
  const hasScalpSensitivity = watch('has_scalp_sensitivity')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // 画像プレビューを生成
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // 自動でOCR処理を開始
      processOCR(file)
    }
  }

  const processOCR = async (file: File) => {
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setOcrResult(data.parsedData)
        setExtractedText(data.extractedText)
        
        // フォームに自動入力
        Object.entries(data.parsedData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            setValue(key as keyof FormData, value as any)
          }
        })
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'OCR処理に失敗しました')
      }
    } catch (error) {
      console.error('OCR error:', error)
      alert('OCR処理中にエラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReprocessOCR = () => {
    if (selectedFile) {
      processOCR(selectedFile)
    }
  }

  const handleReset = () => {
    reset()
    setOcrResult(null)
    setExtractedText('')
  }

  const onSubmit = async (data: FormData) => {
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const errorData = await response.json()
        alert(errorData.error || '保存に失敗しました')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('保存中にエラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">保存完了</h2>
          <p className="text-gray-600 mb-6">
            OCRアンケートが正常に保存されました。
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setSubmitted(false)
                setSelectedFile(null)
                setImagePreview(null)
                handleReset()
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              新しい画像を処理
            </button>
            <button
              onClick={() => window.location.href = '/admin/dashboard'}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              管理画面へ
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">OCR アンケート読み取り・編集</h1>
          <p className="text-gray-600">紙のアンケートをアップロードして自動読み取り、手動で修正できます</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 画像プレビューエリア */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Eye className="mr-2" size={20} />
              画像プレビュー
            </h2>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label className="cursor-pointer">
                  <span className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg inline-block transition-colors">
                    画像をアップロード
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-gray-500 mt-2">JPG, PNG形式の画像をアップロードしてください</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="アップロードされた画像"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
                
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <span className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors inline-block">
                      画像を変更
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  
                  <button
                    onClick={handleReprocessOCR}
                    disabled={isProcessing}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition-colors flex items-center"
                  >
                    <RotateCcw className="mr-1" size={16} />
                    OCR再実行
                  </button>
                </div>
                
                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-600 mt-2">OCR処理中...</p>
                  </div>
                )}
              </div>
            )}
            
            {/* 抽出されたテキスト表示 */}
            {extractedText && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">抽出されたテキスト</h3>
                <div className="bg-gray-50 p-4 rounded border max-h-48 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{extractedText}</pre>
                </div>
              </div>
            )}
          </div>

          {/* 右側: 編集フォームエリア */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">アンケート内容編集</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="山田 太郎"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ふりがな <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('furigana')}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="やまだ たろう"
                  />
                  {errors.furigana && <p className="text-red-500 text-xs mt-1">{errors.furigana.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    郵便番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('postal_code')}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="000-0000"
                  />
                  {errors.postal_code && <p className="text-red-500 text-xs mt-1">{errors.postal_code.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="090-0000-0000"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住所
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="大阪府大阪市..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  生年月日 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    {...register('birth_year', { valueAsNumber: true })}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">年</option>
                    {Array.from({ length: 100 }, (_, i) => 2024 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    {...register('birth_month', { valueAsNumber: true })}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">月</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <select
                    {...register('birth_day', { valueAsNumber: true })}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">日</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                {(errors.birth_year || errors.birth_month || errors.birth_day) && (
                  <p className="text-red-500 text-xs mt-1">生年月日を正しく入力してください</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  来店きっかけ <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('source_type')}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  <option value="storefront">店頭</option>
                  <option value="instagram_store">Instagram（お店のアカウント）</option>
                  <option value="instagram_personal">Instagram（個人アカウント）</option>
                  <option value="hotpepper">ホットペッパー</option>
                  <option value="youtube">YouTube</option>
                  <option value="google">Google</option>
                  <option value="tiktok">TikTok</option>
                  <option value="referral">ご紹介</option>
                </select>
                {errors.source_type && <p className="text-red-500 text-xs mt-1">{errors.source_type.message}</p>}
              </div>

              {sourceType === 'instagram_personal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    誰のアカウント
                  </label>
                  <input
                    type="text"
                    {...register('instagram_account')}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="アカウント名"
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
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="お名前"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  頭皮アレルギーの有無 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="has_scalp_sensitivity"
                      value="true"
                      onChange={() => setValue('has_scalp_sensitivity', true)}
                      className="mr-2"
                    />
                    はい
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="has_scalp_sensitivity"
                      value="false"
                      onChange={() => setValue('has_scalp_sensitivity', false)}
                      className="mr-2"
                    />
                    いいえ
                  </label>
                </div>
                {errors.has_scalp_sensitivity && <p className="text-red-500 text-xs mt-1">{errors.has_scalp_sensitivity.message}</p>}
              </div>

              {hasScalpSensitivity === true && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    症状の詳細
                  </label>
                  <textarea
                    {...register('scalp_sensitivity_details')}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="症状を詳しく教えてください"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="mr-2" size={16} />
                  リセット
                </button>
                
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded transition-colors flex items-center justify-center"
                >
                  <Save className="mr-2" size={16} />
                  {isProcessing ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}