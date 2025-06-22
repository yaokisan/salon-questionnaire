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

    const { data: responses, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching responses:', error)
      return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json(responses)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}