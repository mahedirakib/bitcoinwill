import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncState } from './useAsyncState';

describe('useAsyncState', () => {
  it('returns data on success', async () => {
    const { result } = renderHook(() => useAsyncState<number>());

    let returnValue: number | null = null;
    await act(async () => {
      returnValue = await result.current.execute(async () => 42);
    });

    expect(returnValue).toBe(42);
    expect(result.current.data).toBe(42);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('captures error message on failure', async () => {
    const { result } = renderHook(() => useAsyncState<number>());

    await act(async () => {
      await result.current.execute(async () => {
        throw new Error('boom');
      });
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('boom');
    expect(result.current.isLoading).toBe(false);
  });

  it('uses fallback message for non-Error throws', async () => {
    const { result } = renderHook(() => useAsyncState<number>());

    await act(async () => {
      await result.current.execute(() => Promise.reject('string error'));
    });

    expect(result.current.error).toBe('An unexpected error occurred');
  });

  it('clears the loading state and ignores stale resolutions', async () => {
    const { result } = renderHook(() => useAsyncState<string>());

    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve('slow-result'), 50);
    });
    const fast = new Promise<string>((resolve) => {
      setTimeout(() => resolve('fast-result'), 5);
    });

    await act(async () => {
      const p1 = result.current.execute(() => slow);
      const p2 = result.current.execute(() => fast);
      await Promise.all([p1, p2]);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    // The latest call (fast) should win; the slow resolution must not overwrite it
    expect(result.current.data).toBe('fast-result');
  });

  it('does not apply the latest state after unmount', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useAsyncState<number>());

    let resolveFn: ((value: number) => void) | null = null;
    const pending = new Promise<number>((resolve) => {
      resolveFn = resolve;
    });

    void act(() => {
      void result.current.execute(() => pending);
    });

    unmount();
    await act(async () => {
      if (resolveFn) resolveFn(123);
    });

    // No error means no state update was attempted post-unmount
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('reset() clears data, error, and loading', async () => {
    const { result } = renderHook(() => useAsyncState<number>());

    await act(async () => {
      await result.current.execute(async () => 99);
    });

    expect(result.current.data).toBe(99);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('reset() prevents an in-flight request from restoring stale data', async () => {
    const { result } = renderHook(() => useAsyncState<number>());
    let resolvePending: ((value: number) => void) | undefined;
    const pending = new Promise<number>((resolve) => {
      resolvePending = resolve;
    });

    act(() => {
      void result.current.execute(() => pending);
    });
    act(() => {
      result.current.reset();
    });
    await act(async () => {
      resolvePending?.(123);
      await pending;
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('setData updates data and clears error', async () => {
    const { result } = renderHook(() => useAsyncState<{ name: string }>());

    act(() => {
      result.current.setData({ name: 'manual' });
    });

    expect(result.current.data).toEqual({ name: 'manual' });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('setData prevents an in-flight request from replacing manual data', async () => {
    const { result } = renderHook(() => useAsyncState<string>());
    let resolvePending: ((value: string) => void) | undefined;
    const pending = new Promise<string>((resolve) => {
      resolvePending = resolve;
    });

    act(() => {
      void result.current.execute(() => pending);
    });
    act(() => {
      result.current.setData('manual');
    });
    await act(async () => {
      resolvePending?.('stale');
      await pending;
    });

    expect(result.current.data).toBe('manual');
  });
});
