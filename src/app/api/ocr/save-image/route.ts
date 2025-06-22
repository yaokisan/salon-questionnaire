import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadOCRImage, validateImageFile } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const questionnaireId = formData.get('questionnaire_id') as string
    const ocrText = formData.get('ocr_text') as string
    
    if (!file || !questionnaireId || !ocrText) {
      return NextResponse.json({ error: '必要なデータが不足しています' }, { status: 400 })
    }

    // ファイルバリデーション
    try {
      validateImageFile(file, 10) // 最大10MB
    } catch (validationError) {
      return NextResponse.json({ 
        error: validationError instanceof Error ? validationError.message : 'ファイルが無効です' 
      }, { status: 400 })
    }

    // Supabase Storageに画像をアップロード
    const imageUrl = await uploadOCRImage(file, questionnaireId)

    // OCR画像情報をデータベースに保存
    const { error: imageError } = await supabase
      .from('ocr_images')
      .insert([{
        questionnaire_id: parseInt(questionnaireId),
        image_url: imageUrl,
        ocr_text: ocrText,
      }])

    if (imageError) {
      console.error('Error saving OCR image:', imageError)
      return NextResponse.json({ error: 'OCR画像の保存に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'OCR画像が正常に保存されました',
      imageUrl 
    })

  } catch (error) {
    console.error('Save image error:', error)
    return NextResponse.json(
      { error: 'OCR画像の保存中にエラーが発生しました' },
      { status: 500 }
    )
  }
}