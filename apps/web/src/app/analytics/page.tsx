'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { format, startOfDay, endOfDay, subDays, formatDistanceToNow } from 'date-fns'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { io } from 'socket.io-client'

// Types for analytics data
interface RealTimeMetrics {
  todayOrders: number
  todayRevenue: number
  yesterdayOrders: number
  yesterdayRevenue: number
  revenueGrowth: number
  ordersGrowth: number
  currentMonthOrders: number
  currentMonthRevenue: { _sum: { totalAmount: number } }
  pendingOrders: number
  lowStockProducts: number
  totalProducts: number
}

interface HourlyStats {
  hour: number
  orders: number
  revenue: number
}

interface DailyStats {
  date: string
  orders: number
  revenue: number
  avgOrderValue: number
}

interface CategoryStats {
  category: string
  itemsSold: number
  totalQuantity: number
  revenue: number
  avgPrice: number
}

interface TopProduct {
  name: string
  barcode: string
  category: string
  quantitySold: number
  revenue: number
  ordersCount: number
}

interface InventoryStats {
  category: string
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  avgStock: number
  totalInventoryValue: number
}

interface AnalyticsData {
  realTimeMetrics: RealTimeMetrics
  hourlyStats: HourlyStats[]
  dailyStats: DailyStats[]
  categoryStats: CategoryStats[]
  topProducts: TopProduct[]
  inventoryStats: InventoryStats[]
}

interface CustomerInsights {
  customerStats: Array<{
    customerName: string
    customerPhone: string | null
    totalOrders: number
    totalSpent: number
    avgOrderValue: number
    lastOrderDate: string
    firstOrderDate: string
  }>
  purchasePatterns: Array<{
    hour: number
    dayOfWeek: number
    orders: number
    avgOrderValue: number
  }>
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0']

export default function EnhancedAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'inventory' | 'customers'>('overview')
  const [socket, setSocket] = useState<any>(null)
  const router = useRouter()

