import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${DJANGO_API_URL}/api/accounts/password/reset/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Always return 200 for security, even if email doesn't exist
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return 200 for security
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}