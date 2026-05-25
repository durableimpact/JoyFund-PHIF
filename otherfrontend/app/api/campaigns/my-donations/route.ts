import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';
import { getServerAccessToken } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const token = await getServerAccessToken(req);
  const res = await fetch(`${DJANGO_API_URL}/api/campaigns/donations/my-donations/`, { headers: { Authorization: `Bearer ${token}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}
