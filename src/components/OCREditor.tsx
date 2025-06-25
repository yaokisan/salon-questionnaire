'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ocrFormSchema } from '@/lib/validations'
import { QuestionnaireResponse } from '@/types/questionnaire'
import { Upload, RotateCcw, Save, Eye } from 'lucide-react'
import { filterHiraganaOnly, generateFurigana } from '@/lib/utils'

type FormData = {
  furigana?: string
  name?: string
  last_name?: string
  first_name?: string
  last_name_furigana?: string
  first_name_furigana?: string
  address?: string
  postal_code?: string
  phone?: string
  birth_year?: number
  birth_month?: number
  birth_day?: number
  source_type?: 'storefront' | 'instagram_store' | 'instagram_personal' | 'hotpepper' | 'youtube' | 'google' | 'tiktok' | 'referral'
  instagram_account?: string
  referral_person?: string
  has_scalp_sensitivity?: boolean
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
    resolver: zodResolver(ocrFormSchema),
    mode: 'onChange',
  })

  const sourceType = watch('source_type')
  const hasScalpSensitivity = watch('has_scalp_sensitivity')
  const watchedLastName = watch('last_name')
  const watchedFirstName = watch('first_name')

  // IME入力状態を管理
  const isComposingRef = useRef(false)

  // ふりがなフィールドの入力制限（ひらがなのみ）
  const handleFuriganaCompositionStart = () => {
    isComposingRef.current = true
  }

  const handleFuriganaCompositionEnd = (field: 'last_name_furigana' | 'first_name_furigana') => (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false
    const target = e.currentTarget
    const filtered = filterHiraganaOnly(target.value)
    if (target.value !== filtered) {
      target.value = filtered
      setValue(field, filtered, { shouldValidate: true })
      updateCombinedFields()
    }
  }

  const handleFuriganaInput = (field: 'last_name_furigana' | 'first_name_furigana') => (e: React.FormEvent<HTMLInputElement>) => {
    // IME入力中は処理しない
    if (isComposingRef.current) return
    
    const target = e.currentTarget
    const filtered = filterHiraganaOnly(target.value)
    if (target.value !== filtered) {
      target.value = filtered
      setValue(field, filtered, { shouldValidate: true })
      updateCombinedFields()
    }
  }

  // 姓・名から結合フィールドを更新
  const updateCombinedFields = () => {
    const lastName = watch('last_name') || ''
    const firstName = watch('first_name') || ''
    const lastNameFurigana = watch('last_name_furigana') || ''
    const firstNameFurigana = watch('first_name_furigana') || ''
    
    setValue('name', `${lastName} ${firstName}`.trim())
    setValue('furigana', `${lastNameFurigana} ${firstNameFurigana}`.trim())
  }

  // 姓・名変更時にふりがなを自動生成
  useEffect(() => {
    const lastName = watchedLastName || ''
    const firstName = watchedFirstName || ''
    
    if (lastName || firstName) {
      const { lastNameFurigana, firstNameFurigana, fullFurigana } = generateFurigana(lastName, firstName)
      
      if (lastNameFurigana && !watch('last_name_furigana')) {
        setValue('last_name_furigana', lastNameFurigana)
      }
      
      if (firstNameFurigana && !watch('first_name_furigana')) {
        setValue('first_name_furigana', firstNameFurigana)
      }
      
      setValue('name', `${lastName} ${firstName}`.trim())
      if (fullFurigana) {
        setValue('furigana', fullFurigana)
      }
    }
  }, [watchedLastName, watchedFirstName])

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
            const fieldKey = key as keyof FormData
            setValue(fieldKey, value as FormData[keyof FormData])
          }
        })
        
        // 結合フィールドから分離フィールドを生成
        if (data.parsedData.name && !data.parsedData.last_name) {
          const nameParts = data.parsedData.name.split(' ')
          if (nameParts.length >= 2) {
            setValue('last_name', nameParts[0])
            setValue('first_name', nameParts.slice(1).join(' '))
          }
        }
        
        if (data.parsedData.furigana && !data.parsedData.last_name_furigana) {
          const furiganaParts = data.parsedData.furigana.split(' ')
          if (furiganaParts.length >= 2) {
            setValue('last_name_furigana', furiganaParts[0])
            setValue('first_name_furigana', furiganaParts.slice(1).join(' '))
          }
        }
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
      // アンケートデータをデータベースに保存
      const response = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        const questionnaireId = result.id

        // OCR画像がある場合は画像情報も保存
        if (selectedFile && imagePreview && extractedText) {
          const imageFormData = new FormData()
          imageFormData.append('image', selectedFile)
          imageFormData.append('questionnaire_id', questionnaireId.toString())
          imageFormData.append('ocr_text', extractedText)

          const imageResponse = await fetch('/api/ocr/save-image', {
            method: 'POST',
            body: imageFormData,
          })

          if (!imageResponse.ok) {
            console.error('Error saving OCR image')
          }
        }

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
      <div className="flex items-center justify-center py-16">
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
    <>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">アンケート読み取り・編集</h2>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  氏名
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      {...register('last_name')}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="姓（例：山田）"
                    />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      {...register('first_name')}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="名（例：太郎）"
                    />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ふりがな
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      {...register('last_name_furigana')}
                      onCompositionStart={handleFuriganaCompositionStart}
                      onCompositionEnd={handleFuriganaCompositionEnd('last_name_furigana')}
                      onInput={handleFuriganaInput('last_name_furigana')}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="姓ふりがな（例：やまだ）"
                    />
                    {errors.last_name_furigana && <p className="text-red-500 text-xs mt-1">{errors.last_name_furigana.message}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      {...register('first_name_furigana')}
                      onCompositionStart={handleFuriganaCompositionStart}
                      onCompositionEnd={handleFuriganaCompositionEnd('first_name_furigana')}
                      onInput={handleFuriganaInput('first_name_furigana')}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="名ふりがな（例：たろう）"
                    />
                    {errors.first_name_furigana && <p className="text-red-500 text-xs mt-1">{errors.first_name_furigana.message}</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    郵便番号
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
                    電話番号
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
                  生年月日
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
                  来店きっかけ
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
                  頭皮アレルギーの有無
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="true"
                      checked={hasScalpSensitivity === true}
                      onChange={() => setValue('has_scalp_sensitivity', true)}
                      className="mr-2"
                    />
                    はい
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="false"
                      checked={hasScalpSensitivity === false}
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
    </>
  )
}