import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

const ROLE_ENDPOINT: Record<string, string> = {
  hospital_admin: '/api/accounts/hospital-admins/',
  social_worker: '/api/accounts/social-workers/',
  receptionist: '/api/accounts/receptionists/',
  donor: '/api/accounts/donors/register/',
};

export async function POST(req: NextRequest) {
  try {
    // Try to parse as multipart/form-data first (files for hospital admin)
    let role: string | undefined;
    let forwardOptions: { method: string; headers: any; body: any } = {
      method: 'POST',
      headers: {},
      body: null,
    };

    const contentType = req.headers.get('content-type') || '';
    role = role || req.nextUrl.searchParams.get('role') || undefined;

    if (contentType.includes('multipart/form-data')) {
      if (!role) {
        return NextResponse.json({ message: 'Missing role query parameter for multipart request' }, { status: 400 });
      }
      const body = await req.arrayBuffer();
      forwardOptions.body = body;
      forwardOptions.headers['Content-Type'] = contentType;
    } else {
      const body = await req.json().catch(() => ({}));
      role = role || body.role;
      const payload = body.payload || {};
      forwardOptions.headers['Content-Type'] = 'application/json';
      forwardOptions.body = JSON.stringify(payload);
    }

    if (!role || !ROLE_ENDPOINT[role]) {
      return NextResponse.json({ message: 'Invalid or missing role' }, { status: 400 });
    }

    const endpoint = ROLE_ENDPOINT[role];
    const token = req.cookies.get('joyfund_token')?.value;

    if (token) {
      forwardOptions.headers = { ...(forwardOptions.headers || {}), Authorization: `Bearer ${token}` };
    }

    const response = await fetch(`${DJANGO_API_URL}${endpoint}`, forwardOptions);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Admin create-user backend error', response.status, data);
    }
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error('Admin create-user proxy error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
