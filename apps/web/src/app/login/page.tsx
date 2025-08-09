'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please check if the API server is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (userType: 'admin' | 'owner' | 'cashier') => {
    const credentials = {
      admin: { email: 'admin@eazyque.com', password: 'admin123' },
      owner: { email: 'owner@demoshop.com', password: 'owner123' },
      cashier: { email: 'cashier@demoshop.com', password: 'cashier123' }
    }
    
    setFormData(credentials[userType])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">EazyQue</h1>
            <p className="text-gray-600 mb-8">Sign in to your retail dashboard</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white dark:text-black dark:bg-white dark:border-gray-300 placeholder-gray-500 dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white dark:text-black dark:bg-white dark:border-gray-300 placeholder-gray-500 dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Admin Account</p>
                    <p className="text-sm text-gray-500">admin@eazyque.com</p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">ADMIN</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('owner')}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Shop Owner</p>
                    <p className="text-sm text-gray-500">owner@demoshop.com</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">OWNER</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cashier')}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Cashier</p>
                    <p className="text-sm text-gray-500">cashier@demoshop.com</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">CASHIER</span>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-600 hover:underline">
                Sign up here
              </a>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact support at{' '}
              <a href="mailto:support@eazyque.com" className="text-blue-600 hover:underline">
                support@eazyque.com
              </a>
            </p>
          </div>
        </div>

        <div className="text-center">
          <a 
            href="/"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
