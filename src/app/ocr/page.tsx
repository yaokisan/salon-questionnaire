import OCREditor from '@/components/OCREditor'
import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'

export default function OCRPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/dashboard"
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="mr-2" size={16} />
                ダッシュボードに戻る
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">OCR読み取り</h1>
                <p className="text-gray-600">紙のアンケートをデジタル化</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Home className="text-gray-400" size={20} />
              <span className="text-sm text-gray-600">BELO OSAKA アンケート管理</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* OCRエディター */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <OCREditor />
      </div>
    </div>
  )
}