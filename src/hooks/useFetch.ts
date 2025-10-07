'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';

interface ApiError extends Error {
  status?: number;
  body?: {
    message?: string;
  };
}

export function useFetch<T>(url: string | null, options: RequestInit = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);

  // Stabilize options object to prevent infinite re-renders
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);

  const run = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<T>(url, options);
      setData(res);
    } catch (e) {
      const apiError = e as ApiError;
      setError(apiError?.body?.message || apiError?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, optionsKey]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run, setData };
}
