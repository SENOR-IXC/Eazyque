import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const resolvedParams = await params
    const barcode = resolvedParams.barcode
    
    if (!barcode) {
      return NextResponse.json(
        { success: false, message: 'Barcode is required' },
        { status: 400 }
      )
    }

    // Get authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization required' },
        { status: 401 }
      )
    }

    // Forward the request to the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
    const apiUrl = `${backendUrl}/api/products/barcode/${encodeURIComponent(barcode)}`

    console.log('🔍 Forwarding barcode lookup to:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Backend API error:', response.status, data)
      return NextResponse.json(data, { status: response.status })
    }

    console.log('✅ Product lookup successful:', data)
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('❌ Error in barcode lookup proxy:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    )
  }
}
