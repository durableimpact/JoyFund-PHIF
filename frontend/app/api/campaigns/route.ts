import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(`${DJANGO_API_URL}/api/campaigns/`);
    req.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Campaigns proxy GET error:', error);
    return NextResponse.json({ message: 'Unable to load campaigns' }, { status: 500 });
  }
}
