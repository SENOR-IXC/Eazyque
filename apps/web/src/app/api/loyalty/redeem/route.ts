import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');
    
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
      body: JSON.stringify(body),
    });

    const data = await apiResponse.json();
    
    return NextResponse.json(data, { 
      status: apiResponse.status 
    });
  } catch (error) {
    console.error('Loyalty redeem proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}