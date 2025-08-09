import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:5001/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
        token: data.data.token,
        data: data.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: data.message || 'Login failed'
      }, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Network error. Please check if the API server is running.' },
      { status: 500 }
    );
  }
}
