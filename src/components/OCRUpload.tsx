'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

export default function OCRUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError('')
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'OCR処理に失敗しました')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('アップロード中にエラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              紙アンケート OCR読み取り
            </h1>
            <p className="text-gray-600">
              紙のアンケートの写真をアップロードして自動でデータ化します
            </p>
          </div>

          <div className="space-y-6">
            {/* ファイルアップロード */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-4">
                  <label className="cursor-pointer">
                    <span className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg inline-block transition-colors">
                      ファイルを選択
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  {selectedFile && (
                    <p className="text-sm text-gray-600">
                      選択されたファイル: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* アップロードボタン */}
            {selectedFile && (
              <div className="text-center">
                <button
                  onClick={handleUpload}
                  disabled={isProcessing}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  {isProcessing ? 'OCR処理中...' : 'OCR実行'}
                </button>
              </div>
            )}

            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* 結果表示 */}
            {result && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  OCR処理が完了しました！アンケートデータがデータベースに保存されました。
                </div>

                {/* 抽出されたテキスト */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">抽出されたテキスト</h3>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                    {result.extractedText}
                  </pre>
                </div>

                {/* 解析されたデータ */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">解析されたアンケートデータ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(result.parsedData).map(([key, value]) => (
                      <div key={key} className="bg-white p-3 rounded border">
                        <div className="text-sm font-medium text-gray-700 capitalize">
                          {getFieldLabel(key)}
                        </div>
                        <div className="text-gray-900">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* アクション */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => window.location.href = '/admin/dashboard'}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    管理画面で確認
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setResult(null)
                      setError('')
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    新しい画像をアップロード
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    name: '氏名',
    furigana: 'ふりがな',
    address: '住所',
    postal_code: '郵便番号',
    phone: '電話番号',
    birth_year: '生年',
    birth_month: '生月',
    birth_day: '生日',
    age_group: '年代',
    source_type: '来店きっかけ',
    instagram_account: 'Instagramアカウント',
    referral_person: 'ご紹介者',
    has_scalp_sensitivity: 'アレルギー有無',
    scalp_sensitivity_details: 'アレルギー詳細',
    last_salon_date: '前回施術日',
    last_salon_treatment: '前回施術内容',
    past_treatments: '過去の施術',
  }
  return labels[key] || key
}