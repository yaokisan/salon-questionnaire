import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100">
      <div className="text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">BELO OSAKA</h1>
          <p className="text-lg text-gray-600">アンケートシステム</p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/questionnaire"
            className="block w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors"
          >
            アンケートに回答する
          </Link>
          
          <Link 
            href="/admin/login"
            className="block w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors"
          >
            管理者ログイン
          </Link>
          
          <Link 
            href="/admin/ocr"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors"
          >
            紙アンケート読み取り
          </Link>
        </div>
      </div>
    </main>
  )
}