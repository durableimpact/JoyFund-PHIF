'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function ClientHydrator() {
  const loadInitialData = useStore((s) => s.loadInitialData);

  useEffect(() => {
    if (typeof loadInitialData === 'function') {
      loadInitialData().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('ClientHydrator loadInitialData failed', err);
      });
    }
  }, [loadInitialData]);

  return null;
}
