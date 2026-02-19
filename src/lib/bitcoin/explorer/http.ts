import { extractErrorMessage } from './utils';

export const fetchJsonWithTimeout = async <T>(
  url: string,
  fetcher: typeof fetch,
  timeoutMs: number,
): Promise<T> => {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }
    return (await response.json()) as T;
  } finally {
    globalThis.clearTimeout(timer);
  }
};

export const fetchTextWithTimeout = async (
  url: string,
  fetcher: typeof fetch,
  timeoutMs: number,
  init?: RequestInit,
): Promise<string> => {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }
    return await response.text();
  } finally {
    globalThis.clearTimeout(timer);
  }
};
