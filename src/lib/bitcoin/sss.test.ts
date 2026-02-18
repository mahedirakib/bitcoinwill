import { describe, it, expect } from 'vitest';
import {
  splitPrivateKey,
  combineShares,
  validateShare,
  getSSSOptions,
} from './sss';

describe('Shamir Secret Sharing', () => {
  // Test private key (DO NOT USE IN PRODUCTION)
  const TEST_PRIVATE_KEY = 'e9873d79c6d87dc0fb6a5778633389f4453213303da61f20bd67fc233aa33262';

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
  });

  describe('combineShares', () => {
    it('should reconstruct from 2-of-3 threshold', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });
      
      // Use shares 1 and 2
      const sharesToCombine = [
        splitResult.shares[0].share,
        splitResult.shares[1].share,
      ];

      const reconstructed = await combineShares(sharesToCombine);
      expect(reconstructed).toBe(TEST_PRIVATE_KEY);
    });

    it('should reconstruct from any 2 shares in 2-of-3', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });
      
      // Try different combinations
      const combo1 = [splitResult.shares[0].share, splitResult.shares[2].share];
      const combo2 = [splitResult.shares[1].share, splitResult.shares[2].share];

      expect(await combineShares(combo1)).toBe(TEST_PRIVATE_KEY);
      expect(await combineShares(combo2)).toBe(TEST_PRIVATE_KEY);
    });

    it('should reconstruct from 3-of-5 threshold', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 3, total: 5 });
      
      const sharesToCombine = [
        splitResult.shares[0].share,
        splitResult.shares[2].share,
        splitResult.shares[4].share,
      ];

      const reconstructed = await combineShares(sharesToCombine);
      expect(reconstructed).toBe(TEST_PRIVATE_KEY);
    });

    it('should work with more than threshold shares', async () => {
      const splitResult = await splitPrivateKey(TEST_PRIVATE_KEY, { threshold: 2, total: 3 });
      
      // Use all 3 shares (more than threshold of 2)
      const sharesToCombine = splitResult.shares.map(s => s.share);

      const reconstructed = await combineShares(sharesToCombine);
      expect(reconstructed).toBe(TEST_PRIVATE_KEY);
    });

    it('should reject single share', async () => {
      await expect(combineShares(['abcd1234'])).rejects.toThrow('At least 2 shares required');
    });
  });

  describe('validateShare', () => {
    it('should validate correct share format', () => {
      expect(validateShare('abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234')).toBe(true);
    });

    it('should reject short shares', () => {
      expect(validateShare('abcd')).toBe(false);
      expect(validateShare('')).toBe(false);
    });

    it('should reject non-hex shares', () => {
      expect(validateShare('ghijklmnop')).toBe(false);
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
