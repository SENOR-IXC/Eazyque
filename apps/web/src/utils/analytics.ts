import { format, startOfDay, endOfDay, subDays, isToday, isYesterday } from 'date-fns'

// Format currency in Indian Rupees
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// Format large numbers with K, M, B suffixes
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Calculate percentage change
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Format percentage with color coding
export const formatPercentage = (value: number): { text: string; color: string; symbol: string } => {
  const isPositive = value >= 0
  return {
    text: `${Math.abs(value).toFixed(1)}%`,
    color: isPositive ? 'text-green-600' : 'text-red-600',
    symbol: isPositive ? '↗' : '↘'
  }
}

// Generate color palette for charts
export const getChartColors = (count: number): string[] => {
  const baseColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', 
    '#8dd1e1', '#d084d0', '#87d068', '#ffc0cb'
  ]
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count)
  }
  
  // Generate additional colors if needed
  const additionalColors = []
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 360 / count) % 360
    additionalColors.push(`hsl(${hue}, 70%, 60%)`)
  }
  
  return [...baseColors, ...additionalColors]
}

// Calculate moving average
export const calculateMovingAverage = (data: number[], window: number): number[] => {
  const result = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1)
    const subset = data.slice(start, i + 1)
    const average = subset.reduce((sum, val) => sum + val, 0) / subset.length
    result.push(Math.round(average * 100) / 100)
  }
  return result
}

// Group data by time period
export const groupDataByPeriod = (
  data: Array<{ date: string; value: number }>,
  period: 'hour' | 'day' | 'week' | 'month'
): Array<{ period: string; value: number; count: number }> => {
  const grouped = new Map()
  
  data.forEach(item => {
    const date = new Date(item.date)
    let key: string
    
    switch (period) {
      case 'hour':
        key = format(date, 'yyyy-MM-dd HH:00')
        break
      case 'day':
        key = format(date, 'yyyy-MM-dd')
        break
      case 'week':
        const weekStart = startOfDay(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = format(weekStart, 'yyyy-MM-dd')
        break
      case 'month':
        key = format(date, 'yyyy-MM')
        break
      default:
        key = format(date, 'yyyy-MM-dd')
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, { period: key, value: 0, count: 0 })
    }
    
    const existing = grouped.get(key)
    existing.value += item.value
    existing.count += 1
  })
  
  return Array.from(grouped.values()).sort((a, b) => a.period.localeCompare(b.period))
}

// Calculate trend direction
export const calculateTrend = (data: number[]): 'up' | 'down' | 'stable' => {
  if (data.length < 2) return 'stable'
  
  const recent = data.slice(-3) // Last 3 data points
  const earlier = data.slice(-6, -3) // Previous 3 data points
  
  if (recent.length === 0 || earlier.length === 0) return 'stable'
  
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length
  const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length
  
  const threshold = 0.05 // 5% threshold for stability
  const change = (recentAvg - earlierAvg) / earlierAvg
  
  if (Math.abs(change) < threshold) return 'stable'
  return change > 0 ? 'up' : 'down'
}

// Calculate correlation between two datasets
export const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length === 0) return 0
  
  const n = x.length
  const sumX = x.reduce((sum, val) => sum + val, 0)
  const sumY = y.reduce((sum, val) => sum + val, 0)
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
  const sumXX = x.reduce((sum, val) => sum + val * val, 0)
  const sumYY = y.reduce((sum, val) => sum + val * val, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
  
  return denominator === 0 ? 0 : numerator / denominator
}

// Generate insights from data
export const generateInsights = (data: any): string[] => {
  const insights: string[] = []
  
  if (!data || !data.realTimeMetrics) return insights
  
  const { realTimeMetrics, dailyStats, categoryStats, topProducts } = data
  
  // Revenue insights
  if (realTimeMetrics.revenueGrowth > 10) {
    insights.push(`🚀 Revenue is up ${realTimeMetrics.revenueGrowth.toFixed(1)}% compared to yesterday!`)
  } else if (realTimeMetrics.revenueGrowth < -10) {
    insights.push(`📉 Revenue is down ${Math.abs(realTimeMetrics.revenueGrowth).toFixed(1)}% compared to yesterday.`)
  }
  
  // Order insights
  if (realTimeMetrics.ordersGrowth > 15) {
    insights.push(`📈 Order volume increased by ${realTimeMetrics.ordersGrowth.toFixed(1)}% today!`)
  }
  
  // Inventory insights
  if (realTimeMetrics.lowStockProducts > 5) {
    insights.push(`⚠️ ${realTimeMetrics.lowStockProducts} products are running low on stock.`)
  }
  
  // Category insights
  if (categoryStats && categoryStats.length > 0) {
    const topCategory = categoryStats.reduce((max: any, cat: any) => 
      cat.revenue > max.revenue ? cat : max
    )
    insights.push(`🏆 ${topCategory.category} is your top performing category with ${formatCurrency(topCategory.revenue)} in revenue.`)
  }
  
  // Product insights
  if (topProducts && topProducts.length > 0) {
    const topProduct = topProducts[0]
    insights.push(`⭐ ${topProduct.name} is your best seller with ${topProduct.quantitySold} units sold.`)
  }
  
  // Trend insights
  if (dailyStats && dailyStats.length >= 3) {
    const revenues = dailyStats.map((d: any) => d.revenue)
    const trend = calculateTrend(revenues)
    
    if (trend === 'up') {
      insights.push(`📊 Your sales are trending upward over the past week.`)
    } else if (trend === 'down') {
      insights.push(`📊 Your sales have been declining over the past week. Consider promotional activities.`)
    }
  }
  
  return insights.slice(0, 5) // Return top 5 insights
}

// Export utility functions
export const analyticsUtils = {
  formatCurrency,
  formatNumber,
  calculatePercentageChange,
  formatPercentage,
  getChartColors,
  calculateMovingAverage,
  groupDataByPeriod,
  calculateTrend,
  calculateCorrelation,
  generateInsights
}
