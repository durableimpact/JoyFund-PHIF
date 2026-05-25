import { useStore } from '@/store/useStore';
import { DJANGO_API_URL } from './apiClient';

/**
 * Authenticated fetch — sends requests directly to Django backend.
 * Handles token auth, 401 auto-logout, and proper error parsing.
 */
export async function authenticatedFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const store = useStore.getState();
  const token = store.accessToken;
  const method = (options.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type for requests with a body
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${DJANGO_API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, { ...options, method, headers });
  } catch (networkError) {
    throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:8000');
  }

  if (res.status === 401) {
    store.logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    let errorMessage = `Error ${res.status}`;
    try {
      const errorData = await res.json();
      // Django REST Framework error formats
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.non_field_errors) {
        errorMessage = errorData.non_field_errors[0];
      } else {
        // Field-level errors: join them
        const fieldErrors = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .slice(0, 3)
          .join('; ');
        if (fieldErrors) errorMessage = fieldErrors;
      }
    } catch {}
    throw new Error(errorMessage);
  }

  // Handle empty responses
  if (res.status === 204) return {};
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return {};

  return res.json();
}
