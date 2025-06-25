'use client'

import { useState, useEffect, useRef } from 'react'
import { QuestionnaireResponse } from '@/types/questionnaire'
import { X, Save, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { questionnaireSchema, ocrFormSchema } from '@/lib/validations'
import { filterHiraganaOnly } from '@/lib/utils'

interface ResponseEditModalProps {
  response: QuestionnaireResponse | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedResponse: QuestionnaireResponse) => void
}

interface ImageModalProps {
  imageUrl: string | null
  isOpen: boolean
  onClose: () => void
}

function ImageModal({ imageUrl, isOpen, onClose }: ImageModalProps) {
  if (!isOpen || !imageUrl) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors z-10"
        >
          <X size={24} />
        </button>
        <img
          src={imageUrl}
          alt="OCR画像拡大表示"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}

export default function ResponseEditModal({ response, isOpen, onClose, onSave }: ResponseEditModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch
  } = useForm<QuestionnaireResponse>({
    resolver: zodResolver(response?.is_ocr ? ocrFormSchema : questionnaireSchema),
    mode: 'onChange'
  })

  const sourceType = watch('source_type')
  const hasScalpSensitivity = watch('has_scalp_sensitivity')

  useEffect(() => {
    if (response) {
      reset(response)
    }
  }, [response, reset])

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
    }
  }

  if (!isOpen || !response) return null

  const onSubmit = async (data: QuestionnaireResponse) => {
    setIsSaving(true)
    setError('')

    try {
      const updateData = {
        ...data,
        id: response.id,
        updated_at: new Date().toISOString()
      }

      const res = await fetch(`/api/admin/responses/${response.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        const updated = await res.json()
        onSave({ ...response, ...updated })
        onClose()
      } else {
        const errorData = await res.json()
        setError(errorData.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('Update error:', error)
      setError('更新中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">アンケート編集</h2>
            <p className="text-sm text-gray-600">ID: {response.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <X size={24} />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* OCR画像（左側） - OCRの場合のみ表示 */}
          {response.is_ocr && response.ocr_image && (
            <div className="w-full lg:w-1/3 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">OCR元画像</h3>
              <div className="sticky top-0">
                <img
                  src={response.ocr_image.image_url}
                  alt="OCR元画像"
                  className="w-full h-auto rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setShowImageModal(true)}
                />
                <p className="text-xs text-gray-600 mt-2 text-center">
                  画像をクリックして拡大表示
                </p>
              </div>
            </div>
          )}

          {/* フォーム（右側） */}
          <div className={`flex-1 p-6 overflow-y-auto ${response.is_ocr && response.ocr_image ? 'lg:w-2/3' : 'w-full'}`}>
          <form 
            onSubmit={handleSubmit(onSubmit)}
          >
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                <AlertCircle className="mr-2" size={20} />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">基本情報</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  氏名 {!response.is_ocr && <span className="text-red-500">*</span>}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      {...register('last_name')}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="姓"
                    />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      {...register('first_name')}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="名"
                    />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ふりがな {!response.is_ocr && <span className="text-red-500">*</span>}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      {...register('last_name_furigana')}
                      onCompositionStart={handleFuriganaCompositionStart}
                      onCompositionEnd={handleFuriganaCompositionEnd('last_name_furigana')}
                      onInput={handleFuriganaInput('last_name_furigana')}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="姓ふりがな"
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
                      placeholder="名ふりがな"
                    />
                    {errors.first_name_furigana && <p className="text-red-500 text-xs mt-1">{errors.first_name_furigana.message}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  生年月日 {!response.is_ocr && <span className="text-red-500">*</span>}
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
            </div>

            {/* 連絡先情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">連絡先情報</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  郵便番号 {!response.is_ocr && <span className="text-red-500">*</span>}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号 {!response.is_ocr && <span className="text-red-500">*</span>}
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

            {/* 来店情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">来店情報</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  来店きっかけ {!response.is_ocr && <span className="text-red-500">*</span>}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">誰のアカウント</label>
                  <input
                    type="text"
                    {...register('instagram_account')}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {sourceType === 'referral' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ご紹介者様のお名前</label>
                  <input
                    type="text"
                    {...register('referral_person')}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* アレルギー情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">アレルギー情報</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  頭皮アレルギーの有無 {!response.is_ocr && <span className="text-red-500">*</span>}
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
                {errors.has_scalp_sensitivity && (
                  <p className="text-red-500 text-xs mt-1">{errors.has_scalp_sensitivity.message}</p>
                )}
              </div>

              {hasScalpSensitivity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">症状の詳細</label>
                  <textarea
                    {...register('scalp_sensitivity_details')}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

            {/* OCR情報表示 */}
            {response.is_ocr && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="inline mr-1" size={16} />
                  このアンケートはOCRで読み取られたデータです
                </p>
              </div>
            )}
          </form>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center"
          >
            <Save className="mr-2" size={16} />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>

        {/* 画像拡大モーダル */}
        <ImageModal
          imageUrl={response?.ocr_image?.image_url || null}
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
        />
      </div>
    </div>
  )
}