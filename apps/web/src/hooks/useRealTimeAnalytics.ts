'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'

interface UseRealTimeAnalyticsOptions {
  refreshInterval?: number
  enableRealTime?: boolean
}

export function useRealTimeAnalytics(options: UseRealTimeAnalyticsOptions = {}) {
  const { refreshInterval = 30000, enableRealTime = true } = options
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [socket, setSocket] = useState<Socket | null>(null)
  const router = useRouter()

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/analytics/real-time-stats', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch analytics data')
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    // Initial fetch
    fetchData()

    // Setup real-time updates if enabled
    if (enableRealTime) {
      const socketInstance = io('http://localhost:5001', {
        auth: { token }
      })

      socketInstance.on('connect', () => {
        console.log('Connected to analytics real-time updates')
        const user = JSON.parse(userData)
        socketInstance.emit('joinShop', user.shopId)
      })

      socketInstance.on('orderUpdate', () => {
        fetchData(true)
      })

      socketInstance.on('inventoryUpdate', () => {
        fetchData(true)
      })

      setSocket(socketInstance)

      // Cleanup on unmount
      return () => {
        socketInstance.disconnect()
      }
    }

    // Setup polling interval
    const interval = setInterval(() => {
      fetchData(true)
    }, refreshInterval)

    return () => {
      clearInterval(interval)
    }
  }, [fetchData, enableRealTime, refreshInterval, router])

  const refresh = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  return {
    data,
    loading,
    refreshing,
    lastUpdated,
    refresh,
    socket
  }
}
