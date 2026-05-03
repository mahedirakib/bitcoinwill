import { describe, expect, it } from 'vitest';
import * as ecc from 'tiny-secp256k1';
import { bytesToHex, hexToBytes } from './hex';
import { generateSecp256k1PrivateKey, type RandomBytes } from './keygen';

const VALID_PRIVATE_KEY = 'e9873d79c6d87dc0fb6a5778633389f4453213303da61f20bd67fc233aa33262';

describe('generateSecp256k1PrivateKey', () => {
  it('returns a valid 32-byte secp256k1 private key', () => {
    const randomBytes: RandomBytes = (target) => {
      target.set(hexToBytes(VALID_PRIVATE_KEY));
      return target;
    };

    const privateKey = generateSecp256k1PrivateKey(randomBytes);

    expect(privateKey).toHaveLength(32);
    expect(ecc.isPrivate(privateKey)).toBe(true);
    expect(bytesToHex(privateKey)).toBe(VALID_PRIVATE_KEY);
  });

  it('retries invalid random candidates before returning a key', () => {
    let calls = 0;
    const randomBytes: RandomBytes = (target) => {
      calls += 1;
      if (calls === 1) {
        target.fill(0);
        return target;
      }

      target.set(hexToBytes(VALID_PRIVATE_KEY));
      return target;
    };

    const privateKey = generateSecp256k1PrivateKey(randomBytes);

    expect(calls).toBe(2);
    expect(bytesToHex(privateKey)).toBe(VALID_PRIVATE_KEY);
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
