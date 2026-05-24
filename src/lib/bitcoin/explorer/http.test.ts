import { describe, expect, it, vi } from 'vitest';
import {
  fetchJsonWithTimeout,
  fetchTextWithTimeout,
  DEFAULT_RETRY_CONFIG,
} from './http';
import {
  ExplorerNetworkError,
  ExplorerTimeoutError,
  ExplorerClientError,
  ExplorerServerError,
} from './errors';

describe('explorer HTTP client', () => {
  const makeJsonResponse = (data: unknown, status = 200): Response =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  describe('fetchJsonWithTimeout', () => {
    it('returns parsed JSON on success', async () => {
      const fetcher = vi.fn().mockResolvedValue(makeJsonResponse({ balance: 1000 }));

      const result = await fetchJsonWithTimeout(
        'https://api.example.com/balance',
        fetcher as typeof fetch,
        5000,
        { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 },
      );

      expect(result).toEqual({ balance: 1000 });
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('retries on network error and succeeds', async () => {
      const fetcher = vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Network request failed'))
        .mockResolvedValueOnce(makeJsonResponse({ balance: 2000 }));

      const result = await fetchJsonWithTimeout(
        'https://api.example.com/balance',
        fetcher as typeof fetch,
        5000,
        { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 },
      );

      expect(result).toEqual({ balance: 2000 });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('retries on server error (5xx) and succeeds', async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(new Response('Internal Server Error', { status: 503 }))
        .mockResolvedValueOnce(makeJsonResponse({ balance: 3000 }));

      const result = await fetchJsonWithTimeout(
        'https://api.example.com/balance',
        fetcher as typeof fetch,
        5000,
        { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 },
      );

      expect(result).toEqual({ balance: 3000 });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('does not retry on client error (4xx)', async () => {
      const fetcher = vi.fn().mockResolvedValue(
        new Response('Not Found', { status: 404 }),
      );

      await expect(
        fetchJsonWithTimeout(
          'https://api.example.com/balance',
          fetcher as typeof fetch,
          5000,
          { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 },
        ),
      ).rejects.toThrow(ExplorerClientError);

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('throws ExplorerTimeoutError on abort', async () => {
      const fetcher = vi.fn().mockImplementation(() => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      await expect(
        fetchJsonWithTimeout(
          'https://api.example.com/balance',
          fetcher as typeof fetch,
          100,
          { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 },
        ),
      ).rejects.toThrow(ExplorerTimeoutError);
    });

    it('throws ExplorerNetworkError on TypeError', async () => {
      const fetcher = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

      await expect(
        fetchJsonWithTimeout(
          'https://api.example.com/balance',
          fetcher as typeof fetch,
          5000,
          { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 },
        ),
      ).rejects.toThrow(ExplorerNetworkError);
    });

    it('exhausts retries and throws last error', async () => {
      const fetcher = vi.fn().mockRejectedValue(new TypeError('Network failure'));

      await expect(
        fetchJsonWithTimeout(
          'https://api.example.com/balance',
          fetcher as typeof fetch,
          5000,
          { maxRetries: 1, baseDelayMs: 10, maxDelayMs: 100 },
        ),
      ).rejects.toThrow(ExplorerNetworkError);

      expect(fetcher).toHaveBeenCalledTimes(2); // initial + 1 retry
    });

    it('uses default retry config when not provided', async () => {
      const fetcher = vi.fn().mockResolvedValue(makeJsonResponse({ ok: true }));

      await fetchJsonWithTimeout(
        'https://api.example.com/balance',
        fetcher as typeof fetch,
        5000,
      );

      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchTextWithTimeout', () => {
    it('returns text on success', async () => {
      const fetcher = vi.fn().mockResolvedValue(new Response('hello world', { status: 200 }));

      const result = await fetchTextWithTimeout(
        'https://api.example.com/text',
        fetcher as typeof fetch,
        5000,
        undefined,
        { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 },
      );

      expect(result).toBe('hello world');
    });

    it('sends init options to fetcher', async () => {
      const fetcher = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));

      await fetchTextWithTimeout(
        'https://api.example.com/tx',
        fetcher as typeof fetch,
        5000,
        { method: 'POST', body: 'txhex' },
        { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 },
      );

      expect(fetcher).toHaveBeenCalledWith(
        'https://api.example.com/tx',
        expect.objectContaining({
          method: 'POST',
          body: 'txhex',
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('retries on server error', async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(new Response('Error', { status: 502 }))
        .mockResolvedValueOnce(new Response('success', { status: 200 }));

      const result = await fetchTextWithTimeout(
        'https://api.example.com/text',
        fetcher as typeof fetch,
        5000,
        undefined,
        { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 },
      );

      expect(result).toBe('success');
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('throws ExplorerServerError on 5xx', async () => {
      const fetcher = vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 }));

      await expect(
        fetchTextWithTimeout(
          'https://api.example.com/text',
          fetcher as typeof fetch,
          5000,
          undefined,
          { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 },
        ),
      ).rejects.toThrow(ExplorerServerError);
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(10000);
    });
  });
});
