import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  if (!campaignId) return NextResponse.json({ message: 'Missing campaign id' }, { status: 400 });
  const url = new URL(`${DJANGO_API_URL}/api/campaigns/${campaignId}/`);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));
  const res = await fetch(url.toString());
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
