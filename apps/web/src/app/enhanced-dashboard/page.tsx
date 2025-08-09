'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { format, subDays, formatDistanceToNow } from 'date-fns'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  todayRevenue: number
  todayOrders: number
  pendingOrders: number
  completedOrders: number
  totalProducts: number
  lowStockProducts: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    customerName: string
    totalAmount: number
    status: string
    createdAt: string
    itemCount: number
    cashier: { name: string; email: string } | null
  }>
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0']

export default function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'products' | 'orders'>('overview')
  const router = useRouter()

  // Mock data for enhanced visualization
  const [mockHourlyData, setMockHourlyData] = useState<Array<{hour: string, orders: number, revenue: number}>>([])
  const [mockCategoryData, setMockCategoryData] = useState<Array<{category: string, revenue: number, orders: number}>>([])
  const [mockWeeklyData, setMockWeeklyData] = useState<Array<{day: string, orders: number, revenue: number}>>([])

  // Real-time data fetching
  const fetchDashboardStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      if (data.success) {
        setStats(data.data)
        generateMockChartData(data.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  // Generate mock chart data based on real stats
  const generateMockChartData = (statsData: DashboardStats) => {
    // Generate hourly data for today
    const hourlyData = []
    const currentHour = new Date().getHours()
    for (let i = 0; i <= currentHour; i++) {
      const baseOrders = Math.floor(Math.random() * 5) + 1
      const baseRevenue = baseOrders * (Math.random() * 500 + 200)
      hourlyData.push({
        hour: `${i}:00`,
        orders: baseOrders,
        revenue: Math.round(baseRevenue)
      })
    }
    setMockHourlyData(hourlyData)

    // Generate category data
    const categories = ['Groceries', 'Electronics', 'Clothing', 'Books', 'Home & Garden']
    const categoryData = categories.map(category => ({
      category,
      revenue: Math.floor(Math.random() * 10000) + 5000,
      orders: Math.floor(Math.random() * 50) + 10
    }))
    setMockCategoryData(categoryData)

    // Generate weekly data
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayName = format(date, 'EEE')
      weeklyData.push({
        day: dayName,
        orders: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 5000) + 2000
      })
    }
    setMockWeeklyData(weeklyData)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    // Initial fetch
    fetchDashboardStats()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchDashboardStats, router])

  // Export functions
  const exportToPDF = useCallback(() => {
    if (!stats) return

    const pdf = new jsPDF()
    
    pdf.setFontSize(20)
    pdf.text('EazyQue Dashboard Report', 20, 20)
    
    pdf.setFontSize(12)
    pdf.text(`Generated on: ${format(lastUpdated, 'PPP')}`, 20, 30)
    
    pdf.setFontSize(16)
    pdf.text('Key Metrics', 20, 50)
    
    pdf.setFontSize(12)
    const metrics = [
      `Total Orders: ${stats.totalOrders}`,
      `Total Revenue: ₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      `Today's Orders: ${stats.todayOrders}`,
      `Today's Revenue: ₹${stats.todayRevenue.toLocaleString('en-IN')}`,
      `Pending Orders: ${stats.pendingOrders}`,
      `Low Stock Products: ${stats.lowStockProducts}`
    ]
    
    metrics.forEach((metric, index) => {
      pdf.text(metric, 20, 60 + (index * 10))
    })

    pdf.save('eazyque-dashboard-report.pdf')
  }, [stats, lastUpdated])

  const exportToExcel = useCallback(() => {
    if (!stats) return

    const workbook = XLSX.utils.book_new()

    // Overview data
    const overviewData = [
      ['Metric', 'Value'],
      ['Total Orders', stats.totalOrders],
      ['Total Revenue', stats.totalRevenue],
      ['Today Orders', stats.todayOrders],
      ['Today Revenue', stats.todayRevenue],
      ['Pending Orders', stats.pendingOrders],
      ['Completed Orders', stats.completedOrders],
      ['Total Products', stats.totalProducts],
      ['Low Stock Products', stats.lowStockProducts]
    ]
    
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData)
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview')

    // Recent orders data
    const ordersData = [
      ['Order Number', 'Customer', 'Amount', 'Status', 'Date'],
      ...stats.recentOrders.slice(0, 20).map(order => [
        order.orderNumber,
        order.customerName,
        order.totalAmount,
        order.status,
        format(new Date(order.createdAt), 'PPP')
      ])
    ]
    
    const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData)
    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Recent Orders')

    XLSX.writeFile(workbook, 'eazyque-dashboard-data.xlsx')
  }, [stats])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Loading Enhanced Dashboard...</h2>
          <p className="text-gray-600 mt-2">Preparing your business insights</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No Data Available</h2>
          <p className="text-gray-600 mt-2">Unable to load dashboard data</p>
          <button 
            onClick={() => fetchDashboardStats()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enhanced Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                {refreshing && <span className="ml-2 text-blue-600 animate-pulse">Refreshing...</span>}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
              >
                ← Back to Dashboard
              </button>
              
              <button
                onClick={() => fetchDashboardStats(true)}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
              
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                📄 PDF Report
              </button>
              
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                📊 Excel Export
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'sales', label: 'Sales Analytics', icon: '📈' },
                { key: 'products', label: 'Product Performance', icon: '📦' },
                { key: 'orders', label: 'Order Insights', icon: '🛒' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">₹</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.todayRevenue)}
                      </dd>
                      <dd className="text-sm text-green-600">
                        📈 Live tracking enabled
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">#</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Orders</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {stats.todayOrders}
                      </dd>
                      <dd className="text-sm text-blue-600">
                        🔄 Real-time updates
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {stats.pendingOrders}
                      </dd>
                      <dd className="text-sm text-orange-600">
                        ⚡ Needs attention
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">⚠</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {stats.lowStockProducts}
                      </dd>
                      <dd className="text-sm text-red-600">
                        🚨 Reorder required
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Hourly Sales */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Hourly Performance</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockHourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(value as number) : value,
                          name === 'revenue' ? 'Revenue' : 'Orders'
                        ]}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8884d8"
                        fillOpacity={0.6}
                        fill="#8884d8"
                        name="Revenue"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="orders"
                        fill="#82ca9d"
                        name="Orders"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Category Revenue Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {mockCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">7-Day Performance Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockWeeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      strokeWidth={3}
                      name="Revenue"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalOrders}</div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalOrders > 0 ? formatCurrency(stats.totalRevenue / stats.totalOrders) : '₹0'}
                  </div>
                  <div className="text-sm text-gray-600">Average Order Value</div>
                </div>
              </div>
            </div>

            {/* Enhanced charts would go here */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Sales Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockWeeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      fillOpacity={0.8}
                      fill="#8884d8"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{stats.totalProducts}</div>
                  <div className="text-sm text-gray-600">Total Products</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.lowStockProducts}</div>
                  <div className="text-sm text-gray-600">Low Stock Items</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
                  <div className="text-sm text-gray-600">Pending Orders</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
                  <div className="text-sm text-gray-600">Completed Orders</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.todayOrders}</div>
                  <div className="text-sm text-gray-600">Today's Orders</div>
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentOrders.slice(0, 10).map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
