import { useStore } from '@/store/useStore';

export async function logoutUser() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout request failed', error);
  }

  useStore.getState().logout();
}

// Server-side token extraction for Next.js route handlers
import { NextRequest } from 'next/server';

export async function getServerAccessToken(req: NextRequest): Promise<string> {
  // Token can come from Authorization header (forwarded by client-side fetch)
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Fallback: check cookie-based session
  const cookie = req.cookies.get('access_token');
  if (cookie?.value) return cookie.value;
  return '';
}
