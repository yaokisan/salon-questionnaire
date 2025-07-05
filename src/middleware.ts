import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // 管理画面へのアクセスは認証が必要
        if (req.nextUrl.pathname.startsWith('/admin')) {
          // ログインページは除外
          if (req.nextUrl.pathname === '/admin/login') {
            return true
          }
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*']
}