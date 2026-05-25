import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';
import { getServerAccessToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = await getServerAccessToken(req);
  const res = await fetch(`${DJANGO_API_URL}/api/vouchers/`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
