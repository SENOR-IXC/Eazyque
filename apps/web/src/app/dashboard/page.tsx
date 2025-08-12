'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  shop: {
    name: string
    gstNumber: string
  }
}

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  todayRevenue: number
  todayOrders: number
  pendingOrders: number
  completedOrders: number
  totalProducts: number
  lowStockProducts: number
  recentOrders: {
    id: string
    orderNumber: string
    customerName: string
    totalAmount: number
    status: string
    createdAt: string
    itemCount: number
    cashier: {
      name: string
      email: string
    } | null
  }[]
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string | null
  totalAmount: number
  status: string
  createdAt: string
  items: {
    id: string
    quantity: number
    unitPrice: number
    product: {
      name: string
    }
  }[]
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))

    // Fetch dashboard stats
    fetchDashboardStats(token)
    fetchPendingOrders(token)
  }, [router])

  const fetchDashboardStats = async (token: string) => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Set fallback demo data
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        todayOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalProducts: 0,
        lowStockProducts: 0,
        recentOrders: []
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingOrders = async (token: string) => {
    setOrdersLoading(true)
    try {
      const response = await fetch('/api/orders?status=PENDING&limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json()
      if (data.success) {
        setPendingOrders(data.data)
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error)
      // Set empty array as fallback
      setPendingOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (data.success) {
        // Refresh pending orders
        fetchPendingOrders(token)
        // Refresh stats
        fetchDashboardStats(token)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const createTestOrder = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('http://localhost:5001/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: 'Test Customer',
          customerPhone: '+919876543999',
          items: [
            {
              productId: 'cme0zo9w2000m127vza80jgc5', // Basmati Rice
              quantity: 2,
              unitPrice: 120,
              discountAmount: 0
            }
          ],
          paymentMethod: 'CASH',
          discountAmount: 0
        })
      })

      const data = await response.json()
      if (data.success) {
        // Refresh pending orders and stats
        fetchPendingOrders(token)
        fetchDashboardStats(token)
      }
    } catch (error) {
      console.error('Error creating test order:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EazyQue Dashboard</h1>
              <p className="text-sm text-gray-600">{user.shop.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/enhanced-dashboard')}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              📊 Enhanced Analytics
            </button>
            <button
              onClick={() => router.push('/products')}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Products
            </button>
            <button
              onClick={() => router.push('/orders')}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Orders
            </button>
            <button
              onClick={() => router.push('/pos')}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              POS
            </button>
            <button
              onClick={() => router.push('/inventory')}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Inventory
            </button>
            <button
              onClick={() => router.push('/analytics')}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center"
            >
              <span className="mr-1">📊</span>
              Enhanced Analytics
            </button>
            <button
              onClick={() => router.push('/loyalty')}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center"
            >
              <span className="mr-1">⭐</span>
              Loyalty Program
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening in your store today.
          </p>
        </div>

        {/* Comprehensive Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : stats && (
          <>
            {/* Primary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                      <p className="text-xs text-gray-500">All time</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                      <p className="text-xs text-gray-500">All time</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                      <p className="text-xs text-gray-500">Awaiting action</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                      <p className="text-xs text-gray-500">In inventory</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Performance Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Today's Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
                    <div className="flex items-center mt-2">
                      <svg className="w-4 h-4 text-blue-200 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-xs text-blue-200">Daily performance</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-400 bg-opacity-30 rounded-lg">
                    <svg className="w-8 h-8 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Today's Orders</p>
                    <p className="text-2xl font-bold">{stats.todayOrders}</p>
                    <div className="flex items-center mt-2">
                      <svg className="w-4 h-4 text-emerald-200 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      </svg>
                      <span className="text-xs text-emerald-200">Orders placed today</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-400 bg-opacity-30 rounded-lg">
                    <svg className="w-8 h-8 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Low Stock Alert</p>
                    <p className="text-2xl font-bold">{stats.lowStockProducts}</p>
                    <div className="flex items-center mt-2">
                      <svg className="w-4 h-4 text-amber-200 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-xs text-amber-200">Products below threshold</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-400 bg-opacity-30 rounded-lg">
                    <svg className="w-8 h-8 text-amber-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rose-100 text-sm font-medium">Recent Activity</p>
                    <p className="text-2xl font-bold">{stats.recentOrders?.length || 0}</p>
                    <div className="flex items-center mt-2">
                      <svg className="w-4 h-4 text-rose-200 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-rose-200">Recent transactions</span>
                    </div>
                  </div>
                  <div className="p-3 bg-rose-400 bg-opacity-30 rounded-lg">
                    <svg className="w-8 h-8 text-rose-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={createTestOrder}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Test Order</p>
                  <p className="text-sm text-gray-600">Add demo order</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => router.push('/products')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add Product</p>
                  <p className="text-sm text-gray-600">Add new product</p>
                </div>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Reports</p>
                  <p className="text-sm text-gray-600">Sales & analytics</p>
                </div>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Inventory</p>
                  <p className="text-sm text-gray-600">Manage stock</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Orders</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {pendingOrders.length} pending
              </span>
            </div>
            
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading orders...</p>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending orders</h3>
                <p className="mt-1 text-sm text-gray-500">All orders are up to date!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                        {order.customerPhone && (
                          <p className="text-xs text-gray-500">{order.customerPhone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-1">Items:</p>
                      <div className="text-sm text-gray-700">
                        {order.items.slice(0, 2).map((item, index) => (
                          <span key={item.id}>
                            {item.quantity}x {item.product.name}
                            {index < Math.min(order.items.length - 1, 1) && ', '}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-gray-500"> +{order.items.length - 2} more</span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
                        className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 transition-colors"
                      >
                        Start Processing
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                        className="flex-1 bg-green-600 text-white text-xs py-2 px-3 rounded hover:bg-green-700 transition-colors"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                        className="bg-red-600 text-white text-xs py-2 px-3 rounded hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Summary & Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-3 bg-gray-50 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-500 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Today's Revenue</p>
                      <p className="text-sm text-gray-600">{formatCurrency(stats.todayRevenue)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-blue-600">
                      {stats.todayOrders} orders
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-emerald-500 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">All-time Performance</p>
                      <p className="text-sm text-gray-600">{formatCurrency(stats.totalRevenue)} total revenue</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-emerald-600">
                      {stats.totalOrders} orders
                    </span>
                  </div>
                </div>

                {stats.lowStockProducts > 0 && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-amber-500 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Inventory Alert</p>
                        <p className="text-sm text-gray-600">{stats.lowStockProducts} products need restocking</p>
                      </div>
                    </div>
                    <button className="text-amber-600 hover:text-amber-800 text-sm font-medium">
                      View →
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-500 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Product Catalog</p>
                      <p className="text-sm text-gray-600">{stats.totalProducts} products available</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-purple-600">
                      Active
                    </span>
                  </div>
                </div>

                {stats.recentOrders && stats.recentOrders.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Recent Orders</h4>
                      <button
                        onClick={() => router.push('/orders')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {stats.recentOrders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                            <p className="text-xs text-gray-600">{order.customerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                <p className="mt-1 text-sm text-gray-500">Start by creating your first order!</p>
                <button
                  onClick={createTestOrder}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Create Test Order
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
