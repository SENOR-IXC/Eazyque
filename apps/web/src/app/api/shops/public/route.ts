import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:5001/api';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/shops/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        data: data.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: data.message || 'Failed to fetch shops'
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Get public shops API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
