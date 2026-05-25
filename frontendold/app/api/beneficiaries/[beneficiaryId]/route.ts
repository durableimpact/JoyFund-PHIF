import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

function getToken(req: NextRequest): string {
  return req.cookies.get('joyfund_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '') || '';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ beneficiaryId: string }> }
) {
  const { beneficiaryId } = await params;
  if (!beneficiaryId) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
  const token = getToken(req);
  const res = await fetch(`${DJANGO_API_URL}/api/beneficiaries/${beneficiaryId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ beneficiaryId: string }> }
) {
  const { beneficiaryId } = await params;
  const token = getToken(req);
  const body = await req.json();
  const res = await fetch(`${DJANGO_API_URL}/api/beneficiaries/${beneficiaryId}/`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
