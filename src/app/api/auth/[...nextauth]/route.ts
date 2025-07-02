import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions: NextAuthOptions = {
  debug: true, // デバッグモードを有効化
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn attempt:', { email: user.email, name: user.name })
      
      if (!user.email) {
        console.log('No email provided')
        return false
      }

      try {
        // admin_usersテーブルでメールアドレスを確認
        console.log('Checking admin_users table for:', user.email)
        const { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('google_email', user.email)
          .eq('is_active', true)
          .single()

        console.log('Admin user query result:', { adminUser, error })

        if (error || !adminUser) {
          // 初期マスターユーザーの場合は自動登録
          console.log('Checking if master email:', user.email, '===', process.env.INITIAL_MASTER_EMAIL)
          if (user.email === process.env.INITIAL_MASTER_EMAIL) {
            console.log('Creating master user...')
            const { error: insertError } = await supabase
              .from('admin_users')
              .insert({
                name: user.name || 'Master Admin',
                email: user.email,
                google_email: user.email,
                role: 'master',
                is_active: true,
                created_by: 'system'
              })
            
            if (insertError) {
              console.error('Failed to create master user:', insertError)
              return false
            }
            console.log('Master user created successfully')
            return true
          }
          console.log('User not authorized:', user.email)
          return false
        }

        console.log('User authorized:', adminUser)
        return true
      } catch (error) {
        console.error('Auth error:', error)
        return false
      }
    },
    async session({ session, token }) {
      if (session.user?.email) {
        // セッションに管理者情報を追加
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id, role, name')
          .eq('google_email', session.user.email)
          .single()

        if (adminUser) {
          session.user.id = adminUser.id
          session.user.role = adminUser.role
          session.user.name = adminUser.name
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }