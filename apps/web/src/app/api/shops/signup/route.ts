import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:5001/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🏪 Frontend API received shop data:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/shops/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('🏪 Backend response status:', response.status);
    const data = await response.json();
    console.log('🏪 Backend response data:', data);
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        data: data.data,
        message: data.message || 'Shop created successfully'
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: data.message || 'Failed to create shop'
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Create shop API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
