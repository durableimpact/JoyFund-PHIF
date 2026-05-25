import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  if (!campaignId) return NextResponse.json({ message: 'Missing campaign id' }, { status: 400 });
  const token = req.cookies.get('joyfund_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '') || '';
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${DJANGO_API_URL}/api/campaigns/${campaignId}/donate/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
