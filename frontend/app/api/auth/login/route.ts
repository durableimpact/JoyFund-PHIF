import { NextRequest, NextResponse } from 'next/server';
import { DJANGO_API_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } from '@/lib/apiClient';

const INFO_ENDPOINTS = {
  DONOR: '/api/accounts/donor/info/',
  HOSPITAL_ADMIN: '/api/accounts/hospital-admin/info/',
  RECEPTIONIST: '/api/accounts/receptionist/info/',
  SOCIAL_WORKER: '/api/accounts/social-worker/info/',
  SYSTEM_ADMIN: '/api/accounts/system-admin/info/',
};

async function obtainToken(email: string, password: string) {
  const params = new URLSearchParams({
    grant_type: 'password',
    username: email,
    password,
    client_id: OAUTH_CLIENT_ID,
    client_secret: OAUTH_CLIENT_SECRET,
  });

  const response = await fetch(`${DJANGO_API_URL}/auth/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OAuth error:', errorData);
    const detail = errorData.error_description || errorData.detail || 'Authentication failed';
    throw new Error(detail);
  }

  const data = await response.json();
  return {
    access: data.access_token || data.access,
    refresh: data.refresh_token || data.refresh,
  };
}

async function fetchCurrentUser(accessToken: string) {
  for (const endpoint of Object.values(INFO_ENDPOINTS)) {
    try {
      const response = await fetch(`${DJANGO_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return normalizeUser(data);
      }

      if (response.status === 403) {
        continue; // Try next endpoint
      }

      if (response.status === 401) {
        throw new Error('Unauthorized');
      }

      throw new Error('Failed to fetch user profile');
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        throw error;
      }
      // Continue to next endpoint
    }
  }

  throw new Error('Unable to determine authenticated user role');
}

function normalizeUser(data: any) {
  const user = data?.user ? data.user : data;
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || user?.email || 'Unknown User';
  const phone = user?.phone_number || user?.phone || undefined;
  const hospitalId = data?.hospital?.id ?? user?.hospital?.id ?? undefined;
  const avatarUrl = user?.profile_picture
    ? `${DJANGO_API_URL}${user.profile_picture}`
    : undefined;

  const roleMap: Record<string, string> = {
    DONOR: 'donor',
    SOCIAL_WORKER: 'social_worker',
    RECEPTIONIST: 'receptionist',
    HOSPITAL_ADMIN: 'hospital_admin',
    SYSTEM_ADMIN: 'admin',
  };

  function normalizeRole(input?: string): string {
    if (!input) return 'donor';
    const normalized = input.toUpperCase();
    return roleMap[normalized] || normalized.toLowerCase().replace(/\s+/g, '_');
  }

  return {
    id: user?.id ?? '',
    name,
    email: user?.email ?? '',
    phone,
    role: normalizeRole(user?.role),
    hospitalId,
    avatarUrl,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const tokens = await obtainToken(email, password);
    const user = await fetchCurrentUser(tokens.access);

    return NextResponse.json({
      access: tokens.access,
      refresh: tokens.refresh,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}