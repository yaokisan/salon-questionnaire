'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Download, QrCode } from 'lucide-react'

export default function QRCodeTab() {
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [questionnaireURL, setQuestionnaireURL] = useState('')

  useEffect(() => {
    // 本番環境のURLを使用
    const url = 'https://salon-questionnaire.vercel.app/questionnaire'
    setQuestionnaireURL(url)
  }, [])

  useEffect(() => {
    if (questionnaireURL) {
      generateQRCode()
    }
  }, [questionnaireURL])

  const generateQRCode = async () => {
    try {
      const canvas = canvasRef.current
      if (canvas) {
        await QRCode.toCanvas(canvas, questionnaireURL, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        
        // データURLも生成（ダウンロード用）
        const dataURL = await QRCode.toDataURL(questionnaireURL, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQRCodeDataURL(dataURL)
      }
    } catch (error) {
      console.error('QRコード生成エラー:', error)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeDataURL) {
      const link = document.createElement('a')
      link.download = 'questionnaire-qrcode.png'
      link.href = qrCodeDataURL
      link.click()
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <QrCode className="mr-3 text-blue-600" size={32} />
              <h2 className="text-2xl font-bold text-gray-800">アンケートQRコード</h2>
            </div>
            <p className="text-gray-600">
              お客様にアンケートへアクセスしていただくためのQRコードです
            </p>
          </div>

          <div className="mb-6">
            <div className="inline-block p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-700 mb-2">アクセス先URL:</p>
            <div className="bg-gray-100 p-3 rounded-lg border">
              <code className="text-sm text-gray-800">{questionnaireURL}</code>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={downloadQRCode}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              <Download className="mr-2" size={20} />
              QRコードを画像でダウンロード
            </button>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>• QRコードを印刷してお店に設置できます</p>
              <p>• お客様のスマートフォンでスキャンしてアンケートにアクセス</p>
              <p>• 画像形式：PNG（300×300px）</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}