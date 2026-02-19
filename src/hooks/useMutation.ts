'use client';

import { useState, useCallback, useRef } from 'react';
import type { ApiError } from '@/lib/api';

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: ApiError) => void;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: string | null;
  data: TData | null;
  reset: () => void;
}

/**
 * Hook for handling mutations (POST, PUT, DELETE) with loading and error states
 * @example
 * const createLeague = useMutation(
 *   (data) => LeagueApi.create(data),
 *   { onSuccess: (result) => console.log('Created:', result) }
 * );
 * await createLeague.mutate({ name: 'My League' });
 */
export function useMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TVariables>,
): UseMutationResult<TData, TVariables> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutationFnRef = useRef(mutationFn);
  mutationFnRef.current = mutationFn;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutationFnRef.current(variables);
      setData(result);
      await optionsRef.current?.onSuccess?.(result, variables);
      return result;
    } catch (e) {
      const apiError = e as ApiError;
      const errorMessage = apiError?.body?.message || apiError?.message || 'Request failed';
      setError(errorMessage);
      optionsRef.current?.onError?.(apiError);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    mutateAsync: mutate,
    loading,
    error,
    data,
    reset,
  };
}
