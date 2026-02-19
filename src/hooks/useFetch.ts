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

  const fetchData = useCallback(
    async (signal: AbortSignal) => {
      if (!url) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<T>(url, { ...options, signal });
        setData(res);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const apiError = e as ApiError;
        setError(apiError?.body?.message || apiError?.message || 'Request failed');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, optionsKey],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
  }, [fetchData]);

  return { data, loading, error, refetch, setData };
}
