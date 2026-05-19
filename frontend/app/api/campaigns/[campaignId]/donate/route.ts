import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = req.cookies.get('joyfund_token')?.value;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function POST(req: NextRequest) {
  try {
    const { campaignId } = req.nextUrl.pathname.match(/\/api\/campaigns\/(?<campaignId>[^/]+)\/donate\/?/)?.groups || {};
    if (!campaignId) {
      return NextResponse.json({ message: 'Missing campaign id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const response = await fetch(`${DJANGO_API_URL}/api/campaigns/${campaignId}/donate/`, {
      method: 'POST',
      headers: buildAuthHeaders(req),
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Campaign donate proxy error:', error);
    return NextResponse.json({ message: 'Unable to process donation' }, { status: 500 });
  }
}
