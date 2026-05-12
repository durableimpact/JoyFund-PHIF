import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, code, password } = await req.json();
  if (!email || !code || !password) return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });

  // TODO: POST to Django → /api/auth/password-reset/confirm/
//   const res = await fetch(`${process.env.DJANGO_API_URL}/api/auth/password-reset/confirm/`, {
//     method: 'POST',
//     body: JSON.stringify({ email, token: code, password }),
//   });
//   if (!res.ok) return NextResponse.json({ message: 'Reset failed.' }, { status: 400 });

  return NextResponse.json({ ok: true }, { status: 200 });
}