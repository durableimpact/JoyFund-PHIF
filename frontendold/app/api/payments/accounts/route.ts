import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';
import { getServerAccessToken } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const token = await getServerAccessToken(req);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || '';
  const path = type === 'escrow' ? '/api/payments/accounts/escrow/' : type === 'fee' ? '/api/payments/accounts/fee/' : '/api/payments/accounts/';
  const res = await fetch(`${DJANGO_API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}
