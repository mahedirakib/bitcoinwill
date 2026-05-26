import { useState, useCallback, useRef, useEffect } from 'react';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseAsyncStateReturn<T> extends AsyncState<T> {
  execute: (asyncFn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  setData: (data: T) => void;
}

/**
 * A reusable hook for managing async operation state (loading, error, data).
 *
 * @example
 * const { data, isLoading, error, execute } = useAsyncState<AddressSummary>();
 *
 * const loadData = async () => {
 *   await execute(async () => {
 *     return await fetchAddressSummary({ network, address });
 *   });
 * };
 */
export function useAsyncState<T>(): UseAsyncStateReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFn();
      if (isMountedRef.current) {
        setState({ data: result, isLoading: false, error: null });
      }
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  const setData = useCallback((data: T) => {
    setState({ data, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}
