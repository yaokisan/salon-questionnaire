import { NextRequest, NextResponse } from 'next/server'
import vision from '@google-cloud/vision'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: '画像ファイルが必要です' }, { status: 400 })
    }

    // APIキーがない場合のエラーハンドリング
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      return NextResponse.json({ error: 'Google Cloud Vision APIキーが設定されていません' }, { status: 500 })
    }

    // 画像をbase64に変換
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    // Google Cloud Vision APIクライアント初期化
    const client = new vision.ImageAnnotatorClient({
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
    })

    // OCR実行
    const [result] = await client.textDetection({
      image: {
        content: base64Image,
      },
    })

    const detections = result.textAnnotations
    const extractedText = detections?.[0]?.description || ''

    // 抽出されたテキストを解析してアンケートデータに変換
    const parsedData = parseOCRText(extractedText)

    // 画像をSupabaseに保存（実際の実装では適切なストレージを使用）
    const imageUrl = `data:${file.type};base64,${base64Image}`

    // アンケートデータをデータベースに保存
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('questionnaire_responses')
      .insert([parsedData])
      .select()
      .single()

    if (questionnaireError) {
      console.error('Error saving questionnaire:', questionnaireError)
      return NextResponse.json({ error: 'アンケートデータの保存に失敗しました' }, { status: 500 })
    }

    // OCR画像情報を保存
    const { error: imageError } = await supabase
      .from('ocr_images')
      .insert([{
        questionnaire_id: questionnaire.id,
        image_url: imageUrl,
        ocr_text: extractedText,
      }])

    if (imageError) {
      console.error('Error saving OCR image:', imageError)
    }

    return NextResponse.json({
      extractedText,
      parsedData,
      questionnaireId: questionnaire.id,
    })

  } catch (error) {
    console.error('OCR processing error:', error)
    return NextResponse.json(
      { error: 'OCR処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

function parseOCRText(text: string): any {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line)
  
  const result: any = {}

  // 氏名の抽出
  const namePattern = /氏名\s*([^\s]+)/
  const nameMatch = text.match(namePattern)
  if (nameMatch) {
    result.name = nameMatch[1]
  }

  // ふりがなの抽出
  const furiganaPattern = /ふりがな\s*([^\s]+)/
  const furiganaMatch = text.match(furiganaPattern)
  if (furiganaMatch) {
    result.furigana = furiganaMatch[1]
  }

  // 住所の抽出
  const addressPattern = /住所\s*〒?(\d{3}-?\d{4})?\s*([^\n]+)/
  const addressMatch = text.match(addressPattern)
  if (addressMatch) {
    if (addressMatch[1]) result.postal_code = addressMatch[1]
    if (addressMatch[2]) result.address = addressMatch[2]
  }

  // 電話番号の抽出
  const phonePattern = /電話\s*(\d{2,4}-?\d{2,4}-?\d{3,4})/
  const phoneMatch = text.match(phonePattern)
  if (phoneMatch) {
    result.phone = phoneMatch[1]
  }

  // 生年月日の抽出
  const birthPattern = /生年月日\s*(\d{2,4})\s*年?\s*(\d{1,2})\s*月?\s*(\d{1,2})\s*日?/
  const birthMatch = text.match(birthPattern)
  if (birthMatch) {
    result.birth_year = parseInt(birthMatch[1])
    result.birth_month = parseInt(birthMatch[2])
    result.birth_day = parseInt(birthMatch[3])
  }

  // 来店きっかけの抽出
  if (text.includes('店頭') || text.includes('☑店頭')) {
    result.source_type = 'storefront'
  } else if (text.includes('instagram') || text.includes('Instagram')) {
    if (text.includes('お店のアカウント')) {
      result.source_type = 'instagram_store'
    } else {
      result.source_type = 'instagram_personal'
    }
  } else if (text.includes('ホットペッパー')) {
    result.source_type = 'hotpepper'
  } else if (text.includes('Youtube') || text.includes('YouTube')) {
    result.source_type = 'youtube'
  } else if (text.includes('Google')) {
    result.source_type = 'google'
  } else if (text.includes('TikTok')) {
    result.source_type = 'tiktok'
  } else if (text.includes('ご紹介')) {
    result.source_type = 'referral'
  }

  // ご紹介者名の抽出
  const referralPattern = /ご紹介\s*\(\s*([^)]+)\s*\)/
  const referralMatch = text.match(referralPattern)
  if (referralMatch) {
    result.referral_person = referralMatch[1]
  }

  // アレルギーの抽出
  if (text.includes('はい') && text.includes('アレルギー')) {
    result.has_scalp_sensitivity = true
    
    // アレルギー詳細の抽出
    const allergyPattern = /はい\s*\(\s*([^)]+)\s*\)/
    const allergyMatch = text.match(allergyPattern)
    if (allergyMatch) {
      result.scalp_sensitivity_details = allergyMatch[1]
    }
  } else if (text.includes('いいえ')) {
    result.has_scalp_sensitivity = false
  }

  // 施術履歴の抽出
  const treatments = []
  if (text.includes('カラー')) treatments.push('カラー')
  if (text.includes('ブリーチ')) treatments.push('ブリーチ')
  if (text.includes('白髪染め') || text.includes('黒染め')) treatments.push('白髪染め/黒染め')
  if (text.includes('縮毛矯正')) treatments.push('縮毛矯正')
  if (text.includes('酸熱トリートメント')) treatments.push('酸熱トリートメント')
  if (text.includes('ストレートパーマ')) treatments.push('ストレートパーマ')
  if (text.includes('パーマ')) treatments.push('パーマ')
  
  if (treatments.length > 0) {
    result.past_treatments = treatments
  }

  return result
}