'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScannerState, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode'
import { Camera, CameraOff, X, RotateCcw, FlashlightIcon } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string, format?: string) => void
  onError?: (error: string) => void
  onClose?: () => void
  isOpen: boolean
  scannerOptions?: {
    fps?: number
    qrbox?: number | { width: number; height: number }
    aspectRatio?: number
    disableFlip?: boolean
    videoConstraints?: MediaTrackConstraints
  }
}

const DEFAULT_SCANNER_OPTIONS = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  disableFlip: false,
  supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
  formatsToSupport: [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E
  ]
}

export default function BarcodeScanner({
  onScan,
  onError,
  onClose,
  isOpen,
  scannerOptions = {}
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [flashSupported, setFlashSupported] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)

  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const scannerElementId = 'barcode-scanner-container'

  // Merged scanner options with defaults
  const mergedOptions = { ...DEFAULT_SCANNER_OPTIONS, ...scannerOptions }

  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraPermission('granted')
      
      // Stop the stream after getting permission
      stream.getTracks().forEach(track => track.stop())
      
      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(cameras)
      
      // Select back camera if available (for mobile devices)
      const backCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      )
      setSelectedCameraId(backCamera?.deviceId || cameras[0]?.deviceId || '')
      
    } catch (error) {
      console.error('Camera permission denied:', error)
      setCameraPermission('denied')
      setError('Camera access is required for barcode scanning. Please allow camera access and try again.')
      onError?.('Camera access denied')
    }
  }, [onError])

  // Initialize scanner
  const initializeScanner = useCallback(async () => {
    if (!isOpen || !cameraPermission || cameraPermission !== 'granted') return

    try {
      setError(null)
      setIsScanning(true)

      // Clean up existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear()
        } catch (err) {
          console.warn('Error clearing previous scanner:', err)
        }
        scannerRef.current = null
      }

      // Create new scanner instance
      const scanner = new Html5QrcodeScanner(
        scannerElementId,
        {
          fps: mergedOptions.fps,
          qrbox: mergedOptions.qrbox,
          aspectRatio: mergedOptions.aspectRatio,
          disableFlip: mergedOptions.disableFlip,
          supportedScanTypes: mergedOptions.supportedScanTypes,
          formatsToSupport: mergedOptions.formatsToSupport,
          videoConstraints: {
            deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
            facingMode: selectedCameraId ? undefined : { ideal: 'environment' },
            ...mergedOptions.videoConstraints
          }
        },
        /* verbose= */ false
      )

      scannerRef.current = scanner

      // Success callback
      const onScanSuccess = (decodedText: string, decodedResult: any) => {
        console.log('✅ Barcode scan successful:', decodedText, decodedResult)
        
        // Vibrate on successful scan (mobile devices)
        if (navigator.vibrate) {
          navigator.vibrate(200)
        }
        
        onScan(decodedText, decodedResult?.result?.format?.formatName || 'Unknown')
      }

      // Error callback (for scan failures, not critical errors)
      const onScanFailure = (error: string) => {
        // Don't log every scan attempt failure to avoid console spam
        // console.warn('Scan attempt failed:', error)
      }

      // Start scanning
      scanner.render(onScanSuccess, onScanFailure)

    } catch (err: any) {
      console.error('Error initializing scanner:', err)
      setError(`Failed to initialize scanner: ${err.message}`)
      setIsScanning(false)
      onError?.(err.message)
    }
  }, [isOpen, cameraPermission, selectedCameraId, mergedOptions, onScan, onError])

  // Cleanup scanner
  const cleanupScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.clear()
        }
      } catch (err) {
        console.warn('Error during scanner cleanup:', err)
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  // Toggle camera
  const switchCamera = useCallback(async () => {
    if (availableCameras.length <= 1) return

    const currentIndex = availableCameras.findIndex(camera => camera.deviceId === selectedCameraId)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]
    
    setSelectedCameraId(nextCamera.deviceId)
  }, [availableCameras, selectedCameraId])

  // Toggle flash (if supported)
  const toggleFlash = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCameraId }
      })
      
      const videoTrack = stream.getVideoTracks()[0]
      const capabilities = videoTrack.getCapabilities() as any
      
      if ('torch' in capabilities && capabilities.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        })
        setFlashEnabled(!flashEnabled)
        setFlashSupported(true)
      }
      
      stream.getTracks().forEach(track => track.stop())
    } catch (err) {
      console.warn('Flash not supported:', err)
      setFlashSupported(false)
    }
  }, [selectedCameraId, flashEnabled])

  // Effects
  useEffect(() => {
    if (isOpen && !cameraPermission) {
      requestCameraPermission()
    }
  }, [isOpen, cameraPermission, requestCameraPermission])

  useEffect(() => {
    if (isOpen && cameraPermission === 'granted') {
      initializeScanner()
    }
    
    return () => {
      cleanupScanner()
    }
  }, [isOpen, cameraPermission, initializeScanner, cleanupScanner])

  useEffect(() => {
    // Reinitialize scanner when camera changes
    if (isScanning && selectedCameraId) {
      cleanupScanner().then(() => {
        setTimeout(initializeScanner, 100)
      })
    }
  }, [selectedCameraId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Barcode Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Controls */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between gap-2">
            {/* Camera Switch */}
            {availableCameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                disabled={!isScanning}
              >
                <RotateCcw className="w-4 h-4" />
                Switch
              </button>
            )}

            {/* Flash Toggle */}
            {flashSupported && (
              <button
                onClick={toggleFlash}
                className={`flex items-center gap-1 px-3 py-2 rounded-md transition-colors text-sm ${
                  flashEnabled 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={!isScanning}
              >
                <FlashlightIcon className="w-4 h-4" />
                Flash
              </button>
            )}

            {/* Status Indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
              isScanning 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isScanning ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Scanning
                </>
              ) : (
                <>
                  <CameraOff className="w-4 h-4" />
                  Stopped
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="text-red-500">⚠️</div>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              {cameraPermission === 'denied' && (
                <button
                  onClick={requestCameraPermission}
                  className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Retry Permission
                </button>
              )}
            </div>
          )}

          {cameraPermission === 'granted' ? (
            <div className="space-y-4">
              {/* Scanner Container */}
              <div 
                id={scannerElementId}
                className="relative bg-black rounded-lg overflow-hidden min-h-[300px]"
              >
                {!isScanning && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Initializing camera...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center text-sm text-gray-600">
                <p className="font-medium">Point your camera at a barcode</p>
                <p>Supports: QR codes, EAN-13, UPC-A, Code 128, and more</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Camera Access Required</h4>
              <p className="text-gray-600 mb-4">
                Please allow camera access to scan barcodes
              </p>
              <button
                onClick={requestCameraPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Allow Camera Access
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Aim the camera at the barcode and hold steady for best results
          </p>
        </div>
      </div>
    </div>
  )
}
