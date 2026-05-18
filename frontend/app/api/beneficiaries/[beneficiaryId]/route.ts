import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = {};
  const token = req.cookies.get('joyfund_token')?.value;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function GET(req: NextRequest) {
  try {
    const { beneficiaryId } = req.nextUrl.pathname.match(/\/api\/beneficiaries\/(?<beneficiaryId>[^/]+)\/?/)?.groups || {};
    if (!beneficiaryId) {
      return NextResponse.json({ message: 'Missing beneficiary id' }, { status: 400 });
    }

    const response = await fetch(`${DJANGO_API_URL}/api/beneficiaries/${beneficiaryId}/`, {
      method: 'GET',
      headers: buildAuthHeaders(req),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Beneficiary detail proxy error:', error);
    return NextResponse.json({ message: 'Unable to load beneficiary details' }, { status: 500 });
  }
}
