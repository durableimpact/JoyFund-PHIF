'use client';

import { useEffect } from 'react';

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const registerWorker = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('[PWA] Service worker registered successfully.');
      } catch (error) {
        console.warn('[PWA] Service worker registration failed:', error);
      }
    };

    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
      registerWorker();
    }
  }, []);

  return null;
}
