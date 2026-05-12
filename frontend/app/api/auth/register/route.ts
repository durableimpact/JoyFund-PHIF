import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { fullName, email, phone, password, role } = await req.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
  }

  // TODO: Replace with real DB insert + bcrypt.hash(password, 10)
//   const res = await fetch('http://127.0.0.1:8000/api/accounts/donors/register/', { 
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ email, password, first_name, last_name, phone_number: phone}),
//    })

  const mockUser = {
    id: 'usr-new-' + Date.now(),
    name: fullName,
    email,
    role: role ?? 'donor',
    token: 'mock-jwt-token-replace-me',
  };

  return NextResponse.json({ user: mockUser }, { status: 201 });
}