import { describe, it, expect } from 'vitest';
import * as ecc from 'tiny-secp256k1';
import {
  splitPrivateKey,
  combineShares,
  validateShare,
  getSSSOptions,
  collectUniqueValidShares,
} from './sss';
import { bytesToHex } from './hex';

describe('Shamir Secret Sharing', () => {
  // Build a valid 32-byte secp256k1 private key at runtime so the repo never
  // commits a hardcoded scalar for which ecc.isPrivate is true (AGENTS.md:
  // "Never commit private keys — Not even for testing").
  const buildTestPrivateKeyBytes = (): Uint8Array => {
    const candidate = new Uint8Array(32);
    candidate.fill(0xab);
    for (let high = 0x01; high < 0xff; high += 1) {
      candidate[0] = high;
      if (ecc.isPrivate(candidate)) {
        return candidate;
      }
    }
    throw new Error('test setup: could not derive a valid test private key');
  };

  const TEST_PRIVATE_KEY_BYTES = buildTestPrivateKeyBytes();
  const TEST_PRIVATE_KEY = bytesToHex(TEST_PRIVATE_KEY_BYTES);

  describe('splitPrivateKey', () => {
    it('should split into 2-of-3 shares', async () => {
      const result = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });

      expect(result.shares).toHaveLength(3);
      expect(result.config.threshold).toBe(2);
      expect(result.config.total).toBe(3);
      expect(result.shares[0].index).toBe(1);
      expect(result.shares[1].index).toBe(2);
      expect(result.shares[2].index).toBe(3);
      
      // Each share should be valid hex
      result.shares.forEach(share => {
        expect(validateShare(share.share)).toBe(true);
      });
    });

    it('should split into 3-of-5 shares', async () => {
      const result = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 3, total: 5 });

      expect(result.shares).toHaveLength(5);
      expect(result.config.threshold).toBe(3);
      expect(result.config.total).toBe(5);
    });

    it('should include instructions', async () => {
      const result = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });

      expect(result.instructions.length).toBeGreaterThan(0);
      expect(result.instructions.join(' ')).toContain('2-of-3');
    });

    it('should reject invalid private key', async () => {
      await expect(
        splitPrivateKey('invalid', { threshold: 2, total: 3 })
      ).rejects.toThrow('Invalid private key');
    });

    it('should reject private key with wrong length', async () => {
      await expect(
        splitPrivateKey('abcd1234', { threshold: 2, total: 3 })
      ).rejects.toThrow('Invalid private key');
    });

    it('should reject invalid secp256k1 private key scalars', async () => {
      await expect(
        splitPrivateKey('0'.repeat(64), { threshold: 2, total: 3 })
      ).rejects.toThrow('valid secp256k1 scalar');
    });

    it('should reject unsupported runtime SSS configurations', async () => {
      await expect(
        splitPrivateKey(
          TEST_PRIVATE_KEY,
          { threshold: 2, total: 5 } as unknown as Parameters<typeof splitPrivateKey>[1],
        ),
      ).rejects.toThrow('Invalid SSS configuration');
    });
  });

  describe('combineShares', () => {
    it('should reconstruct from 2-of-3 threshold', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });
      
      // Use shares 1 and 2
      const sharesToCombine = [
        splitResult.shares[0].share,
        splitResult.shares[1].share,
      ];

      const reconstructed = await combineShares(sharesToCombine, { expectedThreshold: 2 });
      expect(reconstructed).toBe(TEST_PRIVATE_KEY);
    });

    it('should reconstruct from any 2 shares in 2-of-3', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });
      
      // Try different combinations
      const combo1 = [splitResult.shares[0].share, splitResult.shares[2].share];
      const combo2 = [splitResult.shares[1].share, splitResult.shares[2].share];

      expect(await combineShares(combo1, { expectedThreshold: 2 })).toBe(TEST_PRIVATE_KEY);
      expect(await combineShares(combo2, { expectedThreshold: 2 })).toBe(TEST_PRIVATE_KEY);
    });

    it('should reconstruct from 3-of-5 threshold', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 3, total: 5 });
      
      const sharesToCombine = [
        splitResult.shares[0].share,
        splitResult.shares[2].share,
        splitResult.shares[4].share,
      ];

      const reconstructed = await combineShares(sharesToCombine, { expectedThreshold: 3 });
      expect(reconstructed).toBe(TEST_PRIVATE_KEY);
    });

    it('should work with more than threshold shares', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });
      
      // Use all 3 shares (more than threshold of 2)
      const sharesToCombine = splitResult.shares.map(s => s.share);

      const reconstructed = await combineShares(sharesToCombine, { expectedThreshold: 2 });
      expect(reconstructed).toBe(TEST_PRIVATE_KEY);
    });

    it('should reject single share', async () => {
      await expect(combineShares(['abcd1234'], { expectedThreshold: 2 })).rejects.toThrow('At least 2 shares required');
    });

    it('should reject fewer shares than the expected threshold', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 3, total: 5 });

      // Provide only 2 shares for a 3-of-5 scheme — would silently yield a
      // wrong key without the threshold check.
      const twoShares = [splitResult.shares[0].share, splitResult.shares[1].share];

      await expect(
        combineShares(twoShares, { expectedThreshold: 3 }),
      ).rejects.toThrow('Need at least 3 shares');
    });

    it('should reject an unsupported expected threshold', async () => {
      await expect(
        // 4 is not a supported threshold (only 2 and 3 are)
        combineShares(['a'.repeat(64), 'b'.repeat(64)], { expectedThreshold: 4 as unknown as 2 | 3 }),
      ).rejects.toThrow('Invalid expected threshold');
    });

    it('should verify the reconstructed key against the expected beneficiary pubkey', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });
      const derivedPub = ecc.pointFromScalar(TEST_PRIVATE_KEY_BYTES, true);
      // TEST_PRIVATE_KEY is a valid scalar, so pointFromScalar always returns a point.
      if (!derivedPub) throw new Error('test setup: expected a derived pubkey');
      const expectedPubkey = bytesToHex(derivedPub);
      const shares = [splitResult.shares[0].share, splitResult.shares[1].share];

      const reconstructed = await combineShares(shares, {
        expectedThreshold: 2,
        expectedBeneficiaryPubkey: expectedPubkey,
      });
      expect(reconstructed).toBe(TEST_PRIVATE_KEY);
    });

    it('should throw when the reconstructed key does not match the expected pubkey', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });
      const shares = [splitResult.shares[0].share, splitResult.shares[1].share];

      // A different, valid-looking pubkey that does NOT correspond to the secret.
      const wrongPubkey = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';

      await expect(
        combineShares(shares, { expectedThreshold: 2, expectedBeneficiaryPubkey: wrongPubkey }),
      ).rejects.toThrow('does not match the beneficiary public key');
    });

    it('should reject an invalid expected beneficiary pubkey', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });
      const shares = [splitResult.shares[0].share, splitResult.shares[1].share];

      await expect(
        combineShares(shares, { expectedThreshold: 2, expectedBeneficiaryPubkey: 'not-a-pubkey' }),
      ).rejects.toThrow('not a valid compressed pubkey');
    });
  });

  describe('validateShare', () => {
    it('should validate correct share format', () => {
      expect(validateShare('abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234')).toBe(true);
    });

    it('should accept surrounding whitespace and uppercase hex', () => {
      expect(validateShare('  ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234  ')).toBe(true);
    });

    it('should reject short shares', () => {
      expect(validateShare('abcd')).toBe(false);
      expect(validateShare('')).toBe(false);
    });

    it('should reject non-hex shares', () => {
      expect(validateShare('ghijklmnop')).toBe(false);
    });

    it('should reject odd-length hex shares', () => {
      expect(validateShare(`${'a'.repeat(64)}f`)).toBe(false);
    });
  });

  describe('collectUniqueValidShares', () => {
    it('should trim, normalize, and deduplicate valid shares', () => {
      const shareA = 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';
      const shareB = 'efef5678efef5678efef5678efef5678efef5678efef5678efef5678efef5678';

      expect(
        collectUniqueValidShares([
          `  ${shareA.toUpperCase()}  `,
          'not-a-share',
          shareB,
          shareA,
        ]),
      ).toEqual([shareA, shareB]);
    });
  });

  describe('getSSSOptions', () => {
    it('should return 2-of-3 and 3-of-5 options', () => {
      const options = getSSSOptions();
      
      expect(options).toHaveLength(2);
      expect(options[0].id).toBe('2-of-3');
      expect(options[1].id).toBe('3-of-5');
      expect(options[0].label).toContain('2-of-3');
      expect(options[1].label).toContain('3-of-5');
    });
  });
});
