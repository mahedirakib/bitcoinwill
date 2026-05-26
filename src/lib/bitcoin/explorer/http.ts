import { extractErrorMessage } from './utils';
import {
  ExplorerError,
  ExplorerNetworkError,
  ExplorerTimeoutError,
  ExplorerClientError,
  ExplorerServerError,
} from './errors';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10_000,
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const exponential = config.baseDelayMs * 2 ** attempt;
  const jitter = Math.random() * 1000;
  return Math.min(exponential + jitter, config.maxDelayMs);
};

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof ExplorerError) return error.isRetryable;
  // Only retry TypeErrors that appear to be network-related (fetch failures).
  // Other TypeErrors are likely programming bugs and should not be retried.
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('failed to fetch')
    );
  }
  if (error instanceof Error && error.name === 'AbortError') return true;
  return false;
};

const classifyResponseError = async (response: Response): Promise<ExplorerError> => {
  const message = await extractErrorMessage(response);
  if (response.status >= 400 && response.status < 500) {
    return new ExplorerClientError(message, response.status);
  }
  if (response.status >= 500) {
    return new ExplorerServerError(message, response.status);
  }
  return new ExplorerError(message, 'HTTP_ERROR', false);
};

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt += 1) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === retryConfig.maxRetries || !isRetryableError(lastError)) {
        break;
      }

      const delay = calculateDelay(attempt, retryConfig);
      await sleep(delay);
    }
  }

  throw lastError ?? new ExplorerNetworkError('Request failed after retries');
}

export const fetchJsonWithTimeout = async <T>(
  url: string,
  fetcher: typeof fetch,
  timeoutMs: number,
  retryConfig?: RetryConfig,
): Promise<T> => {
  return fetchWithRetry(async () => {
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(url, { signal: controller.signal });
      if (!response.ok) {
        throw await classifyResponseError(response);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ExplorerTimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`);
      }
      if (error instanceof TypeError) {
        throw new ExplorerNetworkError(`Network error fetching ${url}: ${error.message}`);
      }
      throw error;
    } finally {
      globalThis.clearTimeout(timer);
    }
  }, retryConfig);
};

export const fetchTextWithTimeout = async (
  url: string,
  fetcher: typeof fetch,
  timeoutMs: number,
  init?: RequestInit,
  retryConfig?: RetryConfig,
): Promise<string> => {
  return fetchWithRetry(async () => {
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(url, { ...init, signal: controller.signal });
      if (!response.ok) {
        throw await classifyResponseError(response);
      }
      return await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ExplorerTimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`);
      }
      if (error instanceof TypeError) {
        throw new ExplorerNetworkError(`Network error fetching ${url}: ${error.message}`);
      }
      throw error;
    } finally {
      globalThis.clearTimeout(timer);
    }
  }, retryConfig);
};
