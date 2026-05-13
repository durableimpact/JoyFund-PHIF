import { useStore } from '../store/useStore';
import { DJANGO_API_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } from '@/lib/apiClient';

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const store = useStore.getState();
  const accessToken = store.accessToken;

  const headers = new Headers(options.headers);
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Try to refresh token
    try {
      const refreshToken = store.refreshToken;
      if (refreshToken) {
        const refreshResponse = await fetch(`${DJANGO_API_URL}/auth/token/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: OAUTH_CLIENT_ID,
            client_secret: OAUTH_CLIENT_SECRET,
          }).toString(),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.access_token || refreshData.access;
          store.setAccessToken(newAccessToken);

          // Retry the original request with new token
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          return fetch(url, {
            ...options,
            headers,
          });
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // Refresh failed, logout
    store.logout();
    throw new Error('Session expired. Please log in again.');
  }

  return response;
}

// Helper for authenticated API calls
export async function authenticatedFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${DJANGO_API_URL}${endpoint}`;
  const response = await apiFetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Request failed: ${response.status}`);
  }

  return response.json();
}