import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('Login attempt:', { email, password: '***' })

    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()

    console.log('Database query result:', { admin: admin ? 'found' : 'not found', error })

    if (error || !admin) {
      console.log('User not found or database error:', error)
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash)

    console.log('Password validation:', { isPasswordValid, storedHash: admin.password_hash.substring(0, 20) + '...' })

    if (!isPasswordValid) {
      console.log('Password validation failed')
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true })
    
    response.cookies.set('admin-session', admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
}