export const getTimeoutMs = (timeoutMs?: number): number =>
  Number.isFinite(timeoutMs) && (timeoutMs as number) > 0 ? (timeoutMs as number) : 10_000;

export const sanitizeAddress = (address: string): string => {
  const normalized = address.trim();
  if (normalized.length < 14) {
    throw new Error('Address is too short to query.');
  }
  return normalized;
};

export const sanitizeRawTxHex = (rawTxHex: string): string => {
  const normalized = rawTxHex.trim().toLowerCase();
  if (normalized.length === 0) {
    throw new Error('Transaction hex is required.');
  }
  if (!/^[a-f0-9]+$/.test(normalized)) {
    throw new Error('Transaction hex must contain only hexadecimal characters (0-9, a-f).');
  }
  if (normalized.length % 2 !== 0) {
    throw new Error('Transaction hex must have an even number of characters.');
  }
  if (normalized.length < 20) {
    throw new Error('Transaction hex is too short to be valid.');
  }
  return normalized;
};

export const toSafeInteger = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.trunc(value);
};

export const parseTipHeight = (value: string): number | undefined => {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const extractErrorMessage = async (response: Response): Promise<string> => {
  const body = await response.text().catch(() => '');
  const normalized = body.trim();
  if (normalized.length > 0) {
    return normalized.slice(0, 300);
  }
  return `${response.status} ${response.statusText}`.trim();
};

export const formatSats = (sats: number): string =>
  new Intl.NumberFormat('en-US').format(Math.trunc(sats));

export const formatBtc = (sats: number): string =>
  (sats / 100_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
