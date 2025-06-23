import { redirect } from 'next/navigation'

export default function Home() {
  // トップページは管理者ログインにリダイレクト
  redirect('/admin/login')
}