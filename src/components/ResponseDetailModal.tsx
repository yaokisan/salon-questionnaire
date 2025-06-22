'use client'

import { QuestionnaireResponse } from '@/types/questionnaire'
import { X, User, MapPin, Phone, Calendar, Instagram, Users, AlertCircle } from 'lucide-react'

interface ResponseDetailModalProps {
  response: QuestionnaireResponse | null
  isOpen: boolean
  onClose: () => void
}

export default function ResponseDetailModal({ response, isOpen, onClose }: ResponseDetailModalProps) {
  if (!isOpen || !response) return null

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      storefront: '店頭',
      instagram_store: 'Instagram（店舗アカウント）',
      instagram_personal: 'Instagram（個人アカウント）',
      hotpepper: 'ホットペッパー',
      youtube: 'YouTube',
      google: 'Google',
      tiktok: 'TikTok',
      referral: 'ご紹介',
      unknown: '未選択'
    }
    return labels[source] || source
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAge = () => {
    if (!response.birth_year) return '-'
    const currentYear = new Date().getFullYear()
    return `${currentYear - response.birth_year}歳`
  }

  const getBirthDate = () => {
    if (!response.birth_year || !response.birth_month || !response.birth_day) return '-'
    return `${response.birth_year}年${response.birth_month}月${response.birth_day}日`
  }

  const getLastSalonDate = () => {
    if (!response.last_salon_year && !response.last_salon_month) return '初回'
    if (response.last_salon_year && response.last_salon_month) {
      return `${response.last_salon_year}年${response.last_salon_month}月`
    }
    if (response.last_salon_year) {
      return `${response.last_salon_year}年`
    }
    return '-'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">アンケート詳細</h2>
            <p className="text-sm text-gray-600">回答日時: {formatDate(response.created_at!)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 基本情報 */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <User className="mr-2" size={20} />
                  基本情報
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">氏名:</span>
                    <span className="text-gray-900">{response.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">ふりがな:</span>
                    <span className="text-gray-900">{response.furigana || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">生年月日:</span>
                    <span className="text-gray-900">{getBirthDate()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">年齢:</span>
                    <span className="text-gray-900">{getAge()}</span>
                  </div>
                </div>
              </div>

              {/* 連絡先情報 */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                  <MapPin className="mr-2" size={20} />
                  連絡先情報
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">郵便番号:</span>
                    <span className="text-gray-900">{response.postal_code || '-'}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-gray-700">住所:</span>
                    <span className="text-gray-900 text-sm break-words">
                      {response.address || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">電話番号:</span>
                    <span className="text-gray-900 flex items-center">
                      <Phone className="mr-1" size={16} />
                      {response.phone || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* アレルギー情報 */}
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                  <AlertCircle className="mr-2" size={20} />
                  アレルギー情報
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">頭皮アレルギー:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      response.has_scalp_sensitivity 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {response.has_scalp_sensitivity ? 'あり' : 'なし'}
                    </span>
                  </div>
                  {response.has_scalp_sensitivity && response.scalp_sensitivity_details && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-gray-700">症状詳細:</span>
                      <span className="text-gray-900 text-sm bg-white p-2 rounded border">
                        {response.scalp_sensitivity_details}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 来店・施術情報 */}
            <div className="space-y-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                  <Instagram className="mr-2" size={20} />
                  来店きっかけ
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">きっかけ:</span>
                    <span className="text-gray-900">{getSourceLabel(response.source_type || '')}</span>
                  </div>
                  {response.source_type === 'instagram_personal' && response.instagram_account && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">アカウント名:</span>
                      <span className="text-gray-900">@{response.instagram_account}</span>
                    </div>
                  )}
                  {response.source_type === 'referral' && response.referral_person && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">ご紹介者:</span>
                      <span className="text-gray-900 flex items-center">
                        <Users className="mr-1" size={16} />
                        {response.referral_person}様
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 施術履歴 */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                  <Calendar className="mr-2" size={20} />
                  施術履歴
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">前回来店:</span>
                    <span className="text-gray-900">{getLastSalonDate()}</span>
                  </div>
                  {response.last_salon_treatment && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-gray-700">前回施術内容:</span>
                      <span className="text-gray-900 text-sm bg-white p-2 rounded border">
                        {response.last_salon_treatment}
                      </span>
                    </div>
                  )}
                  {response.past_treatments && response.past_treatments.length > 0 && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-gray-700">過去の施術:</span>
                      <div className="flex flex-wrap gap-1">
                        {response.past_treatments.map((treatment, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white text-xs rounded border text-gray-800"
                          >
                            {treatment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* システム情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">システム情報</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">回答ID:</span>
                    <span className="text-gray-800 font-mono">{response.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">作成日時:</span>
                    <span className="text-gray-800">{formatDate(response.created_at!)}</span>
                  </div>
                  {response.updated_at && response.updated_at !== response.created_at && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">更新日時:</span>
                      <span className="text-gray-800">{formatDate(response.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}