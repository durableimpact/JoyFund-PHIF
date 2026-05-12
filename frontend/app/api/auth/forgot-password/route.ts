import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ message: 'Email is required.' }, { status: 400 });

  // TODO: POST to Django → /api/auth/password-reset/   (django-rest-passwordreset or custom view)
  // await fetch(`${process.env.DJANGO_API_URL}/api/auth/password-reset/`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email }),
  // });

  // Always 200 — never confirm whether the email exists (security)
  return NextResponse.json({ ok: true }, { status: 200 });
}