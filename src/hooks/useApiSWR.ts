'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import useSWR from 'swr';
import type { ApiError } from '@/lib/api';

/**
 * SWR-backed data hook. Drop-in replacement for the old hand-rolled `useFetch`:
 * it keeps the exact same `{ data, loading, error, refetch, setData }` surface, so
 * migrating a call site is just a hook-name swap.
 *
 * The win over the old hook is SWR's shared, keyed cache: two components requesting
 * the same URL dedupe onto one in-flight request, cached responses are reused across
 * mounts/remounts/navigation (see `SWRProvider`'s `dedupingInterval`), and an
 * optimistic `setData` (or a `refetch`) updates the shared cache so every mounted
 * component reading that key stays in sync — the whole point of the Neon
 * data-transfer reduction (stop re-shipping identical payloads on every remount).
 *
 * - `url = null` skips the request (same conditional-fetch behavior as before).
 * - `refetch()` revalidates the key.
 * - `setData(value | updater)` writes the SWR cache for this key without revalidating
 *   (used for optimistic updates); typed as a React setState so it can be passed
 *   straight through as a `Dispatch<SetStateAction<T | null>>` prop.
 */
export function useApiSWR<T>(url: string | null) {
  const { data, error, isLoading, mutate } = useSWR<T>(url);

  const refetch = useCallback(() => {
    void mutate();
  }, [mutate]);

  const setData: Dispatch<SetStateAction<T | null>> = useCallback(
    (value) => {
      void mutate(
        (current: T | undefined) => {
          const prev = (current ?? null) as T | null;
          const next =
            typeof value === 'function'
              ? (value as (p: T | null) => T | null)(prev)
              : value;
          return (next ?? undefined) as T | undefined;
        },
        { revalidate: false },
      );
    },
    [mutate],
  );

  const apiError = error as ApiError | undefined;
  const errorMessage = apiError
    ? apiError.body?.message || apiError.message || 'Request failed'
    : null;

  return {
    data: (data ?? null) as T | null,
    loading: isLoading,
    error: errorMessage,
    refetch,
    setData,
  };
}
