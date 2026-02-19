'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import type { ApiError } from '@/lib/api';

export function useFetch<T>(url: string | null, options: RequestInit = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);
  const refetchController = useRef<AbortController | null>(null);

  // Stabilize options object to prevent infinite re-renders
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);

  const fetchData = useCallback(
    async (signal: AbortSignal) => {
      if (!url) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<T>(url, { ...options, signal });
        if (!signal.aborted) setData(res);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const apiError = e as ApiError;
        if (!signal.aborted) {
          setError(apiError?.body?.message || apiError?.message || 'Request failed');
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, optionsKey],
  );

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData, url]);

  const refetch = useCallback(() => {
    refetchController.current?.abort();
    refetchController.current = new AbortController();
    fetchData(refetchController.current.signal);
  }, [fetchData]);

  // Cleanup refetch controller on unmount
  useEffect(() => {
    return () => refetchController.current?.abort();
  }, []);

  return { data, loading, error, refetch, setData };
}
