import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  // TODO: Replace with real DB lookup + bcrypt.compare()
  // For now, mock a successful response for testing
  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  // Mock: forward to your real backend here
  // const res = await fetch('https://your-api.com/auth/login', { method: 'POST', body: ... })

  // Temporary mock user — remove when backend is ready
  const mockUser = {
    id: 'usr-001',
    name: 'Jean-Pierre Mbarga',
    email,
    role: 'donor',
    token: 'mock-jwt-token-replace-me',
  };

  return NextResponse.json({ user: mockUser }, { status: 200 });
}