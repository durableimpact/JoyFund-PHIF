import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();
  if (!email || !code) return NextResponse.json({ message: 'Email and code are required.' }, { status: 400 });

  // TODO: POST to Django → /api/auth/password-reset/verify/
  // const res = await fetch(`${process.env.DJANGO_API_URL}/api/auth/password-reset/verify/`, {
  //   method: 'POST',
  //   body: JSON.stringify({ email, token: code }),
  // });
  // if (!res.ok) return NextResponse.json({ message: 'Invalid or expired code.' }, { status: 400 });

  return NextResponse.json({ ok: true }, { status: 200 });
}