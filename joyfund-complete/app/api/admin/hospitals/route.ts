import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('joyfund_token')?.value;
    const url = `${DJANGO_API_URL}/api/hospitals/`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error('Hospitals proxy error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
