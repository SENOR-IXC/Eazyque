import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:5001/api';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/shops`, {
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
    console.error('Get shops API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/shops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
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
