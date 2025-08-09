import { useState, useCallback } from 'react'

interface Product {
  id: string
  name: string
  barcode: string
  sellingPrice: number
  imageUrl?: string
  category: string
  unitOfMeasurement: string
}

interface ScanResult {
  product: Product | null
  error: string | null
  isLoading: boolean
}

export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult>({
    product: null,
    error: null,
    isLoading: false
  })
  const [scanHistory, setScanHistory] = useState<string[]>([])

  const lookupProduct = useCallback(async (barcode: string): Promise<Product | null> => {
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.data?.product) {
        return data.data.product
      } else {
        throw new Error(data.message || 'Product not found')
      }
    } catch (error) {
      console.error('Error looking up product:', error)
      throw error
    }
  }, [])

  const handleScan = useCallback(async (barcode: string) => {
    // Debounce rapid scans of the same barcode
    if (scanHistory.includes(barcode) && scanHistory[scanHistory.length - 1] === barcode) {
      return
    }

    setScanResult({ product: null, error: null, isLoading: true })
    
    try {
      const product = await lookupProduct(barcode)
      
      setScanResult({
        product,
        error: null,
        isLoading: false
      })
      
      // Add to scan history
      setScanHistory(prev => [...prev.slice(-9), barcode]) // Keep last 10 scans
      
    } catch (error) {
      setScanResult({
        product: null,
        error: error instanceof Error ? error.message : 'Failed to lookup product',
        isLoading: false
      })
    }
  }, [lookupProduct, scanHistory])

  const startScanning = useCallback(() => {
    setIsScanning(true)
    setScanResult({ product: null, error: null, isLoading: false })
  }, [])

  const stopScanning = useCallback(() => {
    setIsScanning(false)
    setScanResult({ product: null, error: null, isLoading: false })
  }, [])

  const clearResult = useCallback(() => {
    setScanResult({ product: null, error: null, isLoading: false })
  }, [])

  return {
    isScanning,
    scanResult,
    scanHistory,
    handleScan,
    startScanning,
    stopScanning,
    clearResult,
    lookupProduct
  }
}

export type { Product, ScanResult }
