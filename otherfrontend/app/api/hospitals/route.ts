import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';
import { getServerAccessToken } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const token = await getServerAccessToken(req);
  const res = await fetch(`${DJANGO_API_URL}/api/hospitals/`, { headers: { Authorization: `Bearer ${token}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}
export async function POST(req: NextRequest) {
  const token = await getServerAccessToken(req);
  const body = await req.json();
  const res = await fetch(`${DJANGO_API_URL}/api/hospitals/`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
