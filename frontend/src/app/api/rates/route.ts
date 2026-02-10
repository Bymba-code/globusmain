import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // TODO: Connect to backend API for real rates data
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rates/`);
    // if (!response.ok) throw new Error('Failed to fetch rates');
    // const data = await response.json();
    // return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
    
    // Return empty state until backend is connected
    return NextResponse.json(
      {
        success: false,
        message: 'Backend not connected. Configure NEXT_PUBLIC_API_BASE_URL',
        data: [],
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error fetching rates:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch rates', data: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
