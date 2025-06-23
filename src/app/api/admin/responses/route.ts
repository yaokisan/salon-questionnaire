import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // セッション確認（簡易版）
    const adminSession = request.cookies.get('admin-session')
    if (!adminSession) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // questionnaire_responsesとocr_imagesを結合して取得
    const { data: responses, error } = await supabase
      .from('questionnaire_responses')
      .select(`
        *,
        ocr_images (
          id,
          image_url,
          ocr_text
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching responses:', error)
      return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 })
    }

    // OCR画像がある場合は is_ocr フラグを追加
    const responsesWithOCRFlag = responses?.map(response => ({
      ...response,
      is_ocr: response.ocr_images && response.ocr_images.length > 0,
      ocr_image: response.ocr_images?.[0] || null
    }))

    return NextResponse.json(responsesWithOCRFlag)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}