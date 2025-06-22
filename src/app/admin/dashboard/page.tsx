'use client'

import { useState, useEffect, useCallback } from 'react'
import { QuestionnaireResponse } from '@/types/questionnaire'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Eye, Calendar, Filter, BarChart3, Users, TrendingUp } from 'lucide-react'
import ResponseDetailModal from '@/components/ResponseDetailModal'

export default function AdminDashboard() {
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([])
  const [filteredResponses, setFilteredResponses] = useState<QuestionnaireResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<QuestionnaireResponse | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    fetchResponses()
  }, [])

  const fetchResponses = async () => {
    try {
      const response = await fetch('/api/admin/responses')
      if (response.ok) {
        const data = await response.json()
        setResponses(data)
      }
    } catch (error) {
      console.error('Error fetching responses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterResponses = useCallback(() => {
    let filtered = [...responses]

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate: Date | null = null
      let endDate: Date | null = null

      switch (dateFilter) {
        case 'today':
          startDate = new Date()
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date()
          endDate.setHours(23, 59, 59, 999)
          break
        case 'week':
          startDate = new Date()
          startDate.setDate(now.getDate() - 7)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date()
          endDate.setHours(23, 59, 59, 999)
          break
        case 'month':
          startDate = new Date()
          startDate.setMonth(now.getMonth() - 1)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date()
          endDate.setHours(23, 59, 59, 999)
          break
        case 'custom':
          if (customStartDate) {
            startDate = new Date(customStartDate)
            startDate.setHours(0, 0, 0, 0)
          }
          if (customEndDate) {
            endDate = new Date(customEndDate)
            endDate.setHours(23, 59, 59, 999)
          }
          break
      }
      
      if (startDate) {
        filtered = filtered.filter(response => 
          new Date(response.created_at!) >= startDate!
        )
      }
      if (endDate) {
        filtered = filtered.filter(response => 
          new Date(response.created_at!) <= endDate!
        )
      }
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(response => response.source_type === sourceFilter)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())

    setFilteredResponses(filtered)
  }, [responses, dateFilter, sourceFilter, customStartDate, customEndDate])

  useEffect(() => {
    filterResponses()
  }, [filterResponses])

  const getSourceData = () => {
    const sourceCounts: Record<string, number> = {}
    filteredResponses.forEach(response => {
      const source = response.source_type || 'unknown'
      sourceCounts[source] = (sourceCounts[source] || 0) + 1
    })

    return Object.entries(sourceCounts).map(([name, value]) => ({
      name: getSourceLabel(name),
      value
    }))
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      storefront: '店頭',
      instagram_store: 'Instagram（店舗）',
      instagram_personal: 'Instagram（個人）',
      hotpepper: 'ホットペッパー',
      youtube: 'YouTube',
      google: 'Google',
      tiktok: 'TikTok',
      referral: 'ご紹介',
      unknown: '未選択'
    }
    return labels[source] || source
  }

  const getAgeData = () => {
    const ageCounts: Record<string, number> = {}
    filteredResponses.forEach(response => {
      if (response.birth_year) {
        const currentYear = new Date().getFullYear()
        const age = currentYear - response.birth_year
        const ageGroup = Math.floor(age / 10) * 10
        const ageKey = `${ageGroup}代`
        ageCounts[ageKey] = (ageCounts[ageKey] || 0) + 1
      }
    })

    return Object.entries(ageCounts).map(([age, count]) => ({
      age,
      count
    }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

  // Event handlers
  const handleRowClick = (response: QuestionnaireResponse) => {
    setSelectedResponse(response)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedResponse(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">管理者ダッシュボード</h1>
              <p className="text-gray-600">BELO OSAKA アンケート管理</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">全回答数</p>
              <p className="text-2xl font-bold text-blue-600">{responses.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* フィルター */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="mr-2" size={20} />
            <h2 className="text-lg font-semibold">検索・フィルター</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期間</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全期間</option>
                <option value="today">今日</option>
                <option value="week">過去1週間</option>
                <option value="month">過去1ヶ月</option>
                <option value="custom">カスタム期間</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">来店きっかけ</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="storefront">店頭</option>
                <option value="instagram_store">Instagram（店舗）</option>
                <option value="instagram_personal">Instagram（個人）</option>
                <option value="hotpepper">ホットペッパー</option>
                <option value="youtube">YouTube</option>
                <option value="google">Google</option>
                <option value="tiktok">TikTok</option>
                <option value="referral">ご紹介</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">表示件数</label>
              <div className="text-sm text-gray-600 py-2">
                {filteredResponses.length}件 / {responses.length}件
              </div>
            </div>
          </div>
          
          {/* カスタム期間選択 */}
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* 回答一覧（メインセクション） */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="mr-2" size={20} />
                <h3 className="text-lg font-semibold">アンケート回答一覧</h3>
              </div>
              <div className="text-sm text-gray-600">
                {filteredResponses.length}件表示中
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">回答日時</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">氏名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ふりがな</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">年齢</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話番号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">来店きっかけ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アレルギー</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResponses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      該当するアンケート回答がありません
                    </td>
                  </tr>
                ) : (
                  filteredResponses.map((response) => (
                    <tr 
                      key={response.id} 
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(response)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(response.created_at!).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {response.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {response.furigana || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {response.birth_year ? `${new Date().getFullYear() - response.birth_year}歳` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {response.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {response.source_type ? getSourceLabel(response.source_type) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {response.has_scalp_sensitivity ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            あり
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            なし
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(response)
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        >
                          <Eye className="mr-1" size={16} />
                          詳細
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分析セクション（折りたたみ可能） */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center">
                <BarChart3 className="mr-2" size={20} />
                <h3 className="text-lg font-semibold">分析・統計</h3>
              </div>
              <TrendingUp 
                className={`transform transition-transform ${showAnalytics ? 'rotate-180' : ''}`} 
                size={20} 
              />
            </button>
          </div>

          {showAnalytics && (
            <div className="p-6">
              {/* 統計カード */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-blue-700">表示中の回答</h3>
                  <p className="text-3xl font-bold text-blue-600">{filteredResponses.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-green-700">今日の回答</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {responses.filter(r => {
                      const today = new Date()
                      const responseDate = new Date(r.created_at!)
                      return responseDate.toDateString() === today.toDateString()
                    }).length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-purple-700">今週の回答</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {responses.filter(r => {
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return new Date(r.created_at!) >= weekAgo
                    }).length}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-red-700">アレルギーあり</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {filteredResponses.filter(r => r.has_scalp_sensitivity).length}
                  </p>
                </div>
              </div>

              {/* チャート */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 来店きっかけ円グラフ */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">来店きっかけ分布</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getSourceData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getSourceData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 年代別棒グラフ */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">年代別分布</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getAgeData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 詳細表示モーダル */}
        <ResponseDetailModal
          response={selectedResponse}
          isOpen={showDetailModal}
          onClose={closeDetailModal}
        />
      </div>
    </div>
  )
}