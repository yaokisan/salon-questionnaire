import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // セッション確認
    const adminSession = request.cookies.get('admin-session')
    if (!adminSession) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    // is_ocr と ocr_image は更新対象から除外
    delete updateData.is_ocr
    delete updateData.ocr_image
    delete updateData.ocr_images

    const { data, error } = await supabase
      .from('questionnaire_responses')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating response:', error)
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // セッション確認
    const adminSession = request.cookies.get('admin-session')
    if (!adminSession) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // まずOCR画像があれば削除
    const { data: ocrImages } = await supabase
      .from('ocr_images')
      .select('*')
      .eq('questionnaire_id', params.id)

    if (ocrImages && ocrImages.length > 0) {
      // OCR画像をStorageから削除
      for (const ocrImage of ocrImages) {
        const imagePath = ocrImage.image_url.split('/').pop()
        if (imagePath) {
          await supabase.storage
            .from('ocr-images')
            .remove([`${params.id}/${imagePath}`])
        }
      }

      // OCR画像レコードを削除
      await supabase
        .from('ocr_images')
        .delete()
        .eq('questionnaire_id', params.id)
    }

    // アンケート回答を削除
    const { error } = await supabase
      .from('questionnaire_responses')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting response:', error)
      return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}