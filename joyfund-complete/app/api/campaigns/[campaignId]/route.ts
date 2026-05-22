import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

export async function GET(req: NextRequest) {
  try {
    const { campaignId } = req.nextUrl.pathname.match(/\/api\/campaigns\/(?<campaignId>[^/]+)\/?/)?.groups || {};
    if (!campaignId) {
      return NextResponse.json({ message: 'Missing campaign id' }, { status: 400 });
    }

    const url = new URL(`${DJANGO_API_URL}/api/campaigns/${campaignId}/`);
    req.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Campaign detail proxy GET error:', error);
    return NextResponse.json({ message: 'Unable to load campaign details' }, { status: 500 });
  }
}
