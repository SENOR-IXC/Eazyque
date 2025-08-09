'use client'

import { useState, useCallback } from 'react'

interface Product {
  id: string
  name: string
  description: string
  barcode: string
  sellingPrice: number
  gstRate: number
  inventory: Array<{ quantity: number }>
  unitOfMeasurement: string
  category: string
}

interface UseBarcodeProps {
  onProductFound?: (product: Product) => void
  onProductNotFound?: (barcode: string) => void
  onScanError?: (error: string) => void
}

export function useBarcode({ onProductFound, onProductNotFound, onScanError }: UseBarcodeProps = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<Array<{ barcode: string; timestamp: Date; success: boolean }>>([])

  // Look up product by barcode
  const lookupProduct = useCallback(async (barcode: string): Promise<Product | null> => {
    try {
      setIsLoading(true)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      console.log('🔍 Looking up product with barcode:', barcode)

      const response = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 404) {
        console.log('❌ Product not found for barcode:', barcode)
        return null
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API error response:', response.status, errorText)
        throw new Error(`Failed to lookup product: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        console.log('❌ No product data in response:', result)
        return null
      }

      console.log('✅ Product found:', result.data)
      return result.data as Product

    } catch (error: any) {
      console.error('❌ Error looking up product:', error)
      onScanError?.(error.message || 'Failed to lookup product')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [onScanError])

  // Handle barcode scan
  const handleScan = useCallback(async (barcode: string, format?: string) => {
    console.log('📱 Barcode scanned:', barcode, 'Format:', format)
    
    // Clean and validate barcode
    const cleanBarcode = barcode.trim()
    if (!cleanBarcode) {
      onScanError?.('Invalid barcode: empty value')
      return
    }

    // Avoid duplicate scans in quick succession
    if (lastScannedBarcode === cleanBarcode) {
      console.log('⚠️ Duplicate scan ignored:', cleanBarcode)
      return
    }

    setLastScannedBarcode(cleanBarcode)
    
    // Add to scan history
    setScanHistory(prev => [
      { barcode: cleanBarcode, timestamp: new Date(), success: false },
      ...prev.slice(0, 9) // Keep last 10 scans
    ])

    try {
      // Look up product
      const product = await lookupProduct(cleanBarcode)
      
      if (product) {
        // Update scan history with success
        setScanHistory(prev => prev.map((scan, index) => 
          index === 0 ? { ...scan, success: true } : scan
        ))
        
        onProductFound?.(product)
      } else {
        onProductNotFound?.(cleanBarcode)
      }
    } catch (error: any) {
      console.error('❌ Error handling scan:', error)
      onScanError?.(error.message || 'Failed to process scan')
    }

    // Reset last scanned barcode after a delay to allow rescanning
    setTimeout(() => {
      setLastScannedBarcode(null)
    }, 2000)
  }, [lastScannedBarcode, lookupProduct, onProductFound, onProductNotFound, onScanError])

  // Handle manual barcode entry
  const handleManualEntry = useCallback(async (barcode: string) => {
    if (barcode.trim()) {
      await handleScan(barcode.trim())
    }
  }, [handleScan])

  // Clear scan history
  const clearScanHistory = useCallback(() => {
    setScanHistory([])
    setLastScannedBarcode(null)
  }, [])

  // Get stats
  const getStats = useCallback(() => {
    const totalScans = scanHistory.length
    const successfulScans = scanHistory.filter(scan => scan.success).length
    const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0

    return {
      totalScans,
      successfulScans,
      failedScans: totalScans - successfulScans,
      successRate: Math.round(successRate)
    }
  }, [scanHistory])

  return {
    // State
    isLoading,
    lastScannedBarcode,
    scanHistory,
    
    // Actions
    handleScan,
    handleManualEntry,
    lookupProduct,
    clearScanHistory,
    
    // Utils
    getStats
  }
}
