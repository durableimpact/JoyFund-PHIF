import { useStore } from '@/store/useStore';

export async function logoutUser() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout request failed', error);
  }

  useStore.getState().logout();
}
