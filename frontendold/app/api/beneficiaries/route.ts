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
    const url = new URL(`${DJANGO_API_URL}/api/beneficiaries/`);
    req.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: buildAuthHeaders(req),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Beneficiaries proxy GET error:', error);
    return NextResponse.json({ message: 'Unable to load beneficiaries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const response = await fetch(`${DJANGO_API_URL}/api/beneficiaries/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(req),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Beneficiaries proxy POST error:', error);
    return NextResponse.json({ message: 'Unable to create beneficiary' }, { status: 500 });
  }
}
