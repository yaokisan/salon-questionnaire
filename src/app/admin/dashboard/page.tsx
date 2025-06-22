'use client'

import { useState, useEffect, useCallback } from 'react'
import { QuestionnaireResponse } from '@/types/questionnaire'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function AdminDashboard() {
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([])
  const [filteredResponses, setFilteredResponses] = useState<QuestionnaireResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

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
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(response => 
        new Date(response.created_at!) >= filterDate
      )
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(response => response.source_type === sourceFilter)
    }

    setFilteredResponses(filtered)
  }, [responses, dateFilter, sourceFilter])

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
    const ageCounts: Record<number, number> = {}
    filteredResponses.forEach(response => {
      if (response.age_group) {
        ageCounts[response.age_group] = (ageCounts[response.age_group] || 0) + 1
      }
    })

    return Object.entries(ageCounts).map(([age, count]) => ({
      age: `${age}代`,
      count
    }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

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
          <h1 className="text-2xl font-bold text-gray-800">管理者ダッシュボード</h1>
          <p className="text-gray-600">BELO OSAKA アンケート管理</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* フィルター */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">フィルター</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期間</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="all">全期間</option>
                <option value="today">今日</option>
                <option value="week">過去1週間</option>
                <option value="month">過去1ヶ月</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">来店きっかけ</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
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
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">総回答数</h3>
            <p className="text-3xl font-bold text-blue-600">{filteredResponses.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">今日の回答</h3>
            <p className="text-3xl font-bold text-green-600">
              {responses.filter(r => {
                const today = new Date()
                const responseDate = new Date(r.created_at!)
                return responseDate.toDateString() === today.toDateString()
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">今週の回答</h3>
            <p className="text-3xl font-bold text-purple-600">
              {responses.filter(r => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(r.created_at!) >= weekAgo
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">アレルギー有り</h3>
            <p className="text-3xl font-bold text-red-600">
              {filteredResponses.filter(r => r.has_scalp_sensitivity).length}
            </p>
          </div>
        </div>

        {/* チャート */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 来店きっかけ円グラフ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">来店きっかけ</h3>
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
          <div className="bg-white rounded-lg shadow p-6">
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

        {/* 回答リスト */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">回答一覧</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">氏名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">年代</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">来店きっかけ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アレルギー</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResponses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(response.created_at!).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {response.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {response.age_group ? `${response.age_group}代` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {response.source_type ? getSourceLabel(response.source_type) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {response.has_scalp_sensitivity ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          有り
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          無し
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}