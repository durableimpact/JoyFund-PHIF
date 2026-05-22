import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/apiClient';

function sanitizePhone(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  const digits = cleaned.replace(/^0+/, '');
  return `+237${digits}`;
}

async function registerDonor(first_name: string, last_name: string, email: string, phone: string, password: string) {
  const response = await fetch(`${DJANGO_API_URL}/api/accounts/donors/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      first_name,
      last_name,
      phone_number: sanitizePhone(phone),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Backend error:', errorData);
    const detail = errorData.detail || errorData.email?.[0] || errorData.phone_number?.[0] || errorData.non_field_errors?.[0] || 'Registration failed';
    throw new Error(detail);
  }

  return await response.json();
}

export async function POST(req: NextRequest) {
  try {
    const { first_name, last_name, email, phone, password } = await req.json();

    if (!first_name || !last_name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const registerResult = await registerDonor(first_name, last_name, email, phone, password);

    return NextResponse.json({
      user: registerResult.user,
      message: 'Registration successful. Please log in.',
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
