'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores';

export function useCheckAuth() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);
}
