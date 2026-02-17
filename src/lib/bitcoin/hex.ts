/**
 * Browser-safe hex helpers used by Bitcoin logic modules.
 */

export const hexToBytes = (hex: string): Uint8Array => {
  const normalized = hex.trim().toLowerCase();
  if (normalized.length % 2 !== 0) {
    throw new Error('Hex string must have an even length.');
  }

  const output = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    const parsed = Number.parseInt(normalized.slice(i, i + 2), 16);
    if (Number.isNaN(parsed)) {
      throw new Error('Invalid hex string.');
    }
    output[i / 2] = parsed;
  }
  return output;
};

export const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
