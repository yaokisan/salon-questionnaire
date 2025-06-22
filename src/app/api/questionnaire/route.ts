import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    console.log('Questionnaire submission:', data)

    // nameフィールドが必須なので確認
    if (!data.name) {
      return NextResponse.json({ error: '氏名は必須です' }, { status: 400 })
    }

    const { data: questionnaire, error } = await supabase
      .from('questionnaire_responses')
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error('Error saving questionnaire:', error)
      return NextResponse.json({ error: 'アンケートの保存に失敗しました', details: error }, { status: 500 })
    }

    console.log('Questionnaire saved successfully:', questionnaire.id)

    return NextResponse.json({ success: true, id: questionnaire.id })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}