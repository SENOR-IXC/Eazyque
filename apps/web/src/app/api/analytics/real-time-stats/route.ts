import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:5001/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/analytics/real-time-stats`, {
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch real-time analytics' },
      { status: 500 }
    );
  }
}