  // Real-time data fetching
  const fetchAnalyticsData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const [analyticsResponse, customerResponse] = await Promise.all([
        fetch('/api/analytics/real-time-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/analytics/customer-insights', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!analyticsResponse.ok || !customerResponse.ok) {
        if (analyticsResponse.status === 401 || customerResponse.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch analytics data')
      }

      const [analyticsData, customerData] = await Promise.all([
        analyticsResponse.json(),
        customerResponse.json()
      ])

      if (analyticsData.success) {
        setAnalyticsData(analyticsData.data)
      }
      if (customerData.success) {
        setCustomerInsights(customerData.data)
      }
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  // Setup real-time updates with Socket.IO
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    // Initial data fetch
    fetchAnalyticsData()

    // Setup Socket.IO for real-time updates
    const socketInstance = io('http://localhost:5001', {
      auth: { token }
    })

    socketInstance.on('connect', () => {
      console.log('Connected to analytics socket')
      const user = JSON.parse(userData)
      socketInstance.emit('joinShop', user.shopId)
    })

    socketInstance.on('orderUpdate', () => {
      // Refresh analytics when new orders come in
      fetchAnalyticsData()
    })

    socketInstance.on('inventoryUpdate', () => {
      // Refresh analytics when inventory changes
      fetchAnalyticsData()
    })

    setSocket(socketInstance)

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAnalyticsData(true)
    }, 30000)

    return () => {
      clearInterval(interval)
      socketInstance.disconnect()
    }
  }, [fetchAnalyticsData, router])

  // Export functions
  const exportToPDF = useCallback(() => {
    if (!analyticsData) return

    const pdf = new jsPDF()
    
    // Header
    pdf.setFontSize(20)
    pdf.text('EazyQue Analytics Report', 20, 20)
    
    pdf.setFontSize(12)
    pdf.text(`Generated on: ${format(lastUpdated, 'PPP')}`, 20, 30)
    
    // Key metrics
    pdf.setFontSize(16)
    pdf.text('Key Metrics', 20, 50)
    
    pdf.setFontSize(12)
    const metrics = [
      `Today's Orders: ${analyticsData.realTimeMetrics.todayOrders}`,
      `Today's Revenue: ₹${analyticsData.realTimeMetrics.todayRevenue.toLocaleString('en-IN')}`,
      `Revenue Growth: ${analyticsData.realTimeMetrics.revenueGrowth}%`,
      `Orders Growth: ${analyticsData.realTimeMetrics.ordersGrowth}%`,
      `Pending Orders: ${analyticsData.realTimeMetrics.pendingOrders}`,
      `Low Stock Products: ${analyticsData.realTimeMetrics.lowStockProducts}`
    ]
    
    metrics.forEach((metric, index) => {
      pdf.text(metric, 20, 60 + (index * 10))
    })

    // Top products
    pdf.setFontSize(16)
    pdf.text('Top Products', 20, 140)
    
    pdf.setFontSize(10)
    analyticsData.topProducts.slice(0, 5).forEach((product, index) => {
      pdf.text(
        `${index + 1}. ${product.name} - Sold: ${product.quantitySold}, Revenue: ₹${product.revenue.toLocaleString('en-IN')}`,
        20, 150 + (index * 8)
      )
    })

    pdf.save('eazyque-analytics-report.pdf')
  }, [analyticsData, lastUpdated])

  const exportToExcel = useCallback(() => {
    if (!analyticsData) return

    const workbook = XLSX.utils.book_new()

    // Overview sheet
    const overviewData = [
      ['Metric', 'Value'],
      ['Today Orders', analyticsData.realTimeMetrics.todayOrders],
      ['Today Revenue', analyticsData.realTimeMetrics.todayRevenue],
      ['Revenue Growth %', analyticsData.realTimeMetrics.revenueGrowth],
      ['Orders Growth %', analyticsData.realTimeMetrics.ordersGrowth],
      ['Pending Orders', analyticsData.realTimeMetrics.pendingOrders],
      ['Low Stock Products', analyticsData.realTimeMetrics.lowStockProducts],
      ['Total Products', analyticsData.realTimeMetrics.totalProducts]
    ]
    
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData)
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview')

    // Category stats sheet
    const categoryData = [
      ['Category', 'Items Sold', 'Revenue', 'Avg Price'],
      ...analyticsData.categoryStats.map(cat => [
        cat.category,
        cat.itemsSold,
        cat.revenue,
        cat.avgPrice
      ])
    ]
    
    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData)
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categories')

    // Top products sheet
    const productsData = [
      ['Product Name', 'Category', 'Quantity Sold', 'Revenue', 'Orders Count'],
      ...analyticsData.topProducts.map(product => [
        product.name,
        product.category,
        product.quantitySold,
        product.revenue,
        product.ordersCount
      ])
    ]
    
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData)
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Products')

    XLSX.writeFile(workbook, 'eazyque-analytics-data.xlsx')
  }, [analyticsData])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // Format percentage
  const formatPercentage = (value: number) => {
    const color = value >= 0 ? 'text-green-600' : 'text-red-600'
    const symbol = value >= 0 ? '↗' : '↘'
    return (
      <span className={`${color} font-semibold`}>
        {symbol} {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Loading Analytics...</h2>
          <p className="text-gray-600 mt-2">Preparing your business insights</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No Data Available</h2>
          <p className="text-gray-600 mt-2">Unable to load analytics data</p>
          <button 
            onClick={() => fetchAnalyticsData()}
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
              <h1 className="text-3xl font-bold text-gray-900">Enhanced Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                {refreshing && <span className="ml-2 text-blue-600">Refreshing...</span>}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => fetchAnalyticsData(true)}
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
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF Report
              </button>
              
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel Export
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'sales', label: 'Sales Trends', icon: '📈' },
                { key: 'inventory', label: 'Inventory', icon: '📦' },
                { key: 'customers', label: 'Customers', icon: '👥' }
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
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">₹</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(analyticsData.realTimeMetrics.todayRevenue)}
                      </dd>
                      <dd className="text-sm">
                        {formatPercentage(analyticsData.realTimeMetrics.revenueGrowth)} vs yesterday
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">#</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Orders</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {analyticsData.realTimeMetrics.todayOrders}
                      </dd>
                      <dd className="text-sm">
                        {formatPercentage(analyticsData.realTimeMetrics.ordersGrowth)} vs yesterday
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {analyticsData.realTimeMetrics.pendingOrders}
                      </dd>
                      <dd className="text-sm text-gray-500">Awaiting processing</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">⚠</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {analyticsData.realTimeMetrics.lowStockProducts}
                      </dd>
                      <dd className="text-sm text-red-600">Need reordering</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Hourly Sales Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Hourly Sales</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
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

            {/* Category Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Category Revenue Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.categoryStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {analyticsData.categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
                <div className="space-y-4">
                  {analyticsData.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product.barcode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.revenue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantitySold} sold
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-8">
            {/* Daily Revenue Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">7-Day Revenue Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), 'PPP')}
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : 
                        name === 'avgOrderValue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 
                        name === 'avgOrderValue' ? 'Avg Order Value' : 'Orders'
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
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgOrderValue"
                      stroke="#ffc658"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Avg Order Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Performance Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance (Last 30 Days)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.categoryStats} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={100} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' || name === 'avgPrice' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 
                        name === 'itemsSold' ? 'Items Sold' : 
                        name === 'avgPrice' ? 'Avg Price' : name
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="itemsSold" fill="#82ca9d" name="Items Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-8">
            {/* Inventory Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analyticsData.inventoryStats.map((category, index) => (
                <div key={category.category} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 ${COLORS[index % COLORS.length]} rounded-md flex items-center justify-center`} style={{backgroundColor: COLORS[index % COLORS.length]}}>
                        <span className="text-white text-sm font-bold">📦</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{category.category}</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {category.totalProducts} products
                        </dd>
                        <dd className="text-sm text-red-600">
                          {category.lowStockCount} low stock, {category.outOfStockCount} out of stock
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">
                      Inventory Value: {formatCurrency(category.totalInventoryValue)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Avg Stock: {Math.round(category.avgStock)} units
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inventory Status Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Status by Category</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.inventoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalProducts" fill="#8884d8" name="Total Products" />
                    <Bar dataKey="lowStockCount" fill="#ff7300" name="Low Stock" />
                    <Bar dataKey="outOfStockCount" fill="#ff0000" name="Out of Stock" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && customerInsights && (
          <div className="space-y-8">
            {/* Top Customers */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers (Last 30 Days)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Order Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Order
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerInsights.customerStats.slice(0, 10).map((customer, index) => (
                      <tr key={customer.customerPhone || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.customerPhone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.totalOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(customer.avgOrderValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(customer.lastOrderDate), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Purchase Patterns Heatmap */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Patterns (Hour vs Day of Week)</h3>
              <div className="text-sm text-gray-600 mb-4">
                Darker colors indicate higher order volume
              </div>
              
              {/* Simple grid representation of purchase patterns */}
              <div className="grid grid-cols-8 gap-1 text-xs">
                <div className="font-medium">Hour</div>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="font-medium text-center">{day}</div>
                ))}
                
                {Array.from({ length: 24 }, (_, hour) => {
                  const patterns = customerInsights.purchasePatterns.filter(p => p.hour === hour)
                  return (
                    <div key={hour} className="contents">
                      <div className="font-medium">{hour}:00</div>
                      {Array.from({ length: 7 }, (_, day) => {
                        const pattern = patterns.find(p => p.dayOfWeek === day)
                        const orders = pattern?.orders || 0
                        const maxOrders = Math.max(...customerInsights.purchasePatterns.map(p => p.orders))
                        const intensity = maxOrders > 0 ? orders / maxOrders : 0
                        const opacity = Math.max(0.1, intensity)
                        
                        return (
                          <div
                            key={day}
                            className="h-6 bg-blue-500 rounded text-center flex items-center justify-center text-white"
                            style={{ opacity }}
                            title={`${hour}:00 on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}: ${orders} orders`}
                          >
                            {orders > 0 ? orders : ''}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
