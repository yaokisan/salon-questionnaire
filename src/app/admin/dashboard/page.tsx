'use client'

import { useState, useEffect, useCallback } from 'react'
import { QuestionnaireResponse } from '@/types/questionnaire'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Eye, Calendar, Filter, BarChart3, Users, FileText, Edit, Image, FileSpreadsheet, ChevronLeft, ChevronRight, X, ArrowUpDown, ArrowUp, ArrowDown, PieChart as PieChartIcon, BarChart as BarChartIcon, Trash2, Check, QrCode, LogOut, Camera } from 'lucide-react'
import ResponseDetailModal from '@/components/ResponseDetailModal'
import ResponseEditModal from '@/components/ResponseEditModal'
import QRCodeTab from '@/components/QRCodeTab'
import { signOut, useSession } from 'next-auth/react'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([])
  const [filteredResponses, setFilteredResponses] = useState<QuestionnaireResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'responses' | 'analytics' | 'qrcode' | 'ocr'>('responses')
  const [dateFilter, setDateFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [inputTypeFilter, setInputTypeFilter] = useState<'all' | 'manual' | 'ocr'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<QuestionnaireResponse | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingResponse, setEditingResponse] = useState<QuestionnaireResponse | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(30)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'age'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/admin/login' })
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

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

    // Input type filter (OCR vs Manual)
    if (inputTypeFilter !== 'all') {
      filtered = filtered.filter(response => {
        if (inputTypeFilter === 'ocr') {
          return response.is_ocr === true
        } else {
          return response.is_ocr !== true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
          break
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ja')
          break
        case 'age':
          const ageA = a.birth_year ? new Date().getFullYear() - a.birth_year : 0
          const ageB = b.birth_year ? new Date().getFullYear() - b.birth_year : 0
          comparison = ageA - ageB
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

    setFilteredResponses(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [responses, dateFilter, sourceFilter, inputTypeFilter, customStartDate, customEndDate, sortBy, sortOrder])

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

  // Sorting handler
  const handleSort = (field: 'date' | 'name' | 'age') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: 'date' | 'name' | 'age') => {
    if (sortBy !== field) {
      return <ArrowUpDown size={14} className="ml-1 text-gray-400" />
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-blue-600" />
      : <ArrowDown size={14} className="ml-1 text-blue-600" />
  }

  // Event handlers
  const handleRowClick = (response: QuestionnaireResponse) => {
    setSelectedResponse(response)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedResponse(null)
  }

  const handleEdit = (response: QuestionnaireResponse) => {
    setEditingResponse(response)
    setShowEditModal(true)
  }

  const handleSaveEdit = (updatedResponse: QuestionnaireResponse) => {
    setResponses(prev => prev.map(r => r.id === updatedResponse.id ? updatedResponse : r))
    setShowEditModal(false)
    setEditingResponse(null)
  }

  // 削除機能
  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedResponses.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(paginatedResponses.map(r => r.id!)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return
    
    if (!confirm(`選択した${selectedItems.size}件のアンケート回答を削除しますか？この操作は取り消せません。`)) {
      return
    }

    setIsDeleting(true)
    try {
      const deletePromises = Array.from(selectedItems).map(id =>
        fetch(`/api/admin/responses/${id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      // ローカル状態から削除
      setResponses(prev => prev.filter(r => !selectedItems.has(r.id!)))
      setSelectedItems(new Set())
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除中にエラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteSingle = async (id: string, name: string) => {
    if (!confirm(`「${name}」さんのアンケート回答を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/responses/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setResponses(prev => prev.filter(r => r.id !== id))
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除中にエラーが発生しました')
    }
  }

  const handleExportCSV = () => {
    const headers = ['ID', '回答日時', '氏名', 'ふりがな', '年齢', '郵便番号', '住所', '電話番号', '来店きっかけ', 'アレルギー', '入力方法']
    const rows = filteredResponses.map(r => [
      r.id,
      new Date(r.created_at!).toLocaleString('ja-JP'),
      r.name,
      r.furigana || '',
      r.birth_year ? `${new Date().getFullYear() - r.birth_year}` : '',
      r.postal_code || '',
      r.address || '',
      r.phone || '',
      getSourceLabel(r.source_type || ''),
      r.has_scalp_sensitivity ? 'あり' : 'なし',
      r.is_ocr ? 'OCR' : '手動入力'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `アンケート回答_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }


  // Pagination
  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedResponses = filteredResponses.slice(startIndex, endIndex)

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
          {/* スマホ: 縦積み、PC: 横並び */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">管理者ダッシュボード</h1>
              <p className="text-sm sm:text-base text-gray-600">BELO OSAKA アンケート管理</p>
              {session?.user && (
                <p className="text-xs text-gray-500 mt-1">ログイン中: {session.user.email}</p>
              )}
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-4">
              <div className="text-center sm:text-right">
                <p className="text-xs sm:text-sm text-gray-600">全回答数</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{responses.length}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 sm:px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
              >
                <LogOut className="mr-1 sm:mr-2" size={14} />
                <span className="hidden sm:inline">ログアウト</span>
                <span className="sm:hidden">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* タブメニュー */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 sm:gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('responses')}
              className={`flex-shrink-0 py-3 px-3 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === 'responses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="inline mr-1 sm:mr-2" size={16} />
              <span className="hidden sm:inline">アンケート回答一覧</span>
              <span className="sm:hidden">回答一覧</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-shrink-0 py-3 px-3 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline mr-1 sm:mr-2" size={16} />
              <span className="hidden sm:inline">分析・統計</span>
              <span className="sm:hidden">分析</span>
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`flex-shrink-0 py-3 px-3 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === 'qrcode'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <QrCode className="inline mr-1 sm:mr-2" size={16} />
              <span className="hidden sm:inline">QRコード</span>
              <span className="sm:hidden">QR</span>
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`flex-shrink-0 py-3 px-3 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === 'ocr'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Camera className="inline mr-1 sm:mr-2" size={16} />
              <span className="hidden sm:inline">OCR読み取り</span>
              <span className="sm:hidden">OCR</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'responses' ? (
          <>
            {/* フィルター */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4">
                <div className="flex items-center">
                  <Filter className="mr-2" size={20} />
                  <h2 className="text-lg font-semibold">検索・フィルター</h2>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
                >
                  <FileSpreadsheet className="mr-1 sm:mr-2" size={14} />
                  CSVエクスポート
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">入力方法</label>
                  <select
                    value={inputTypeFilter}
                    onChange={(e) => setInputTypeFilter(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">すべて</option>
                    <option value="manual">手動入力</option>
                    <option value="ocr">OCR読み取り</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">表示件数</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30件</option>
                    <option value={50}>50件</option>
                    <option value={100}>100件</option>
                  </select>
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

            {/* 回答一覧 */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2" size={20} />
                    <h3 className="text-lg font-semibold">アンケート回答一覧</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {selectedItems.size}件選択中
                      </span>
                      <button
                        onClick={handleDeleteSelected}
                        disabled={selectedItems.size === 0 || isDeleting}
                        className="px-2 sm:px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs sm:text-sm rounded transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={12} className="mr-1 sm:w-4 sm:h-4" />
                        {isDeleting ? '削除中...' : '選択削除'}
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {filteredResponses.length}件中 {startIndex + 1}-{Math.min(endIndex, filteredResponses.length)}件表示
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === paginatedResponses.length && paginatedResponses.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 focus:ring-blue-500"
                        />
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">入力方法</th>
                      <th 
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          <span className="hidden sm:inline">回答日時</span>
                          <span className="sm:hidden">日時</span>
                          {getSortIcon('date')}
                        </div>
                      </th>
                      <th 
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          氏名
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ふりがな</th>
                      <th 
                        className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('age')}
                      >
                        <div className="flex items-center">
                          年齢
                          {getSortIcon('age')}
                        </div>
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話番号</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">来店きっかけ</th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アレルギー</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedResponses.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                          該当するアンケート回答がありません
                        </td>
                      </tr>
                    ) : (
                      paginatedResponses.map((response) => (
                        <tr 
                          key={response.id} 
                          className="hover:bg-blue-50 transition-colors cursor-pointer"
                          onClick={(e) => {
                            // チェックボックスがクリックされた場合は詳細表示しない
                            const target = e.target as HTMLElement
                            if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') {
                              handleRowClick(response)
                            }
                          }}
                        >
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(response.id!)}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleSelectItem(response.id!)
                              }}
                              className="rounded border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                            {response.is_ocr ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                <Image className="mr-1" size={14} />
                                OCR
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                <Edit className="mr-1" size={14} />
                                手動
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            <div className="sm:hidden">
                              {new Date(response.created_at!).toLocaleDateString('ja-JP', {
                                month: '2-digit',
                                day: '2-digit'
                              })}
                              <br />
                              <span className="text-xs text-gray-500">
                                {new Date(response.created_at!).toLocaleDateString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="hidden sm:block">
                              {new Date(response.created_at!).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900">
                            <div className="truncate max-w-[120px] sm:max-w-none">
                              {response.name}
                            </div>
                            <div className="sm:hidden text-xs text-gray-500 truncate max-w-[120px]">
                              {response.furigana || ''}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {response.furigana || '-'}
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {response.birth_year ? `${new Date().getFullYear() - response.birth_year}歳` : '-'}
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {response.phone || '-'}
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {response.source_type ? getSourceLabel(response.source_type) : '-'}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-1 sm:space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRowClick(response)
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium p-1 rounded hover:bg-blue-50 transition-colors"
                                title="詳細表示"
                              >
                                <Eye size={14} className="sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(response)
                                }}
                                className="text-green-600 hover:text-green-800 font-medium p-1 rounded hover:bg-green-50 transition-colors"
                                title="編集"
                              >
                                <Edit size={14} className="sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSingle(response.id!, response.name)
                                }}
                                className="text-red-600 hover:text-red-800 font-medium p-1 rounded hover:bg-red-50 transition-colors"
                                title="削除"
                              >
                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="px-3 sm:px-6 py-4 border-t">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                      全{filteredResponses.length}件中 {startIndex + 1}-{Math.min(endIndex, filteredResponses.length)}件を表示
                    </div>
                    <div className="flex justify-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-2 sm:px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs sm:text-sm"
                      >
                        <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm ${
                            currentPage === i + 1
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 sm:px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs sm:text-sm"
                      >
                        <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'analytics' ? (
          /* 分析・統計タブ */
          <div className="space-y-6">
            {/* 期間フィルター */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Filter className="mr-2" size={20} />
                <h2 className="text-lg font-semibold">期間フィルター</h2>
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
                {dateFilter === 'custom' && (
                  <>
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
                  </>
                )}
              </div>
              <div className="text-center mt-4">
                <p className="text-2xl font-bold text-blue-600">{filteredResponses.length}</p>
                <p className="text-sm text-gray-600">件の回答が条件に一致</p>
              </div>
            </div>

            {/* チャート */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 来店きっかけ分布 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">来店きっかけ分布</h3>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setChartType('pie')}
                      className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        chartType === 'pie'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <PieChartIcon size={16} className="mr-1" />
                      円グラフ
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        chartType === 'bar'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <BarChartIcon size={16} className="mr-1" />
                      棒グラフ
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={getSourceData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, value }) => `${name} ${value}件 (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getSourceData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}件`, '回答数']} />
                    </PieChart>
                  ) : (
                    <BarChart data={getSourceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value}件`, '回答数']}
                        labelFormatter={(label) => `来店きっかけ: ${label}`}
                      />
                      <Bar dataKey="value" fill="#8884d8">
                        {getSourceData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
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

          </div>
        ) : activeTab === 'qrcode' ? (
          <QRCodeTab />
        ) : activeTab === 'ocr' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <Camera className="mx-auto mb-4 text-blue-600" size={48} />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">OCR読み取り</h2>
              <p className="text-gray-600 mb-6">紙のアンケートをスキャンしてデジタル化できます</p>
              <button
                onClick={() => window.location.href = '/ocr'}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                OCR読み取りページに移動
              </button>
            </div>
          </div>
        ) : null}

        {/* 詳細表示モーダル */}
        <ResponseDetailModal
          response={selectedResponse}
          isOpen={showDetailModal}
          onClose={closeDetailModal}
          onEdit={handleEdit}
        />

        {/* 編集モーダル */}
        <ResponseEditModal
          response={editingResponse}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingResponse(null)
          }}
          onSave={handleSaveEdit}
        />

      </div>
    </div>
  )
}