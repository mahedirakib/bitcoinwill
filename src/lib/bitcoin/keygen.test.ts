import { describe, expect, it } from 'vitest';
import * as ecc from 'tiny-secp256k1';
import { bytesToHex } from './hex';
import { generateSecp256k1PrivateKey, type RandomBytes } from './keygen';

/**
 * Build a deterministic, valid 32-byte secp256k1 private key at runtime so the
 * repo never commits a hardcoded scalar for which `ecc.isPrivate` is true
 * (AGENTS.md: "Never commit private keys — Not even for testing").
 *
 * We start from a fixed byte pattern (not itself a valid key in any meaningful
 * sense — it's just a test vector) and bump the high byte until ecc.isPrivate
 * accepts it. The result is only ever computed in-memory and never written to
 * the repo.
 */
const buildTestPrivateKey = (): Uint8Array => {
  const candidate = new Uint8Array(32);
  // Start from a deterministic, non-zero pattern.
  candidate.fill(0xab);
  for (let high = 0x01; high < 0xff; high += 1) {
    candidate[0] = high;
    if (ecc.isPrivate(candidate)) {
      return candidate;
    }
  }
  throw new Error('test setup: could not derive a valid test private key');
};

describe('generateSecp256k1PrivateKey', () => {
  it('returns a valid 32-byte secp256k1 private key', () => {
    const expected = buildTestPrivateKey();
    const expectedHex = bytesToHex(expected);
    const randomBytes: RandomBytes = (target) => {
      target.set(expected);
      return target;
    };

    const privateKey = generateSecp256k1PrivateKey(randomBytes);

    expect(privateKey).toHaveLength(32);
    expect(ecc.isPrivate(privateKey)).toBe(true);
    expect(bytesToHex(privateKey)).toBe(expectedHex);
  });

  it('retries invalid random candidates before returning a key', () => {
    const expected = buildTestPrivateKey();
    const expectedHex = bytesToHex(expected);
    let calls = 0;
    const randomBytes: RandomBytes = (target) => {
      calls += 1;
      if (calls === 1) {
        target.fill(0);
        return target;
      }

      target.set(expected);
      return target;
    };

    const privateKey = generateSecp256k1PrivateKey(randomBytes);

    expect(calls).toBe(2);
    expect(bytesToHex(privateKey)).toBe(expectedHex);
  });

  it('throws when no valid candidate is generated', () => {
    const randomBytes: RandomBytes = (target) => {
      target.fill(0);
      return target;
    };

    expect(() => generateSecp256k1PrivateKey(randomBytes, 2)).toThrow(
      'Failed to generate a valid secp256k1 private key.',
    );
  });
});
