'use client';

import { useState } from 'react';
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

  const mutate = async (variables: TVariables): Promise<TData> => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutationFn(variables);
      setData(result);
      await options?.onSuccess?.(result, variables);
      return result;
    } catch (e) {
      const apiError = e as ApiError;
      const errorMessage = apiError?.body?.message || apiError?.message || 'Request failed';
      setError(errorMessage);
      options?.onError?.(apiError);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setData(null);
    setLoading(false);
  };

  return {
    mutate,
    mutateAsync: mutate, // Alias for consistency with react-query
    loading,
    error,
    data,
    reset,
  };
}
