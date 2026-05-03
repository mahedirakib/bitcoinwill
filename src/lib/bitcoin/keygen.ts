import * as ecc from 'tiny-secp256k1';

const PRIVATE_KEY_BYTES = 32;
const DEFAULT_MAX_ATTEMPTS = 128;

export type RandomBytes = (target: Uint8Array) => Uint8Array;

const browserRandomBytes: RandomBytes = (target) => crypto.getRandomValues(target);

export const generateSecp256k1PrivateKey = (
  randomBytes: RandomBytes = browserRandomBytes,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
): Uint8Array => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = randomBytes(new Uint8Array(PRIVATE_KEY_BYTES));
    if (candidate.length === PRIVATE_KEY_BYTES && ecc.isPrivate(candidate)) {
      return candidate;
    }
  }

  throw new Error('Failed to generate a valid secp256k1 private key.');
};
