import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
    });

    const data = await apiResponse.json();
    
    return NextResponse.json(data, { 
      status: apiResponse.status 
    });
  } catch (error) {
    console.error('Loyalty stats proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
