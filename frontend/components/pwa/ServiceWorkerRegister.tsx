'use client';

import { useEffect } from 'react';

/**
 * Service Worker Registration Component
 * Registers the service worker for PWA functionality:
 * - Offline support via caching
 * - Web push notifications
 * - Background sync
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register in browser environment
    if (typeof window === 'undefined') return;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported in this browser');
      return;
    }

    // Register service worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Always check for updates
        });

        console.log('✅ Service Worker registered successfully:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is ready
              console.log('📦 New Service Worker version available');

              // Notify the new service worker to skip waiting
              // This will activate the new version immediately
              newWorker.postMessage({ type: 'SKIP_WAITING' });

              // Show update notification (optional)
              if (window.confirm('A new version of JoyFund is available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });

        // Handle service worker errors
        registration.addEventListener('error', (error) => {
          console.error('❌ Service Worker error:', error);
        });
      } catch (error) {
        console.error('❌ Failed to register Service Worker:', error);
      }
    };

    // Register after a short delay to ensure DOM is ready
    const timer = setTimeout(registerServiceWorker, 1000);

    // Cleanup
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything
  return null;
}
