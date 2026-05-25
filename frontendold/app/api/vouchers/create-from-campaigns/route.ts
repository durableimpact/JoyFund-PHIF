import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';
import { getServerAccessToken } from '@/lib/auth';
export async function POST(req: NextRequest) {
  const token = await getServerAccessToken(req);
  const body = await req.json();
  const res = await fetch(`${DJANGO_API_URL}/api/vouchers/create-from-campaigns/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
